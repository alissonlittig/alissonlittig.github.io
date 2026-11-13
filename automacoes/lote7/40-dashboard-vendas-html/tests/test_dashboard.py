import sys, pathlib
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import dashboard as D
n = 0
def check(c, m):
    global n; assert c, m; n += 1; print("ok", m)
tiny = "date,product,region,qty,unit_price\n2026-09-10,A,Sul,2,10.00\n2026-10-02,A,Sul,1,30.00\n2026-10-03,B,Norte,3,5.50\n2026-10-04,B,Norte,0,5.50\n2026-13-01,B,Norte,1,5.50"
s = D.summarize(tiny)
check(s["revenue"] == 6650 and s["orders"] == 3 and s["avg_ticket"] == 2216, "faturamento 20,00+30,00+16,50 e ticket médio (centavos inteiros)")
check(s["rejected_lines"] == [5, 6], "qty 0 e data 13/01 rejeitadas, com o número da linha")
check(s["by_month"] == [["2026-09", 2000], ["2026-10", 4650]] and s["mom_pct"] == 132, "por mês e variação +132% (4650 vs 2000)")
check(s["top_products"][0] == ["A", 5000, 3] and s["by_region"][0] == ["Sul", 5000], "ranking de produto e região")
check(D.summarize("date,product,region,qty,unit_price")["orders"] == 0 and D.summarize("date,product,region,qty,unit_price")["mom_pct"] is None, "arquivo só com cabeçalho não quebra")
real = D.summarize((H / "data/vendas.csv").read_text("utf-8"))
check(real["orders"] == 144 and len(real["rejected_lines"]) == 2 and len(real["by_month"]) == 3, "vendas.csv: 144 válidas, 2 ignoradas, 3 meses")
check(sum(v for _, v in real["by_month"]) == real["revenue"] == sum(v for _, v in real["by_region"]), "as três visões somam o mesmo faturamento")
evil = D.summarize('date,product,region,qty,unit_price\n2026-10-01,"<script>alert(1)</script>",Sul,1,1.00')
h = D.render(evil)
check("<script>alert" not in h and "&lt;script&gt;" in h, "nome de produto é escapado (sem injeção de HTML)")
h = D.render(real); (H / "output").mkdir(exist_ok=True); (H / "output/dashboard.html").write_text(h, "utf-8")
check("http" not in h.replace("<!doctype", "") and "<script" not in h and 'lang="pt-BR"' in h and "viewport" in h, "HTML autônomo: sem script, sem recurso externo, com lang e viewport")
print(f"{n} checks ok")
