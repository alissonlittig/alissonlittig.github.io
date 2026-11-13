"""RAG com memória de conversa, 100% local, sem chave, sem LLM. Pergunta de acompanhamento ("E o família?", "E no iOS?") vira uma consulta AUTOSSUFICIENTE:
  1. "slots" (plano: grátis/premium/família; plataforma: android/ios/web) são entidades da conversa; o valor novo SUBSTITUI o do mesmo tipo.
  2. Pergunta só com entidade/pronome (elipse) herda o TÓPICO do último turno que falou desse tipo de slot ("E no iOS?" volta ao turno do Android, não ao do preço).
  3. Pergunta com conteúdo próprio herda só os slots, como contexto "mole" (entra na busca, não conta na cobertura).
A janela de memória (N turnos) é ajustável; N = 0 é o RAG sem memória. Busca: BM25 + n-gramas + RRF; resposta = texto do trecho + citação; sem cobertura, recusa.
Uso: python rag.py "Quanto custa o plano premium?" "E o família?" [--janela 3]"""
import json, pathlib, sys
import rag_core as C

HERE, COVERAGE_MIN, WINDOW = pathlib.Path(__file__).parent, 0.5, 3


def build(data=HERE / "data"):
    data = pathlib.Path(data); docs = json.loads((data / "docs.json").read_text("utf-8")); sl = json.loads((data / "slots.json").read_text("utf-8"))
    slot_map = {}  # token (como a pergunta é tokenizada) -> [tipo, valor canônico]
    for typ, vals in ((k, v) for k, v in sl.items() if k not in ("filler", "glossario")):
        for canon, aliases in vals.items():
            for a in aliases:
                if C.tokens(a): slot_map[C.tokens(a)[0]] = [typ, C.tokens(canon)[0]]
    texts = [d["title"] + ". " + d["text"] for d in docs]; bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"docs": docs, "slot_map": slot_map, "filler": sorted({t for w in sl["filler"].split() for t in C.tokens(w)}), "glossary": C.gloss_norm(sl["glossario"]),
            "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def _dedupe(xs): return list(dict.fromkeys(xs))


def rewrite(ix, history, q, window=WINDOW):
    """-> registro do turno: own (slots ditos agora), content, topic (efetivo), query (tokens), soft (contexto herdado), ellipsis, cov_terms."""
    tk = C.tokens(q); own, content = {}, []
    for t in tk:
        if t in ix["slot_map"]: own[ix["slot_map"][t][0]] = ix["slot_map"][t][1]
        elif t not in ix["filler"]: content.append(t)
    hist = history[-window:] if window > 0 else []; ellipsis = bool(hist) and not content; topic = list(content); soft = []
    if hist:
        merged = {}
        for h in hist: merged.update(h["own"])
        soft = [v for k, v in merged.items() if k not in own]
        if ellipsis:
            src = next((h for h in reversed(hist) if set(h["own"]) & set(own)), hist[-1]); topic = list(src["topic"])
        else: pass
    query = _dedupe(list(own.values()) + content + (topic if ellipsis else []) + soft)
    cov = _dedupe(list(own.values()) + content + (topic if ellipsis else []))
    return {"q": q, "own": own, "content": content, "topic": topic, "soft": soft, "ellipsis": ellipsis, "followup": bool(hist), "query": query, "cov_terms": cov}


def search(ix, terms, k=3):
    groups, qt = C.expand(ix["glossary"], " ".join(terms)); toks = [C.tokens(d["title"] + ". " + d["text"]) for d in ix["docs"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]; fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    return [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused], toks


def turn(ix, history, q, window=WINDOW):
    """Um turno: reescreve, busca, decide (responde/recusa). Devolve (resultado, registro para a memória)."""
    rec = rewrite(ix, history, q, window); hits, toks = search(ix, rec["query"]); res = {**rec, "hits": hits, "status": "refused", "doc": None, "coverage": 0.0, "answer": None}
    if hits and rec["query"]:
        N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: C.math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0; unk = C.math.log(1 + (N + .5) / .5)
        groups = C.expand(ix["glossary"], " ".join(rec["cov_terms"]))[0]; w = lambda g: max([idf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else unk
        top = hits[0]["id"]; res["coverage"] = round(sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups), 2) if groups else 0.0
        if res["coverage"] >= COVERAGE_MIN: res.update(status="answered", doc=top, answer=ix["docs"][top]["text"])
    return res, {"own": rec["own"], "topic": rec["topic"]}


def run(ix, questions, window=WINDOW):
    hist, out = [], []
    for q in questions:
        r, rec = turn(ix, hist, q, window); hist.append(rec); out.append(r)
    return out


def evaluate(ix, tests, window=WINDOW):
    """Por turno (primeiros turnos separados dos de acompanhamento): top-1 certo; turno sem resposta no corpus deve ser recusado."""
    o = dict(window=window, first_ok=0, first_n=0, follow_ok=0, follow_n=0, wrong=[])
    for d in tests:
        for i, (r, (q, exp)) in enumerate(zip(run(ix, [t[0] for t in d["turns"]], window), d["turns"])):
            ok = r["status"] == "refused" if exp is None else r["status"] == "answered" and r["doc"] == exp; k = "first" if i == 0 else "follow"; o[k + "_n"] += 1; o[k + "_ok"] += ok
            if not ok: o["wrong"].append(f"{d['id']}.{i + 1} {q}")
    return o


if __name__ == "__main__":
    a = sys.argv[1:]; w = int(a[a.index("--janela") + 1]) if "--janela" in a else WINDOW; ix = build(); qs = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--janela")] or ["Quanto custa o plano premium?", "E o família?"]
    for q, r in zip(qs, run(ix, qs, w)):
        print(f"\nU: {q}\n   consulta reescrita: {' '.join(r['query'])}" + ("  (elipse: herdou tópico)" if r["ellipsis"] else "") + (f"  contexto mole: {r['soft']}" if r["soft"] else ""))
        print("A:", r["answer"] or "Não encontrei isso na ajuda.", f"[{r['status']}, cobertura {r['coverage']}]" + (f" [1] {ix['docs'][r['doc']]['title']}" if r["doc"] is not None else ""))
