"""Reescrita de pergunta antes da busca, com comparação ANTES x DEPOIS. Local, sem chave, sem LLM.
Três modos sobre o mesmo índice (BM25 + n-gramas, RRF):
  raw     = a pergunta como foi digitada;
  rewrite = reescrita por regras: tira enchimento ("oi", "queria saber") e acrescenta os termos técnicos que a linguagem do dia a dia esconde
            (dicionário data/reescrita.json: "barriga ruim" -> "diarreia vomito");
  hyde    = "HyDE sem LLM": usa o 1º resultado da reescrita como documento hipotético e acrescenta à consulta os termos mais característicos dele
            (feedback de pseudo-relevância). O HyDE de verdade pede a um LLM que ESCREVA uma resposta hipotética; aqui o documento vem do próprio corpus, então
            se o 1º resultado estiver errado a consulta se afasta ainda mais (mostrado nos números).
Uso: python rag.py "meu cachorro tá com a barriga ruim" | python rag.py --eval"""
import json, math, pathlib, re, sys
import rag_core as C

HERE, PRF_TERMS = pathlib.Path(__file__).parent, 4
NOISE = set("oi ola bom dia tarde noite queria quero saber gostaria tipo ne mano galera pfv favor entao ai e ate".split())  # "até" fica de fora da busca, mas não do regex da reescrita


def build(data=HERE / "data"):
    data = pathlib.Path(data); chunks = []; sec = ""
    for no, l in enumerate((data / "clinica_pata_segura.md").read_text("utf-8").splitlines(), start=1):
        if l.startswith("## "): sec = l[3:].strip()
        elif l.startswith("- ["): m = re.match(r"- \[([\w-]+)\] (.+)", l); chunks.append({"id": len(chunks), "key": m.group(1), "section": sec, "line": no, "text": m.group(2)})
    bix, toks = C.bm25_index([c["section"] + " " + c["text"] for c in chunks]); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    rules = json.loads((data / "reescrita.json").read_text("utf-8"))
    return {"rules": rules, "noise": sorted(NOISE), "chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs], "prf_terms": PRF_TERMS, "dev": json.loads((data / "dev_q.json").read_text("utf-8")), "test": json.loads((data / "test_q.json").read_text("utf-8"))}


def _toks(ix): return [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]


def rewrite(ix, q):
    """-> {text, removed, added[{rule, terms}]}. Aplica cada regra do dicionário uma vez sobre o texto normalizado (a pergunta original continua na consulta)."""
    nq = C.norm(q); words = nq.split(); kept = [w for w in re.findall(r"[a-z0-9-]+", nq) if w not in ix["noise"]]; removed = [w for w in re.findall(r"[a-z0-9-]+", nq) if w in ix["noise"]]
    added = [{"rule": pat.split("|")[0], "terms": terms} for pat, terms in ix["rules"] if re.search(pat, nq)]
    return {"text": " ".join(kept + [t for a in added for t in a["terms"].split()]), "removed": removed, "added": added}


def ranking(ix, text):
    qt = C.tokens(text); toks = _toks(ix); qv = C.ng_vec(qt, ix["ng_idf"]); b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    return [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in C.rrf([C.rank(b), C.rank(v)])]


def prf(ix, text, top):
    """Termos mais característicos do documento hipotético (top 1): tf * idf, fora os que já estão na consulta."""
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; have = set(C.tokens(text)); tk = C.tokens(ix["chunks"][top]["section"] + " " + ix["chunks"][top]["text"]); sc = {}
    for t in tk:
        if t not in have and t in df: sc[t] = sc.get(t, 0.0) + math.log(1 + (N - df[t] + .5) / (df[t] + .5))
    return [t for t, _ in sorted(sc.items(), key=lambda p: (-round(p[1], 6), p[0]))[:ix["prf_terms"]]]


def search(ix, q, mode):
    """-> {query, rewrite?, extra?, ranking}. mode: raw | rewrite | hyde."""
    if mode == "raw": return {"query": q, "ranking": ranking(ix, q)}
    rw = rewrite(ix, q); r = ranking(ix, rw["text"])
    if mode == "rewrite": return {"query": rw["text"], "rewrite": rw, "ranking": r}
    extra = prf(ix, rw["text"], r[0]["id"]) if r else []; text = rw["text"] + " " + " ".join(extra)
    return {"query": text, "rewrite": rw, "extra": extra, "hypothetical": ix["chunks"][r[0]["id"]]["text"] if r else "", "ranking": ranking(ix, text)}


def rank_of(ix, res, key):
    return next((i + 1 for i, h in enumerate(res["ranking"]) if ix["chunks"][h["id"]]["key"] == key), None)


def evaluate(ix, tests):
    """Por modo: hit@1, hit@3, MRR e quantas perguntas melhoraram / pioraram em relação ao modo anterior (posição do trecho certo)."""
    out = {}; ranks = {m: [rank_of(ix, search(ix, x["q"], m), x["gold"]) for x in tests] for m in ("raw", "rewrite", "hyde")}; n = len(tests)
    for m, rs in ranks.items(): out[m] = {"hit1": round(sum(r == 1 for r in rs) / n, 3), "hit3": round(sum(r is not None and r <= 3 for r in rs) / n, 3), "mrr": round(sum(1 / r for r in rs if r) / n, 3)}
    big = lambda r: 99 if r is None else r
    for a, b in (("raw", "rewrite"), ("rewrite", "hyde")): out[b]["better"] = sum(big(y) < big(x) for x, y in zip(ranks[a], ranks[b])); out[b]["worse"] = sum(big(y) > big(x) for x, y in zip(ranks[a], ranks[b]))
    out["n"] = n; return out, ranks


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8"); ix = build()
    if "--eval" in sys.argv:
        for name in ("dev_q", "test_q"):
            f = HERE / "data" / f"{name}.json"
            if f.exists(): print(name, evaluate(ix, json.loads(f.read_text("utf-8")))[0])
    else:
        q = " ".join(a for a in sys.argv[1:] if not a.startswith("--"))
        for m in ("raw", "rewrite", "hyde"):
            r = search(ix, q, m); print(m, "|", r["query"]); [print("   ", i + 1, ix["chunks"][h["id"]]["key"], h["rrf"]) for i, h in enumerate(r["ranking"][:3])]
