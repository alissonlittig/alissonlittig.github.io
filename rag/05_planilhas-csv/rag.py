"""RAG sobre planilha (CSV). Local, sem chave, sem LLM. Pergunta em português -> intenção por regras (agregação, medida, agrupamento, filtros achados
no índice de valores da planilha) -> o CÁLCULO é feito sobre as linhas filtradas (nunca "estimado") -> tabela + linhas de origem (arquivo:linha),
ordenadas por BM25. Termo que não existe na planilha = recusa em vez de chutar.
Uso: python rag.py "qual cidade vendeu mais?" """
import csv, json, pathlib, re, sys
import rag_core as C

HERE = pathlib.Path(__file__).parent
CATS = ["mes", "cidade", "categoria", "produto", "vendedor"]  # colunas categóricas (ordem de prioridade nos filtros)
st = lambda w: w[:-1] if len(w) > 3 and w.endswith("s") else w
S = lambda s: {st(w) for w in s.split()}
HEAD = {"cidade": S("cidade filial loja"), "vendedor": S("vendedor vendedora atendente"), "categoria": S("categoria"), "produto": S("produto item artigo"), "mes": S("mes meses mensal mensais")}
MEAS = {"qtd": S("unidade unidades quantidade qtd pecas peca"), "preco": S("preco precos")}
AVG, MAX, MIN = S("media medio ticket"), S("maior maximo caro melhor top"), S("menor minimo barato pior")
SUMW, DESC, ASC = S("total soma faturamento receita vendeu vendemos vender faturou rendeu venda vendas vendido vendidos vendida vendidas valor quanto"), S("mais maior melhor top ranking"), S("menos menor pior")
GROUPPRE = S("por cada qual quais ranking")
KNOWN = set().union(*HEAD.values(), *MEAS.values(), AVG, MAX, MIN, SUMW, DESC, ASC, GROUPPRE, S("pedido pedidos numero contagem quantos quantas foram foi feito feitos feitas tiveram teve tivemos como vendedora total media data coluna linha"))


def read_csv(path=HERE / "data" / "vendas.csv"):
    with open(path, encoding="utf-8", newline="") as f: rd = list(csv.reader(f))
    cols = rd[0]; rows = [[int(x) if x.isdigit() else x for x in r] for r in rd[1:]]
    return cols, rows


def build(path=HERE / "data" / "vendas.csv"):
    cols, rows = read_csv(path); bix, _ = C.bm25_index([" ".join(map(str, r)) for r in rows])
    return {"file": pathlib.Path(path).name, "columns": cols, "rows": rows, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]},
            "values": {c: list(dict.fromkeys(r[cols.index(c)] for r in rows)) for c in CATS}}


def _vocab(ix):
    if "_vocab" not in ix: ix["_vocab"] = {t for c in ix["columns"] for t in C.tokens(c)} | {t for r in ix["rows"] for x in r[:2] for t in C.tokens(str(x))}
    return ix["_vocab"]


def parse(ix, q):
    """-> intenção {agg, measure, group, filters, order, unknown}. Tudo por regras e pelo índice de valores."""
    raw = re.findall(r"[a-z0-9]+", C.norm(q)); W = [st(w) for w in raw]; tk = C.tokens(q); used = [False] * len(tk)
    cand = sorted(((c, v, C.tokens(str(v))) for c in CATS for v in ix["values"][c]), key=lambda x: (-len(x[2]), CATS.index(x[0])))
    filters = {}
    for c, v, vt in cand:
        pos = [next((i for i, t in enumerate(tk) if t == x and not used[i]), -1) for x in vt]
        if vt and all(p >= 0 for p in pos):
            for p in pos: used[p] = True
            filters.setdefault(c, []).append(v)
    group = None
    for i, w in enumerate(W):
        for c, hw in HEAD.items():
            if w in hw and i > 0 and W[i - 1] in GROUPPRE and group is None: group = c
    ws = set(W); measure = "qtd" if ws & MEAS["qtd"] else "preco" if ws & MEAS["preco"] else "total"
    if ws & AVG: agg = "avg"
    elif {"quantos", "quantas", "numero"} & set(raw) and measure != "qtd": agg, measure = "count", "pedido"
    elif ws & MAX and not group: agg = "max"
    elif ws & MIN and not group: agg = "min"
    elif ws & SUMW or group or measure == "qtd": agg = "sum"
    else: agg = None
    if group and group in filters and len(filters[group]) == 1 and not (ws & (DESC | ASC)): group = None
    order = "asc" if ws & ASC else "desc" if ws & DESC else None
    unknown = [t for i, t in enumerate(tk) if not used[i] and t not in KNOWN and t not in _vocab(ix)]
    return {"agg": agg, "measure": measure, "group": group, "filters": filters, "order": order, "unknown": unknown, "terms": tk}


def _agg(vals, agg):
    if agg == "count": return len(vals)
    if agg == "avg": return round(sum(vals) / len(vals) + 1e-9, 2)
    return {"sum": sum, "max": max, "min": min}[agg](vals)


def ask(ix, q):
    it = parse(ix, q); cols = ix["columns"]; col = cols.index
    res = {"status": "refused", "intent": it, "table": None, "value": None, "sources": [], "n": 0}
    if it["unknown"]: res["reason"] = "unknown"; return res
    rows = [(n + 2, r) for n, r in enumerate(ix["rows"]) if all(r[col(c)] in vs for c, vs in it["filters"].items())]  # linha 1 = cabeçalho
    qt = it["terms"]; sc = {n: C.bm25_score(ix["bm25"], qt, C.tokens(" ".join(map(str, r)))) for n, r in rows}
    if not it["agg"] and not it["group"]:
        if not it["filters"]: res["reason"] = "no_intent"; return res
        res["status"] = "rows"
    if not rows: res["reason"] = "no_rows"; res["status"] = "refused"; return res
    res["n"] = len(rows); m = it["measure"]; vals = lambda rs: [1 if m == "pedido" else r[col(m)] for _, r in rs]
    if it["group"]:
        g = col(it["group"]); keys = list(dict.fromkeys(r[g] for _, r in rows)); tab = [[k, _agg(vals([x for x in rows if x[1][g] == k]), it["agg"])] for k in keys]
        if it["group"] != "mes" or it["order"]: tab.sort(key=lambda p: (p[1] if it["order"] == "asc" else -p[1], str(p[0])))
        res.update(status="answered", table={"columns": [it["group"], it["agg"] + " " + m], "rows": tab}, value=tab[0][1], first=tab[0][0]); rows = [x for x in rows if x[1][g] == tab[0][0]]
    elif it["agg"]:
        v = _agg(vals(rows), it["agg"]); res.update(status="answered", value=v)
        if it["agg"] in ("max", "min"): rows = [x for x in rows if x[1][col(m)] == v]
    res["sources"] = [{"line": n, "row": r, "bm25": round(sc[n], 4)} for n, r in sorted(rows, key=lambda x: (-sc[x[0]], x[0]))[:5]]
    return res


def say(r, ix):
    i = r["intent"]
    if r["status"] == "refused": return {"unknown": "Não encontrei na planilha: " + ", ".join(i["unknown"]) + ". Colunas: " + ", ".join(ix["columns"]) + ".", "no_rows": "Nenhuma linha com esses filtros.", "no_intent": "Não entendi qual conta fazer com a planilha."}[r["reason"]]
    if r["status"] == "rows": return f"{r['n']} linhas com esses filtros (mostrando as 5 mais relevantes)."
    what = {"sum": "soma", "avg": "média", "max": "maior", "min": "menor", "count": "contagem"}[i["agg"]] + " de " + i["measure"]
    return (f"{r['first']}: " if i["group"] else "") + f"{what} = {r['value']}" + (f" (filtros: {', '.join(c + '=' + '/'.join(map(str, v)) for c, v in i['filters'].items())})" if i["filters"] else "")


def evaluate(ix, tests):
    out = dict(value_ok=0, value_n=0, first_ok=0, first_n=0, refuse_ok=0, refuse_n=0, wrong=[])
    for t in tests:
        r = ask(ix, t["q"]); k = t["kind"]; out[k + "_n"] += 1
        ok = r["status"] == "refused" if k == "refuse" else r["status"] == "answered" and (abs(r["value"] - t["expect"]) < 0.006 if k == "value" else r.get("first") == t["expect"])
        out[k + "_ok"] += ok
        if not ok: out["wrong"].append(t["q"])
    return out


if __name__ == "__main__":
    ix = build()
    for q in sys.argv[1:] or ["qual cidade vendeu mais?"]:
        r = ask(ix, q); print("\nP:", q, "\nR:", say(r, ix))
        if r["table"]: print("   " + " | ".join(r["table"]["columns"])); [print("   ", *x) for x in r["table"]["rows"]]
        for s in r["sources"]: print(f"   {ix['file']}:{s['line']}  {s['row']}  (bm25 {s['bm25']})")
