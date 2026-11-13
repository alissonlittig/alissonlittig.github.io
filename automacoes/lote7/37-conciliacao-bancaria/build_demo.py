"""Roda o reconcile.py real, grava as saídas esperadas e gera a demo interativa."""
import pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import reconcile as R
from _build_lib import B, area, build
bank = (HERE / "data/bank.csv").read_text("utf-8"); erp = (HERE / "data/erp.csv").read_text("utf-8")
clean_b = "date,description,amount\n2026-11-02,PIX recebido Cafe Rio,300.00\n2026-11-03,Boleto Papelaria Sul,-120.00"
clean_e = "id,date,description,amount\nE1,2026-11-02,Venda Cafe Rio,300.00\nE2,2026-11-03,Pagamento Papelaria Sul,-120.00"
far_b = "date,description,amount\n2026-11-01,PIX recebido Joao,500.00"
far_e = "id,date,description,amount\nE9,2026-11-20,Venda Joao,500.00"
P = [("1. Mês com divergências", "1. Month with divergences", bank, erp), ("2. Tudo certo", "2. All clear", clean_b, clean_e), ("3. Datas longe demais", "3. Dates too far apart", far_b, far_e)]
recorded = []
for i, (_, _, b, e) in enumerate(P):
    rec = {"input": {"bank": b, "erp": e}, "expect": R.reconcile(R.parse(b, False), R.parse(e, True))}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
nodes = [("start", "Read CSVs", "file", 0, 0, B("extrato + ERP", "bank + ERP")), ("exact", "Exact match", "code", 1, 0, B("mesmo valor, ±3 dias", "same amount, ±3 days")), ("tolerance", "Close match", "code", 2, 0, B("±2% + descrição", "±2% + description")), ("report", "Divergence report", "sheet", 3, 0, B("CSV + resumo", "CSV + summary"))]
edges = [{"from": "start", "to": "exact"}, {"from": "exact", "to": "tolerance"}, {"from": "tolerance", "to": "report"}]
build(HERE, "37-conciliacao-bancaria", B("Conciliação bancária: extrato x ERP com relatório de divergências", "Bank reconciliation: statement x ERP with a divergence report"), B("Python · CSV", "Python · CSV"),
      B("O script lê o extrato do banco e os lançamentos do ERP (CSV), casa o que bate (mesmo valor, data até 3 dias de diferença), tenta de novo com tolerância de 2% e descrição parecida (tarifa de cartão, arredondamento) e lista só o que sobra: cobranças que não estão no ERP, vendas que não entraram no banco e valores diferentes. Não altera nenhum dado.",
        "The script reads the bank statement and the ERP entries (CSV), matches what agrees (same amount, dates up to 3 days apart), tries again with a 2% tolerance and a similar description (card fee, rounding) and lists only what is left: charges missing in the ERP, sales that never reached the bank, and different amounts. It changes no data."),
      B("Evento: arquivos do mês prontos", "Event: month files ready"),
      B("Edite os CSVs (colunas date, description, amount; no ERP também id) e rode. Valores com ponto decimal.", "Edit the CSVs (columns date, description, amount; ERP also id) and run. Decimal point for amounts."),
      [(B(a, b_), {"bank": b, "erp": e}) for a, b_, b, e in P],
      [area("bank", bank, B("Extrato do banco (CSV)", "Bank statement (CSV)"), 8), area("erp", erp, B("Lançamentos do ERP (CSV)", "ERP entries (CSV)"), 8)], nodes, edges,
      {"problem": B("No fechamento do mês alguém compara linha a linha o extrato com o ERP, na planilha. Dá horas, e um erro de R$ 22 de taxa de cartão passa batido.", "At month end someone compares the statement with the ERP line by line in a spreadsheet. It takes hours and a R$ 22 card-fee gap slips through."),
       "solution": B("Dois passes automáticos (valor exato com janela de datas; valor próximo com descrição parecida), cada lançamento usado uma vez (cobrança duplicada aparece), e um CSV só com o que precisa de olho humano.", "Two automatic passes (exact amount with a date window; close amount with a similar description), each entry used once (a duplicate charge shows up), and a CSV with only what needs a human eye."),
       "gain": B("Estimativa, não medição: conciliar ~200 linhas à mão leva ~2 h por mês; o script roda em segundos e a pessoa revisa só as divergências (~15 min). Casamento por valor/data/palavra erra com valores repetidos de clientes diferentes: por isso nada é lançado sozinho.", "An estimate, not a measurement: reconciling ~200 lines by hand takes ~2 h a month; the script runs in seconds and a person reviews only the divergences (~15 min). Matching by amount/date/word can err on repeated amounts from different clients, which is why nothing is posted automatically."),
       "stack": ["Python 3.13", "csv", "datetime"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python reconcile.py data/bank.csv data/erp.csv output", "Testes: python tests/test_reconcile.py"], ["python reconcile.py data/bank.csv data/erp.csv output", "Tests: python tests/test_reconcile.py"])},
      B("O código é o reconcile.py portado para JavaScript linha a linha; a lógica foi conferida contra as saídas reais do Python em 3 casos. Dados fictícios. Não há conexão com banco ou ERP: a leitura é de CSV exportado. Importação OFX e baixa automática no ERP não foram escritas.", "The code is reconcile.py ported to JavaScript line by line; the logic was checked against the real Python outputs in 3 cases. Fictional data. No bank or ERP connection: it reads exported CSV. OFX import and automatic posting to the ERP were not written."),
      recorded, (HERE / "demo_logic.js").read_text("utf-8"), ["reconcile.py"], "Conciliação bancária extrato x ERP", "Demo interativa de conciliação bancária com relatório de divergências.")
