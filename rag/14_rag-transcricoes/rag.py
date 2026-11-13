"""RAG sobre transcrições de reuniões e vídeo-aula (fictícias), com minuto:segundo. Local, sem chave, sem LLM.
Corte: janelas deslizantes de W falas consecutivas (passo 1), cada janela guarda o tempo da primeira e da última fala.
Busca: BM25 + n-gramas (RRF) nas janelas, com pré-filtro opcional por gravação. Resposta EXTRATIVA: a fala da melhor janela com mais termos
da pergunta (ponderados por raridade), citada como gravação + mm:ss + quem falou. Resultados que se sobrepõem a um melhor já mostrado são descartados.
Confiança = 0.5 * min(1, cos/0.6) + 0.5 * cobertura de termos; abaixo do limiar T, diz que não achou nas gravações.
Uso: python rag.py "quando sai o beta?" [--doc kickoff_rota_leve] | python rag.py --eval"""
import json, math, pathlib, re, sys
import rag_core as C

HERE, T_DEFAULT, W_DEFAULT = pathlib.Path(__file__).parent, 0.45, 3
mmss = lambda s: f"{s // 60:02d}:{s % 60:02d}"
sec = lambda t: int(t[:-3]) * 60 + int(t[-2:])


def parse(path):
    lines = [l for l in path.read_text("utf-8").splitlines() if l.strip()]; head = [x.strip() for x in lines[0].lstrip("# ").split("|")]
    segs = []
    for l in lines[1:]:
        m = re.match(r"(\d\d:\d\d) ([^:]+): (.+)", l); segs.append({"t": sec(m.group(1)), "who": m.group(2), "text": m.group(3)})
    return {"id": path.stem, "title": head[0], "about": head[1], "dur": sec(head[2])}, segs


def wtext(segs): return " ".join(s["who"] + ": " + s["text"] for s in segs)


def build(W=W_DEFAULT, data=HERE / "data"):
    docs, segs, wins = [], [], []
    for f in sorted(pathlib.Path(data).glob("*.txt")):
        d, ss = parse(f); docs.append(d); base = len(segs); segs += [dict(s, doc=d["id"]) for s in ss]
        for i in range(max(1, len(ss) - W + 1)): wins.append({"doc": d["id"], "a": base + i, "b": base + min(i + W, len(ss)) - 1})
    for w in wins: w["t0"], w["t1"] = segs[w["a"]]["t"], segs[w["b"]]["t"]
    bix, toks = C.bm25_index([wtext(segs[w["a"]:w["b"] + 1]) for w in wins]); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    gl = C.gloss_norm(json.loads((pathlib.Path(data) / "glossario.json").read_text("utf-8")))
    return {"W": W, "glossary": gl, "docs": docs, "segs": segs, "wins": wins, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def _toks(ix): return [C.tokens(wtext(ix["segs"][w["a"]:w["b"] + 1])) for w in ix["wins"]]


def confidence(ix, groups, toks, v, top):
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; mx = math.log(1 + (N + .5) / .5)
    w = lambda g: max([math.log(1 + (N - df[t] + .5) / (df[t] + .5)) for t in g if t in df] + [0.0]) if any(t in df for t in g) else mx
    cov = sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups) if groups else 0.0
    return round(0.5 * min(1.0, v[top] / 0.6) + 0.5 * cov, 3), round(cov, 3)


def ask(ix, q, doc=None, t=T_DEFAULT, k=3):
    groups, qt = C.expand(ix["glossary"], q); toks = _toks(ix); qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, tk) for tk in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    ok = lambda i: doc is None or ix["wins"][i]["doc"] == doc  # pré-filtro por gravação
    fused = [(i, s) for i, s in C.rrf([C.rank(b), C.rank(v)]) if ok(i)]; hits = []
    for i, s in fused:
        w = ix["wins"][i]
        if any(h["doc"] == w["doc"] and not (w["b"] < h["a"] or w["a"] > h["b"]) for h in hits): continue  # sobreposto a um melhor
        hits.append({"id": i, "doc": w["doc"], "a": w["a"], "b": w["b"], "t0": w["t0"], "t1": w["t1"], "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)})
        if len(hits) == k: break
    r = {"terms": qt, "hits": hits, "answer": None, "conf": 0.0}
    if not hits: return r
    top = hits[0]["id"]; r["conf"], r["cov"] = confidence(ix, groups, toks, v, top)
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; wt = lambda x: math.log(1 + (N - df[x] + .5) / (df[x] + .5)) if x in df else 0.0; qs = set(qt) | {x for g in groups for x in g}
    best = max(range(hits[0]["a"], hits[0]["b"] + 1), key=lambda j: (round(sum(wt(x) for x in set(C.tokens(ix["segs"][j]["who"] + " " + ix["segs"][j]["text"])) & qs), 4), -j))
    if r["conf"] >= t: r["answer"] = {"seg": best, "t": ix["segs"][best]["t"], "ts": mmss(ix["segs"][best]["t"]), "who": ix["segs"][best]["who"], "text": ix["segs"][best]["text"], "doc": ix["segs"][best]["doc"]}
    return r


def evaluate(tests, W=W_DEFAULT, t=T_DEFAULT, ix=None):
    """Respondíveis: hit@1 / hit@3 (algum resultado cobre a fala-ouro; o tempo-ouro está dentro de [t0,t1] da janela), MRR e acerto da fala citada. Fora de escopo: % recusadas."""
    ix = ix or build(W); n = h1 = h3 = ans_ok = answered = 0; mrr = 0.0; oos = oos_ref = 0
    for x in tests:
        r = ask(ix, x["q"], None, t, 5)
        if x["gold"] is None:
            oos += 1; oos_ref += r["answer"] is None; continue
        n += 1; cov = lambda h: h["doc"] == x["gold"]["doc"] and any(h["t0"] <= g <= h["t1"] for g in map(sec, x["gold"]["t"]))
        rk = next((i for i, h in enumerate(r["hits"]) if cov(h)), None)
        if rk is not None: mrr += 1 / (rk + 1); h3 += rk < 3; h1 += rk == 0
        if r["answer"]: answered += 1; ans_ok += r["answer"]["doc"] == x["gold"]["doc"] and r["answer"]["t"] in map(sec, x["gold"]["t"])
    return {"W": W, "n": n, "hit1": round(h1 / n, 3), "hit3": round(h3 / n, 3), "mrr": round(mrr / n, 3), "answered": answered, "cited_exact": ans_ok, "oos": oos, "oos_refused": oos_ref}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--eval" in sys.argv:
        ts = json.loads((HERE / "data" / "tests.json").read_text("utf-8"))
        for n, part in (("DEV", ts[0::2]), ("TESTE", ts[1::2])): print(n, evaluate(part))
        print("janela W (todas as perguntas):"); [print(" ", evaluate(ts, W=w)) for w in (1, 2, 3, 5)]
    else:
        a = [x for x in sys.argv[1:] if not x.startswith("--")]; doc = sys.argv[sys.argv.index("--doc") + 1] if "--doc" in sys.argv else None
        a = [x for x in a if x != doc]; r = ask(build(), " ".join(a), doc); print("conf", r["conf"])
        for h in r["hits"]: print(f"  {h['doc']} {mmss(h['t0'])}-{mmss(h['t1'])} rrf {h['rrf']}")
        print(r["answer"] or "não achei nas gravações")
