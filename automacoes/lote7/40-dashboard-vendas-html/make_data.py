"""Gera data/vendas.csv fictício e determinístico (seed fixa), com 2 linhas ruins de propósito."""
import random, pathlib
r = random.Random(42); prods = [("Cafe especial 250g", "42.90"), ("Filtro de papel", "12.50"), ("Moedor manual", "189.00"), ("Caneca termica", "64.90"), ("Assinatura mensal", "79.00"), ("Chaleira bico fino", "145.00")]
regs = ["Sul", "Sudeste", "Nordeste", "Centro-Oeste"]; rows = ["date,product,region,qty,unit_price"]
for m in (8, 9, 10):
    for _ in range(40 + (m - 8) * 8):
        p = r.choice(prods); rows.append(f"2026-{m:02d}-{r.randint(1, 28):02d},{p[0]},{r.choice(regs)},{r.randint(1, 4)},{p[1]}")
rows.insert(30, "2026-09-31,Filtro de papel,Sul,1,12.50"); rows.insert(70, "2026-10-05,Moedor manual,Sul,0,189.00")
pathlib.Path(__file__).parent.joinpath("data/vendas.csv").write_text("\n".join(rows) + "\n", "utf-8"); print(len(rows) - 1, "linhas")
