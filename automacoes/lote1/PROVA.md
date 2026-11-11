# Test evidence / Prova de execução (n8n 2.47.3, local, 10-11/11/2026)

Everything ran on a local n8n (npm install, SQLite, Node 26, no Docker, no cards, no paid accounts). Telegram, shop page and LLM were replaced by `_demo/mock_server.py` (127.0.0.1:8099); no message left the machine.

| # | Test | Result |
|---|---|---|
| 1 | POST 4 leads to the published webhook | hot (score 5, Telegram alert sent) / cold PT reply / spam (no reply) / invalid e-mail -> workflow error "Error in workflow". 3 rows in leads.csv, 1 alert. |
| 2 | Manual run on 47 fictional sales rows | Execution success. Revenue R$ 6.275,10, 23 sales, -3.7% vs 09/11, report .md saved, summary sent. |
| 3 | Run 1 (baseline) -> run 2 after price/stock change | Run with no change: no alert. After 299.90/12 -> 249.90/3: alert "price 299.9 -> 249.9 (DROP); stock 12 -> 3". |
| 4 | 3 messages, rules mode | billing/high (PT draft), bug/high/negative, sales/normal (EN draft). 2 urgent alerts. |
| 4b | use_ai=true against mock OpenAI-compatible endpoint | source=ai. With a dead endpoint: source=rules-fallback (visible, not silent). NOT tested with a real model. |
| 5 | Manual run, tomorrow = 2026-11-11 | 3 of 5 appointments picked, 3 wa.me messages in reminders_outbox.csv, owner summary sent. |

Each folder: `canvas_executed.png` (green nodes after a run in the real editor, headless Playwright) and `demo.gif` (about 8 s of frames of that run). Output files are in `example_output/`.

Fixes found while testing (all in the exported JSON): missing-snapshot read needed alwaysOutputData; PT/EN detection matched the English word "a"; spam got an auto-reply.
