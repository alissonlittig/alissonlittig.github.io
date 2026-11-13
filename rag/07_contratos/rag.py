"""RAG de contratos (jurídico), 100% local, sem chave, sem LLM. NÃO É ACONSELHAMENTO JURÍDICO. Contratos 100% fictícios.
Chunking por ESTRUTURA (cláusula -> item numerado, guarda arquivo:linha) -> tipo da cláusula (regras sobre o título) -> busca híbrida (BM25 + n-gramas, RRF)
com filtro opcional por tipo -> resposta = o item LITERAL (nunca parafraseado) com valores/prazos/percentuais destacados e "pontos de atenção" por REGRAS
(renovação automática, aviso curto, multa alta, exclusividade, responsabilidade ilimitada, critério unilateral, foro fora da cidade das partes).
Sem cobertura suficiente, recusa. Uso: python rag.py "O contrato renova sozinho?" [--tipo rescisao]"""
import json, pathlib, re, sys
import rag_core as C

HERE, COVERAGE_MIN = pathlib.Path(__file__).parent, 0.5
DISCLAIMER = "Protótipo de estudo com contratos fictícios. Não é aconselhamento jurídico; para um caso real, consulte um(a) advogado(a)."
TIPOS = {"objeto": "objeto", "preco": "preco_pagamento", "pagamento": "preco_pagamento", "prazo": "prazo", "rescisao": "rescisao_multa", "confidencialidade": "confidencialidade", "propriedade": "propriedade_intelectual",
         "exclusividade": "exclusividade", "responsabilidade": "responsabilidade", "dados": "dados_pessoais", "garantia": "garantia", "reajuste": "reajuste", "foro": "foro", "aluguel": "preco_pagamento",
         "conservacao": "conservacao", "sublocacao": "sublocacao_animais"}
# regras de atenção sobre texto normalizado (sem acento, minúsculo); id -> (regex, rótulo PT, rótulo EN)
FLAGS = {"renovacao_automatica": (r"renova[- ]se automaticamente|renovacao automatica", "Renovação automática", "Automatic renewal"),
         "exclusividade": (r"exclusividade", "Exclusividade", "Exclusivity"),
         "responsabilidade_ilimitada": (r"sem limite de valor|responsabilidade ilimitada", "Responsabilidade sem limite de valor", "Liability without a cap"),
         "criterio_unilateral": (r"criterio exclusivo|unilateralmente", "Decisão unilateral de uma parte", "One-sided decision by one party")}
SPANS = [("valor", r"R\$\s?\d[\d.]*(?:,\d{2})?"), ("percentual", r"\d+(?:,\d+)?\s?%"), ("prazo", r"\b\d+\s+(?:dias|meses|anos|horas)\b"), ("data", r"\d{2}/\d{2}/\d{4}")]


def tipo_de(title):
    t = C.norm(title)
    for k, v in TIPOS.items():
        if k in t: return v
    return "outros"


def flags_de(text, title, city):
    n = C.norm(title + ". " + text); out = [f for f, (rx, *_r) in FLAGS.items() if re.search(rx, n)]
    if "multa" in n and any(float(p.replace(",", ".")) >= 20 for p in re.findall(r"(\d+(?:,\d+)?)\s?%", n)): out.append("multa_alta")
    for m in re.finditer(r"aviso[^.]*?(\d+) dias", n):
        if int(m.group(1)) < 15: out.append("aviso_curto"); break
    m = re.search(r"comarca de ([a-z ]+?)(?:/|,|\.)", n)
    if m and m.group(1).strip() != C.norm(city).split("/")[0].strip(): out.append("foro_distante")
    return sorted(out)


def spans_de(text):
    sp = [{"s": m.start(), "e": m.end(), "k": k} for k, rx in SPANS for m in re.finditer(rx, text)]
    return sorted(sp, key=lambda x: (x["s"], x["e"]))


def chunk_doc(path, letter):
    lines = pathlib.Path(path).read_text("utf-8").splitlines(); title = lines[0].lstrip("# ").strip(); city = next(l.split(":", 1)[1].strip() for l in lines if l.startswith("Cidade das partes")); out = []; clause = ctitle = ""
    for no, l in enumerate(lines, start=1):
        if l.startswith("## "):
            m = re.match(r"## CLÁUSULA (\d+)ª — (.*)", l); clause, ctitle = m.group(1), m.group(2)
        elif clause and (m := re.match(r"(\d+\.\d+) (.*)", l)):
            out.append({"key": f"{letter}:{m.group(1)}", "doc": letter, "docfile": pathlib.Path(path).name, "doctitle": title, "clause": int(clause), "ctitle": ctitle, "item": m.group(1), "line": no,
                        "text": m.group(2), "type": tipo_de(ctitle), "flags": flags_de(m.group(2), ctitle, city), "spans": spans_de(m.group(2))})
    return out


def build(data=HERE / "data"):
    data = pathlib.Path(data); chunks = chunk_doc(data / "contrato_servicos.md", "A") + chunk_doc(data / "contrato_locacao.md", "B")
    for i, c in enumerate(chunks): c["id"] = i
    texts = [c["ctitle"] + " " + c["text"] for c in chunks]; bix, toks = C.bm25_index(texts); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    gl = C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8")))
    return {"disclaimer": DISCLAIMER, "glossary": gl, "chunks": chunks, "types": sorted({c["type"] for c in chunks}), "flag_labels": {k: [v[1], v[2]] for k, v in FLAGS.items()} | {"multa_alta": ["Multa de 20% ou mais", "Penalty of 20% or more"], "aviso_curto": ["Aviso prévio curto (menos de 15 dias)", "Short notice (under 15 days)"], "foro_distante": ["Foro fora da cidade das partes", "Court outside the parties' city"]},
            "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def search(ix, q, tipo=None, k=3):
    groups, qt = C.expand(ix["glossary"], q); toks = [C.tokens(c["ctitle"] + " " + c["text"]) for c in ix["chunks"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    ok = lambda i: tipo in (None, "", ix["chunks"][i]["type"])
    b = [C.bm25_score(ix["bm25"], qt, t) if ok(i) else 0.0 for i, t in enumerate(toks)]; v = [C.cos(qv, x) if ok(i) else 0.0 for i, x in enumerate(ix["ng_vecs"])]
    fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    return [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused], groups, qt, toks


def answer(ix, q, tipo=None, k=3):
    hits, groups, qt, toks = search(ix, q, tipo, k); res = {"terms": qt, "status": "refused", "hits": hits, "coverage": 0.0, "chunk": None}
    if not qt: res["reason"] = "none"; return res
    if not hits: res["reason"] = "no_hits"; return res
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: C.math.log(1 + (N - df[t] + .5) / (df[t] + .5)) if t in df else 0.0; unk = C.math.log(1 + (N + .5) / .5)
    w = lambda g: max([idf(t) for t in g if t in df] + [0.0]) if any(t in df for t in g) else unk
    top = hits[0]["id"]; res["coverage"] = round(sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups), 2)
    if res["coverage"] < COVERAGE_MIN: res["reason"] = "coverage"; return res
    res.update(status="answered", chunk=top); return res


def evaluate(ix, T):
    r1 = r3 = n = oos_a = 0
    for x in T["questions"]:
        ids = [ix["chunks"][h["id"]]["key"] for h in search(ix, x["q"], None, 3)[0]]; n += 1; r1 += bool(ids) and ids[0] in x["ok"]; r3 += any(i in x["ok"] for i in ids)
    for q in T["oos"]: oos_a += answer(ix, q)["status"] == "answered"
    got = {c["key"]: c["flags"] for c in ix["chunks"] if c["flags"]}; exp = T["flags"]; pairs = {(k, f) for k, v in got.items() for f in v}; ep = {(k, f) for k, v in exp.items() for f in v}
    return {"n": n, "recall1": round(r1 / n, 3), "recall3": round(r3 / n, 3), "oos": len(T["oos"]), "oos_answered": oos_a, "flag_tp": len(pairs & ep), "flag_fp": sorted(pairs - ep), "flag_fn": sorted(ep - pairs)}


if __name__ == "__main__":
    a = sys.argv[1:]; tipo = a[a.index("--tipo") + 1] if "--tipo" in a else None; ix = build(); print("!", DISCLAIMER)
    for q in [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--tipo")] or ["O contrato renova sozinho?"]:
        r = answer(ix, q, tipo); print("\nP:", q)
        if r["status"] == "refused": print("R: não encontrei isso nos contratos", f"(cobertura {r['coverage']})"); continue
        c = ix["chunks"][r["chunk"]]; print(f"R: {c['text']}\n   [{c['docfile']}, cláusula {c['clause']} ({c['ctitle'].lower()}), item {c['item']}, linha {c['line']}] tipo={c['type']}" + (" ATENÇÃO: " + ", ".join(ix["flag_labels"][f][0] for f in c["flags"]) if c["flags"] else ""))
