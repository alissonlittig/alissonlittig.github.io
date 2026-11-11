# Weekly KPI report with chart, alert and e-mail / Relatório semanal de KPIs com gráfico, alerta e e-mail

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/15-weekly-kpi-report/`). It runs fully in the browser, no backend.

## English

**Problem.** Every Monday someone exports sales, pastes them into a spreadsheet, builds a chart, writes the summary and e-mails it. That is about 45 minutes, it is easy to skip in a busy week, and a revenue drop or a refund spike only shows up once it already hurts.

**What the workflow does.** An n8n workflow receives two weeks of daily sales, validates the CSV (header, numbers, all 14 days), compares the week with the previous one, computes average order value and refund rate, generates an attached SVG chart and an e-mail in PT or EN. If revenue falls 20% or more, refunds go past 5% or new customers drop 30%, the owner gets a Telegram alert on top of the e-mail. Every report goes into a log.

**Estimated gain (honest).** An estimate, not a measurement: ~45 min a week of assembly = about 3 h a month handed back, and the report goes out even in a busy week. Fictional data; the real gain depends on how many sources you stitch by hand today.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/kpi-report -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `healthy_week` | 1 | 200 | {"company": "Northwind Pottery", "week_end": "2026-11-08", "revenue": 7493.05, "revenue_delta_pct": 8.7, "flag |
| `revenue_drop_alert_pt` | 1 | 200 | {"company": "Cerâmica Aurora", "week_end": "2026-11-08", "revenue": 4591.65, "revenue_delta_pct": -33.4, "flag |
| `email_down` | 1 | 200 | {"company": "Northwind Pottery", "week_end": "2026-11-08", "revenue": 7493.05, "revenue_delta_pct": 8.7, "flag |
| `missing_days` | 1 | 500 | Missing 3 day(s) of data: 2026-10-28, 2026-10-29, 2026-11-03 [line 36] |
| `bad_recipient` | 1 | 500 | recipients must be valid e-mail addresses [line 36] |

## Português

**Problema.** Toda segunda alguém exporta as vendas, cola numa planilha, monta um gráfico, escreve o resumo e manda por e-mail. Dá uns 45 minutos, é fácil pular em semana corrida e uma queda de receita ou um pico de reembolso só aparece quando já doeu.

**O que o workflow faz.** Um workflow no n8n recebe duas semanas de vendas por dia, valida o CSV (cabeçalho, números, os 14 dias), compara a semana com a anterior, calcula ticket médio e taxa de reembolso, gera um gráfico SVG anexo e um e-mail em PT ou EN. Se a receita cai 20% ou mais, os reembolsos passam de 5% ou os novos clientes caem 30%, o dono recebe um alerta no Telegram além do e-mail. Cada relatório vai para um registro.

**Ganho estimado (honesto).** Estimativa, não medição: ~45 min por semana de montagem = cerca de 3 h por mês devolvidas, e o relatório sai mesmo em semana corrida. Dados fictícios; o ganho real depende de quantas fontes você hoje junta à mão.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
