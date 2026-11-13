"""RAG com detecção de alucinação: checa se CADA frase de uma resposta tem suporte nos trechos recuperados. 100% local, sem chave, sem LLM.
As respostas candidatas vêm escritas à mão (data/respostas.json) para simular a saída de um gerador, algumas com frases inventadas;
o verificador é lexical, não um modelo de inferência (NLI).
Fluxo: pergunta + resposta -> recupera os 3 melhores trechos (BM25 + n-gramas, RRF) -> para cada frase da resposta acha a melhor frase de evidência
  suporte = peso (idf) dos termos da frase que aparecem na evidência / peso de todos os termos da frase
  -> sem suporte se: suporte < LO, ou número que não está na evidência, ou polaridade oposta (proibido x permitido, não x sim)
  -> parcial se LO <= suporte < HI; suportada se suporte >= HI.
Uso: python rag.py "Qual a multa?" "A multa é de R$ 1,00 por dia." """
import json, pathlib, re, sys
from math import log
import rag_core as C

HERE = pathlib.Path(__file__).parent
HI, LO = 0.7, 0.5
NEG = {"nao", "nunca", "proibido", "proibida", "sem", "impossivel"}
POS = {"permitido", "permitida", "pode", "podem", "liberado", "liberada"}


def chunk_doc(path):
    lines = path.read_text("utf-8").splitlines(); title = lines[0].lstrip("# ").strip(); sec = ""; out = []
    for no, l in enumerate(lines, start=1):
        if l.startswith("## "): sec = l[3:].strip()
        elif sec and l.strip(): out.append({"doc": path.name, "title": title, "section": sec, "line": no, "text": l.strip()})
    return out


def build(docs_dir=HERE / "data"):
    chunks = [c for f in sorted(pathlib.Path(docs_dir).glob("*.md")) for c in chunk_doc(f)]
    for i, c in enumerate(chunks): c["id"] = i
    bix, toks = C.bm25_index([c["section"] + " " + c["text"] for c in chunks]); idf, vecs = C.ng_index(toks)
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def retrieve(ix, text, k=3):
    qt = C.tokens(text); qv = C.ng_vec(qt, ix["ng_idf"]); toks = [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    return [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in C.rrf([C.rank(b), C.rank(v)])[:k]]


def numbers(s): return sorted({m.replace(",", ".") for m in re.findall(r"\d+(?:[.,]\d+)?", s)})


def polarity(s):
    w = set(re.findall(r"[a-z]+", C.norm(s))); return "neg" if w & NEG else ("pos" if w & POS else "")


def check(ix, question, answer, k=3):
    hits = retrieve(ix, question + " " + answer, k); N, df = ix["bm25"]["n"], ix["bm25"]["df"]
    w = lambda t: log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else log(1 + (N + .5) / .5)  # termo que nunca aparece no corpus pesa o máximo
    ev = [(h["id"], s) for h in hits for s in C.sentences(ix["chunks"][h["id"]]["text"])]; out = []
    for s in C.sentences(answer):
        ts = set(C.tokens(s)); best = None
        for cid, e in ev:
            te = set(C.tokens(e)); tot = sum(w(t) for t in ts)
            sc = round(sum(w(t) for t in ts & te) / tot, 4) if tot else 0.0
            if best is None or sc > best[0]: best = (sc, cid, e)
        sc, cid, e = best if best else (0.0, None, "")
        issues = []
        ns, ne = numbers(s), numbers(e)
        if not ts: label = "na"
        else:
            if [n for n in ns if n not in ne]: issues.append("número fora da evidência: " + ", ".join(n for n in ns if n not in ne))
            ps, pe = polarity(s), polarity(e)
            if sc >= LO and ps != pe and "neg" in (ps, pe): issues.append("polaridade oposta à evidência")
            label = "sem suporte" if (issues or sc < LO) else ("suportada" if sc >= HI else "parcial")
        out.append({"text": s, "label": label, "support": sc, "issues": issues, "evidence": {"id": cid, "sentence": e} if label != "na" and cid is not None else None})
    n = len([x for x in out if x["label"] != "na"]); ok = sum(1 for x in out if x["label"] == "suportada")
    return {"hits": hits, "sentences": out, "summary": {"n": n, "suportada": ok, "parcial": sum(1 for x in out if x["label"] == "parcial"), "sem_suporte": sum(1 for x in out if x["label"] == "sem suporte"), "fiel_pct": round(100 * ok / n) if n else 0}}


def evaluate(ix, samples):
    """gold 1 = frase fiel ao documento, 0 = inventada. Previsão 'inventada' = label 'sem suporte'. -> precisão/recall de achar as inventadas."""
    tp = fp = fn = tn = 0
    for r in samples:
        sents = check(ix, r["q"], r["answer"])["sentences"]; assert len(sents) == len(r["gold"]), r["id"]
        for s, g in zip(sents, r["gold"]):
            flag = s["label"] == "sem suporte"
            if flag and g == 0: tp += 1
            elif flag and g == 1: fp += 1
            elif not flag and g == 0: fn += 1
            else: tn += 1
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "precision": round(tp / (tp + fp), 3) if tp + fp else None, "recall": round(tp / (tp + fn), 3) if tp + fn else None}


if __name__ == "__main__":
    ix = build()
    if len(sys.argv) < 3: print("uso: rag.py PERGUNTA RESPOSTA"); sys.exit(2)
    r = check(ix, sys.argv[1], sys.argv[2]); print(r["summary"])
    for s in r["sentences"]: print(f"[{s['label']:11}] {s['support']:.2f} {s['text']}" + (f"  <- {s['issues']}" if s["issues"] else "") + (f"\n               evid: {s['evidence']['sentence']}" if s["evidence"] else ""))
