# 23 · Python data pipeline with quality gates / Pipeline de dados em Python com checagem de qualidade

![demo](prints/demo_1366.png)

## EN

**Business problem.** The daily sales report comes from a file exported by the shop. When it arrives with duplicate rows, a renamed column or not at all, someone notices in the meeting, with the wrong number already circulating.

**What it does.** `pipeline.py` (pandas + SQLite):
1. **Extract**: file missing → alert, exit 3, yesterday's numbers stay.
2. **Schema check**: renamed/missing/extra columns → halt, nothing loaded, exit 1.
3. **Validate** each row (order id, duplicate id, qty integer > 0, price > 0, date = run date, status). Bad rows are quarantined with line number and reason.
4. **Quality gate**: more than 25% rejected → halt, nothing loaded.
5. **Load** the day in one transaction replacing that day's partition: re-running never doubles anything. A volume drop (< 50% of the earlier average) or quarantined rows → loaded with warnings, exit 2.
6. **KPIs** (orders, revenue in integer cents, average ticket) and an alert line in `alerts.jsonl`.

Scheduling: `python pipeline.py --loop-at 06:30` (sleep loop) or Windows Task Scheduler/cron; the exit code (0/1/2/3) is what a scheduler reacts to.

**Honest gain estimate.** ~20 min/day checking the file by hand → seconds plus ~5 min only on alerts; ≈ 5 h per month. Estimate, not measurement. Thresholds are examples. The alert is a file line, not an e-mail.

**Stack.** Python 3.13, pandas, sqlite3.

**Run.**
```
pip install pandas
python make_data.py
python pipeline.py --inbox data --db warehouse.db --date 2026-11-09
python run_scenarios.py        # 7 days on a shared warehouse -> output/scenarios.json
python tests/test_pipeline.py  # 9 checks incl. idempotent re-run and scheduler next_run
```
**Demo:** `../../demos/23-pipeline-dados-python/`.

## PT

**Problema de negócio.** O relatório diário de vendas vem de um arquivo exportado pela loja. Quando chega com linha duplicada, coluna trocada ou não chega, alguém só percebe na reunião, com o número errado já circulando.

**O que faz.** `pipeline.py` (pandas + SQLite): arquivo ausente → alerta, saída 3; esquema mudou → interrompe, saída 1; linhas ruins vão para quarentena com linha e motivo; mais de 25% rejeitadas → interrompe; carga do dia em uma transação que substitui a partição (rodar de novo não duplica); queda de volume ou quarentena → carregado com avisos, saída 2; indicadores e alerta em `alerts.jsonl`. Agendamento: `--loop-at 06:30` ou Agendador de Tarefas/cron.

**Ganho estimado (honesto).** ~20 min/dia conferindo à mão → segundos mais ~5 min só nos alertas; ≈ 5 h por mês. Estimativa, não medição. Limites são exemplos. O alerta é uma linha em arquivo, não e-mail.

**Stack.** Python 3.13, pandas, sqlite3.

**Como rodar.** Comandos acima. Saídas reais em `output/`. Demo em `../../demos/23-pipeline-dados-python/`.
