"""Perguntas e respostas sobre PDFs, 100% local e sem chave: extrai o texto (pypdf), divide em trechos por seção, busca por BM25 e responde com a FRASE do documento
que melhor casa com a pergunta, citando arquivo, página e seção. Resposta extrativa (não gera texto novo, não usa LLM nem embeddings): se a pergunta não tem correspondência
nos documentos, ele diz que não encontrou em vez de inventar. Protótipo de estudo com PDFs fictícios; não está em produção em lugar nenhum.
Uso: python rag.py "qual o prazo para pedir reembolso?" [--docs docs/] [--k 3]"""
import json, math, pathlib, re, sys, unicodedata

K1, B, COVERAGE_MIN, MAX_WORDS = 1.5, 0.75, 0.5, 60
STOP = set("a o as os um uma uns umas de do da dos das em no na nos nas por para com e ou que qual quais quando como se ao aos e sao ser tem ter pode posso preciso quero meu minha seu sua sobre mais ate quanto quantos quantas quanta onde ha foi vai fazer faco existe ser sua suas seus ja nao sim".split())


def norm(s): return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if not unicodedata.combining(c))


def tokens(s):
    out = []
    for t in re.findall(r"[a-z0-9]+", norm(s)):
        if len(t) < 2 or t in STOP: continue
        out.append(t[:-1] if len(t) > 3 and t.endswith("s") else t)  # "stemmer" mínimo: só plural em -s
    return out


def sentences(text): return [x for x in re.split(r"(?<=[a-zà-ú0-9][.!?])\s+", re.sub(r"\s+", " ", text).strip()) if x]


def load_pdf(path):
    """-> [(página, texto)] com pypdf."""
    from pypdf import PdfReader
    return [(i, (p.extract_text() or "")) for i, p in enumerate(PdfReader(str(path)).pages, start=1)]


def chunk_page(file, page, text):
    """Seção = linha numerada ('2. Prazo para pedir'); o corpo dela vira 1 trecho (ou mais, se passar de MAX_WORDS palavras)."""
    secs, cur = [], ["", []]
    for line in (l.strip() for l in text.splitlines() if l.strip()):
        if re.match(r"^\d+\.\s+\S", line): secs.append(cur); cur = [line, []]
        else: cur[1].append(line)
    secs.append(cur); out = []
    for sec, body in secs:
        grp, n = [], 0
        for s in sentences(" ".join(body)) + [None]:
            if s is None or (grp and n + len(s.split()) > MAX_WORDS):
                if grp: out.append({"file": file, "page": page, "section": sec, "text": " ".join(grp)})
                grp, n = [], 0
            if s: grp.append(s); n += len(s.split())
    return out


def build_index(docs_dir):
    chunks = []
    for f in sorted(pathlib.Path(docs_dir).glob("*.pdf")):
        for page, text in load_pdf(f): chunks += chunk_page(f.name, page, text)
    if not chunks: raise ValueError(f"nenhum texto extraído de {docs_dir} (sem PDFs, ou PDFs escaneados: este protótipo não faz OCR)")
    return index_from(chunks)


def index_from(chunks):
    df = {}
    for i, c in enumerate(chunks):
        c["id"] = i; c["tokens"] = tokens(c["section"] + " " + c["text"])
        for t in set(c["tokens"]): df[t] = df.get(t, 0) + 1
    return {"chunks": chunks, "df": df, "avgdl": sum(len(c["tokens"]) for c in chunks) / max(1, len(chunks))}


def bm25(ix, q, c):
    N, s = len(ix["chunks"]), 0.0
    for t in set(q):
        tf = c["tokens"].count(t)
        if tf: n = ix["df"][t]; s += math.log(1 + (N - n + 0.5) / (n + 0.5)) * tf * (K1 + 1) / (tf + K1 * (1 - B + B * len(c["tokens"]) / ix["avgdl"]))
    return s


def answer(ix, question, k=3):
    q = tokens(question); res = {"terms": q, "unmatched": sorted({t for t in q if t not in ix["df"]}), "status": "refused", "answer": None, "coverage": 0.0, "sources": []}
    if not q: res["reason"] = "a pergunta só tem palavras comuns; reescreva com o assunto"; return res
    hits = sorted(((round(bm25(ix, q, c), 4), c) for c in ix["chunks"]), key=lambda h: (-h[0], h[1]["id"]))[:k]; top = hits[0]
    res["coverage"] = round(len(set(q) & set(top[1]["tokens"])) / len(set(q)), 2)
    if top[0] <= 0 or res["coverage"] < COVERAGE_MIN: res["reason"] = "não encontrei isso nos documentos (cobertura da pergunta abaixo de %.0f%%)" % (COVERAGE_MIN * 100); return res
    N = len(ix["chunks"]); idf = lambda t: math.log(1 + (N - ix["df"][t] + 0.5) / (ix["df"][t] + 0.5)) if t in ix["df"] else 0.0
    ss = sentences(top[1]["text"]); sc = [round(sum(idf(t) for t in set(q) & set(tokens(x))), 4) for x in ss]  # termo raro pesa mais que termo comum
    rank = sorted(range(len(ss)), key=lambda i: (-sc[i], i)); pick = [rank[0]] + [i for i in rank[1:2] if sc[i] > 0 and sc[i] >= 0.5 * sc[rank[0]]]
    best = " ".join(ss[i] for i in sorted(pick))  # até 2 frases (a 2ª só se pesar pelo menos metade da 1ª), na ordem do documento
    res.update(status="partial" if res["unmatched"] else "answered", answer=best, sources=[{"file": c["file"], "page": c["page"], "section": c["section"], "score": s} for s, c in hits if s > 0]); return res


if __name__ == "__main__":
    a = sys.argv[1:]; docs = pathlib.Path(a[a.index("--docs") + 1]) if "--docs" in a else pathlib.Path(__file__).parent / "docs"; k = int(a[a.index("--k") + 1]) if "--k" in a else 3
    q = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or not a[i - 1].startswith("--"))]
    ix = build_index(docs); print(f"{len(ix['chunks'])} trechos de {len({c['file'] for c in ix['chunks']})} PDFs")
    for question in q or ["qual o prazo para pedir reembolso?"]:
        r = answer(ix, question, k); print("\nP:", question); print("R:", r["answer"] or r["reason"], f"[{r['status']}" + (f"; sem correspondência nos PDFs: {', '.join(r['unmatched'])}" if r["unmatched"] else "") + "]")
        for s in r["sources"]: print(f"   fonte: {s['file']} p.{s['page']} {s['section'] or '(abertura)'} (score {s['score']})")
