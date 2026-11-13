"""Notas fiscais em PDF (com texto) -> campos -> validação -> planilha (CSV + XLSX). Só lê os PDFs; o que não confere vai marcado 'revisar'."""
import csv, pathlib, re, sys
from datetime import date

MONEY = r"([\d.]+,\d{2})"
FIELDS = {"numero": r"Numero:\s*(\d+)", "prestador": r"Prestador:[ \t]*(.+)", "cnpj": r"CNPJ:\s*(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})",
          "total": r"Valor total:\s*R\$\s*" + MONEY, "iss": r"ISS:\s*R\$\s*" + MONEY}
ITEM = re.compile(r"^(.+?)\s+(\d+)\s+x\s+" + MONEY + r"$", re.M)
COLS = ["arquivo", "numero", "data", "prestador", "cnpj", "itens", "total", "iss", "status", "problemas"]


def cents(s): return int(s.replace(".", "").replace(",", ""))
def brl(c): return f"{c // 100:,}".replace(",", ".") + f",{c % 100:02d}"


def cnpj_ok(c):
    d = re.sub(r"\D", "", c)
    if len(d) != 14 or len(set(d)) == 1: return False
    for n in (12, 13):
        w = ([6] if n == 13 else []) + [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        r = sum(int(x) * y for x, y in zip(d[:n], w)) % 11
        if int(d[n]) != (0 if r < 2 else 11 - r): return False
    return True


def parse_text(text):
    got = {}
    for k, rx in FIELDS.items():
        m = re.search(rx, text); got[k] = m.group(1).strip() if m else None
    m = re.search(r"Data de emissao:\s*(\d{2})/(\d{2})/(\d{4})", text); iso = None; issues = []
    if m:
        try: iso = date(int(m[3]), int(m[2]), int(m[1])).isoformat()
        except ValueError: issues.append("data inválida")
    items = [(d.strip(), int(q), cents(v)) for d, q, v in ITEM.findall(text)]
    for k, label in (("numero", "número"), ("prestador", "prestador"), ("cnpj", "CNPJ"), ("total", "valor total")):
        if got[k] is None: issues.append(f"falta {label}")
    if not m: issues.append("falta data")
    if got["cnpj"] and not cnpj_ok(got["cnpj"]): issues.append("CNPJ inválido")
    total = cents(got["total"]) if got["total"] else None
    soma = sum(q * v for _, q, v in items)
    if total is not None and items and soma != total: issues.append(f"soma dos itens ({brl(soma)}) diferente do total ({brl(total)})")
    if total is not None and not items: issues.append("nenhum item lido")
    return {"numero": got["numero"], "data": iso, "prestador": got["prestador"], "cnpj": got["cnpj"], "itens": len(items), "total": total,
            "iss": cents(got["iss"]) if got["iss"] else None, "status": "revisar" if issues else "ok", "problemas": issues}


def read_pdf(path):
    from pypdf import PdfReader
    return "\n".join(p.extract_text() or "" for p in PdfReader(str(path)).pages)


def run(pdf_dir, out):
    recs = []
    for p in sorted(pathlib.Path(pdf_dir).glob("*.pdf")):
        text = read_pdf(p)
        r = parse_text(text) if text.strip() else {"numero": None, "data": None, "prestador": None, "cnpj": None, "itens": 0, "total": None, "iss": None, "status": "revisar", "problemas": ["PDF sem texto (escaneado?): precisa de OCR"]}
        recs.append({"arquivo": p.name, **r})
    seen = {}
    for r in recs:  # duplicada = mesmo CNPJ + número
        k = (r["cnpj"], r["numero"])
        if r["numero"] and k in seen: r["status"] = "revisar"; r["problemas"].append(f"duplicada de {seen[k]}")
        else: seen.setdefault(k, r["arquivo"])
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    rows = [[r["arquivo"], r["numero"] or "", r["data"] or "", r["prestador"] or "", r["cnpj"] or "", r["itens"], brl(r["total"]) if r["total"] is not None else "", brl(r["iss"]) if r["iss"] is not None else "", r["status"], "; ".join(r["problemas"])] for r in recs]
    with open(out / "notas.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(COLS); w.writerows(rows)
    try:
        from openpyxl import Workbook
        wb = Workbook(); ws = wb.active; ws.title = "notas"; ws.append(COLS)
        for r, x in zip(rows, recs): ws.append(r[:6] + [x["total"] / 100 if x["total"] is not None else None, x["iss"] / 100 if x["iss"] is not None else None] + r[8:])
        for c in ("G", "H"):
            for cell in ws[c][1:]: cell.number_format = "#,##0.00"
        wb.save(out / "notas.xlsx")
    except ImportError: print("openpyxl ausente: só o CSV foi gravado")
    return recs


if __name__ == "__main__":
    if len(sys.argv) != 3: sys.exit("uso: python nfe_extract.py pasta_pdfs/ saida/")
    recs = run(sys.argv[1], sys.argv[2]); bad = [r["arquivo"] for r in recs if r["status"] != "ok"]
    print(f"{len(recs)} nota(s); {len(bad)} para revisar: {', '.join(bad) or '-'}")
