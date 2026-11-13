"""RAG com CACHE SEMÂNTICO e medição de custo/latência (100% local, sem chave, sem LLM). FAQ de uma clínica veterinária FICTÍCIA (CC0).
Pergunta -> vetor (3 opções: n-gramas, n-gramas com glossário, LSA) -> vizinho mais próximo entre as perguntas já respondidas -> se similaridade >= limiar, devolve a resposta guardada (ACERTO);
senão roda o RAG (BM25 + n-gramas, RRF), "chama o gerador" e guarda (ERRO). Resposta = o texto extrativo do documento.
REAL: recuperação, cache, similaridade, taxa de acerto, acerto FALSO (cache serviu a resposta de outra intenção) e a latência da busca/consulta ao cache (medida).
SIMULADO: o gerador (LLM) e seu custo/latência (constantes de SIM, hipotéticas, não são preço de nenhum fornecedor). Uso: python rag.py"""
import json, math, pathlib, statistics, time
import rag_core as C

HERE = pathlib.Path(__file__).parent
SIM = {"sys_tokens": 120, "tok_per_word": 1.4, "llm_base_ms": 700, "ms_per_out_token": 22, "usd_per_m_in": 0.50, "usd_per_m_out": 1.50}  # tudo hipotético
KINDS = ["ng", "ngx", "lsa"]; THRESH = [round(0.30 + 0.05 * i, 2) for i in range(14)]; MAX_FALSE = 0.05


def build(data=HERE / "data"):
    data = pathlib.Path(data); docs = json.loads((data / "faq.json").read_text("utf-8")); gl = C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8")))
    toks = [C.tokens(d["title"] + " " + d["text"]) for d in docs]; bix, _ = C.bm25_index([d["title"] + " " + d["text"] for d in docs]); idf, vecs = C.ng_index(toks)
    lsa, _ = C.lsa_build(toks, k=12); lsa.pop("_ix", None)
    intents = json.loads((data / "stream.json").read_text("utf-8"))["intents"]; names = list(intents); stream = []
    for r in range(5):
        for k, n in enumerate(names):
            if r < len(intents[n]): stream.append({"q": intents[n][r], "intent": n, "dev": k % 2 == 0})
    for k, n in enumerate(names):
        if k % 3 == 0: stream.append({"q": intents[n][0], "intent": n, "dev": k % 2 == 0})  # repetição exata
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"disclaimer": "Protótipo de estudo: FAQ fictício, gerador e custos simulados.", "docs": docs, "glossary": gl, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]},
            "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs], "lsa": lsa, "stream": stream, "sim": SIM, "kinds": KINDS, "thresholds": THRESH, "max_false": MAX_FALSE}


def retrieve(ix, q, k=3):
    groups, qt = C.expand(ix["glossary"], q); qv = C.ng_vec(qt, ix["ng_idf"]); toks = [C.tokens(d["title"] + " " + d["text"]) for d in ix["docs"]]
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    return [i for i, _ in C.rrf([C.rank(b), C.rank(v)])[:k]]


def embed(ix, q, kind):
    if kind == "ng": return C.ng_vec(C.tokens(q), ix["ng_idf"])
    if kind == "ngx": return C.ng_vec(C.expand(ix["glossary"], q)[1], ix["ng_idf"])
    return C.lsa_vec(ix["lsa"], C.tokens(q))


def sim(kind, a, b): return C.dot(a, b) if kind == "lsa" else C.cos(a, b)


def llm_cost(ix, q, top):
    """Custo/latência SIMULADOS de uma chamada ao gerador com o prompt (sistema + pergunta + 3 trechos) e a resposta extrativa."""
    s = ix["sim"]; w = lambda t: len(t.split()) * s["tok_per_word"]
    tin = s["sys_tokens"] + w(q) + sum(w(ix["docs"][i]["text"]) for i in top); tout = w(ix["docs"][top[0]]["text"]) if top else 0
    return {"tin": round(tin), "tout": round(tout), "ms": round(s["llm_base_ms"] + s["ms_per_out_token"] * tout), "usd": (tin * s["usd_per_m_in"] + tout * s["usd_per_m_out"]) / 1e6}


def replay(ix, queries, kind, t):
    cache = []; hits = false_hits = wrong = base_wrong = 0; usd = base_usd = ms = base_ms = 0.0; rows = []
    for x in queries:
        top = retrieve(ix, x["q"]); ans = ix["docs"][top[0]]["id"] if top else None; c = llm_cost(ix, x["q"], top); base_usd += c["usd"]; base_ms += c["ms"]; base_wrong += ans != x["intent"]
        v = embed(ix, x["q"], kind); best = max(((sim(kind, v, e["v"]), n) for n, e in enumerate(cache)), default=(0.0, -1), key=lambda p: (p[0], -p[1]))
        if best[1] >= 0 and best[0] >= t:
            e = cache[best[1]]; served = e["ans"]; hits += 1; false_hits += served != x["intent"]; wrong += served != x["intent"]; rows.append({"q": x["q"], "hit": True, "sim": round(best[0], 4), "from": e["q"], "served": served, "ok": served == x["intent"]})
        else:
            usd += c["usd"]; ms += c["ms"]; wrong += ans != x["intent"]; cache.append({"v": v, "ans": ans, "q": x["q"]}); rows.append({"q": x["q"], "hit": False, "sim": round(best[0], 4), "from": None, "served": ans, "ok": ans == x["intent"]})
    n = len(queries)
    return {"n": n, "hits": hits, "hit_rate": round(hits / n, 4), "false_hits": false_hits, "false_hit_rate": round(false_hits / hits, 4) if hits else 0.0, "wrong": wrong, "base_wrong": base_wrong, "llm_calls": n - hits,
            "usd": round(usd, 8), "base_usd": round(base_usd, 8), "saved_pct": round(100 * (1 - usd / base_usd), 1), "sim_ms": round(ms), "base_sim_ms": round(base_ms), "rows": rows}


def pick(ix, kind):
    dev = [x for x in ix["stream"] if x["dev"]]; best = None
    for t in ix["thresholds"]:
        r = replay(ix, dev, kind, t)
        if r["false_hit_rate"] <= ix["max_false"] and (best is None or r["saved_pct"] >= best[1]): best = (t, r["saved_pct"])
    return best[0] if best else 1.01  # nenhum limiar seguro: cache desligado


def measure(ix, n=3):
    """Latência REAL (ms) da consulta ao cache (embed + varredura) e da recuperação, nesta máquina. Não entra nos testes de igualdade."""
    qs = [x["q"] for x in ix["stream"]]; out = {}
    for kind in KINDS:
        cache = [embed(ix, q, kind) for q in qs[:40]]; ts = []
        for _ in range(n):
            for q in qs:
                t0 = time.perf_counter(); v = embed(ix, q, kind); max(sim(kind, v, e) for e in cache); ts.append((time.perf_counter() - t0) * 1000)
        out[kind] = {"p50_ms": round(statistics.median(ts), 3), "p95_ms": round(sorted(ts)[int(len(ts) * .95)], 3)}
    ts = []
    for _ in range(n):
        for q in qs: t0 = time.perf_counter(); retrieve(ix, q); ts.append((time.perf_counter() - t0) * 1000)
    out["retrieve"] = {"p50_ms": round(statistics.median(ts), 3), "p95_ms": round(sorted(ts)[int(len(ts) * .95)], 3)}; return out


def report(ix):
    test = [x for x in ix["stream"] if not x["dev"]]; res = {}
    for kind in KINDS:
        t = pick(ix, kind); r = replay(ix, test, kind, t); res[kind] = {"threshold": t, **{k: v for k, v in r.items() if k != "rows"}}
    return res


if __name__ == "__main__":
    ix = build(); print(f"{len(ix['stream'])} perguntas (DEV {sum(x['dev'] for x in ix['stream'])}, TESTE {sum(not x['dev'] for x in ix['stream'])}); gerador e custo SIMULADOS")
    for k, r in report(ix).items(): print(f"{k:4} limiar {r['threshold']} (escolhido no DEV) -> TESTE: acerto {r['hit_rate']:.0%}, acerto falso {r['false_hits']}/{r['hits']}, economia simulada {r['saved_pct']}%, chamadas ao gerador {r['llm_calls']}/{r['n']}")
    print("latência medida (ms, esta máquina):", measure(ix))
