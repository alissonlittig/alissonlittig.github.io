"""RPA com Playwright: entra no portal, baixa o CSV de cada filial, valida linha a linha, consolida em Excel.
Falha em uma filial não derruba as outras: vira aviso no resumo e código de saída 2 (parcial)."""
import argparse, csv, io, json, pathlib, sys, datetime
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

MONTH = "2026-10"
ATTEMPTS = 3
BRANCHES = ["curitiba", "recife", "salvador"]


class LoginError(Exception): pass


def cents(s): return int(round(float(s) * 100))


def validate(rows):
    """Retorna (válidas, rejeitadas). Regra por linha: SKU preenchido, qty inteira > 0, preço > 0, data dentro do mês."""
    ok, bad = [], []
    for n, r in enumerate(rows, start=2):  # linha 1 = cabeçalho
        why = None
        try:
            if not r["sku"].strip(): why = "empty sku"
            elif int(r["qty"]) <= 0: why = "qty must be > 0"
            elif cents(r["unit_price"]) <= 0: why = "price must be > 0"
            elif not r["date"].startswith(MONTH + "-") or datetime.date.fromisoformat(r["date"]).month != int(MONTH[-2:]): why = "date outside " + MONTH
        except (ValueError, KeyError) as e: why = f"unreadable value ({e.__class__.__name__})"
        if why: bad.append({"line": n, "reason": why, "row": r})
        else: ok.append({**r, "qty": int(r["qty"]), "price_cents": cents(r["unit_price"])})
    return ok, bad


def consolidate(per_branch, missing):
    """per_branch = {filial: (válidas, rejeitadas)}. Tudo em centavos inteiros para não acumular erro de float."""
    by, prod, chan, total = [], {}, {}, 0
    for b, (ok, bad) in per_branch.items():
        rev = sum(r["qty"] * r["price_cents"] for r in ok); total += rev
        by.append({"branch": b, "rows_ok": len(ok), "rows_rejected": len(bad), "revenue": rev / 100})
        for r in ok:
            prod[r["product"]] = prod.get(r["product"], 0) + r["qty"] * r["price_cents"]
            chan[r["channel"]] = chan.get(r["channel"], 0) + r["qty"] * r["price_cents"]
    top = sorted(prod.items(), key=lambda x: (-x[1], x[0]))[:3]
    return {"month": MONTH, "total_revenue": total / 100, "by_branch": by, "top_products": [{"product": p, "revenue": v / 100} for p, v in top],
            "by_channel": [{"channel": c, "revenue": v / 100} for c, v in sorted(chan.items())], "missing_branches": missing}


def login(page, base, user, password):
    page.goto(base + "/login"); page.fill("input[name=user]", user); page.fill("input[name=password]", password); page.click("button")
    page.wait_for_load_state()
    if "/reports" not in page.url: raise LoginError("login rejected by the portal (check the credentials)")


def run(base, user, password, outdir, headless=True):
    out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True); log = []; per, missing = {}, []
    with sync_playwright() as p:
        br = p.chromium.launch(headless=headless); ctx = br.new_context(accept_downloads=True); page = ctx.new_page()
        login(page, base, user, password); log.append({"step": "login", "ok": True})
        for b in BRANCHES:
            got = None
            for attempt in range(1, ATTEMPTS + 1):
                if "/reports" not in page.url: page.goto(base + "/reports")
                if "/login" in page.url:  # sessão caiu: entra de novo e repete a mesma tentativa
                    login(page, base, user, password); log.append({"step": "relogin", "branch": b}); page.goto(base + "/reports")
                    if "/login" in page.url: raise LoginError("session expired and re-login failed")
                try:
                    with page.expect_download(timeout=2500) as d: page.click(f"#dl-{b}")
                    path = out / f"{b}_{MONTH}.csv"; d.value.save_as(path); got = path; log.append({"step": "download", "branch": b, "attempt": attempt, "ok": True}); break
                except PWTimeout:
                    why = "session expired" if "/login" in page.url else "portal error 500"
                    log.append({"step": "download", "branch": b, "attempt": attempt, "ok": False, "why": why})
                    if "/login" in page.url:
                        login(page, base, user, password); log.append({"step": "relogin", "branch": b})
                    page.goto(base + "/reports")
                    page.wait_for_timeout(300 * attempt)  # espera crescente
            if got is None: missing.append(b); continue
            per[b] = validate(list(csv.DictReader(io.StringIO(got.read_text("utf-8")))))
        br.close()
    summary = consolidate(per, missing); summary["log"] = log
    rejected = [{"branch": b, **x} for b, (_, bad) in per.items() for x in bad]
    summary["rejected"] = [{"branch": r["branch"], "line": r["line"], "reason": r["reason"]} for r in rejected]
    write_xlsx(out / f"consolidated_{MONTH}.xlsx", per, summary)
    (out / "summary.json").write_text(json.dumps(summary, indent=1), "utf-8")
    return summary


def write_xlsx(path, per, s):
    from openpyxl import Workbook
    from openpyxl.styles import Font
    wb = Workbook(); w = wb.active; w.title = "Consolidated"
    w.append(["branch", "date", "sku", "product", "qty", "unit_price", "channel", "revenue"])
    for b, (ok, _) in per.items():
        for r in ok: w.append([b, r["date"], r["sku"], r["product"], r["qty"], r["price_cents"] / 100, r["channel"], r["qty"] * r["price_cents"] / 100])
    w2 = wb.create_sheet("By branch"); w2.append(["branch", "rows ok", "rows rejected", "revenue"])
    for x in s["by_branch"]: w2.append([x["branch"], x["rows_ok"], x["rows_rejected"], x["revenue"]])
    w2.append(["TOTAL", "", "", s["total_revenue"]])
    w3 = wb.create_sheet("Rejected"); w3.append(["branch", "line", "reason"])
    for x in s["rejected"]: w3.append([x["branch"], x["line"], x["reason"]])
    w4 = wb.create_sheet("Missing"); w4.append(["branch"]); [w4.append([m]) for m in s["missing_branches"]]
    for sh in wb: [setattr(c, "font", Font(bold=True)) for c in sh[1]]
    wb.save(path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://127.0.0.1:8765"); ap.add_argument("--user", default="analista"); ap.add_argument("--password", default="demo123"); ap.add_argument("--out", default="output/run")
    a = ap.parse_args()
    try: s = run(a.base, a.user, a.password, a.out)
    except LoginError as e: print("ERROR:", e, file=sys.stderr); sys.exit(1)
    print(json.dumps({k: v for k, v in s.items() if k != "log"}, indent=1))
    if s["missing_branches"]: print("PARTIAL: missing", s["missing_branches"], file=sys.stderr); sys.exit(2)
