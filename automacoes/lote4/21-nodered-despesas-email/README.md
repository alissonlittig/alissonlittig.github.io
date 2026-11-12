# 21 · Node-RED: expense sheet becomes an alert e-mail / planilha de despesas vira e-mail de alerta

![demo](prints/demo_1366.png)

## EN

**Business problem.** Finance receives expense sheets and checks them by hand: spending cap, missing receipt, duplicates, wrong category. Errors slip through and are found at month close.

**What it does.** A Node-RED 5.0 flow (`flows.json`, real export; function-node code lives in `functions/`):
`POST /expenses (text/csv) → check header → parse CSV → validate + policy → switch → build e-mail → SMTP → 200`.
- Wrong header → **422** and nothing is read.
- Rules: amount over 500 needs manager approval; over 50 without receipt needs one; same person/date/category/amount twice is a possible duplicate; invalid rows (date outside month, unknown category, amount ≤ 0, missing employee) are rejected with the line number.
- Anything flagged or rejected → `[ACTION]` e-mail listing each line; otherwise `[OK]` e-mail.
- **SMTP down** → the `catch` node appends the e-mail to `output/outbox_retry.jsonl` and the HTTP answer is **202 queued**, not a false 200.

**Honest gain estimate.** Checking a ~100-row sheet by hand ≈ 15 min; the flow answers in seconds and a person reviews only flagged rows (~3 min). With 20 sheets a month that is close to 4 h. Estimate, not measurement; the rules are examples to adapt to the real policy. The finance address is fictional and no real e-mail was sent.

**Stack.** Node-RED 5.0.9, `node-red-node-email`, JavaScript function nodes; test harness in Python with a local SMTP sink (`aiosmtpd`) that only stores `.eml` files.

**Run.**
```
cd runtime && npm install && cd ..
python run_scenarios.py     # starts SMTP sink + Node-RED, posts 4 sheets, writes output/
# or by hand: python smtp_sink.py output/inbox ; node runtime/node_modules/node-red/red.js -s runtime/settings.js -u runtime flows.json
# then: curl -X POST --data-binary @data/issues.csv -H "Content-Type: text/csv" localhost:1881/expenses
```
Real results are in `output/results.json` and the delivered e-mails in `output/inbox/*.eml`. `python build_flow.py` regenerates `flows.json` from `functions/`. `runtime/node_modules` is not meant to be committed (see `../.gitignore`).

**Interactive demo.** `../../demos/21-nodered-despesas-email/`.

## PT

**Problema de negócio.** O financeiro recebe planilhas de despesas e confere à mão: teto, recibo faltando, duplicidade, categoria errada. O erro passa e aparece no fechamento.

**O que faz.** Fluxo Node-RED 5.0 (`flows.json`, export real; o código dos nós function está em `functions/`):
`POST /expenses (text/csv) → confere cabeçalho → lê CSV → valida + política → switch → monta e-mail → SMTP → 200`.
- Cabeçalho errado → **422**, nada é lido.
- Regras: acima de 500 pede aprovação; acima de 50 sem recibo pede recibo; mesma pessoa/data/categoria/valor repetidos = possível duplicidade; linhas inválidas (data fora do mês, categoria desconhecida, valor ≤ 0, sem funcionário) são rejeitadas com o número da linha.
- Algo sinalizado ou rejeitado → e-mail `[ACTION]` com cada linha; senão `[OK]`.
- **SMTP fora do ar** → o nó `catch` grava o e-mail em `output/outbox_retry.jsonl` e a resposta HTTP é **202 na fila**, não um 200 falso.

**Ganho estimado (honesto).** Conferir ~100 linhas à mão ≈ 15 min; o fluxo responde em segundos e a pessoa revisa só o sinalizado (~3 min). Com 20 planilhas por mês, perto de 4 h. Estimativa, não medição; as regras são exemplos para adaptar à política real. O e-mail do financeiro é fictício e nenhum e-mail real foi enviado.

**Stack.** Node-RED 5.0.9, `node-red-node-email`, nós function em JavaScript; testes em Python com servidor SMTP local (`aiosmtpd`) que só guarda `.eml`.

**Como rodar.** Comandos acima. Resultados reais em `output/`. Demo interativa em `../../demos/21-nodered-despesas-email/`.
