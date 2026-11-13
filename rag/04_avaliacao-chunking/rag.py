"""Avaliação de estratégias de chunking para RAG: mesmos documentos, mesmas perguntas, mesmo retriever (BM25), só o jeito de cortar muda.
Estratégias: janelas fixas de N palavras (com 0% ou 25% de sobreposição), N frases por trecho, e parágrafo.
Acerto = o trecho recuperado contém inteira a frase-ouro da resposta. Métricas: hit@1, hit@3, MRR, teto (a frase-ouro sobrevive inteira em ALGUM trecho?) e custo (palavras de contexto no top-3).
Uso: python rag.py --eval   |   python rag.py "qual a multa por atraso?" [--cfg fixo60_25]"""
import json, pathlib, sys
import rag_core as C

HERE, K = pathlib.Path(__file__).parent, 3


def words(t): return t.split()


def fixed(text, size, ov):
    w = words(text); step = max(1, round(size * (1 - ov))); out = []
    for i in range(0, len(w), step):
        out.append(" ".join(w[i:i + size]))
        if i + size >= len(w): break
    return out


def by_sentences(text, n):
    s = C.sentences(text); return [" ".join(s[i:i + n]) for i in range(0, len(s), n)]


def by_paragraph(raw): return [" ".join(p.split()) for p in raw.split("\n\n") if p.strip()]


def configs():
    cfg = {f"fixo{n}_{int(o * 100)}": ("fixo", n, o) for n in (30, 60, 120, 240) for o in (0, 0.25)}
    cfg.update({f"frases{n}": ("frases", n, 0) for n in (2, 4)}); cfg["paragrafo"] = ("paragrafo", 0, 0); return cfg


def chunk_all(docs, cfg):
    kind, n, ov = cfg; out = []
    for name, raw in docs.items():
        text = " ".join(raw.split())
        parts = fixed(text, n, ov) if kind == "fixo" else by_sentences(text, n) if kind == "frases" else by_paragraph(raw)
        out += [{"doc": name, "text": p} for p in parts]
    for i, c in enumerate(out): c["id"] = i
    return out


def index_for(chunks):
    bix, toks = C.bm25_index([c["text"] for c in chunks]); return {"bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "chunks": chunks}


def search(ix, q, k=K):
    qt = C.tokens(q); toks = [C.tokens(c["text"]) for c in ix["chunks"]]; s = [C.bm25_score(ix["bm25"], qt, t) for t in toks]
    return [(i, round(s[i], 4)) for i in C.rank(s)[:k]]


def evaluate_cfg(ix, questions, k=K):
    hit1 = hit3 = mrr = ceil = ctx = 0.0
    for q in questions:
        r = search(ix, q["q"], k); texts = [ix["chunks"][i]["text"] for i, _ in r]; ok = [q["gold"] in t for t in texts]
        hit1 += ok[:1] == [True]; hit3 += any(ok); mrr += next((1 / (n + 1) for n, o in enumerate(ok) if o), 0.0)
        ceil += any(q["gold"] in c["text"] for c in ix["chunks"]); ctx += sum(len(t.split()) for t in texts)
    n = len(questions); ws = [len(c["text"].split()) for c in ix["chunks"]]
    return {"chunks": len(ix["chunks"]), "avg_words": round(sum(ws) / len(ws), 1), "hit@1": round(hit1 / n, 3), "hit@3": round(hit3 / n, 3), "mrr": round(mrr / n, 3), "ceiling": round(ceil / n, 3), "ctx_words": round(ctx / n, 1)}


def build(data=HERE / "data"):
    docs = json.loads((pathlib.Path(data) / "docs.json").read_text("utf-8")); qs = json.loads((pathlib.Path(data) / "questions.json").read_text("utf-8"))
    return {"questions": qs, "configs": {name: index_for(chunk_all(docs, c)) for name, c in configs().items()}}


if __name__ == "__main__":
    ix = build(); qs = ix["questions"]
    if "--eval" in sys.argv:
        print(f"{len(qs)} perguntas\n{'config':12} chunks  pal/chunk  hit@1  hit@3    MRR  teto  ctx(pal)")
        for n, c in ix["configs"].items(): e = evaluate_cfg(c, qs); print(f"{n:12} {e['chunks']:6} {e['avg_words']:10} {e['hit@1']:6} {e['hit@3']:6} {e['mrr']:6} {e['ceiling']:5} {e['ctx_words']:9}")
        sys.exit()
    a = sys.argv[1:]; cfg = a[a.index("--cfg") + 1] if "--cfg" in a else "fixo60_25"; q = " ".join(x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--cfg")) or "qual a multa por atraso?"
    for i, s in search(ix["configs"][cfg], q): c = ix["configs"][cfg]["chunks"][i]; print(f"{s:7}  [{c['doc']}] {c['text'][:110]}...")
