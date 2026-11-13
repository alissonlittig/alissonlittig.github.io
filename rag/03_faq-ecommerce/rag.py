"""FAQ de e-commerce com guardrail 'não sei'. Local, sem chave, sem LLM: a resposta é o texto cadastrado da FAQ (nunca gerado).
Recuperação: BM25 + TF-IDF de n-gramas (RRF) escolhe a FAQ candidata; a CONFIANÇA decide se responde, sugere ou diz 'não sei':
  conf = 0.5 * min(1, cos/0.6) + 0.5 * cobertura   (cos = similaridade de n-gramas; cobertura = fração, ponderada por raridade, dos termos da pergunta presentes na FAQ)
  conf >= T -> responde · conf >= T-0.15 -> 'você quis dizer?' (2 FAQs, sem resposta) · abaixo -> 'não sei' + encaminha para atendente.
Uso: python rag.py "quanto tempo demora a entrega?" [--t 0.5]   |   python rag.py --eval"""
import json, math, pathlib, sys
import rag_core as C

HERE, T_DEFAULT, BAND = pathlib.Path(__file__).parent, 0.5, 0.15  # 0.5 escolhido olhando só a metade DEV


def build(data=HERE / "data"):
    faq = json.loads((pathlib.Path(data) / "faq.json").read_text("utf-8")); texts = [f["q"] + ". " + f["q"] + ". " + f["a"] for f in faq]  # pergunta repetida = pesa mais que a resposta
    bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    gl = C.gloss_norm(json.loads((pathlib.Path(data) / "glossario.json").read_text("utf-8")))
    return {"glossary": gl, "faq": faq, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def retrieve(ix, q, use_gloss=True):
    groups, qt = C.expand(ix["glossary"] if use_gloss else {}, q); toks = [C.tokens(f["q"] + ". " + f["q"] + ". " + f["a"]) for f in ix["faq"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    fused = C.rrf([C.rank(b), C.rank(v)])[:3]
    return groups, qt, toks, b, v, fused


def confidence(ix, groups, toks, v, top):
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else math.log(1 + (N + .5) / .5)  # termo inexistente pesa o máximo
    w = lambda g: max([idf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else math.log(1 + (N + .5) / .5)  # grupo = termo + sinônimos; cobre se qualquer um está na FAQ
    cov = sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups) if groups else 0.0
    return round(0.5 * min(1.0, v[top] / 0.6) + 0.5 * cov, 3), round(cov, 3)


def ask(ix, q, t=T_DEFAULT, use_gloss=True):
    groups, qt, toks, b, v, fused = retrieve(ix, q, use_gloss); r = {"terms": qt, "decision": "idk", "conf": 0.0, "faq": None, "answer": None, "suggest": [], "cands": []}
    if not fused: return r
    top = fused[0][0]; r["conf"], r["cov"] = confidence(ix, groups, toks, v, top); r["cos"] = round(v[top], 4)
    r["cands"] = [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused]
    if r["conf"] >= t: r.update(decision="answer", faq=top, answer=ix["faq"][top]["a"])
    elif r["conf"] >= t - BAND: r.update(decision="suggest", suggest=[i for i, _ in fused[:2]])
    return r


def evaluate(ix, tests, t, use_gloss=True):
    """Por limiar t: respondeu certo / errado / sugeriu / não sei nas perguntas COM resposta na FAQ; respondeu indevidamente nas SEM resposta."""
    c = dict(correct=0, wrong=0, suggested=0, idk=0, oos_answered=0, oos_refused=0)
    for x in tests:
        r = ask(ix, x["q"], t, use_gloss)
        if x["faq"] is None: c["oos_answered" if r["decision"] == "answer" else "oos_refused"] += 1
        elif r["decision"] == "answer": c["correct" if r["faq"] == x["faq"] else "wrong"] += 1
        else: c["suggested" if r["decision"] == "suggest" else "idk"] += 1
    ins = c["correct"] + c["wrong"] + c["suggested"] + c["idk"]; oos = c["oos_answered"] + c["oos_refused"]; ans = c["correct"] + c["wrong"] + c["oos_answered"]
    c.update(t=t, in_scope=ins, oos=oos, coverage=round(c["correct"] / ins, 3) if ins else 0, precision=round(c["correct"] / ans, 3) if ans else 1.0, false_answer_rate=round(c["oos_answered"] / oos, 3) if oos else 0)
    return c


def split(tests): return [x for i, x in enumerate(tests) if i % 2 == 0], [x for i, x in enumerate(tests) if i % 2 == 1]  # dev (ajusta o limiar) / teste (só mede)


SWEEP = [round(0.30 + 0.05 * i, 2) for i in range(11)]

if __name__ == "__main__":
    ix = build(); tests = json.loads((HERE / "data" / "tests.json").read_text("utf-8"))
    if "--eval" in sys.argv:
        dev, held = split(tests)
        for name, ts in (("DEV (ajuste do limiar)", dev), ("TESTE (separado, só medição)", held)):
            print(f"\n{name}: {len(ts)} perguntas\n   T  certo errado sug  nao-sei  oos-resp  cobertura precisao falsa-resp")
            for t in SWEEP: e = evaluate(ix, ts, t); print(f"{t:5} {e['correct']:5} {e['wrong']:6} {e['suggested']:3} {e['idk']:7} {e['oos_answered']:8} {e['coverage']:10} {e['precision']:8} {e['false_answer_rate']:9}")
        sys.exit()
    a = sys.argv[1:]; t = float(a[a.index("--t") + 1]) if "--t" in a else T_DEFAULT
    for q in [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--t")] or ["quanto tempo demora a entrega?"]:
        r = ask(ix, q, t); print(f"\nP: {q}\n   [{r['decision']}, confiança {r['conf']}]", r["answer"] or ("você quis dizer: " + " | ".join(ix["faq"][i]["q"] for i in r["suggest"]) if r["suggest"] else "Não sei responder isso com segurança; encaminho para um atendente."))
