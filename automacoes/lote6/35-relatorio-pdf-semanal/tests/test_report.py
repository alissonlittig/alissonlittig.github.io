import sys, pathlib, tempfile
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import report
from pypdf import PdfReader
n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
s = report.run(H / "data/vendas.csv", H / "output")
check(s["status"] == "ok" and s["week"] == "2026-W45", "latest week picked: 2026-W45")
check(s["delta_pct"] == round((s["revenue"] - s["prev_revenue"]) / s["prev_revenue"] * 100, 1), "change vs previous week computed")
check([r["line"] for r in s["rejected"]] == [36, 37], "2 bad rows rejected with their line numbers (qty 0, US-style date)")
check(abs(sum(s["daily"]) - s["revenue"]) < 0.01 and abs(sum(z["revenue"] for z in s["regions"]) - s["revenue"]) < 0.01, "daily and region totals add up to the revenue")
check(s["zero_days"] == ["2026-11-04"], "weekday without sales is flagged")
txt = "\n".join(p.extract_text() for p in PdfReader(H / "output/weekly_2026-W45.pdf").pages)
check("2026-W45" in txt and "Top products" in txt and "Monitor 24" in txt and "rejected" in txt, "PDF opens and contains title, top products and the rejected-rows note")
check(report.brl(129990) == "R$ 1.299,90", "Brazilian money format")
bad = "date,product,region,qty,unit_price\n2026-11-02,A,Sul,1,10\nx,B,Sul,1,10\ny,C,Sul,1,10\n"
check(report.summarize(bad)["status"] == "review", "too many bad rows (2 of 3): no report, status review")
check(report.summarize("date,product,region,qty,unit_price\n")["status"] == "empty", "empty file: no report")
check(report.summarize(pathlib.Path(H / "data/vendas.csv").read_text("utf-8"), "2026-W50")["status"] == "empty", "week without rows: no report")
print(n, "ok")
