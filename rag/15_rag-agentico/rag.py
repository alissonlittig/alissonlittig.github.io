"""RAG agêntico POR REGRAS (sem LLM): a cada pergunta o agente decide entre BUSCAR no guia, CALCULAR com o que achou, PERGUNTAR DE VOLTA ou RECUSAR, e mostra cada passo.
Ferramentas: buscar(consulta) = BM25 + n-gramas (RRF) sobre o guia, com confiança; calcular(expr) = aritmética segura (+ - * / e parênteses, sem eval);
perguntar(texto); responder/recusar. Os números (tarifa, taxa, faixa) são extraídos por regex dos próprios trechos na hora de montar o índice.
Planejador: regras sobre a pergunta (intenção + campos kwh/plano) + estado da conversa (pergunta pendente). O "raciocínio" mostrado é texto de modelo, não pensamento de um LLM.
Uso: python rag.py "quanto vou pagar com 350 kWh no plano Casa?" | python rag.py --eval"""
import json, math, pathlib, re, sys
import rag_core as C

HERE, T_DEFAULT = pathlib.Path(__file__).parent, 0.5
RULES = {  # sobre texto normalizado (sem acento); o JS usa estes mesmos textos
    "kwh": r"(\d+(?:[.,]\d+)?)\s*kwh", "num_only": r"^\D{0,25}(\d+(?:[.,]\d+)?)\s*(?:kwh)?\D{0,15}$", "plano": r"\b(solo|casa|empresa)\b", "plano_x": r"\b[Pp]lano ([A-ZÀ-Ú]\w+)",
    "plano_ok": "solo casa empresa ideal certo indicado melhor mais para de que e ou do da no na serve pra um uma meu minha ai", "compare": r"(diferenca|comparar|compare|versus|\bvs\b)",
    "economia": r"(economi[az]|poup[ao])", "custo": r"(quanto (vou |eu |vai )?(pago|pagar|custa|custar|fica|sai)|valor (da|de|do) (minha |meu )?(conta|fatura|mensalidade)|mensalidade)", "custo_ctx": r"(fatura|conta|mensalidade|pagar|pago)",
    "qual_plano": r"(qual plano|que plano|plano (ideal|certo|indicado)|recomend)",
}
PLANOS = ["solo", "casa", "empresa"]; NOME = {"solo": "Solo", "casa": "Casa", "empresa": "Empresa"}


def brl(v): return "R$ " + f"{v:.2f}".replace(".", ",")
def num(s): return float(s.replace(",", "."))
def g(x): return "%g" % x


def facts_of(text):
    f = {}; m = re.match(r"Plano (\w+):", text)
    if m: f["plano"] = C.norm(m.group(1))
    m = re.search(r"tarifa de R\$ ([\d,]+) por kWh", text); f.update(tarifa=num(m.group(1))) if m else None
    m = re.search(r"taxa fixa de R\$ ([\d,]+)", text); f.update(taxa=num(m.group(1))) if m else None
    m = re.search(r"de (\d+) a (\d+) kWh", text)
    if m: f.update(min=int(m.group(1)), max=int(m.group(2)))
    m = re.search(r"até (\d+) kWh", text); f.update(min=0, max=int(m.group(1))) if m else None
    m = re.search(r"acima de (\d+) kWh", text); f.update(min=int(m.group(1)) + 1, max=10 ** 9) if m else None
    m = re.search(r"Tarifa de referência da distribuidora: R\$ ([\d,]+) por kWh", text); f.update(ref=num(m.group(1))) if m else None
    return f


def build(data=HERE / "data"):
    data = pathlib.Path(data); chunks = []; sec = ""
    for no, l in enumerate((data / "coop_sol_vale.md").read_text("utf-8").splitlines(), start=1):
        if l.startswith("## "): sec = l[3:].strip()
        elif l.startswith("- "): chunks.append({"id": len(chunks), "section": sec, "line": no, "text": l[2:].strip(), "facts": facts_of(l[2:].strip())})
    bix, toks = C.bm25_index([c["section"] + " " + c["text"] for c in chunks]); idf, vecs = C.ng_index(toks); r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    gl = C.gloss_norm(json.loads((data / "glossario.json").read_text("utf-8")))
    return {"rules": RULES, "glossary": gl, "chunks": chunks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


# ---- ferramenta: calcular (aritmética segura, sem eval) ----
def calc(expr):
    toks = re.findall(r"\d+(?:\.\d+)?|[()+\-*/]", expr); pos = [0]
    if "".join(toks) != expr.replace(" ", ""): raise ValueError("caractere inválido")
    def peek(): return toks[pos[0]] if pos[0] < len(toks) else None
    def eat(): pos[0] += 1; return toks[pos[0] - 1]
    def atom():
        t = eat()
        if t == "(": v = add(); eat(); return v
        if t == "-": return -atom()
        return float(t)
    def mul():
        v = atom()
        while peek() in ("*", "/"): o = eat(); r = atom(); v = v * r if o == "*" else v / r
        return v
    def add():
        v = mul()
        while peek() in ("+", "-"): o = eat(); r = mul(); v = v + r if o == "+" else v - r
        return v
    v = add()
    if pos[0] != len(toks): raise ValueError("sobra texto")
    return round(v + 1e-9, 2)


# ---- ferramenta: buscar ----
def search(ix, q, k=4):
    groups, qt = C.expand(ix["glossary"], q); toks = [C.tokens(c["section"] + " " + c["text"]) for c in ix["chunks"]]; qv = C.ng_vec(qt, ix["ng_idf"])
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]; fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; mx = math.log(1 + (N + .5) / .5)
    w = lambda gr: max([math.log(1 + (N - df[t] + .5) / (df[t] + .5)) for t in gr if t in df] + [0.0]) if any(t in df for t in gr) else mx
    conf = 0.0
    if fused:
        top = fused[0][0]; cov = sum(w(gr) for gr in groups if set(gr) & set(toks[top])) / sum(w(gr) for gr in groups) if groups else 0.0
        conf = round(0.5 * min(1.0, v[top] / 0.6) + 0.5 * cov, 3)
    return {"conf": conf, "hits": [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused]}


def parse(ix, nq, raw):
    R = ix["rules"]; m = re.search(R["kwh"], nq); planos = []
    for x in re.findall(R["plano"], nq):
        if x not in planos: planos.append(x)
    ok = R["plano_ok"].split(); unk = next((C.norm(x) for x in re.findall(R["plano_x"], raw) if C.norm(x) not in ok), None)  # só nome próprio (maiúscula): "plano Premium"
    intent = "compare" if re.search(R["compare"], nq) else "economia" if re.search(R["economia"], nq) else "qual_plano" if re.search(R["qual_plano"], nq) else "custo" if re.search(R["custo"], nq) and (m or planos or re.search(R["custo_ctx"], nq)) else "busca"
    return {"intent": intent, "kwh": num(m.group(1)) if m else None, "planos": planos, "unk": unk}


def plan_facts(ix, steps, plano):
    s = search(ix, f"plano {plano} tarifa por kWh taxa fixa"); f = ix["chunks"][s["hits"][0]["id"]]["facts"] if s["hits"] else {}
    ok = f.get("plano") == plano
    steps.append({"k": "buscar", "q": f"plano {plano} tarifa por kWh taxa fixa", "conf": s["conf"], "hits": s["hits"], "obs": f"Plano {NOME[plano]}: tarifa {brl(f['tarifa'])}/kWh, taxa fixa {brl(f['taxa'])}" if ok else "o trecho achado não é o plano pedido"})
    return (s["hits"][0]["id"], f) if ok else (None, None)


def do_calc(steps, expr, label):
    r = calc(expr); steps.append({"k": "calcular", "expr": expr, "res": r, "obs": label}); return r


def finish(steps, kind, text, cite=()):
    steps.append({"k": "responder" if kind == "answer" else "recusar" if kind == "refuse" else "perguntar", "t": text, "cite": list(cite)})
    return {"kind": kind, "reply": text, "steps": steps, "cite": list(cite)}


def agent(ix, msg, state=None, t=T_DEFAULT):
    """Uma mensagem -> {kind: answer|ask|refuse, reply, steps, state}. state guarda a pergunta pendente (falta o consumo em kWh)."""
    state = dict(state or {}); R = ix["rules"]; nq = C.norm(msg).strip(); steps = []
    p = parse(ix, nq, msg); pend = state.get("pending")
    if pend == "kwh":
        m = re.search(R["num_only"], nq)
        if m: p = {"intent": state["intent"], "kwh": num(m.group(1)), "planos": state["planos"], "unk": None}; steps.append({"k": "pensar", "t": f"Recebi o consumo ({g(p['kwh'])} kWh). Retomo a pergunta anterior: {state['intent']}."})
    out = _run(ix, p, nq, steps, t); out["state"] = {"pending": "kwh", "intent": p["intent"], "planos": p["planos"]} if out["kind"] == "ask" else {}
    return out


def _run(ix, p, nq, steps, t):
    I, kwh, planos = p["intent"], p["kwh"], p["planos"]
    if p["unk"]: steps.append({"k": "pensar", "t": f"A pergunta cita o plano \"{p['unk']}\", que não está no guia (existem Solo, Casa e Empresa)."}); return finish(steps, "refuse", f"Não encontrei um plano \"{p['unk']}\" no guia. Os planos são Solo, Casa e Empresa.")
    if I == "busca":
        s = search(ix, nq); steps.append({"k": "pensar", "t": "Pergunta de consulta, sem conta: basta buscar no guia."}); top = s["hits"][0]["id"] if s["hits"] else None
        steps.append({"k": "buscar", "q": nq, "conf": s["conf"], "hits": s["hits"], "obs": ix["chunks"][top]["text"] if top is not None else "nada"})
        if top is not None and s["conf"] >= t: return finish(steps, "answer", ix["chunks"][top]["text"], [top])
        return finish(steps, "refuse", "Não achei isso no guia, então prefiro não responder.")
    if kwh is None:
        steps.append({"k": "pensar", "t": f"Pergunta de {I}: preciso do consumo mensal em kWh e a pergunta não traz. Não vou chutar."})
        return finish(steps, "ask", "Qual é o seu consumo mensal, em kWh?")
    if kwh <= 0 or kwh > 100000: return finish(steps, "refuse", "Esse consumo não parece válido. Informe um valor em kWh entre 1 e 100000.")
    if I == "qual_plano" or (I in ("custo", "economia") and not planos):
        steps.append({"k": "pensar", "t": f"Consumo de {g(kwh)} kWh" + (" e nenhum plano citado: descubro o plano pela faixa de consumo." if I != "qual_plano" else ": comparo as faixas dos planos.")})
        s = search(ix, "planos tarifa faixa de consumo kWh por mês"); fs = {ix["chunks"][h["id"]]["facts"]["plano"]: (h["id"], ix["chunks"][h["id"]]["facts"]) for h in s["hits"] if "plano" in ix["chunks"][h["id"]]["facts"]}
        steps.append({"k": "buscar", "q": "planos tarifa faixa de consumo kWh por mês", "conf": s["conf"], "hits": s["hits"], "obs": f"achei {len(fs)} de 3 planos"})
        if len(fs) < 3: return finish(steps, "refuse", "Não consegui reunir as três faixas de plano no guia.")
        best = next((pl for pl in PLANOS if fs[pl][1]["min"] <= kwh <= fs[pl][1]["max"]), None)
        steps.append({"k": "pensar", "t": f"{g(kwh)} kWh cai na faixa do plano {NOME[best]}."})
        if I == "qual_plano": return finish(steps, "answer", f"Para {g(kwh)} kWh por mês, o plano indicado é o {NOME[best]}: tarifa de {brl(fs[best][1]['tarifa'])} por kWh e taxa fixa de {brl(fs[best][1]['taxa'])}.", [fs[best][0]])
        planos = [best]
    if I == "compare":
        planos = planos if len(planos) >= 2 else PLANOS; steps.append({"k": "pensar", "t": f"Comparar {', '.join(NOME[x] for x in planos)} com {g(kwh)} kWh: busco cada plano e calculo cada fatura."}); res = {}; cites = []
        for pl in planos:
            cid, f = plan_facts(ix, steps, pl)
            if cid is None: return finish(steps, "refuse", f"Não consegui ler o plano {NOME[pl]} no guia.")
            res[pl] = do_calc(steps, f"{g(kwh)}*{g(f['tarifa'])}+{g(f['taxa'])}", f"fatura do plano {NOME[pl]}"); cites.append(cid)
        lo = min(planos, key=lambda x: (res[x], planos.index(x))); hi = max(planos, key=lambda x: (res[x], -planos.index(x))); d = do_calc(steps, f"{g(res[hi])}-{g(res[lo])}", "diferença entre o maior e o menor")
        return finish(steps, "answer", f"Com {g(kwh)} kWh: " + "; ".join(f"{NOME[x]} {brl(res[x])}" for x in planos) + f". O mais barato é o {NOME[lo]}, {brl(d)} a menos que o {NOME[hi]}.", cites)
    pl = planos[0]; cid, f = plan_facts(ix, steps, pl)
    if cid is None: return finish(steps, "refuse", f"Não consegui ler o plano {NOME[pl]} no guia.")
    cost_e = f"{g(kwh)}*{g(f['tarifa'])}+{g(f['taxa'])}"
    if I == "custo":
        r = do_calc(steps, cost_e, "fatura mensal = consumo × tarifa + taxa fixa")
        return finish(steps, "answer", f"Com {g(kwh)} kWh no plano {NOME[pl]}: {brl(r)} por mês ({g(kwh)} × {brl(f['tarifa'])} + {brl(f['taxa'])} de taxa fixa).", [cid])
    s = search(ix, "tarifa de referência da distribuidora por kWh sem a cooperativa"); top = s["hits"][0]["id"] if s["hits"] else None; ref = ix["chunks"][top]["facts"].get("ref") if top is not None else None
    steps.append({"k": "buscar", "q": "tarifa de referência da distribuidora por kWh sem a cooperativa", "conf": s["conf"], "hits": s["hits"], "obs": f"referência {brl(ref)}/kWh" if ref else "não achei a referência"})
    if ref is None: return finish(steps, "refuse", "Não achei a tarifa de referência da distribuidora no guia.")
    r = do_calc(steps, f"{g(kwh)}*{g(ref)}-({cost_e})", "economia = consumo × referência − fatura da cooperativa")
    txt = f"Com {g(kwh)} kWh no plano {NOME[pl]} você economiza cerca de {brl(r)} por mês em relação à tarifa de referência ({brl(ref)}/kWh)." if r > 0 else f"Com {g(kwh)} kWh no plano {NOME[pl]} você pagaria {brl(-r)} a mais por mês que na tarifa de referência: a taxa fixa pesa."
    return finish(steps, "answer", txt, [cid, top])


def simple_rag(ix, q):
    """Linha de base: sempre busca e devolve o melhor trecho (não calcula, não pergunta, não recusa)."""
    s = search(ix, q); return ix["chunks"][s["hits"][0]["id"]]["text"] if s["hits"] else ""


def evaluate(ix, tests, t=T_DEFAULT):
    """kind certo; rota (sequência de ferramentas) certa; resposta contém o texto esperado. Linha de base: RAG simples acerta a resposta?"""
    c = dict(n=0, kind_ok=0, route_ok=0, answer_ok=0, simple_ok=0, calc_n=0, simple_calc_ok=0)
    for x in tests:
        r = agent(ix, x["q"], None, t); c["n"] += 1; c["kind_ok"] += r["kind"] == x["kind"]
        c["route_ok"] += [s["k"] for s in r["steps"] if s["k"] != "pensar"] == x["route"]
        ok = x.get("has") is None or x["has"] in r["reply"]; c["answer_ok"] += r["kind"] == x["kind"] and ok
        if x.get("has") and x["kind"] == "answer":
            so = x["has"] in simple_rag(ix, x["q"]); c["simple_ok"] += so
            if "calcular" in x["route"]: c["calc_n"] += 1; c["simple_calc_ok"] += so
    return c


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8"); ix = build()
    if "--eval" in sys.argv:
        ts = json.loads((HERE / "data" / "tests.json").read_text("utf-8"))
        for n, part in (("DEV", ts[0::2]), ("TESTE", ts[1::2])): print(n, evaluate(ix, part))
    else:
        r = agent(ix, " ".join(a for a in sys.argv[1:] if not a.startswith("--")))
        for i, s in enumerate(r["steps"], 1): print(i, s["k"], {k: v for k, v in s.items() if k not in ("k", "hits")})
        print(r["kind"], "->", r["reply"])
