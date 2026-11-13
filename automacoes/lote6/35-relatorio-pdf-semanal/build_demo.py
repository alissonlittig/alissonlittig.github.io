"""Roda o report real (summarize + PDF), grava o resumo e gera a demo interativa."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import report
from _build_lib import B, area, txt, build
report.run(HERE / "data/vendas.csv", HERE / "output")
full = (HERE / "data/vendas.csv").read_text("utf-8"); hdr = "date,product,region,qty,unit_price\n"
P = [("1. Semana completa (W45)", "1. Full week (W45)", {"csv": full, "week": ""}), ("2. Semana anterior (W44)", "2. Previous week (W44)", {"csv": full, "week": "2026-W44"}),
     ("3. Arquivo ruim (2 de 3 linhas inválidas)", "3. Bad file (2 of 3 rows invalid)", {"csv": hdr + "2026-11-02,Cadeira Ergo,Sul,1,899.0\nontem,Mesa,Sul,1,10\n2026-11-03,,Sul,x,10\n", "week": ""}),
     ("4. Arquivo vazio", "4. Empty file", {"csv": hdr, "week": ""}), ("5. Semana sem vendas (W50)", "5. Week with no sales (W50)", {"csv": full, "week": "2026-W50"})]
recorded = []
for i, (_, _, v) in enumerate(P):
    rec = {"input": v, "expect": report.summarize(v["csv"], v["week"] or None)}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
js = (HERE / "demo_logic.js").read_text("utf-8")
nodes = [("start", "Weekly CSV arrives", "file", 0, 0, B("vendas.csv", "vendas.csv")), ("parse", "Parse + validate", "code", 1, 0, B("linha e motivo", "line and reason")), ("gate", "Enough good data?", "if", 2, 0, B("máx. 20% inválidas", "max 20% invalid")),
         ("stop", "No PDF", "respond", 2, 1, B("diz por quê", "says why")), ("aggregate", "Aggregate", "code", 3, 0, B("total, top, região", "totals, top, region")), ("compare", "Compare weeks", "code", 4, 0, B("vs semana anterior", "vs previous week")),
         ("pdf", "Build PDF", "pdf", 5, 0, B("reportlab", "reportlab")), ("save", "Save files", "file", 6, 0, B("pdf + summary.json", "pdf + summary.json"))]
edges = [{"from": "start", "to": "parse"}, {"from": "parse", "to": "gate"}, {"from": "gate", "to": "aggregate", "when": "ok", "label": "ok"}, {"from": "gate", "to": "stop", "when": "stop", "label": "empty / review"},
         {"from": "aggregate", "to": "compare"}, {"from": "compare", "to": "pdf"}, {"from": "pdf", "to": "save"}]
fields = [area("csv", full, B("Conteúdo do CSV (pode editar)", "CSV content (editable)"), 9), txt("week", "", B("Semana (vazio = a mais recente; ex.: 2026-W44)", "Week (empty = latest; e.g. 2026-W44)"))]
build(HERE, "35-relatorio-pdf-semanal", B("Relatório semanal em PDF a partir de um CSV de vendas", "Weekly PDF report from a sales CSV"), B("Python · CSV · PDF", "Python · CSV · PDF"),
      B("Toda segunda o CSV de vendas da semana vira um PDF de uma página: faturamento, unidades, variação contra a semana anterior, gráfico por dia, top produtos e vendas por região. Linhas inválidas são listadas pelo número da linha; se o arquivo vier vazio ou com muito lixo, o script não gera relatório e diz o motivo, em vez de mandar um PDF bonito com número errado.",
        "Every Monday the week's sales CSV becomes a one-page PDF: revenue, units, change against the previous week, a daily chart, top products and sales by region. Invalid rows are listed by line number; if the file arrives empty or full of junk the script produces no report and says why, instead of sending a pretty PDF with wrong numbers."),
      B("Evento: CSV semanal chega", "Event: weekly CSV arrives"),
      B("Edite o CSV à vontade (ex.: estrague linhas) e rode. O PDF em si é gerado pelo Python (reportlab); aqui a página mostra o que vai nele. Dinheiro é calculado em centavos inteiros.", "Edit the CSV freely (e.g. break some rows) and run. The PDF itself is built by Python (reportlab); here the page shows what goes into it. Money is computed in whole cents."),
      [(B(a, b), v) for a, b, v in P], fields, nodes, edges,
      {"problem": B("Toda semana alguém abre a planilha de vendas, filtra, soma, copia os números para um documento e exporta o PDF. Demora, cada semana sai de um jeito e uma linha com data errada passa batida.", "Every week someone opens the sales sheet, filters, sums, copies the numbers into a document and exports the PDF. It takes time, each week looks different and one row with a wrong date slips through."),
       "solution": B("Um script Python valida cada linha, agrega em centavos, compara com a semana anterior e monta o PDF com o mesmo layout toda vez. Recusa gerar relatório com dados vazios ou com mais de 20% de linhas inválidas, e avisa dias úteis sem venda.", "A Python script validates each row, aggregates in cents, compares with the previous week and builds the PDF with the same layout every time. It refuses to produce a report from empty data or with more than 20% invalid rows, and flags weekdays without sales."),
       "gain": B("Estimativa, não medição: ~40 min por semana para montar o relatório à mão, ~3 h por mês. O script leva segundos; alguém ainda precisa olhar o PDF e o aviso de linhas recusadas.", "An estimate, not a measurement: ~40 min a week to build the report by hand, ~3 h a month. The script takes seconds; someone still has to read the PDF and the rejected-rows note."),
       "stack": ["Python 3.13", "csv", "reportlab", "pypdf (testes)"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["pip install reportlab", "python report.py data/vendas.csv output [2026-W45]", "Testes: python tests/test_report.py"], ["pip install reportlab", "python report.py data/vendas.csv output [2026-W45]", "Tests: python tests/test_report.py"])},
      B("O cálculo é o report.py portado para JavaScript linha a linha e conferido contra o resumo real do Python (5 casos). O PDF não é gerado no navegador: o de verdade está em output/weekly_2026-W45.pdf. Produtos e valores são fictícios. Nada é enviado; o envio do PDF por e-mail não foi escrito.", "The calculation is report.py ported to JavaScript line by line and checked against the real Python summary (5 cases). The PDF is not built in the browser: the real one is output/weekly_2026-W45.pdf. Products and values are fictional. Nothing is sent; e-mailing the PDF was not written."),
      recorded, js, ["report.py"], "Relatório semanal em PDF a partir de CSV", "Demo interativa que transforma um CSV de vendas em relatório semanal.")
