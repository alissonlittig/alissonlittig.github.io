"""RAG de políticas de RH (100% local, sem chave, sem LLM). Empresa e políticas FICTÍCIAS (CC0).
Chunking por seção e item numerado, guardando PÁGINA (marcador "---- página N ----"), arquivo e linha -> vigência: a versão substituída fica fora da busca
por padrão -> busca híbrida (BM25 + n-gramas, RRF) -> cobertura mínima ou recusa ("fale com o RH") -> resposta = o item LITERAL com valores destacados,
citação com página e, se a regra mudou na versão nova (números diferentes), a versão antiga ao lado. Uso: python rag.py "Posso dividir minhas férias?" [--antigas]"""
import json, pathlib, re, sys
import rag_core as C

HERE, COVERAGE_MIN = pathlib.Path(__file__).parent, 0.5
SPANS = [("valor", r"(?:R\$|US\$)\s?\d[\d.]*(?:,\d{2})?"), ("percentual", r"\d+(?:,\d+)?\s?%"), ("prazo", r"\b\d+\s+(?:dias(?:\s+úteis|\s+corridos)?|meses|anos|horas|minutos|semanas)\b|\b\d+h\b")]


def spans_de(text):
    sp = []
    for k, rx in SPANS:
        for m in re.finditer(rx, text):
            if not any(m.start() < s["e"] and m.end() > s["s"] for s in sp): sp.append({"s": m.start(), "e": m.end(), "k": k})
    return sorted(sp, key=lambda x: (x["s"], x["e"]))


def chunk_doc(path):
    path = pathlib.Path(path); lines = path.read_text("utf-8").splitlines(); title = lines[0].lstrip("# ").strip(); meta = {}
    for l in lines[1:4]:
        if ":" in l and not l.startswith("#"): k, v = l.split(":", 1); meta[k.strip()] = v.strip()
    stem, page, sec, out = path.stem, 1, "", []
    for no, l in enumerate(lines, start=1):
        if m := re.match(r"---- página (\d+) ----", l): page = int(m.group(1))
        elif l.startswith("## "): sec = l[3:].split(". ", 1)[-1].strip()
        elif sec and (m := re.match(r"(\d+\.\d+) (.*)", l)):
            out.append({"key": f"{stem}:{m.group(1)}", "doc": stem, "docfile": path.name, "doctitle": title, "vigencia": meta.get("vigencia", ""), "section": sec, "item": m.group(1),
                        "page": page, "line": no, "text": m.group(2), "spans": spans_de(m.group(2)), "supersedes": meta.get("substitui", "")})
    return out


def nums(t): return sorted(re.findall(r"\d+", t))


def build(data=HERE / "data"):
    data = pathlib.Path(data); chunks = []
    for f in sorted(data.glob("*.md")): chunks += chunk_doc(f)
    for i, c in enumerate(chunks): c["id"] = i
    replaced = {c["supersedes"][:-3] for c in chunks if c["supersedes"]}  # "ferias_v1.md" -> "ferias_v1"
    for c in chunks: c["current"] = c["doc"] not in replaced
    texts = [c["section"] + " " + c["text"] for c in chunks]; bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks)
    for c in chunks:  # contraparte na versão antiga: melhor cosseno >= 0.5; só mostra se os números mudaram
        c["before"] = None
        if c["supersedes"]:
            old = [o for o in chunks if o["docfile"] == c["supersedes"]]; best = max(old, key=lambda o: C.cos(vecs[c["id"]], vecs[o["id"]]))
            if C.cos(vecs[c["id"]], vecs[best["id"]]) >= 0.5 and nums(best["text"]) != nums(c["text"]): c["before"] = best["id"]
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"disclaimer": "Protótipo de estudo com políticas fictícias de uma empresa inventada. Não representa nenhuma empresa real.", "glossary": C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8"))),
            "chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs],
            "tests": json.loads((data / "tests.json").read_text("utf-8"))}


def search(ix, q, old=False, k=3):
    groups, qt = C.expand(ix["glossary"], q); toks = [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    ok = lambda i: old or ix["chunks"][i]["current"]
    b = [C.bm25_score(ix["bm25"], qt, t) if ok(i) else 0.0 for i, t in enumerate(toks)]; v = [C.cos(qv, x) if ok(i) else 0.0 for i, x in enumerate(ix["ng_vecs"])]
    fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    return [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused], groups, qt, toks


def answer(ix, q, old=False, k=3):
    hits, groups, qt, toks = search(ix, q, old, k); res = {"terms": qt, "status": "refused", "hits": hits, "coverage": 0.0, "chunk": None}
    if not qt: res["reason"] = "none"; return res
    if not hits: res["reason"] = "no_hits"; return res
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: C.math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0; unk = C.math.log(1 + (N + .5) / .5)
    w = lambda g: max([idf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else unk
    top = hits[0]["id"]; res["coverage"] = round(sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups), 2)
    if res["coverage"] < COVERAGE_MIN: res["reason"] = "coverage"; return res
    res.update(status="answered", chunk=top); return res


def evaluate(ix, T):
    r1 = r3 = oos_a = 0
    for x in T["questions"]:
        ids = [ix["chunks"][h["id"]]["key"] for h in search(ix, x["q"], False, 3)[0]]; r1 += bool(ids) and ids[0] in x["ok"]; r3 += any(i in x["ok"] for i in ids)
    for q in T["oos"]: oos_a += answer(ix, q)["status"] == "answered"
    n = len(T["questions"]); return {"n": n, "recall1": round(r1 / n, 3), "recall3": round(r3 / n, 3), "oos": len(T["oos"]), "oos_answered": oos_a}


def cite(c): return f"[{c['doctitle']}, item {c['item']} ({c['section'].lower()}), p. {c['page']}, vigência {c['vigencia']}, {c['docfile']}:{c['line']}]"


if __name__ == "__main__":
    a = sys.argv[1:]; old = "--antigas" in a; ix = build(); print("!", ix["disclaimer"])
    for q in [x for x in a if not x.startswith("--")] or ["Posso dividir minhas férias?"]:
        r = answer(ix, q, old); print("\nP:", q)
        if r["status"] == "refused": print("R: não encontrei isso nas políticas; fale com o RH.", f"(cobertura {r['coverage']})"); continue
        c = ix["chunks"][r["chunk"]]; print("R:", c["text"], "\n  ", cite(c))
        if c["before"] is not None: o = ix["chunks"][c["before"]]; print("   ANTES (versão anterior):", o["text"], f"[{o['doctitle']}, p. {o['page']}]")
