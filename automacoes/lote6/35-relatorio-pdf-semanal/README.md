# 35 · Weekly PDF report from a CSV / Relatório semanal em PDF a partir de CSV

![demo](prints/demo_1366.png)

## EN
**Business problem.** Every week someone filters, sums and pastes sales numbers into a PDF; wrong rows slip through.

**What it does.** `report.py` validates rows (line + reason), aggregates in integer cents, compares with the previous ISO week, flags weekdays without sales and builds a one-page PDF (reportlab: KPIs, daily chart, top products, regions). Empty data or >20% invalid rows: no PDF, a clear status (`empty`/`review`), exit code 1.

**Honest gain.** ~40 min/week by hand = ~3 h/month. Estimate; someone still reads the PDF.

**Stack / not done.** Python 3.13, csv, reportlab (`pip install reportlab`), pypdf for tests. E-mailing the PDF not written.

**Run.**
```
python report.py data/vendas.csv output [2026-W45]
python tests/test_report.py    # 10 checks (opens the PDF and reads its text)
```
Demo: `../_demo/demos/35-relatorio-pdf-semanal/` (check with `node ../_demo/tools/testar.js 35-relatorio-pdf-semanal`). Fictional data. Not published.

## PT
**Problema.** Toda semana alguém filtra, soma e cola números de vendas num PDF; linha errada passa batida.

**O que faz.** `report.py` valida linhas (linha + motivo), agrega em centavos, compara com a semana ISO anterior, marca dias úteis sem venda e monta um PDF de uma página (reportlab). Dados vazios ou >20% inválidos: sem PDF, status claro, código de saída 1.

**Ganho (honesto).** ~40 min/semana à mão = ~3 h/mês. Estimativa; alguém ainda lê o PDF.

**Stack / não feito.** Python 3.13, csv, reportlab, pypdf (testes). Envio do PDF por e-mail não escrito.

**Como rodar.** Comandos acima. Demo em `../_demo/demos/35-relatorio-pdf-semanal/`. Dados fictícios. Não publicado.
