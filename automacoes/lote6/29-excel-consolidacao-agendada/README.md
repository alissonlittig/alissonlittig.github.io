# 29 · Scheduled Excel consolidation / Consolidação de planilhas agendada

![demo](prints/demo_1366.png)

## EN
**Problem.** Each branch sends its own sales spreadsheet; someone opens them one by one, copies into a master sheet and adds up totals. Resends duplicate rows; a mistyped value slips through.

**What it does.** `fluxo.py` (Python + openpyxl), in the spirit of a Power Automate / Excel flow:
1. Scheduler (`daily@HH:MM` or `every:Nm`) works out the next run and fires the job.
2. Reads the CSVs in the inbox folder. A file whose content hash was already processed is skipped (idempotent).
3. Validates row by row (date, product, qty, unit price). A bad row goes to the **Erros** sheet; a file missing a column is rejected whole; the rest keeps going.
4. Builds an `.xlsx` with live formulas: `=D*E` per line, `SUMIF` per branch, `SUM` total, conditional format on low branches, filter and frozen header.

**Honest gain.** ~40 min/day by hand for 3 spreadsheets (estimate, not measured).

**Run.** `python fluxo.py` (one run, `fixtures/ok`) · `python fluxo.py ./inbox out.xlsx --agendar daily@07:30` (keeps running) · `python run_scenarios.py` · `python tests/test_fluxo.py` (12 checks, including an independent sum straight from the CSVs, the xlsx re-read, and the scheduler loop with a fake clock). Demo: `../_demo/demos/29-excel-consolidacao-agendada/`.

**Limits.** Formulas were checked as text, not recalculated in Excel/LibreOffice (neither was opened). Simple CSV reader (no quoted fields). Nothing was left scheduled on Windows; for a persistent schedule use Task Scheduler pointing at `fluxo.py`. Data is fictional.

## PT
**Problema.** Cada filial manda a planilha de um jeito; alguém abre uma por uma, copia para a mestra e soma. Reenvio duplica linha e erro de digitação passa batido.

**O que faz.** `fluxo.py` (Python + openpyxl), no espírito de um fluxo do Power Automate/Excel: agendador (`daily@HH:MM` ou `every:Nm`); lê os CSV da pasta e ignora arquivo já processado (hash do conteúdo); valida linha a linha (linha ruim vai para a aba **Erros**, arquivo sem coluna é rejeitado inteiro); gera o `.xlsx` com fórmulas vivas (`=D*E`, `SUMIF`, `SUM`), formatação condicional, filtro e cabeçalho fixo.

**Ganho honesto.** ~40 min/dia à mão com 3 planilhas (estimativa).

**Como rodar.** Comandos acima (12 verificações). **Limites:** fórmulas conferidas como texto, não recalculadas no Excel; CSV simples (sem aspas); nada ficou agendado no Windows (para agenda permanente, use o Agendador de Tarefas); dados fictícios.
