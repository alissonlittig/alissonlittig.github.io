"""Gera os CSVs fictícios de outubro/2026 (semente fixa, então sempre iguais)."""
import random, pathlib, csv
P = [("PRD-101", "Cold brew 1 L", "18.90"), ("PRD-102", "Oat milk 1 L", "9.50"), ("PRD-103", "Granola 500 g", "14.20"), ("PRD-104", "Green tea box", "11.00"), ("PRD-105", "Protein bar x12", "32.40"), ("PRD-106", "Sparkling water x6", "12.60")]
rnd = random.Random(987)
for branch, n in [("curitiba", 38), ("recife", 34), ("salvador", 36)]:
    rows = []
    for _ in range(n):
        s, name, price = rnd.choice(P); rows.append([f"2026-10-{rnd.randint(1, 31):02d}", s, name, rnd.randint(1, 12), price, rnd.choice(["store", "store", "online", "phone"])])
    if branch == "recife":  # linhas ruins de verdade: quantidade negativa, SKU vazio, data fora do mês
        rows[5][3] = -3; rows[12][1] = ""; rows[20][0] = "2026-09-30"
    with open(pathlib.Path(__file__).parent / "data" / f"{branch}_2026-10.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["date", "sku", "product", "qty", "unit_price", "channel"]); w.writerows(rows)
