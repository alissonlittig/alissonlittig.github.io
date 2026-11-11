# n8n automations for small business / Automações n8n para pequeno negócio

Five workflows built and run end to end on a local n8n 2.47.3 (free, self-hosted, no cards, no paid accounts). All data is fictional. Each folder has `workflow.json` (no credentials), `README.md` (EN + PT), `canvas_executed.png`, `demo.gif`, `example_output/`.

| # | Workflow | Folder |
|---|---|---|
| 1 | Lead capture, classification, auto-reply, CSV, Telegram alert | `01-lead-capture` |
| 2 | Daily sales report from CSV, summary on Telegram | `02-daily-sales-report` |
| 3 | Price and stock monitor, alert on change | `03-price-stock-monitor` |
| 4 | Support triage with optional LLM (rules fallback) | `04-support-triage` |
| 5 | Appointment reminders (WhatsApp-ready messages) | `05-appointment-reminders` |

Shared: `data/` (sample CSVs), `_demo/mock_server.py` (local Telegram / shop page / LLM stand-in on port 8099), `_build/` (generator and test scripts), `PROVA.md` (test evidence).

## Batch 2 / Lote 2 (AI automation: agent, RAG, PDF extraction, lead enrichment, sync with retry)
See `lote2/INDICE.md` (workflows 06-10), `lote2/PESQUISA_VAGAS.md` (job-ad research) and `lote2/PROVA.md`.
