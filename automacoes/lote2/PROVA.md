# Test evidence / Prova de execução, batch 2 (n8n 2.47.3, local, 10-11/11/2026)

Local n8n (npm, SQLite, Node 26, no Docker, no cards, no paid accounts). Telegram, LLM, search API, company pages and System B were replaced by `_demo/mock_server2.py` (127.0.0.1:8098); no message left the machine. Every row below was run through the real n8n editor/webhooks and the outputs are in each `example_output/`.

| # | Test | Result |
|---|---|---|
| 06 | 3 questions, same session, published webhook | Q1 (stock + calendar): tools `sheet_lookup`, `calendar_free`, 3 steps, free slots 10:00-11:00, 12:30-14:00, 15:00-17:00. Q2 "How much does it cost?" resolved from memory (kettle) in 2 steps. Q3 web search: 1 tool call. Memory file `memory_demo.json` written. |
| 07 | Index 5 docs, then 5 questions | Index built (docs and chunks in `rag_index.json`). 4 answered with citations (file, section, paragraph, score); "Do you sell gift cards?" refused with no sources (below threshold). |
| 08 | 5 PDFs, run twice | Run 1: 2 booked (USD 3968.00), 2 to review (total mismatch 320+32 != 399; missing date), 1 duplicate skipped. Run 2: 0 booked, 0 to review, 5 duplicates skipped (idempotent). |
| 09 | 5 leads (1 dead site), run twice | Run 1: +5 rows, 1 unreachable (HTTP 404), hot: Orbit Logix 100, BrightPath Dental 85. Run 2: +0, 5 updated, no duplicate rows, `first_seen` kept. |
| 10 | 5 orders | Valid: 200 synced. Same order again: 200 `duplicate: true`. `-F` order: System B failed twice (503), 3rd try succeeded (attempts=3 in mock state). `-X` order: 3 tries failed, saved in `dead_letter.jsonl`, alert sent, caller got 202. Invalid: 400 with 4 errors. |

Fixes found while testing: HTTP node with text response returns the body in `data`, not `body` (lead enrichment scored everything 20 until fixed); a Merge node never fires when two of its inputs are empty, so the invoice summary was missing on the re-run (replaced by a parallel branch); the invoice duplicate check also reads the review file so re-runs do not re-queue the same PDF.

Not tested: a real LLM (Ollama is not installed here; the agent talks to a deterministic mock planner), real Telegram, real public websites, scanned (image) PDFs.
