"""RAG sobre notas fiscais e boletos em PDF (100% local, sem chave, sem LLM). PDFs, empresas e valores FICTÍCIOS.
Extração REAL do texto dos PDFs (pypdf, 1 documento por página) -> campos por regex (emitente, data, valor, vencimento, situação) -> categoria por regras sobre a descrição
-> pergunta: ligação de entidade (emitente ou categoria) + mês(es) + situação (pago / em aberto) + BM25 só para ordenar/mostrar score -> resposta = SOMA em centavos
com a lista dos documentos (arquivo, página). Guardrail: palavra que o sistema não conhece (ex.: "Netflix") recusa em vez de somar tudo.
Nota fiscal = paga na emissão (premissa); boleto pago conta no mês do pagamento; boleto em aberto conta no mês do vencimento.
Uso: python rag.py "Quanto paguei de energia em setembro?" """
import json, pathlib, re, sys
import rag_core as C

HERE = pathlib.Path(__file__).parent
MESES = {"janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}
NOME_MES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
# palavras de intenção/forma que não são entidade (lista escrita à mão; o que sobrar e não estiver nos documentos vira recusa)
IGNORE = set("paguei gastei gasto gastos pago paga pagos pagas total valor valores mes meses ano conta contas documento documentos nota notas fiscal fiscais boleto boletos maior mais caro cara quais liste lista quantas quantos quantidade aberto devo pagar pendente pendentes vencer vence vencido falta tudo soma somar custou custa foi fui ainda".split())
CATS = [(r"honor[aá]rios cont", "contabilidade"), (r"energia", "energia"), (r"internet", "internet"), (r"[aá]gua", "água"), (r"condominial", "condomínio"), (r"supermercado|hortifr", "supermercado"),
        (r"medicamento", "farmácia"), (r"gasolina|abastecimento", "combustível"), (r"streaming|assinatura", "assinatura"), (r"papelaria|escrit", "papelaria")]


def cents(s): return int(re.sub(r"\D", "", s))
def iso(d): return f"{d[6:]}-{d[3:5]}-{d[:2]}"
def brl(c): return "R$ " + f"{c // 100:,}".replace(",", ".") + f",{c % 100:02d}"


def parse_page(text):
    g = lambda rx: (m.group(1).strip() if (m := re.search(rx, text, re.M)) else None)
    if text.lstrip().startswith("NOTA FISCAL"):
        f = {"kind": "nf", "issuer": g(r"^Emitente: (.+)$"), "date": g(r"^Data de emissão: (\d\d/\d\d/\d{4})"), "desc": g(r"^Descrição: (.+)$"), "amount": g(r"^Valor total: R\$ ([\d.]+,\d\d)"), "status": "pago", "due": None}
        if f["date"]: f["date"] = iso(f["date"])
    elif text.lstrip().startswith("BOLETO"):
        sit = g(r"^Situação: (.+)$") or ""; pago = re.match(r"PAGO em (\d\d/\d\d/\d{4})", sit); due = g(r"^Vencimento: (\d\d/\d\d/\d{4})")
        f = {"kind": "boleto", "issuer": g(r"^Beneficiário: (.+)$"), "desc": g(r"^Descrição: (.+)$"), "amount": g(r"^Valor do documento: R\$ ([\d.]+,\d\d)"), "status": "pago" if pago else "aberto", "due": iso(due) if due else None}
        f["date"] = iso(pago.group(1)) if pago else f["due"]
        if not pago and sit != "EM ABERTO": f["status"] = None
    else: return None
    if None in (f["issuer"], f["date"], f["desc"], f["amount"], f["status"]): return None
    f["amount"] = cents(f["amount"]); f["category"] = next((c for rx, c in CATS if re.search(rx, f["desc"], re.I)), "outros"); return f


def extract(pdf_dir):
    import pypdf
    docs, errors = [], []
    for p in sorted(pathlib.Path(pdf_dir).glob("*.pdf")):
        for n, pg in enumerate(pypdf.PdfReader(str(p)).pages, start=1):
            txt = pg.extract_text() or ""; f = parse_page(txt)
            if f is None: errors.append(f"{p.name} p.{n}"); continue
            docs.append({**f, "file": p.name, "page": n, "text": txt.strip()})
    return docs, errors


def build(data=HERE / "data"):
    data = pathlib.Path(data); docs, errors = extract(data / "pdfs"); docs.sort(key=lambda d: (d["date"], d["file"], d["page"]))
    for i, d in enumerate(docs): d["id"] = i; d["ym"] = d["date"][:7]
    ents = json.loads((data / "entidades.json").read_text("utf-8")); ents = [{"name": e["name"], "kind": e["kind"], "cat": e.get("cat"), "match": [sorted(set(C.tokens(m))) for m in e["match"]]} for e in ents]
    texts = [d["issuer"] + " " + d["category"] + " " + d["desc"] for d in docs]; bix, toks = C.bm25_index(texts)
    vocab = sorted({t for tk in toks for t in tk} | {t for e in ents for m in e["match"] for t in m})
    return {"disclaimer": "Protótipo de estudo com PDFs fictícios. Não é contabilidade nem orientação fiscal.", "docs": docs, "errors": errors, "entities": ents, "vocab": vocab, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]},
            "tests": json.loads((data / "tests.json").read_text("utf-8"))}


def parse_q(ix, q):
    qt = C.tokens(q); words = re.findall(r"[a-z0-9]+", C.norm(q)); months = sorted({MESES[w] for w in words if w in MESES}); years = sorted({int(y) for y in re.findall(r"\b(20\d\d)\b", q)})
    best = None
    for e in ix["entities"]:
        for m in e["match"]:
            if set(m) <= set(qt):
                key = (len(m), e["kind"] == "emitente")
                if best is None or key > best[0]: best = (key, e)
    known = set(ix["vocab"]) | set(IGNORE) | {C.tokens(w)[0] for w in MESES if C.tokens(w)}
    unknown = [t for t in qt if t not in known and not t.isdigit() and not re.fullmatch(r"20\d\d", t)]
    st = "aberto" if set(words) & {"aberto", "devo", "pagar", "pendente", "pendentes", "vencer", "vence", "vencido", "falta"} else "pago"
    agg = "count" if set(words) & {"quantas", "quantos", "quantidade"} else "max" if ("maior" in words or ("mais" in words and ("caro" in words or "cara" in words))) else "list" if set(words) & {"quais", "liste", "lista"} else "sum"
    return {"tokens": qt, "months": months, "years": years, "entity": best[1] if best else None, "unknown": unknown, "status": st, "agg": agg}


def answer(ix, q):
    p = parse_q(ix, q); res = {"status": "refused", "parsed": {k: v for k, v in p.items() if k != "entity"} | {"entity": p["entity"]["name"] if p["entity"] else None}, "docs": [], "total": 0, "count": 0, "by_month": {}, "max": None}
    if p["unknown"]: res["reason"] = "unknown"; return res
    if not p["entity"] and not p["months"]: res["reason"] = "none"; return res
    e = p["entity"]; sel = []
    for d in ix["docs"]:
        if d["status"] != p["status"]: continue
        if e and not ((e["kind"] == "emitente" and d["issuer"] == e["name"]) or (e["kind"] == "categoria" and d["category"] == e["name"])): continue
        if p["months"] and int(d["date"][5:7]) not in p["months"]: continue
        if p["years"] and int(d["date"][:4]) not in p["years"]: continue
        sel.append(d["id"])
    toks = [C.tokens(d["issuer"] + " " + d["category"] + " " + d["desc"]) for d in ix["docs"]]
    res["docs"] = [{"id": i, "bm25": round(C.bm25_score(ix["bm25"], p["tokens"], toks[i]), 4)} for i in sel]
    for i in sel: d = ix["docs"][i]; res["total"] += d["amount"]; res["by_month"][d["ym"]] = res["by_month"].get(d["ym"], 0) + d["amount"]
    res["count"] = len(sel); res["max"] = max(sel, key=lambda i: (ix["docs"][i]["amount"], -i)) if sel else None
    res["status"] = "answered"; return res


def evaluate(ix, T):
    ok = n_oos = 0; bad = []
    for x in T["questions"]:
        r = answer(ix, x["q"]); good = r["status"] == "answered" and r["total"] == x["total"] and r["count"] == x["count"]; ok += good
        if not good: bad.append(x["q"])
    for q in T["oos"]: n_oos += answer(ix, q)["status"] == "answered"
    return {"n": len(T["questions"]), "exact": round(ok / len(T["questions"]), 3), "wrong": bad, "oos": len(T["oos"]), "oos_answered": n_oos}


if __name__ == "__main__":
    ix = build(); print("!", ix["disclaimer"], f"({len(ix['docs'])} documentos, {len(ix['errors'])} páginas sem leitura)")
    for q in sys.argv[1:] or ["Quanto paguei de energia em setembro?"]:
        r = answer(ix, q); print("\nP:", q)
        if r["status"] == "refused": print("R: não consegui responder com segurança:", r["reason"], r["parsed"]["unknown"]); continue
        pr = r["parsed"]; print(f"R: {brl(r['total'])} em {r['count']} documento(s) ({pr['status']}; {pr['entity'] or 'todos'}; meses {[NOME_MES[m] for m in pr['months']] or 'todos'})")
        for h in r["docs"]: d = ix["docs"][h["id"]]; print(f"   {d['date']} {brl(d['amount'])} {d['issuer']} [{d['file']}, p. {d['page']}]")
