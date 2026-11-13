"""Weekly sales CSV -> validated summary -> PDF report (reportlab). Fictional data.
Refuses to publish a report when the data is empty or too many rows are bad (status 'empty' / 'review'): no PDF, a clear reason."""
import csv, io, sys, json, pathlib, datetime as dt

MAX_BAD = 0.2


def brl(c):  # cents -> 'R$ 1.234,56'
    s = f"{c / 100:,.2f}"; return "R$ " + s.replace(",", "_").replace(".", ",").replace("_", ".")


def parse_rows(text):
    rows, bad = [], []
    for ln, r in enumerate(csv.DictReader(io.StringIO(text)), start=2):
        e = []
        try: d = dt.date.fromisoformat((r.get("date") or "").strip())
        except ValueError: d = None; e.append("date must be YYYY-MM-DD")
        prod = (r.get("product") or "").strip(); reg = (r.get("region") or "").strip()
        if not prod: e.append("product is empty")
        if not reg: e.append("region is empty")
        try: q = int((r.get("qty") or "").strip()); q > 0 or e.append("qty must be > 0")
        except ValueError: q = 0; e.append("qty must be an integer")
        try: c = round(float((r.get("unit_price") or "").strip().replace(",", ".")) * 100); c > 0 or e.append("unit_price must be > 0")
        except ValueError: c = 0; e.append("unit_price must be a number")
        if e: bad.append({"line": ln, "errors": e})
        else: rows.append({"date": d, "product": prod, "region": reg, "qty": q, "cents": q * c})
    return rows, bad


def week_of(d): y, w, _ = d.isocalendar(); return f"{y}-W{w:02d}"


def summarize(text, week=None):
    rows, bad = parse_rows(text); total = len(rows) + len(bad)
    if total == 0 or not rows: return {"status": "empty", "rejected": bad}
    if len(bad) / total > MAX_BAD: return {"status": "review", "rejected": bad, "reason": f"{len(bad)} of {total} rows are invalid (limit {int(MAX_BAD * 100)}%)"}
    week = week or week_of(max(r["date"] for r in rows)); y, w = int(week[:4]), int(week[6:])
    prev_week = week_of(dt.date.fromisocalendar(y, w, 1) - dt.timedelta(days=7))
    cur = [r for r in rows if week_of(r["date"]) == week]; prev = [r for r in rows if week_of(r["date"]) == prev_week]
    if not cur: return {"status": "empty", "rejected": bad, "reason": f"no rows in {week}"}
    rev = sum(r["cents"] for r in cur); prev_rev = sum(r["cents"] for r in prev)
    def group(key):
        g = {}
        for r in cur: x = g.setdefault(r[key], {"cents": 0, "units": 0}); x["cents"] += r["cents"]; x["units"] += r["qty"]
        return sorted(({key: k, **v} for k, v in g.items()), key=lambda z: (-z["cents"], z[key]))
    mon = dt.date.fromisocalendar(y, w, 1)
    daily = [sum(r["cents"] for r in cur if r["date"] == mon + dt.timedelta(days=i)) for i in range(7)]
    return {"status": "ok", "week": week, "revenue": rev / 100, "units": sum(r["qty"] for r in cur), "orders": len(cur), "prev_revenue": prev_rev / 100,
            "delta_pct": round((rev - prev_rev) / prev_rev * 100, 1) if prev_rev else None,
            "top": [{"product": z["product"], "revenue": z["cents"] / 100, "units": z["units"]} for z in group("product")[:3]],
            "regions": [{"region": z["region"], "revenue": z["cents"] / 100, "share": round(z["cents"] / rev * 100, 1)} for z in group("region")],
            "daily": [c / 100 for c in daily], "zero_days": [str(mon + dt.timedelta(days=i)) for i, c in enumerate(daily) if c == 0 and i < 5], "rejected": bad}


def make_pdf(s, path):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    st = getSampleStyleSheet(); doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm, title=f"Weekly sales {s['week']}", author="Weekly report bot")
    money = lambda v: brl(round(v * 100))
    delta = "n/a (no previous week)" if s["delta_pct"] is None else f"{s['delta_pct']:+.1f}% vs previous week"
    el = [Paragraph(f"Weekly sales report: {s['week']}", st["Title"]), Paragraph("Fictional data. Generated automatically from the weekly CSV.", st["Italic"]), Spacer(1, 12)]
    k = Table([["Revenue", "Units", "Orders", "Change"], [money(s["revenue"]), str(s["units"]), str(s["orders"]), delta]], colWidths=[4.2 * cm] * 4)
    k.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTSIZE", (0, 1), (-1, 1), 11), ("GRID", (0, 0), (-1, -1), .4, colors.grey), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    el += [k, Spacer(1, 14), Paragraph("Daily revenue (Mon-Sun)", st["Heading3"])]
    d = Drawing(440, 140); c = VerticalBarChart(); c.x, c.y, c.width, c.height = 30, 20, 400, 100; c.data = [s["daily"]]; c.categoryAxis.categoryNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    c.bars[0].fillColor = colors.HexColor("#2563eb"); c.valueAxis.valueMin = 0; d.add(c); el += [d, Paragraph("Top products", st["Heading3"])]
    t = Table([["Product", "Revenue", "Units"]] + [[z["product"], money(z["revenue"]), str(z["units"])] for z in s["top"]], colWidths=[8 * cm, 4.5 * cm, 4 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")), ("GRID", (0, 0), (-1, -1), .4, colors.grey)])); el += [t, Paragraph("By region", st["Heading3"])]
    t = Table([["Region", "Revenue", "Share"]] + [[z["region"], money(z["revenue"]), f"{z['share']}%"] for z in s["regions"]], colWidths=[8 * cm, 4.5 * cm, 4 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")), ("GRID", (0, 0), (-1, -1), .4, colors.grey)])); el.append(t)
    notes = ([f"Weekdays with no sales: {', '.join(s['zero_days'])}."] if s["zero_days"] else []) + ([f"{len(s['rejected'])} input row(s) were rejected (lines {', '.join(str(r['line']) for r in s['rejected'])}) and are not in these numbers."] if s["rejected"] else [])
    if notes: el += [Paragraph("Notes", st["Heading3"])] + [Paragraph("- " + n, st["Normal"]) for n in notes]
    doc.build(el)


def run(csv_path, out_dir, week=None):
    s = summarize(pathlib.Path(csv_path).read_text("utf-8"), week); out = pathlib.Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    if s["status"] == "ok": make_pdf(s, out / f"weekly_{s['week']}.pdf")
    (out / "summary.json").write_text(json.dumps(s, indent=1, ensure_ascii=False), "utf-8"); return s


if __name__ == "__main__":
    s = run(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None); print(s["status"], s.get("week", ""), s.get("reason", ""))
    sys.exit(0 if s["status"] == "ok" else 1)
