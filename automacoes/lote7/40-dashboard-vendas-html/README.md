# 40 · Automatic sales dashboard / Dashboard de vendas automático

![demo](prints/demo_1366.png)
![page](prints/dashboard_1366.png)

## EN
**Problem.** Every month someone rebuilds the sales summary by hand.
**What it does.** `dashboard.py` reads a sales CSV, ignores and lists bad lines (by line number), computes revenue, orders, average ticket, change vs previous month, rankings by month/product/region (whole cents, no float) and writes ONE static HTML (no JS, no CDN, CSS bars, product names escaped). Made for scheduled runs: `--agendar` only PRINTS a Windows `schtasks` command; no task was created.
**Honest gain.** Estimate: ~1 h/month by hand. The CSV export from the sales system is not automated.
**Not done.** Period filters, other currencies, the scheduled task itself.
```
python make_data.py
python dashboard.py data/vendas.csv output/dashboard.html
python tests/test_dashboard.py     # 9 checks
```
Demo: `../_demo/demos/40-dashboard-vendas-html/`. Fictional data. Not published.

## PT
**Problema.** Todo mês alguém refaz o resumo de vendas à mão.
**O que faz.** `dashboard.py` lê o CSV, lista linhas ruins, calcula faturamento, pedidos, ticket, variação e rankings e grava UM HTML estático (sem JS, offline). `--agendar` só imprime o comando do agendador; nenhuma tarefa foi criada.
**Ganho (honesto).** Estimativa: ~1 h/mês. Exportar o CSV do sistema não está automatizado.
**Não feito.** Filtros de período, outras moedas, a tarefa agendada.
**Como rodar.** Comandos acima. Dados fictícios. Não publicado.
