"""Assistente de documentos com citação da fonte (manuais em Markdown, PT-BR). 100% local, sem chave, sem LLM.
Chunking por seção -> busca híbrida (BM25 + TF-IDF de n-gramas, fusão RRF) -> resposta EXTRATIVA: até 2 frases literais, cada uma com marcador [n]
apontando para documento, seção e linha. Sem evidência suficiente, recusa em vez de inventar.
Uso: python rag.py "como reinicio o roteador?" [--k 3]"""
import json, pathlib, re, sys
import rag_core as C

MAX_WORDS, COVERAGE_MIN, HERE = 45, 0.5, pathlib.Path(__file__).parent


def chunk_doc(path):
    """Seção '## n. Título' -> 1+ trechos de até MAX_WORDS palavras. Guarda a linha do arquivo (1-based) onde o trecho começa."""
    lines = path.read_text("utf-8").splitlines(); title = lines[0].lstrip("# ").strip(); out = []; sec, start, body = "", 0, []

    def flush():
        grp, n, first = [], 0, start
        for s in C.sentences(" ".join(body)) + [None]:
            if s is None or (grp and n + len(s.split()) > MAX_WORDS):
                if grp: out.append({"doc": path.name, "title": title, "section": sec, "line": first, "text": " ".join(grp)})
                grp, n = [], 0
            if s: grp.append(s); n += len(s.split())
    for no, l in enumerate(lines, start=1):
        if l.startswith("## "):
            if sec: flush()
            sec, start, body = l[3:].strip(), no, []
        elif sec and l.strip(): body.append(l.strip())
    if sec: flush()
    return out


def build(docs_dir=HERE / "data"):
    chunks = [c for f in sorted(pathlib.Path(docs_dir).glob("*.md")) for c in chunk_doc(f)]
    if not chunks: raise ValueError(f"nenhum .md em {docs_dir}")
    texts = [c["section"] + " " + c["text"] for c in chunks]
    bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks)
    for i, c in enumerate(chunks): c["id"] = i
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    raw = json.loads((pathlib.Path(docs_dir) / "glossario.json").read_text("utf-8"))
    glossary = {C.tokens(k)[0]: [t for s in v for t in C.tokens(s)] for k, v in raw.items() if C.tokens(k)}  # mesma normalização da pergunta (ex.: "meses" -> "mese")
    return {"glossary": glossary, "chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def expand(ix, q):
    """Glossário de sinônimos: -> (grupos [[termo, sin...]], termos achatados sem repetição). Só no lado da pergunta."""
    groups = [[t] + [s for s in ix["glossary"].get(t, []) if s != t] for t in C.tokens(q)]
    flat = []
    for g in groups:
        for t in g:
            if t not in flat: flat.append(t)
    return groups, flat


def search(ix, q, k=3):
    """-> lista [(id, rrf, bm25, cos)] ordenada."""
    bix = ix["bm25"]; qt = expand(ix, q)[1]; qv = C.ng_vec(qt, ix["ng_idf"]); n = len(ix["chunks"])
    toks = [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]
    b = [C.bm25_score(bix, qt, t) for t in toks]; v = [C.cos(qv, ix["ng_vecs"][i]) for i in range(n)]
    fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    return [(i, round(s, 5), round(b[i], 4), round(v[i], 4)) for i, s in fused], qt, toks


def answer(ix, question, k=3):
    hits, q, toks = search(ix, question, k); groups = expand(ix, question)[0]; res = {"terms": q, "status": "refused", "answer": None, "coverage": 0.0, "sources": [], "hits": hits}
    if not q: res["reason"] = "só palavras comuns na pergunta"; return res
    if not hits: res["reason"] = "nenhum trecho tem relação com a pergunta"; return res
    top = hits[0][0]; N, df = ix["bm25"]["n"], ix["bm25"]["df"]
    idf = lambda t: C.math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5)) if t in df else 0.0
    unk = C.math.log(1 + (N + 0.5) / 0.5)  # termo que não existe em nenhum documento pesa o máximo: não achar ele é o sinal mais forte de "não está aqui"
    w = lambda g: max([idf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else unk
    res["coverage"] = round(sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups), 2)
    if res["coverage"] < COVERAGE_MIN: res["reason"] = "não encontrei isso nos documentos (cobertura %d%% < %d%%)" % (res["coverage"] * 100, COVERAGE_MIN * 100); return res
    cand = []  # (score, hit_pos, sent_pos, frase)
    for pos, (i, *_r) in enumerate(hits):
        for sp, s in enumerate(C.sentences(ix["chunks"][i]["text"])):
            cand.append((round(sum(idf(t) for t in set(q) & set(C.tokens(s))), 4), pos, sp, s))
    cand.sort(key=lambda c: (-c[0], c[1], c[2])); best = cand[0]
    pick = [best] + [c for c in cand[1:] if c[0] > 0 and c[0] >= 0.8 * best[0] and c[3] != best[3]][:1]  # a melhor frase vem primeiro; a 2ª só se pesar quase o mesmo
    src, parts = [], []
    for sc, pos, sp, s in pick:
        cid = hits[pos][0]
        if cid not in [x["id"] for x in src]:
            c = ix["chunks"][cid]; src.append({"id": cid, "doc": c["doc"], "title": c["title"], "section": c["section"], "line": c["line"]})
        parts.append(f"{s} [{[x['id'] for x in src].index(cid) + 1}]")
    res.update(status="answered", answer=" ".join(parts), sources=src); return res


if __name__ == "__main__":
    a = sys.argv[1:]; k = int(a[a.index("--k") + 1]) if "--k" in a else 3
    qs = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--k")] or ["quanto tempo dura a garantia?"]
    ix = build(); print(f"{len(ix['chunks'])} trechos de {len({c['doc'] for c in ix['chunks']})} documentos")
    for q in qs:
        r = answer(ix, q, k); print("\nP:", q); print("R:", r["answer"] or r["reason"], f"[{r['status']}, cobertura {r['coverage']}]")
        for n, s in enumerate(r["sources"], 1): print(f"   [{n}] {s['doc']} · {s['section']} (linha {s['line']})")
