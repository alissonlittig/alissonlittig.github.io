"""RAG com filtros por metadados (categoria, autor, data) e facetas. 100% local, sem chave, sem LLM.
Posts de um blog técnico fictício (JSON) -> índice (BM25 + n-gramas, RRF) + metadados.
Filtro ANTES da busca (pré-filtro): o ranking só considera quem passa nos filtros, então sempre devolve até k resultados.
Facetas: contagem por valor, entre os posts que casam com a pergunta, aplicando todos os filtros MENOS o da própria faceta.
Resposta EXTRATIVA: frase literal de um post + [n] com autor, data e categoria. Sem evidência -> recusa.
Uso: python rag.py "backup" [--cat segurança] [--autor "Ana Ribeiro"] [--de 2025-06] [--ate 2026-03]"""
import json, pathlib, sys
from math import log
import rag_core as C

HERE = pathlib.Path(__file__).parent
MIN_COS = 0.2  # n-grama: abaixo disso o post não 'casa' com a pergunta (vale para hits e facetas)
DIMS = (("cat", "category"), ("autor", "author"), ("ano", None))


def build(path=HERE / "data" / "posts.json"):
    posts = json.loads(pathlib.Path(path).read_text("utf-8"))
    chunks = [{"id": i, **p, "month": p["date"][:7], "year": p["date"][:4]} for i, p in enumerate(posts)]
    texts = [c["title"] + " " + c["text"] for c in chunks]
    bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks)
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def passes(c, f, skip=None):
    """f = {cats:[], authors:[], years:[], frm:'YYYY-MM'|'', to:'YYYY-MM'|''}; lista vazia = sem filtro."""
    return ((skip == "cat" or not f.get("cats") or c["category"] in f["cats"])
            and (skip == "autor" or not f.get("authors") or c["author"] in f["authors"])
            and (skip == "ano" or not f.get("years") or c["year"] in f["years"])
            and (not f.get("frm") or c["month"] >= f["frm"]) and (not f.get("to") or c["month"] <= f["to"]))


def scores(ix, q):
    qt = C.tokens(q); toks = [C.tokens(c["title"] + " " + c["text"]) for c in ix["chunks"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    return qt, toks, [C.bm25_score(ix["bm25"], qt, t) for t in toks], [C.cos(qv, x) for x in ix["ng_vecs"]]


def answer(ix, question, f=None, k=5):
    f = f or {}; qt, toks, b, v = scores(ix, question); ch = ix["chunks"]
    cand = [c["id"] for c in ch if passes(c, f)]
    res = {"terms": qt, "status": "refused", "answer": None, "sources": [], "hits": [], "n_cand": len(cand), "coverage": 0.0}
    # facetas: posts que casam com a pergunta (ou todos, se a pergunta é vazia), filtros de todas as outras dimensões aplicados
    match = [c for c in ch if (not qt or b[c["id"]] > 0 or v[c["id"]] > MIN_COS)]
    fac = {}
    for key, field in DIMS:
        cnt = {}
        for c in match:
            if passes(c, f, skip=key): val = c["year"] if key == "ano" else c[field]; cnt[val] = cnt.get(val, 0) + 1
        fac[key] = dict(sorted(cnt.items()))
    res["facets"] = fac
    if not qt:  # sem pergunta: só navega pelos filtros, mais recentes primeiro
        res.update(status="browse", hits=[{"id": i, "rrf": 0, "bm25": 0, "cos": 0} for i in sorted(cand, key=lambda i: (ch[i]["date"], i), reverse=True)[:k]]); return res
    if not cand: res["reason"] = "nenhum post passa nos filtros escolhidos"; return res
    ms = {c["id"] for c in match}; cs = set(cand) & ms; rb = C.rank([b[i] if i in cs else 0 for i in range(len(ch))]); rv = C.rank([v[i] if i in cs else 0 for i in range(len(ch))])
    fused = C.rrf([rb, rv]); res["hits"] = [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused[:k]]
    # pós-filtro (comparação): top-k SEM filtro, depois descarta quem não passa -> costuma sobrar menos que k
    allf = C.rrf([C.rank([b[i] if i in ms else 0 for i in range(len(ch))]), C.rank([v[i] if i in ms else 0 for i in range(len(ch))])])[:k]; res["post_filter_n"] = sum(1 for i, _ in allf if i in set(cand))
    if not res["hits"]: res["reason"] = "nada nos posts filtrados tem relação com a pergunta"; return res
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0
    top = set(toks[res["hits"][0]["id"]]); unk = log(1 + (N + .5) / .5); w = lambda t: idf(t) if t in df else unk
    res["coverage"] = round(sum(w(t) for t in set(qt) if t in top) / sum(w(t) for t in set(qt)), 2)
    if res["coverage"] < 0.5: res["reason"] = f"não encontrei isso nos posts filtrados (cobertura {round(res['coverage'] * 100)}% < 50%)"; return res
    qs = set(qt); best = None
    h = res["hits"][0]  # a frase vem do 1º resultado
    for s in C.sentences(ch[h["id"]]["text"]):
        sc = round(sum(idf(t) for t in set(C.tokens(s)) if t in qs), 4)
        if best is None or sc > best[0]: best = (sc, h["id"], s)
    c = ch[best[1]]
    res.update(status="answered", answer=best[2] + " [1]", sources=[{"id": c["id"], "title": c["title"], "author": c["author"], "date": c["date"], "category": c["category"]}])
    return res


if __name__ == "__main__":
    a = sys.argv[1:]; opt = lambda n: a[a.index(n) + 1] if n in a else ""
    f = {"cats": [opt("--cat")] if opt("--cat") else [], "authors": [opt("--autor")] if opt("--autor") else [], "frm": opt("--de"), "to": opt("--ate")}
    q = " ".join(x for j, x in enumerate(a) if not x.startswith("--") and (j == 0 or not a[j - 1].startswith("--")))
    ix = build(); r = answer(ix, q, f)
    print(r["status"], "| candidatos:", r["n_cand"], "| pós-filtro:", r.get("post_filter_n")); print(r["answer"] or r.get("reason"))
    for h in r["hits"]: c = ix["chunks"][h["id"]]; print(h["id"], h["rrf"], c["date"], c["author"], c["category"], c["title"])
    print(r["facets"])
