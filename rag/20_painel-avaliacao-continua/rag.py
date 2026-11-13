"""Avaliação CONTÍNUA de RAG (100% local, sem chave, sem LLM). Base de ajuda de um app fictício ("Caderno", CC0), 46 perguntas de teste + 6 fora do escopo, 7 VERSÕES do recuperador.
Cada versão é uma configuração real (tokenizador, BM25, n-gramas + RRF, glossário, recusa por cobertura, reranker) executada de verdade; o resultado de cada pergunta em cada versão vai
para um histórico (results/history.json). A análise compara cada versão com a anterior: nota, perguntas que PIORARAM (passava e agora falha) e o status OK / ALERTA / REGRESSÃO.
`python rag.py` recalcula tudo; `python rag.py --gate [v6]` sai com código 1 se a versão regride (uso em CI). As 7 versões são variantes que EU escrevi para contar a história; as datas são inventadas."""
import json, math, pathlib, re, sys
import rag_core as C

HERE = pathlib.Path(__file__).parent; TOL = 1.0; FLIPS_ALERT = 2
VERSIONS = [
    {"id": "v1", "date": "2026-09-14", "note": "BM25 simples: sem stopwords, sem plural", "cfg": {"tok": "raw", "bm25": 1, "ng": 0, "gl": 0, "cov": None, "rerank": 0}},
    {"id": "v2", "date": "2026-09-21", "note": "Tokenizador padrão: stopwords, plural, sem acento", "cfg": {"tok": "std", "bm25": 1, "ng": 0, "gl": 0, "cov": None, "rerank": 0}},
    {"id": "v3", "date": "2026-09-28", "note": "+ n-gramas de caracteres, fusão RRF", "cfg": {"tok": "std", "bm25": 1, "ng": 1, "gl": 0, "cov": None, "rerank": 0}},
    {"id": "v4", "date": "2026-10-05", "note": "+ glossário de sinônimos na pergunta", "cfg": {"tok": "std", "bm25": 1, "ng": 1, "gl": 1, "cov": None, "rerank": 0}},
    {"id": "v5", "date": "2026-10-12", "note": "+ recusa por cobertura (mínimo 0,3)", "cfg": {"tok": "std", "bm25": 1, "ng": 1, "gl": 1, "cov": 0.3, "rerank": 0}},
    {"id": "v6", "date": "2026-10-19", "note": "Refatoração do tokenizador: acentos deixam de ser normalizados", "cfg": {"tok": "accent", "bm25": 1, "ng": 1, "gl": 1, "cov": 0.3, "rerank": 0}},
    {"id": "v7", "date": "2026-10-26", "note": "Corrige os acentos + reranker por bigramas", "cfg": {"tok": "std", "bm25": 1, "ng": 1, "gl": 1, "cov": 0.3, "rerank": 1}}]


def stem(t): return t[:-1] if len(t) > 3 and t.endswith("s") else t


def tok(kind, s):
    if kind == "raw": return re.findall(r"[a-z0-9]+", C.norm(s))
    if kind == "std": return C.tokens(s)
    return [stem(t) for t in re.findall(r"[a-zà-ú0-9]+", s.lower()) if len(t) >= 2 and t not in C.STOP]  # "accent": SEM normalizar acentos (a regressão da v6)


def run_version(kb, questions, gl, cfg):
    kind = cfg["tok"]; toks = [tok(kind, d["title"] + " " + d["text"]) for d in kb]; df = {}
    for tk in toks:
        for t in set(tk): df[t] = df.get(t, 0) + 1
    bix = {"df": df, "avgdl": sum(map(len, toks)) / len(toks), "n": len(toks)}; idf, vecs = C.ng_index(toks); N = len(toks)
    widf = lambda t: math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0; unk = math.log(1 + (N + .5) / .5); out = []
    for x in questions:
        base = tok(kind, x["q"]); groups = [[t] + [s for s in gl.get(t, []) if s != t] for t in base] if cfg["gl"] else [[t] for t in base]; qt = []
        for g in groups:
            for t in g:
                if t not in qt: qt.append(t)
        rankings = []
        if cfg["bm25"]: rankings.append(C.rank([C.bm25_score(bix, qt, t) for t in toks]))
        if cfg["ng"]: qv = C.ng_vec(qt, idf); rankings.append(C.rank([C.cos(qv, v) for v in vecs]))
        fused = C.rrf(rankings)[:5]
        if cfg["rerank"] and fused:
            mx = fused[0][1]; sc = [(i, C.rerank_score(C.rerank_features(qt, kb[i]["title"], toks[i]), s / mx)) for i, s in fused]; fused = sorted(sc, key=lambda p: (-p[1], p[0]))
        top = [i for i, _ in fused]; refused = False; cov = 0.0
        if cfg["cov"] is not None:
            if not top or not qt: refused = True
            else:
                w = lambda g: max([widf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else unk
                cov = round(sum(w(g) for g in groups if set(g) & set(toks[top[0]])) / sum(w(g) for g in groups), 2); refused = cov < cfg["cov"]
        exp = x.get("doc"); rank = (next((n + 1 for n, i in enumerate(top) if kb[i]["id"] == exp), None)) if exp else None
        out.append({"rank": rank, "refused": refused, "top": [kb[i]["id"] for i in top[:3]], "cov": cov})
    return out


def passed(q, r): return r["refused"] if q.get("oos") else (r["rank"] is not None and r["rank"] <= 3 and not r["refused"])


def metrics(qs, per):
    a = [(q, r) for q, r in zip(qs, per) if not q.get("oos")]; o = [(q, r) for q, r in zip(qs, per) if q.get("oos")]; ok = lambda r, k: r["rank"] is not None and r["rank"] <= k and not r["refused"]
    m = {"recall1": sum(ok(r, 1) for _, r in a) / len(a), "recall3": sum(ok(r, 3) for _, r in a) / len(a), "mrr": sum(1 / r["rank"] for _, r in a if r["rank"] and not r["refused"]) / len(a),
         "false_refusal": sum(r["refused"] for _, r in a) / len(a), "oos_refusal": sum(r["refused"] for _, r in o) / len(o)}
    m["nota"] = 100 * (m["recall1"] + m["recall3"] + m["mrr"] + m["oos_refusal"]) / 4; cats = {}
    for q, r in zip(qs, per): cats.setdefault(q["cat"], []).append(passed(q, r))
    return {k: round(v, 4) for k, v in m.items()}, {c: round(sum(v) / len(v), 4) for c, v in cats.items()}


def build(data=HERE / "data"):
    data = pathlib.Path(data); kb = json.loads((data / "kb.json").read_text("utf-8")); Q = json.loads((data / "questions.json").read_text("utf-8")); gl = C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8")))
    qs = Q["questions"] + [{**o, "oos": True} for o in Q["oos"]]; vers = []
    for v in VERSIONS:
        per = run_version(kb, qs, gl, v["cfg"]); m, cats = metrics(qs, per); vers.append({**v, "metrics": m, "by_cat": cats, "per_q": [{"rank": r["rank"], "refused": r["refused"], "top": r["top"]} for r in per]})
    return {"disclaimer": "Protótipo de estudo: base fictícia, versões escritas por mim, datas inventadas.", "tol": TOL, "flips_alert": FLIPS_ALERT, "docs": kb, "questions": qs, "versions": vers}


def analyze(h, tol=TOL, flips_alert=FLIPS_ALERT):
    out = []; qs = h["questions"]
    for n, v in enumerate(h["versions"]):
        if n == 0: out.append({"id": v["id"], "nota": round(v["metrics"]["nota"], 2), "delta": None, "down": [], "up": [], "status": "base"}); continue
        p = h["versions"][n - 1]; down = [i for i, q in enumerate(qs) if passed(q, p["per_q"][i]) and not passed(q, v["per_q"][i])]; up = [i for i, q in enumerate(qs) if not passed(q, p["per_q"][i]) and passed(q, v["per_q"][i])]
        d = round(v["metrics"]["nota"] - p["metrics"]["nota"], 2); st = "regressao" if d < -tol else "alerta" if len(down) >= flips_alert else "ok"
        out.append({"id": v["id"], "nota": round(v["metrics"]["nota"], 2), "delta": d, "down": down, "up": up, "status": st})
    return out


def gate(h, version=None, tol=TOL):
    a = analyze(h, tol); x = next((r for r in a if r["id"] == version), a[-1]); return x["status"] != "regressao", x


if __name__ == "__main__":
    h = build(); (HERE / "results").mkdir(exist_ok=True); (HERE / "results" / "history.json").write_text(json.dumps(h, ensure_ascii=False, indent=1), "utf-8"); a = analyze(h)
    ver = next((s for s in sys.argv[1:] if re.fullmatch(r"v\d+", s)), None)
    if "--gate" in sys.argv:
        ok, x = gate(h, ver); print(f"{'PASSOU' if ok else 'FALHOU'}: {x['id']} nota {x['nota']} ({x['delta']:+} vs anterior), status {x['status']}, {len(x['down'])} perguntas pioraram"); sys.exit(0 if ok else 1)
    print(f"{len(h['questions'])} perguntas ({sum(1 for q in h['questions'] if q.get('oos'))} fora do escopo), {len(h['versions'])} versões")
    for v, x in zip(h["versions"], a): m = v["metrics"]; print(f"{v['id']} nota {x['nota']:6} {'' if x['delta'] is None else format(x['delta'], '+.2f'):>7} {x['status']:9} r@1 {m['recall1']:.2f} r@3 {m['recall3']:.2f} mrr {m['mrr']:.2f} fora {m['oos_refusal']:.2f} falsa-recusa {m['false_refusal']:.2f} | {v['note']} | pioraram {len(x['down'])}")
