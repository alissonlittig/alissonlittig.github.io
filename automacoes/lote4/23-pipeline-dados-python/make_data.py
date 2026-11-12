"""Writes the fictional daily files in data/ (deterministic, no randomness)."""
import pathlib
H = "order_id,customer_id,sku,qty,unit_price,order_date,status"
def rows(day, n, start, bad=None):
    d = day; skus = [("TEA-01", 18.5), ("MUG-02", 32.0), ("KET-03", 129.9), ("BOX-04", 12.25)]; st = ["paid", "shipped", "paid", "refunded"]; out = []
    for i in range(n):
        sku, pr = skus[i % 4]; out.append([f"A{start + i}", f"C{100 + i % 5}", sku, str(1 + i % 3), f"{pr:.2f}", d, st[i % 4]])
    for i, f in (bad or {}).items(): out[i] = f(out[i])
    return out
def csv(rs, head=H): return head + "\n" + "\n".join(",".join(r) for r in rs) + "\n"
def put(name, text): (pathlib.Path(__file__).parent / "data").mkdir(exist_ok=True); (pathlib.Path(__file__).parent / "data" / name).write_text(text, "utf-8")
put("orders_2026-11-09.csv", csv(rows("2026-11-09", 12, 1000)))
dirty = rows("2026-11-10", 12, 2000)
dirty[4][0] = dirty[3][0]      # duplicate order_id
dirty[7][3] = "0"              # qty 0
put("orders_2026-11-10.csv", csv(dirty))
put("orders_2026-11-11.csv", csv(rows("2026-11-11", 3, 3000)))
put("orders_2026-11-12_schema.csv", csv(rows("2026-11-12", 12, 4000), H.replace("qty", "qtd")))
bad = rows("2026-11-12", 12, 5000)
for i in (1, 3, 5, 7, 9): bad[i][4] = "-1" if i % 2 else "abc"
put("orders_2026-11-12_bad.csv", csv(bad))
