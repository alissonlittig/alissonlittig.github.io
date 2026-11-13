# n8n automations

Workflows built and run end to end on a local n8n (free, self-hosted). All data is fictional; no credentials in any JSON.

- `lote2/`: AI agent with tools and memory, RAG with citations, invoice PDFs to sheet, lead enrichment to CRM, webhook sync with retry and dead-letter. See `lote2/INDICE.md`.
- `lote3/`: invoice approval, meeting notes to tasks, WhatsApp booking, content repurposing, weekly KPI report, review replies, resume screening, call summary to CRM. Each has an interactive demo in `demos/`.
- `lote4/`: beyond n8n: AI research agent (LangGraph), RPA with Playwright, Node-RED flow, Python CRM, pandas data pipeline, PowerShell invoice-to-stock. Each has source, tests, real outputs and an interactive demo in `demos/` (19-24).
- `lote5/`: Google Apps Script report, FastAPI signed webhook router, tool-calling support agent (simulated LLM), polite scraper. Source, tests and interactive demo in `demos/` (25-28).
