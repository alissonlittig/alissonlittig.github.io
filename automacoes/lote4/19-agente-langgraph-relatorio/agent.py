"""Research & report agent on LangGraph.
plan -> (retrieve -> write -> critique -> [revise -> retrieve ...] -> accept)* -> compile.
The LLM is pluggable: MockLLM (deterministic, default, no network) or OllamaLLM (local model, not exercised in this repo)."""
import json, re, sys, pathlib, argparse
from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END

ROOT = pathlib.Path(__file__).parent
STOP = set("a an the of and or to for in on is are do does what how which should we our it its with about by be at as from that this".split())
# facet -> (trigger words in the question, query words used to search, section title)
FACETS = {
    "size": (["market", "size", "grow", "growth", "demand"], ["subscriptions", "billion", "grew", "grow", "panel", "subscribe"], "Market size and growth"),
    "pricing": (["price", "pricing", "cost", "plan", "charge"], ["price", "costs", "median", "plan", "shipping", "lowered"], "Pricing"),
    "competition": (["competitor", "competition", "rival", "players"], ["competitor", "roasters", "subscribers", "largest", "lowered"], "Competition"),
    "churn": (["churn", "retention", "cancel"], ["churn", "cancel", "skip", "retention"], "Retention and churn"),
    "channels": (["channel", "acquisition", "marketing", "sales"], ["channel", "website", "marketplaces", "acquisition", "social"], "Channels"),
    "regulation": (["regulation", "regulations", "compliance", "law", "legal"], ["regulation", "compliance", "certification"], "Regulation"),
    "logistics": (["logistics", "shipping", "delivery", "fulfilment"], ["shipping", "roasting", "returns", "stock"], "Logistics"),
}
MAX_REVISIONS = 1


def toks(s): return [w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP]
def numbers(s): return re.findall(r"\d[\d,.]*\d|\d", s)


# ---------- tools ----------
class SourceUnavailable(Exception): pass
CORPUS = {d["id"]: d for d in json.loads((ROOT / "data" / "corpus.json").read_text("utf-8"))}


def fetch_source(doc_id, attempt, faults):
    """Stands in for an HTTP fetch. faults = {doc_id: failures_before_success}; 99 = never works."""
    if attempt <= faults.get(doc_id, 0): raise SourceUnavailable(f"{doc_id}: timeout (attempt {attempt})")
    return CORPUS[doc_id]


def search(facet, expand=False):
    q = set(FACETS[facet][1]); scored = []
    for d in CORPUS.values():
        s = len(q & set(toks(d["text"] + " " + d["title"]))) + (3 if facet in d["facets"] else 0)
        if s >= (1 if expand else 2): scored.append((s, d["id"]))
    return [i for s, i in sorted(scored, key=lambda x: (-x[0], x[1]))]


# ---------- LLM ----------
class MockLLM:
    name = "mock-deterministic"
    def plan(self, question):
        low = set(toks(question)); out = [f for f, (tr, _, _) in FACETS.items() if low & set(tr)]
        return out or ["size", "pricing", "competition"]
    def write(self, facet, docs, feedback):
        if not docs: return f"Not enough evidence in the available sources to cover {FACETS[facet][2].lower()}."
        return " ".join(f"{d['text'].split('. ')[0].rstrip('.')}. [{d['id']}]" for d in docs)


class OllamaLLM(MockLLM):
    """Drop-in: same plan(); write() goes to a local model. NOT exercised in this repo's tests."""
    name = "ollama:llama3.2:3b"
    def write(self, facet, docs, feedback):
        import urllib.request
        ctx = "\n".join(f"[{d['id']}] {d['text']}" for d in docs)
        p = f"Write 2 sentences on '{FACETS[facet][2]}' using ONLY these sources and cite ids like [d01].\n{ctx}\n{feedback}"
        body = json.dumps({"model": "llama3.2:3b", "prompt": p, "stream": False}).encode()
        return json.loads(urllib.request.urlopen(urllib.request.Request("http://localhost:11434/api/generate", body), timeout=60).read())["response"].strip()


def critique_text(text, docs):
    """Pure check: 2+ distinct sources cited (or an explicit gap note), cited ids were retrieved, every number appears in a cited source."""
    if text.startswith("Not enough evidence"): return []
    cited = set(re.findall(r"\[(d\d+)\]", text)); problems = []
    if len(cited) < 2: problems.append("needs 2+ sources")
    allowed = {d["id"]: d["text"] for d in docs}
    problems += [f"cites {c} which was not retrieved" for c in sorted(cited) if c not in allowed]
    body = " ".join(allowed.get(c, "") for c in cited)
    problems += [f"number {n} not in cited sources" for n in numbers(re.sub(r"\[d\d+\]", "", text)) if n not in body]
    return problems


# ---------- graph ----------
class S(TypedDict, total=False):
    question: str; facets: List[str]; i: int; docs: List[dict]; draft: str; problems: List[str]
    revisions: int; sections: List[dict]; notes: List[str]; trace: List[dict]; faults: Dict[str, int]; report: str; error: str


def mk(llm):
    def log(s, node, **kw): s["trace"] = s.get("trace", []) + [{"node": node, **kw}]

    def plan(s):
        q = (s.get("question") or "").strip()
        if len(toks(q)) < 3:
            s["error"] = "question too short to plan"; log(s, "plan", error=s["error"]); return s
        s.update(facets=llm.plan(q), i=0, sections=[], notes=[], revisions=0, problems=[]); log(s, "plan", facets=s["facets"]); return s

    def retrieve(s):
        f = s["facets"][s["i"]]; ids = search(f, expand=s["revisions"] > 0)[:2 + s["revisions"]]; docs = []
        for did in ids:
            for attempt in (1, 2, 3):
                try:
                    docs.append(fetch_source(did, attempt, s.get("faults", {}))); log(s, "retrieve", doc=did, attempt=attempt, ok=True); break
                except SourceUnavailable as e:
                    log(s, "retrieve", doc=did, attempt=attempt, ok=False, err=str(e))
                    if attempt == 3: s["notes"] = s["notes"] + [f"Source {did} was unreachable after 3 attempts and was left out."]
        s["docs"] = docs; return s

    def write(s):
        f = s["facets"][s["i"]]; s["draft"] = llm.write(f, s["docs"], "; ".join(s["problems"])); log(s, "write", facet=f, chars=len(s["draft"])); return s

    def critique(s):
        s["problems"] = critique_text(s["draft"], s["docs"]); log(s, "critique", problems=s["problems"]); return s

    def accept(s):
        f = s["facets"][s["i"]]; t = s["draft"]
        if s["problems"]: t += " (Limited evidence: " + "; ".join(s["problems"]) + ".)"
        s["sections"] = s["sections"] + [{"facet": f, "title": FACETS[f][2], "text": t, "sources": sorted(set(re.findall(r"\[(d\d+)\]", t)))}]
        s.update(i=s["i"] + 1, revisions=0, problems=[]); log(s, "accept", facet=f); return s

    def revise(s): s["revisions"] += 1; log(s, "revise", n=s["revisions"]); return s

    def compile_(s):
        L = [f"# Research brief\n\n**Question:** {s['question']}\n\n_Model: {llm.name}. Every claim carries a source id; the list is at the end._\n"]
        for x in s["sections"]: L.append(f"## {x['title']}\n\n{x['text']}\n")
        if s["notes"]: L.append("## Data-quality notes\n\n" + "\n".join("- " + n for n in dict.fromkeys(s["notes"])) + "\n")
        used = sorted({i for x in s["sections"] for i in x["sources"]})
        L.append("## Sources\n\n" + "\n".join(f"- [{i}] {CORPUS[i]['title']} ({CORPUS[i]['url']})" for i in used))
        s["report"] = "\n".join(L); log(s, "compile", sections=len(s["sections"]), sources=len(used)); return s

    g = StateGraph(S)
    for n, f in [("plan", plan), ("retrieve", retrieve), ("write", write), ("critique", critique), ("accept", accept), ("revise", revise), ("compile", compile_)]:
        g.add_node(n, f)
    g.set_entry_point("plan")
    g.add_conditional_edges("plan", lambda s: END if s.get("error") else "retrieve")
    g.add_edge("retrieve", "write"); g.add_edge("write", "critique")
    g.add_conditional_edges("critique", lambda s: "revise" if s["problems"] and s["revisions"] < MAX_REVISIONS else "accept")
    g.add_edge("revise", "retrieve")
    g.add_conditional_edges("accept", lambda s: "retrieve" if s["i"] < len(s["facets"]) else "compile")
    g.add_edge("compile", END)
    return g.compile()


def run(question, faults=None, llm=None):
    return mk(llm or MockLLM()).invoke({"question": question, "faults": faults or {}, "trace": []})


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("question"); ap.add_argument("--fault", action="append", default=[], help="doc_id=failures (99 = never)"); ap.add_argument("--out")
    a = ap.parse_args(); faults = {k: int(v) for k, v in (x.split("=") for x in a.fault)}
    r = run(a.question, faults)
    if r.get("error"): print("ERROR:", r["error"], file=sys.stderr); sys.exit(1)
    if a.out:
        p = pathlib.Path(a.out); p.with_suffix(".md").write_text(r["report"], "utf-8"); p.with_suffix(".trace.json").write_text(json.dumps(r["trace"], indent=1), "utf-8")
    print(r["report"])
