"""GraphRAG simples: grafo de entidades + busca por vizinhança. 100% local, sem chave, sem LLM.
Parágrafos (chunks) -> entidades por dicionário (NER simulado) -> grafo de co-ocorrência (aresta = duas entidades no mesmo parágrafo)
Pergunta -> sementes = entidades citadas -> vizinhança de N saltos (BFS) -> nota = 0,6*léxica (BM25 e cosseno de n-gramas, normalizados pelo máximo) + 0,4*grafo (1/(1+saltos)).
Resposta EXTRATIVA: frases literais com [n]; mostra o caminho no grafo que trouxe cada trecho.
Uso: python rag.py "O que liga Otávio Brandão ao Projeto Maré Alta?" [--hops 1]"""
import json, pathlib, re, sys
from math import log
import rag_core as C

HERE = pathlib.Path(__file__).parent
W_LEX = 0.6


def chunk_doc(path):
    lines = path.read_text("utf-8").splitlines(); title = lines[0].lstrip("# ").strip(); sec = ""; out = []
    for no, l in enumerate(lines, start=1):
        if l.startswith("## "): sec = l[3:].strip()
        elif sec and l.strip(): out.append({"doc": path.name, "title": title, "section": sec, "line": no, "text": l.strip()})
    return out


def find_ents(ents, text):
    """Ids das entidades cujo alias aparece no texto (sem acento, com limite de palavra)."""
    t = C.norm(text)
    return [e["id"] for e in ents if any(re.search(r"\b" + re.escape(a) + r"\b", t) for a in e["alias_norm"])]


def build(docs_dir=HERE / "data"):
    chunks = [c for f in sorted(pathlib.Path(docs_dir).glob("*.md")) for c in chunk_doc(f)]
    raw = json.loads((pathlib.Path(docs_dir) / "entidades.json").read_text("utf-8"))
    ents = [{"id": i, "name": n, "tipo": v["tipo"], "alias_norm": sorted({C.norm(a) for a in v["alias"]})} for i, (n, v) in enumerate(raw.items())]
    for i, c in enumerate(chunks): c["id"] = i; c["ents"] = find_ents(ents, c["text"])
    w = {}
    for c in chunks:
        for a in c["ents"]:
            for b in c["ents"]:
                if a < b: w[(a, b)] = w.get((a, b), 0) + 1
    edges = [[a, b, n] for (a, b), n in sorted(w.items())]
    import networkx as nx  # só no build (posição dos nós na visualização); a demo não precisa de nada
    G = nx.Graph(); G.add_nodes_from(e["id"] for e in ents); G.add_weighted_edges_from(edges)
    pos = nx.spring_layout(G, seed=7, weight="weight", k=0.9); pos = {str(k): [round(float(v[0]), 3), round(float(v[1]), 3)] for k, v in pos.items()}
    texts = [c["section"] + " " + c["text"] for c in chunks]
    bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks)
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"chunks": chunks, "entities": ents, "edges": edges, "pos": pos, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def lexical(ix, q):
    qt = C.tokens(q); toks = [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    return C.rrf([C.rank(b), C.rank(v)]), qt, toks, b, v


def neighborhood(ix, seeds, hops):
    """BFS multi-fonte, vizinhos em ordem de id (determinístico). -> (dist, parent)."""
    adj = {}
    for a, b, _ in ix["edges"]: adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    dist = {s: 0 for s in seeds}; par = {s: None for s in seeds}; fr = sorted(seeds)
    for d in range(1, hops + 1):
        nxt = []
        for u in fr:
            for v in sorted(adj.get(u, [])):
                if v not in dist: dist[v] = d; par[v] = u; nxt.append(v)
        fr = sorted(nxt)
    return dist, par


def path_names(ix, par, e):
    p = []
    while e is not None: p.append(ix["entities"][e]["name"]); e = par[e]
    return p[::-1]


def answer(ix, question, hops=1, k=4):
    fused, qt, toks, b, v = lexical(ix, question); mb, mv = max(b + [1e-9]), max(v + [1e-9]); base = [i for i, _ in fused[:3]]
    seeds = find_ents(ix["entities"], question); how = "pergunta"
    if not seeds and fused: seeds = sorted({e for i in base[:2] for e in ix["chunks"][i]["ents"]}); how = "trechos"
    dist, par = neighborhood(ix, seeds, hops) if seeds else ({}, {})
    res = {"terms": qt, "seeds": seeds, "seed_from": how, "dist": dist, "baseline": base, "hits": [], "status": "refused", "answer": None, "sources": []}
    if not qt: res["reason"] = "só palavras comuns na pergunta"; return res
    qs = set(qt); cov = max([len(qs & set(t)) / len(qs) for t in toks] or [0])
    if how == "trechos" and (not fused or cov < 0.5): res["reason"] = f"nenhuma entidade na pergunta e cobertura {round(cov * 100)}% < 50%"; return res
    sc = []
    for c in ix["chunks"]:
        g = max([1 / (1 + dist[e]) for e in c["ents"] if e in dist] or [0]); l = (b[c["id"]] / mb + v[c["id"]] / mv) / 2
        s = round(W_LEX * l + (1 - W_LEX) * g, 6)
        if s > 0: sc.append((c["id"], s, round(l, 4), round(g, 4)))
    sc.sort(key=lambda p: (-p[1], p[0]))
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0
    for i, s, l, g in sc[:k]:
        near = [e for e in ix["chunks"][i]["ents"] if e in dist]; best = min(near, key=lambda e: (dist[e], e)) if near else None
        res["hits"].append({"id": i, "score": s, "lex": l, "graph": g, "via": path_names(ix, par, best) if best is not None and dist[best] > 0 else []})
    parts = []
    for h in res["hits"][:3]:
        sents = C.sentences(ix["chunks"][h["id"]]["text"])
        sw = [round(sum(idf(t) for t in set(C.tokens(s)) if t in qs), 4) for s in sents]
        j = max(range(len(sents)), key=lambda j: (sw[j], -j))
        if sents[j] not in [p[0] for p in parts]: parts.append((sents[j], h["id"]))
    if not parts: res["reason"] = "nada recuperado"; return res
    cites = []
    for _, i in parts:
        if i not in cites: cites.append(i)
    res.update(status="answered", answer=" ".join(f"{s} [{cites.index(i) + 1}]" for s, i in parts), sources=[{"id": i, **{x: ix["chunks"][i][x] for x in ("doc", "section", "line")}} for i in cites])
    return res


if __name__ == "__main__":
    a = sys.argv[1:]; h = int(a[a.index("--hops") + 1]) if "--hops" in a else 1
    q = " ".join(x for j, x in enumerate(a) if x != "--hops" and (j == 0 or a[j - 1] != "--hops"))
    ix = build(); r = answer(ix, q, h)
    print("sementes:", [ix["entities"][e]["name"] for e in r["seeds"]], "| baseline:", r["baseline"])
    print(r["answer"] or "Não sei. " + r.get("reason", ""))
    for x in r["hits"]: print(x["id"], x["score"], x["via"], ix["chunks"][x["id"]]["text"][:80])
