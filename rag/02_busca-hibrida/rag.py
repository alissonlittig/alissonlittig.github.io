"""Busca híbrida + reranking com métricas (recall@k, MRR) sobre uma wiki fictícia de TI/RH em PT-BR. Local, sem chave, sem LLM.
Retrievers: BM25 (palavras) · vetorial esparso (TF-IDF de n-gramas) · vetorial denso LSA (SVD, não neural) · híbrido (RRF dos três) · híbrido + reranker heurístico.
Uso: python rag.py "como pedir férias?"   |   python rag.py --eval"""
import json, pathlib, sys
import rag_core as C

HERE, MODES, TOPN = pathlib.Path(__file__).parent, ["bm25", "vector", "lsa", "hybrid", "rerank"], 10


def build(data=HERE / "data"):
    ps = json.loads((pathlib.Path(data) / "passages.json").read_text("utf-8")); texts = [p["title"] + ". " + p["text"] for p in ps]
    bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks); lsa, dvecs = C.lsa_build(toks, k=24); lsa.pop("_ix", None)
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"passages": ps, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs], "lsa": lsa, "lsa_vecs": dvecs}


def search(ix, q, topn=TOPN):
    """-> {modo: [(id, score)]} para os 5 modos + 'terms'."""
    ps = ix["passages"]; qt = C.tokens(q); toks = [C.tokens(p["title"] + ". " + p["text"]) for p in ps]
    qv = C.ng_vec(qt, ix["ng_idf"]); ql = C.lsa_vec(ix["lsa"], qt)
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]; l = [C.dot(ql, x) for x in ix["lsa_vecs"]]
    out = {"terms": qt}
    for m, s in (("bm25", b), ("vector", v), ("lsa", l)): out[m] = [(i, round(s[i], 4)) for i in C.rank(s)[:topn]]
    fused = C.rrf([C.rank(b), C.rank(v), C.rank(l)]); out["hybrid"] = [(i, round(s, 5)) for i, s in fused[:topn]]
    top = fused[:topn]; mx = top[0][1] if top else 1.0
    rr = sorted(((C.rerank_score(C.rerank_features(qt, ps[i]["title"], toks[i]), s / mx), i) for i, s in top), key=lambda p: (-p[0], p[1]))
    out["rerank"] = [(i, s) for s, i in rr]
    return out


def metrics(rank_ids, rel, ks=(1, 3, 5)):
    first = next((n for n, i in enumerate(rank_ids, 1) if i in rel), None)
    return {**{f"recall@{k}": float(any(i in rel for i in rank_ids[:k])) for k in ks}, "mrr": 1.0 / first if first else 0.0}


def evaluate(ix, questions):
    """-> {modo: {métrica média}} e por tipo de pergunta (L lexical, P paráfrase, H difícil)."""
    acc = {m: [] for m in MODES}
    for q in questions:
        s = search(ix, q["q"])
        for m in MODES: acc[m].append((q["type"], metrics([i for i, _ in s[m]], set(q["rel"]))))
    avg = lambda rows: {k: round(sum(r[k] for _, r in rows) / len(rows), 3) for k in rows[0][1]} if rows else {}
    return {"all": {m: avg(acc[m]) for m in MODES}, "by_type": {t: {m: avg([r for r in acc[m] if r[0] == t]) for m in MODES} for t in "LPH"}, "n": len(questions)}


if __name__ == "__main__":
    ix = build(); qs = json.loads((HERE / "data" / "questions.json").read_text("utf-8"))
    if "--eval" in sys.argv:
        ev = evaluate(ix, qs); print(f"{ev['n']} perguntas, {len(ix['passages'])} trechos\n{'modo':8} recall@1 recall@3 recall@5   MRR")
        for m in MODES: r = ev["all"][m]; print(f"{m:8} {r['recall@1']:8.3f} {r['recall@3']:8.3f} {r['recall@5']:8.3f} {r['mrr']:6.3f}")
        sys.exit()
    q = " ".join(a for a in sys.argv[1:]) or "como pedir férias?"; s = search(ix, q); print("termos:", s["terms"])
    for m in MODES: print(f"\n{m}:"); [print(f"  {sc:>8}  {ix['passages'][i]['title']}") for i, sc in s[m][:3]]
