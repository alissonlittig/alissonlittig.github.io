"""RAG multilíngue PT/EN/ES, 100% local, sem chave, sem rede, SEM rede neural.
Como a pergunta em um idioma acha o documento em outro: um léxico bilíngue (data/lexicon.txt, ~70 conceitos escritos à mão) mapeia as formas de cada
idioma para o mesmo CONCEITO; BM25 roda sobre conceitos. Comparamos com: BM25 nas palavras cruas (sem léxico) e n-gramas de caracteres (acha cognatos).
Resposta EXTRATIVA: a frase do documento, no idioma original dele, com citação. Sem cobertura suficiente, recusa.
Uso: python rag.py "How much is the monthly plan?" """
import json, pathlib, re, sys
import rag_core as C

HERE, COVERAGE_MIN, LANGS = pathlib.Path(__file__).parent, 0.3, ("pt", "en", "es")


def stem(w): return w[:-1] if len(w) > 3 and w.endswith("s") else w


def words(s): return re.findall(r"[a-z0-9]+", C.norm(s))


def parse_lexicon(text):
    lex, per = {}, {l: set() for l in LANGS}
    for ln in text.splitlines():
        if not ln.strip() or ln.startswith("#"): continue
        c, rest = ln.split(":", 1)
        for l, part in zip(LANGS, rest.split("|")):
            for w in part.split():
                s = stem(C.norm(w)); lex.setdefault(s, c.strip()); per[l].add(s)
    return lex, {l: sorted(v) for l, v in per.items()}


def build(data=HERE / "data"):
    data = pathlib.Path(data); docs = json.loads((data / "docs.json").read_text("utf-8")); lex, per = parse_lexicon((data / "lexicon.txt").read_text("utf-8"))
    stopl = {l: sorted({stem(w) for w in words(s)}) for l, s in json.loads((data / "stop.json").read_text("utf-8")).items()}
    ix = {"docs": docs, "lex": lex, "lex_lang": per, "stop_lang": stopl, "stop": sorted(set().union(*map(set, stopl.values())))}
    ct = [analyze_ids(ix, d["title"] + ". " + d["text"]) for d in docs]; rt = [[a[1] for a in analyze(ix, d["title"] + ". " + d["text"])] for d in docs]
    cix = _bm(ct); rix = _bm(rt); idf, vecs = C.ng_index(rt)
    ix.update(bm_c=cix, bm_r=rix, ng_idf={k: round(v, 5) for k, v in idf.items()}, ng_vecs=[{k: round(x, 5) for k, x in v.items()} for v in vecs])
    ix.pop("_stop", None); return ix  # _stop é cache; não vai para o JSON


def _bm(toks):
    df = {}
    for tk in toks:
        for t in set(tk): df[t] = df.get(t, 0) + 1
    return {"df": df, "avgdl": sum(len(t) for t in toks) / max(1, len(toks)), "n": len(toks)}


def analyze(ix, text):
    """-> [(palavra, radical, conceito)] sem as palavras comuns dos 3 idiomas."""
    stop = ix.get("_stop") or ix.setdefault("_stop", set(ix["stop"]))
    return [(w, stem(w), ix["lex"].get(stem(w), stem(w))) for w in words(text) if len(w) >= 2 and stem(w) not in stop]


def analyze_ids(ix, text): return [a[2] for a in analyze(ix, text)]


def detect(ix, q):
    """Idioma por contagem de palavras comuns + do léxico de cada idioma (palavra ambígua conta para os dois). Empate -> '?'."""
    ws = [stem(w) for w in words(q)]; sc = {l: sum(1 for w in ws if w in set(ix["stop_lang"][l]) or w in set(ix["lex_lang"][l])) for l in LANGS}
    top = max(sc.values()); best = [l for l in LANGS if sc[l] == top]
    return (best[0] if len(best) == 1 and top > 0 else "?"), sc


MODES = ("concept", "raw", "ngram", "hybrid")


def search(ix, q, mode="concept", k=3):
    an = analyze(ix, q); qc = [a[2] for a in an]; qr = [a[1] for a in an]; n = len(ix["docs"])
    ct = [analyze_ids(ix, d["title"] + ". " + d["text"]) for d in ix["docs"]]; rt = [[a[1] for a in analyze(ix, d["title"] + ". " + d["text"])] for d in ix["docs"]]
    bc = [C.bm25_score(ix["bm_c"], qc, t) for t in ct]; br = [C.bm25_score(ix["bm_r"], qr, t) for t in rt]; qv = C.ng_vec(qr, ix["ng_idf"]); vn = [C.cos(qv, v) for v in ix["ng_vecs"]]
    if mode == "concept": fused = [(i, bc[i]) for i in C.rank(bc)]
    elif mode == "raw": fused = [(i, br[i]) for i in C.rank(br)]
    elif mode == "ngram": fused = [(i, vn[i]) for i in C.rank(vn)]
    else: fused = C.rrf([C.rank(bc), C.rank(vn)])
    hits = [{"id": i, "score": round(s, 5), "bm25_concept": round(bc[i], 4), "bm25_raw": round(br[i], 4), "ngram": round(vn[i], 4)} for i, s in fused[:k]]
    return hits, an, ct


def answer(ix, q, mode="concept", k=3):
    hits, an, ct = search(ix, q, mode, k); res = {"lang": detect(ix, q)[0], "concepts": [a[2] for a in an], "status": "refused", "hits": hits, "answer": None, "coverage": 0.0}
    if not an or not hits: res["reason"] = "nada reconhecido na pergunta"; return res
    N, df = ix["bm_c"]["n"], ix["bm_c"]["df"]; w = lambda t: C.math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else C.math.log(1 + (N + .5) / .5)
    qs = list(dict.fromkeys(res["concepts"])); top = hits[0]["id"]; dset = set(ct[top])
    res["coverage"] = round(sum(w(t) for t in qs if t in dset) / sum(w(t) for t in qs), 3)
    if res["coverage"] < COVERAGE_MIN: res["reason"] = "cobertura %d%% < %d%%" % (res["coverage"] * 100, COVERAGE_MIN * 100); return res
    d = ix["docs"][top]; sents = C.sentences(d["text"]); best = max(range(len(sents)), key=lambda j: (round(sum(w(t) for t in set(qs) & set(analyze_ids(ix, sents[j]))), 4), -j))
    qw = {a[2]: a[0] for a in an}; dw = {a[2]: a[0] for a in analyze(ix, d["text"])}
    res.update(status="answered", answer=sents[best], doc=top, doc_lang=d["lang"], title=d["title"], matches=[{"concept": t, "q": qw[t], "d": dw[t]} for t in qs if t in dw])
    return res


def evaluate(ix, tests, mode="concept"):
    """recall@1, recall@3 e MRR (perguntas com documento esperado, no ranking bruto) + respondeu-indevidamente nas fora-do-escopo (modo com recusa)."""
    r1 = r3 = mrr = n = oos = oos_a = 0; per = {}
    for t in tests:
        if t["doc"] is None:
            oos += 1; oos_a += answer(ix, t["q"], mode)["status"] == "answered"; continue
        ids = [h["id"] for h in search(ix, t["q"], mode, len(ix["docs"]))[0]]; n += 1; pos = ids.index(t["doc"]) + 1 if t["doc"] in ids else None
        r1 += pos == 1; r3 += bool(pos and pos <= 3); mrr += 1 / pos if pos else 0
        pair = t["lang"] + ">" + ix["docs"][t["doc"]]["lang"]; p = per.setdefault(pair, [0, 0]); p[0] += pos == 1; p[1] += 1
    return {"mode": mode, "n": n, "recall1": round(r1 / n, 3), "recall3": round(r3 / n, 3), "mrr": round(mrr / n, 3), "oos": oos, "oos_answered": oos_a, "pairs": per}


if __name__ == "__main__":
    ix = build()
    for q in sys.argv[1:] or ["How much is the monthly plan?"]:
        r = answer(ix, q); print(f"\nP ({r['lang']}):", q); print("R:", r["answer"] or r["reason"], f"[{r['status']}, cobertura {r['coverage']}]")
        if r["status"] == "answered": print(f"   [1] doc {r['doc']} ({r['doc_lang']}) · {r['title']}  ·  " + "; ".join(f"{m['q']}≈{m['d']}" for m in r["matches"]))
