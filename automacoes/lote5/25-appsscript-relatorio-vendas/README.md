# 25 · Google Apps Script: weekly sales report / Relatório semanal de vendas

![demo](prints/demo_1366.png)

## EN
**Problem.** Every Monday someone filters the sales sheet, sums per seller and pastes it into an e-mail. Pending sales get counted, bad rows get missed.

**What it does.** `Code.gs` (bound to the spreadsheet) runs on a weekly time trigger:
1. Skips if this week is already logged as `OK` in the `Relatórios` tab (idempotent).
2. Reads `Vendas`, counts only `pago` rows, validates date/seller/value; bad rows are listed in the e-mail, never silently dropped.
3. Totals per seller and product, compares with the previous week.
4. Sends the summary with `MailApp` and logs a row. If the quota is exceeded the error is logged and the next trigger retries.

**Honest gain.** ~20 min/week by hand ≈ 1h20/month (estimate, not measured).

**Run.** Paste `Code.gs` in Extensions > Apps Script and add a weekly trigger for `sendWeeklyReport`. Outside Google: `node harness.js` (in-memory `SpreadsheetApp`/`MailApp`/`Utilities`) and `node tests/test_report.js` (10 checks). Scenarios: `output/scenarios.json`. Demo: `../_demo/demos/25-appsscript-relatorio-vendas/`.

**Limits.** Not executed inside a real Google account; the harness only covers the calls used. Fictional data.

## PT
**Problema.** Toda segunda alguém filtra a planilha, soma por vendedor e cola num e-mail. Venda pendente entra na conta, linha ruim passa batida.

**O que faz.** `Code.gs` (ligado à planilha) roda num gatilho semanal: (1) não reenvia se a semana já está `OK` na aba `Relatórios`; (2) lê `Vendas`, conta só `pago`, valida data/vendedor/valor e lista as linhas ruins no e-mail; (3) soma por vendedor e produto e compara com a semana anterior; (4) envia com `MailApp` e registra. Cota estourada: o erro vai para o log e o próximo gatilho tenta de novo.

**Ganho honesto.** ~20 min/semana à mão ≈ 1h20/mês (estimativa).

**Como rodar.** Cole o `Code.gs` em Extensões > Apps Script e crie o gatilho semanal de `sendWeeklyReport`. Fora do Google: `node harness.js` e `node tests/test_report.js` (10 verificações). **Limites:** não foi executado numa conta Google real; dados fictícios.
