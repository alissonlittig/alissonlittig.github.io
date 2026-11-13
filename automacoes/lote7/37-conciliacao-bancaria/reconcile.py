"""Conciliação bancária: extrato CSV x lançamentos do ERP -> relatório de divergências. Só lê; não altera nada."""
import csv, io, json, pathlib, re, sys
from datetime import date

WINDOW = 3   # dias de tolerância entre extrato e ERP
TOL_PCT = 2  # diferença de valor aceita no 2º passe (tarifa, arredondamento), em %


def cents(s):
    """'-1234.50' -> -123450 sem float (evita erro de arredondamento)."""
    s = s.strip(); neg = s.startswith("-"); s = s.lstrip("+-")
    if not re.fullmatch(r"\d+(\.\d{1,2})?", s): raise ValueError(f"valor inválido: {s!r}")
    w, _, f = s.partition("."); v = int(w) * 100 + int((f + "00")[:2])
    return -v if neg else v


def days(a, b): return abs((date.fromisoformat(a) - date.fromisoformat(b)).days)
def words(t): return set(re.findall(r"[a-z]{3,}", t.lower()))


def parse(text, erp):
    rows = []
    for i, r in enumerate(csv.DictReader(io.StringIO(text.strip())), 1):
        rows.append({"id": r["id"].strip() if erp else f"B{i}", "date": r["date"].strip(), "desc": r["description"].strip(), "amt": cents(r["amount"])})
    return rows


def reconcile(bank, erp):
    used, matched = set(), []
    def best(b, ok):
        c = [(abs(b["amt"] - e["amt"]), days(b["date"], e["date"]), k) for k, e in enumerate(erp) if k not in used and days(b["date"], e["date"]) <= WINDOW and ok(b, e)]
        return min(c) if c else None
    for b in bank:  # passe 1: mesmo valor, data dentro da janela
        m = best(b, lambda b, e: b["amt"] == e["amt"])
        if m: used.add(m[2]); matched.append({"bank": b["id"], "erp": erp[m[2]]["id"], "kind": "exact", "diff": 0})
    done = {m["bank"] for m in matched}
    for b in bank:  # passe 2: valor próximo + descrição parecida
        if b["id"] in done: continue
        m = best(b, lambda b, e: (b["amt"] > 0) == (e["amt"] > 0) and abs(b["amt"] - e["amt"]) * 100 <= TOL_PCT * abs(e["amt"]) and words(b["desc"]) & words(e["desc"]))
        if m: used.add(m[2]); done.add(b["id"]); matched.append({"bank": b["id"], "erp": erp[m[2]]["id"], "kind": "amount_diff", "diff": b["amt"] - erp[m[2]]["amt"]})
    bank_only = [b["id"] for b in bank if b["id"] not in done]
    erp_only = [e["id"] for k, e in enumerate(erp) if k not in used]
    bt, et = sum(b["amt"] for b in bank), sum(e["amt"] for e in erp)
    return {"matched": matched, "bank_only": bank_only, "erp_only": erp_only,
            "summary": {"bank_total": bt, "erp_total": et, "gap": bt - et, "matched": len(matched), "divergences": len(bank_only) + len(erp_only) + sum(1 for m in matched if m["diff"])}}


def money(c): return f"{'-' if c < 0 else ''}{abs(c) // 100}.{abs(c) % 100:02d}"


def report(res, bank, erp, out):
    out.mkdir(parents=True, exist_ok=True)
    bi, ei = {b["id"]: b for b in bank}, {e["id"]: e for e in erp}
    rows = []
    for m in res["matched"]:
        if m["diff"]: rows.append(["amount_diff", m["bank"], m["erp"], bi[m["bank"]]["desc"], money(bi[m["bank"]]["amt"]), money(ei[m["erp"]]["amt"]), money(m["diff"])])
    for i in res["bank_only"]: rows.append(["bank_only", i, "", bi[i]["desc"], money(bi[i]["amt"]), "", money(bi[i]["amt"])])
    for i in res["erp_only"]: rows.append(["erp_only", "", i, ei[i]["desc"], "", money(ei[i]["amt"]), money(-ei[i]["amt"])])
    with open(out / "divergencias.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["tipo", "extrato", "erp", "descricao", "valor_extrato", "valor_erp", "diferenca"]); w.writerows(rows)
    s = res["summary"]
    (out / "relatorio.md").write_text(f"# Conciliação\n\n- Conciliados: {s['matched']}\n- Divergências: {s['divergences']}\n- Total extrato: {money(s['bank_total'])} | Total ERP: {money(s['erp_total'])} | Diferença: {money(s['gap'])}\n", "utf-8")
    return rows


if __name__ == "__main__":
    if len(sys.argv) != 4: sys.exit("uso: python reconcile.py extrato.csv erp.csv saida/")
    bank, erp = (parse(pathlib.Path(p).read_text("utf-8"), e) for p, e in ((sys.argv[1], False), (sys.argv[2], True)))
    res = reconcile(bank, erp); rows = report(res, bank, erp, pathlib.Path(sys.argv[3]))
    print(json.dumps(res["summary"])); print(f"{len(rows)} divergência(s) em {sys.argv[3]}/divergencias.csv")
