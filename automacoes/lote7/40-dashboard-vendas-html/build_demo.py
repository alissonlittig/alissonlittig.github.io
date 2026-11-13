"""Roda o dashboard.py real, grava as saídas esperadas e gera a demo interativa."""
import pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import dashboard as D
from _build_lib import B, area, build
full = (HERE / "data/vendas.csv").read_text("utf-8")
(HERE / "output").mkdir(exist_ok=True); (HERE / "output/dashboard.html").write_text(D.render(D.summarize(full)), "utf-8")
small = "date,product,region,qty,unit_price\n2026-10-01,Cafe especial 250g,Sul,2,42.90\n2026-10-02,Moedor manual,Sudeste,1,189.00\n2026-11-03,Cafe especial 250g,Sul,3,42.90\n2026-11-04,Caneca termica,Nordeste,2,64.90\n2026-11-04,Filtro de papel,Sul,5,12.50"
bad = "date,product,region,qty,unit_price\n2026-10-01,Cafe,Sul,2,42.90\n2026-10-32,Cafe,Sul,1,42.90\n2026-10-03,Cafe,Sul,0,42.90\n2026-10-04,,Sul,1,42.90\n2026-10-05,Cafe,Sul,1,quarenta"
P = [("1. Pequeno (2 meses)", "1. Small (2 months)", small), ("2. Linhas com erro", "2. Lines with errors", bad), ("3. Três meses, 144 pedidos", "3. Three months, 144 orders", full)]
recorded = []
for i, (_, _, c) in enumerate(P):
    rec = {"input": {"csv": c}, "expect": D.summarize(c)}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
nodes = [("start", "Read CSV", "file", 0, 0, B("valida linha a linha", "validates line by line")), ("kpis", "Indicators", "code", 1, 0, B("faturamento, ticket, variação", "revenue, ticket, change")), ("groups", "Rankings", "code", 2, 0, B("mês, produto, região", "month, product, region")), ("html", "Static HTML", "file", 3, 0, B("sem JS, abre offline", "no JS, opens offline"))]
edges = [{"from": "start", "to": "kpis"}, {"from": "kpis", "to": "groups"}, {"from": "groups", "to": "html"}]
build(HERE, "40-dashboard-vendas-html", B("Dashboard de vendas automático: CSV vira uma página HTML pronta", "Automatic sales dashboard: CSV becomes a ready HTML page"), B("Python · HTML estático", "Python · static HTML"),
      B("O script lê o CSV de vendas, ignora (e lista) linhas com erro, calcula faturamento, pedidos, ticket médio e variação contra o mês anterior, monta os rankings por mês, produto e região e grava UMA página HTML sem JavaScript e sem recurso externo, com gráficos de barras em CSS. Feito para rodar agendado (por exemplo todo dia às 7h) e deixar a página sempre atual numa pasta ou no site.",
        "The script reads the sales CSV, ignores (and lists) bad lines, computes revenue, orders, average ticket and change versus the previous month, builds rankings by month, product and region and writes ONE HTML page with no JavaScript and no external resource, with CSS bar charts. Built to run on a schedule (for example every day at 7am) and keep the page current in a folder or on the site."),
      B("Evento: agendamento diário (ou CSV novo)", "Event: daily schedule (or a new CSV)"),
      B("Cole um CSV seu (date, product, region, qty, unit_price; preço com ponto) ou use os exemplos. Para ver a página completa, baixe o dashboard.html.", "Paste your own CSV (date, product, region, qty, unit_price; decimal point) or use the examples. To see the full page, download dashboard.html."),
      [(B(a, b), {"csv": c}) for a, b, c in P], [area("csv", small, B("Vendas (CSV)", "Sales (CSV)"), 9)], nodes, edges,
      {"problem": B("Todo começo de mês alguém monta o resumo de vendas na planilha: copia dados, refaz fórmulas, tira print de gráfico. O número chega tarde e, às vezes, errado.", "Every start of month someone builds the sales summary in a spreadsheet: copy data, redo formulas, screenshot a chart. The number arrives late and sometimes wrong."),
       "solution": B("O mesmo cálculo, sempre igual, em dinheiro por centavos inteiros (sem erro de arredondamento), com linhas ruins listadas em vez de escondidas, e uma página que qualquer pessoa abre no celular.", "The same calculation every time, in whole cents (no rounding error), with bad lines listed instead of hidden, and a page anyone opens on a phone."),
       "gain": B("Estimativa, não medição: ~1 h por mês montando o resumo à mão, mais a espera de quem pede. O script roda em milissegundos; o agendamento do Windows (comando impresso por --agendar) não foi criado: quem for usar decide. Dependência: o CSV precisa ser exportado do sistema de vendas, e isso não está automatizado.", "An estimate, not a measurement: ~1 h a month building the summary by hand, plus the wait of whoever asks. The script runs in milliseconds; the Windows schedule (command printed by --agendar) was not created: whoever uses it decides. Dependency: the CSV must be exported from the sales system, and that step is not automated."),
       "stack": ["Python 3.13", "csv", "html", "CSS"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python make_data.py", "python dashboard.py data/vendas.csv output/dashboard.html", "python dashboard.py --agendar   (só imprime o comando do agendador)", "Testes: python tests/test_dashboard.py"], ["python make_data.py", "python dashboard.py data/vendas.csv output/dashboard.html", "python dashboard.py --agendar   (only prints the scheduler command)", "Tests: python tests/test_dashboard.py"])},
      B("O código é o summarize do dashboard.py portado para JavaScript; a lógica foi conferida contra as saídas reais do Python em 3 casos (incluindo o arquivo de 144 pedidos). O HTML baixável foi gerado pelo Python. Dados fictícios. Moeda fixa em R$; sem filtros por período na página.", "The code is dashboard.py's summarize ported to JavaScript; the logic was checked against the real Python outputs in 3 cases (including the 144-order file). The downloadable HTML was generated by Python. Fictional data. Fixed R$ currency; no period filters on the page."),
      recorded, (HERE / "demo_logic.js").read_text("utf-8"), ["dashboard.py", "output/dashboard.html"], "Dashboard de vendas automático", "Demo interativa: CSV de vendas vira dashboard HTML estático e agendável.")
