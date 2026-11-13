"""Dashboard de vendas: CSV -> indicadores -> HTML estático (sem JS, sem CDN, abre offline). Feito para rodar agendado; não envia nada."""
import csv, html, io, pathlib, re, sys
from datetime import date


def cents(s):
    if not re.fullmatch(r"\d+(\.\d{1,2})?", s): raise ValueError("preço")
    w, _, f = s.partition("."); return int(w) * 100 + int((f + "00")[:2])


def brl(c): return "R$ " + f"{c // 100:,}".replace(",", ".") + f",{c % 100:02d}"


def summarize(text):
    tot, month, prod, reg, n, rej = 0, {}, {}, {}, 0, []
    for i, r in enumerate(csv.DictReader(io.StringIO(text.strip())), 2):
        try:
            d = date.fromisoformat((r["date"] or "").strip()); q = (r["qty"] or "").strip(); p = cents((r["unit_price"] or "").strip()); name = (r["product"] or "").strip(); rg = (r["region"] or "").strip()
            if not re.fullmatch(r"\d+", q) or int(q) < 1 or not name or not rg: raise ValueError("campo")
        except (ValueError, KeyError, TypeError):
            rej.append(i); continue
        v = int(q) * p; tot += v; n += 1; ym = d.isoformat()[:7]
        month[ym] = month.get(ym, 0) + v; reg[rg] = reg.get(rg, 0) + v
        a = prod.setdefault(name, [0, 0]); a[0] += v; a[1] += int(q)
    ms = sorted(month.items()); mom = None
    if len(ms) >= 2 and ms[-2][1] > 0: mom = (ms[-1][1] - ms[-2][1]) * 100 // ms[-2][1]
    return {"revenue": tot, "orders": n, "avg_ticket": tot // n if n else 0, "by_month": [list(x) for x in ms], "mom_pct": mom,
            "top_products": [[k, v[0], v[1]] for k, v in sorted(prod.items(), key=lambda kv: (-kv[1][0], kv[0]))[:5]],
            "by_region": [list(x) for x in sorted(reg.items(), key=lambda kv: (-kv[1], kv[0]))], "rejected_lines": rej}


def bars(rows, title):
    mx = max((v for _, v in rows), default=1) or 1
    out = "".join(f'<div class="b"><span class="l">{html.escape(str(k))}</span><span class="t"><i style="width:{v * 100 // mx}%"></i></span><span class="v">{brl(v)}</span></div>' for k, v in rows)
    return f"<section><h2>{html.escape(title)}</h2>{out or '<p>sem dados</p>'}</section>"


def render(s, title="Vendas"):
    mom = "—" if s["mom_pct"] is None else f"{s['mom_pct']:+d}% vs. mês anterior"
    warn = f'<p class="w">{len(s["rejected_lines"])} linha(s) ignoradas por erro (linhas {", ".join(map(str, s["rejected_lines"]))}).</p>' if s["rejected_lines"] else ""
    css = ("body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f6f7f9;color:#1b1f24}main{max-width:960px;margin:auto;padding:24px 16px}h1{font-size:1.5rem;margin:0 0 16px}h2{font-size:1rem;margin:0 0 12px}"
           ".k{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}.k div,section{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px #0001}.k b{display:block;font-size:1.4rem}.k small{color:#5b6570}"
           "section{margin-bottom:16px}.b{display:grid;grid-template-columns:110px 1fr 120px;gap:8px;align-items:center;margin:6px 0;font-size:.9rem}.t{background:#e8ebef;border-radius:6px;height:14px;display:block}.t i{display:block;height:100%;background:#2f6fed;border-radius:6px}.v{text-align:right}.w{color:#9a4b00}"
           "@media(max-width:480px){.b{grid-template-columns:80px 1fr 96px}}")
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><style>{css}</style></head><body><main><h1>{html.escape(title)}</h1>'
            f'<div class="k"><div><small>Faturamento</small><b>{brl(s["revenue"])}</b><small>{mom}</small></div><div><small>Pedidos</small><b>{s["orders"]}</b></div><div><small>Ticket médio</small><b>{brl(s["avg_ticket"])}</b></div></div>{warn}'
            + bars(s["by_month"], "Faturamento por mês") + bars([(k, v) for k, v, _ in s["top_products"]], "Top 5 produtos") + bars(s["by_region"], "Por região") + "</main></body></html>")


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) == 1 and a[0] == "--agendar":  # só IMPRIME o comando; criar a tarefa é decisão de quem for usar
        print('schtasks /Create /SC DAILY /ST 07:00 /TN "dashboard-vendas" /TR "python C:\\caminho\\dashboard.py C:\\caminho\\vendas.csv C:\\caminho\\saida\\dashboard.html"'); sys.exit()
    if len(a) != 2: sys.exit("uso: python dashboard.py vendas.csv saida.html   |   python dashboard.py --agendar")
    s = summarize(pathlib.Path(a[0]).read_text("utf-8")); out = pathlib.Path(a[1]); out.parent.mkdir(parents=True, exist_ok=True); out.write_text(render(s), "utf-8")
    print(f"{s['orders']} pedido(s), {brl(s['revenue'])}; {len(s['rejected_lines'])} linha(s) ignorada(s) -> {out}")
