"""Atendimento por WhatsApp SIMULADO sobre catálogo + FAQ de uma loja fictícia (Casa Tramonto). Local, sem chave, sem LLM, sem API do WhatsApp.
A resposta é montada só com campos cadastrados (preço, estoque, texto da FAQ); nunca inventada.
Fluxo da mensagem: saudação/agradecimento -> regras de encaminhamento (pedido de humano, tema sensível, número de pedido)
 -> recuperação (BM25 + n-gramas, RRF) sobre produtos e políticas -> confiança (0.5*cos + 0.5*cobertura de termos)
 -> família de produto sem variante na pergunta = 'clarify' (pergunta de volta) -> conf >= T responde; abaixo disso ENCAMINHA a um humano com resumo do chamado.
Uso: python rag.py "quanto custa o vaso aurora grande?" | python rag.py --eval"""
import json, math, pathlib, re, sys
import rag_core as C

HERE, T_DEFAULT = pathlib.Path(__file__).parent, 0.5  # 0.5 escolhido olhando só a metade DEV
RULES = {  # padrões sobre texto normalizado (sem acento); o JS lê estes mesmos textos do índice
    "greeting": r"^(oi+|ola|bom dia|boa tarde|boa noite|e ai|opa)[ !.,?]*$", "thanks": r"^(muito )?(obrigad[oa]|valeu|vlw|brigad[oa])\b",
    "humano": r"\b(atendente|humano|pessoa de verdade|falar com alguem|gerente)\b",
    "sensivel": r"\b(procon|processo|advogado|justica|golpe|fraude|reclamar|reclamacao|cobrado duas|cobranca indevida|absurdo|ouvidoria)\b",
    "pedido": r"(pedido|compra|encomenda)\W*(n|no|numero)?\W*\d{3,}|#\d{3,}|\bcade\b.*\b(pedido|compra|encomenda)\b|\b(meu|minha) (pedido|compra|encomenda)\b.*\b(nao chegou|atrasou|atrasado|errado|veio)\b",
    "preco": r"\b(preco|custa|custam|valor|quanto (e|fica|sai|custa))\b", "estoque": r"\b(estoque|disponivel|disponiveis|tem ainda|ainda tem|sobrou|restam|tem (ai|em estoque|pronta?))\b",
}
NOISE = set("oi ola bom dia tarde noite queria quero saber gostaria vcs voces".split())


def brl(v): return "R$ " + f"{v:.2f}".replace(".", ",")


def doc_text(d): return d["titulo"] + ". " + d["titulo"] + ". " + d["texto"]


def build(data=HERE / "data"):
    data = pathlib.Path(data); cat = json.loads((data / "catalogo.json").read_text("utf-8")); faq = json.loads((data / "faq.json").read_text("utf-8"))
    docs = [{"id": p["id"], "kind": "produto", "titulo": p["nome"] + (" " + p["variante"] if p.get("variante") else ""), "texto": p["cat"] + ". " + p["desc"], "p": p} for p in cat]
    docs += [{"id": f["id"], "kind": "politica", "titulo": f["q"], "texto": f["a"], "a": f["a"]} for f in faq]
    bix, toks = C.bm25_index([doc_text(d) for d in docs]); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    gl = C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8")))
    return {"rules": RULES, "noise": sorted(NOISE), "glossary": gl, "docs": docs, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def retrieve(ix, q):
    groups, qt = C.expand(ix["glossary"], q); toks = [C.tokens(doc_text(d)) for d in ix["docs"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    return groups, qt, toks, b, v, C.rrf([C.rank(b), C.rank(v)])[:3]


def confidence(ix, groups, toks, v, top):
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; mx = math.log(1 + (N + .5) / .5)
    w = lambda g: max([math.log(1 + (N - df[t] + .5) / (df[t] + .5)) for t in g if t in df] + [0.0]) if any(t in df for t in g) else mx
    cov = sum(w(g) for g in groups if set(g) & set(toks[top])) / sum(w(g) for g in groups) if groups else 0.0
    return round(0.5 * min(1.0, v[top] / 0.6) + 0.5 * cov, 3), round(cov, 3)


def compose(d, nq, rules):
    if d["kind"] == "politica": return d["a"]
    p = d["p"]; nome = d["titulo"]; want_p = bool(re.search(rules["preco"], nq)); want_e = bool(re.search(rules["estoque"], nq)); out = []
    if want_p or not want_e: out.append(f"{nome} custa {brl(p['preco'])}.")
    if want_e or not want_p: out.append(f"Temos {p['estoque']} em estoque." if p["estoque"] else f"Está esgotado no momento; reposição em {p.get('reposicao', 'data a confirmar')}.")
    if not want_p and not want_e: out.insert(0, p["desc"])
    return " ".join(out)


def ticket(history, motivo, detalhe):
    return {"motivo": motivo, "prioridade": "alta" if motivo in ("sensivel", "pedido_humano") else "normal", "resumo": detalhe, "mensagens": history[-4:]}


def handle(ix, msg, history=(), t=T_DEFAULT):
    """Uma mensagem do cliente -> {kind, reply, doc, conf, ticket?, cands}. kind: greeting|thanks|answer|clarify|handoff."""
    R = ix["rules"]; nq = C.norm(msg).strip(); hist = list(history) + [msg]
    for k in ("greeting", "thanks"):
        if re.search(R[k], nq): return {"kind": k, "reply": "Oi! Sou o assistente da Casa Tramonto. Pergunte sobre produtos, preços, entrega e trocas." if k == "greeting" else "Por nada! Se precisar de mais alguma coisa, é só chamar.", "doc": None, "conf": None, "cands": []}
    for k, motivo, texto in (("humano", "pedido_humano", "Cliente pediu atendente."), ("sensivel", "sensivel", "Tema sensível (reclamação, cobrança ou órgão de defesa)."), ("pedido", "pedido", "Pergunta sobre um pedido específico; este protótipo não consulta pedidos.")):
        if re.search(R[k], nq): return {"kind": "handoff", "reply": "Entendi. Vou passar sua conversa para um atendente humano (seg a sex, 9h às 18h). Ele já vai ver o histórico, não precisa repetir.", "doc": None, "conf": None, "cands": [], "ticket": ticket(hist, motivo, texto)}
    clean = " ".join(w for w in nq.split() if w not in ix["noise"]); groups, qt, toks, b, v, fused = retrieve(ix, clean)
    r = {"kind": "handoff", "doc": None, "conf": 0.0, "cands": [{"id": ix["docs"][i]["id"], "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused], "terms": qt}
    if fused:
        top = fused[0][0]; r["conf"], r["cov"] = confidence(ix, groups, toks, v, top); d = ix["docs"][top]
        if r["conf"] >= t:
            fam = [x for x in ix["docs"] if x["kind"] == "produto" and x["p"]["nome"] == d["p"]["nome"]] if d["kind"] == "produto" else []
            if len(fam) > 1 and not any(C.tokens(x["p"]["variante"])[0] in qt for x in fam):
                r.update(kind="clarify", doc=d["id"], reply=f"Temos o {d['p']['nome']} em " + " e ".join(f"{x['p']['variante']} ({brl(x['p']['preco'])})" for x in fam) + ". Qual você quer?"); return r
            r.update(kind="answer", doc=d["id"], reply=compose(d, nq, R)); return r
    r["reply"] = "Não encontrei isso no nosso catálogo nem nas perguntas frequentes, e não quero te passar informação errada. Vou chamar um atendente humano (seg a sex, 9h às 18h)."
    r["ticket"] = ticket(hist, "sem_base", "Sem base no catálogo/FAQ (confiança %.2f)." % r["conf"]); return r


def evaluate(ix, tests, t=T_DEFAULT):
    """Acertou o tipo (answer/clarify/handoff/saudação) e, em answer, o documento. Erros que importam: respondeu errado e respondeu o que devia encaminhar."""
    c = dict(ok=0, wrong_doc=0, answered_should_handoff=0, handoff_should_answer=0, other=0)
    for x in tests:
        r = handle(ix, x["q"], (), t); exp = x["kind"]
        if r["kind"] == exp and (exp != "answer" or r["doc"] == x["id"]): c["ok"] += 1
        elif r["kind"] == "answer" and exp == "answer": c["wrong_doc"] += 1
        elif r["kind"] in ("answer", "clarify") and exp == "handoff": c["answered_should_handoff"] += 1
        elif r["kind"] == "handoff" and exp in ("answer", "clarify"): c["handoff_should_answer"] += 1
        else: c["other"] += 1
    c["n"] = len(tests); c["acc"] = round(c["ok"] / len(tests), 3); return c


if __name__ == "__main__":
    ix = build(); sys.stdout.reconfigure(encoding="utf-8")
    if "--eval" in sys.argv:
        ts = json.loads((HERE / "data" / "tests.json").read_text("utf-8"))
        for n, part in (("DEV", ts[0::2]), ("TESTE", ts[1::2])): print(n, evaluate(ix, part))
    else:
        r = handle(ix, " ".join(a for a in sys.argv[1:] if not a.startswith("--")) or "oi"); print(r["kind"], r["doc"], r["conf"]); print(r["reply"]); print(r.get("ticket") or "")
