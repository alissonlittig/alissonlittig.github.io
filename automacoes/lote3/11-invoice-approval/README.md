# Invoice approval with a human in the loop / Aprovação de fatura com humano no circuito

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/11-invoice-approval/`). It runs fully in the browser, no backend.

## English

**Problem.** Invoices arrive by e-mail and chat. Someone checks whether it was already paid, finds who may approve, chases the answer and then books it. Duplicates slip through and nobody knows who approved what.

**What the workflow does.** An n8n workflow validates the invoice, looks for a duplicate in the ledger and applies limits: up to US$ 500 from a known vendor with a PO is approved by itself; up to US$ 5,000 goes to the manager; above that, to the director. The approver gets buttons on Telegram, only the assigned approver decides, and only once. Every step becomes a ledger row.

**Estimated gain (honest).** An estimate, not a measurement: with ~60 invoices a month and ~5 min of checking and chasing each, that is about 5 h a month handed back, and the main benefit is avoiding double payments and having an audit trail. Fictional data; the real gain depends on your volume.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/invoice-submit -H 'Content-Type: application/json' -d @sample_input/<file>.json
curl -X POST http://localhost:5678/webhook/invoice-decision -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `auto_approved` | 1 | 200 | {"invoice_id": "INV-0003", "status": "approved", "route": "auto"} |
| `manager_approves` | 2 | 200 | {"invoice_id": "INV-0003", "status": "approved"} |
| `director_rejects` | 2 | 200 | {"invoice_id": "INV-0003", "status": "rejected"} |
| `duplicate_blocked` | 1 | 409 | {"status": "blocked", "reason": "duplicate of INV-0001 (approved)"} |
| `invalid_invoice` | 1 | 500 | Invalid invoice: amount must be a positive number [line 38] |
| `wrong_approver` | 1 | 500 | Pedro Alves is not the approver of INV-0002 (assigned: Mariana Costa) [line 22] |
| `already_decided` | 2 | 500 | INV-0002 is already approved: decision ignored [line 22] |

## Português

**Problema.** Faturas chegam por e-mail e WhatsApp. Alguém confere se já foi paga, descobre quem pode aprovar, cobra a resposta e depois lança. Duplicatas escapam e ninguém sabe quem aprovou o quê.

**O que o workflow faz.** Um workflow no n8n valida a fatura, procura duplicata no livro-razão e aplica limites: até US$ 500 de fornecedor conhecido com PO é aprovada sozinha; até US$ 5.000 vai para a gestora; acima disso, para o diretor. O aprovador recebe botões no Telegram, só o aprovador designado decide, e só uma vez. Cada passo vira uma linha do livro-razão.

**Ganho estimado (honesto).** Estimativa, não medição: com ~60 faturas por mês e ~5 min de conferência e cobrança cada, são cerca de 5 h por mês devolvidas, e a principal vantagem é evitar pagamento em duplicidade e ter trilha de auditoria. Dados fictícios; o ganho real depende do seu volume.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
