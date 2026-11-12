"""Writes the fictional starting stock and the invoice files in data/ (deterministic)."""
import pathlib
D = pathlib.Path(__file__).parent / "data"; (D / "invoices").mkdir(parents=True, exist_ok=True)
(D / "stock_start.csv").write_text("sku,name,on_hand\nTEA-01,Black tea 100g,40\nMUG-02,Ceramic mug,25\nKET-03,Kettle 1.2L,8\nBOX-04,Gift box,60\n", "utf-8")
def inv(n, date, direction, items):
    body = "".join(f'      <item sku="{s}" qty="{q}" unit_cost="{c}"/>\n' for s, q, c in items)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<invoice>\n  <number>{n}</number>\n  <date>{date}</date>\n  <direction>{direction}</direction>\n  <items>\n{body}  </items>\n</invoice>\n'
F = {
    "01_NF-1001_in.xml": inv("NF-1001", "2026-11-09", "in", [("TEA-01", 60, "9.80"), ("KET-03", 12, "71.00")]),
    "02_NF-1002_out.xml": inv("NF-1002", "2026-11-10", "out", [("TEA-01", 35, "18.50"), ("MUG-02", 10, "32.00")]),
    "03_NF-1003_broken.xml": inv("NF-1003", "2026-11-10", "out", [("MUG-02", 2, "32.00")]).replace("</items>", ""),
    "04_NF-1004_unknown.xml": inv("NF-1004", "2026-11-11", "out", [("TEA-01", 5, "18.50"), ("PAN-99", 1, "40.00")]),
    "05_NF-1005_toomuch.xml": inv("NF-1005", "2026-11-11", "out", [("KET-03", 25, "129.90")]),
    "06_NF-1001_again.xml": inv("NF-1001", "2026-11-09", "in", [("TEA-01", 60, "9.80"), ("KET-03", 12, "71.00")]),
    "07_noheader.xml": '<invoice><date>2026-11-12</date><direction>in</direction><items><item sku="BOX-04" qty="10" unit_cost="3.10"/></items></invoice>\n',
}
for k, v in F.items(): (D / "invoices" / k).write_text(v, "utf-8")
