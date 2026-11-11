# n8n automations, batch 2 - what AI Automation job ads ask for / Automações n8n, lote 2

Five more workflows built and run end to end on a local n8n 2.47.3 (free, self-hosted, no cards, no paid accounts). All data is fictional. Each folder has `workflow.json` (no credentials), `README.md` (EN + PT), `canvas_executed.png`, `demo.gif` (14-22 s, real run in the editor), `example_output/`. Research behind the choice: `PESQUISA_VAGAS.md`.

| # | Workflow | Job-ad requirement it answers | Folder |
|---|---|---|---|
| 6 | AI agent with tools (search, sheet, calendar) and memory | AI agents, LLM APIs, tool use | `06-ai-agent-tools-memory` |
| 7 | RAG over company documents with source citations | RAG, retrieval, document ingestion | `07-rag-docs-citations` |
| 8 | Invoice PDFs to validated sheet + review queue | Document/data extraction, data entry automation | `08-invoice-pdf-to-sheet` |
| 9 | Lead enrichment from public pages to scored CRM sheet | Lead management, CRM automation | `09-lead-enrichment-crm` |
| 10 | Webhook sync between two systems: retry, idempotency, dead-letter | APIs, webhooks, error handling | `10-webhook-sync-retry-deadletter` |

Shared: `data/` (fictional inputs and run outputs), `_demo/mock_server2.py` (Telegram / LLM / search / sites / System B stand-ins on port 8098), `PROVA.md` (test evidence). `_build/` is internal tooling (generators, API helpers, log): do not publish it. Batch 1 (five small-business workflows) is in the parent folder.
