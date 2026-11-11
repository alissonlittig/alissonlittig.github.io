# Call transcript to CRM lead with a dead-letter queue / Ligação vira lead no CRM com fila de cartas mortas

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/18-call-summary-to-crm/`). It runs fully in the browser, no backend.

## English

**Problem.** Whoever answers the phone notes down (or not) what the customer said and enters it in the CRM later, if there is time. Hot leads cool off, budget and timeline stay in someone's memory, and when the CRM happens to be down that moment, the contact is simply lost.

**What the workflow does.** An n8n workflow receives the call transcript, extracts name, company, budget, timeline, objections and the next step the agent promised, computes a priority (hot, warm, cold) and creates the lead in the CRM. Support requests do not become leads. If the CRM fails all 3 tries, the lead is parked in a dead-letter queue, ops gets an alert and the flow answers normally instead of breaking.

**Estimated gain (honest).** An estimate, not a measurement: ~15 sales calls a week x ~4 min to log = about 4 h a month, and no lead is lost when the CRM goes down. Fictional data. Replaying the dead letters is still manual in this example.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/call-summary -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `hot_lead_saved` | 1 | 200 | {"call_id": "CALL-6678", "intent": "buy", "priority": "hot", "score": 100, "crm": "saved", "ops_alert": "not_n |
| `warm_lead_pt` | 1 | 200 | {"call_id": "CALL-7409", "intent": "buy", "priority": "warm", "score": 45, "crm": "saved", "ops_alert": "not_n |
| `support_not_a_lead` | 1 | 200 | {"call_id": "CALL-4245", "intent": "support", "priority": "support", "score": 0, "crm": "skipped", "ops_alert" |
| `cold_info_call` | 1 | 200 | {"call_id": "CALL-3387", "intent": "info", "priority": "cold", "score": 0, "crm": "saved", "ops_alert": "not_n |
| `crm_down_dead_letter` | 1 | 200 | {"call_id": "CALL-6678", "intent": "buy", "priority": "hot", "score": 100, "crm": "dead_letter", "ops_alert":  |
| `crm_and_telegram_down` | 1 | 200 | {"call_id": "CALL-6678", "intent": "buy", "priority": "hot", "score": 100, "crm": "dead_letter", "ops_alert":  |
| `call_too_short` | 1 | 500 | Call too short (12 s): nothing worth logging [line 34] |
| `bad_phone` | 1 | 500 | phone must have 8 to 15 digits [line 34] |
| `no_caller_lines` | 1 | 500 | Transcript has no "Caller:" lines [line 34] |

## Português

**Problema.** Quem atende o telefone anota (ou não) o que o cliente disse e passa para o CRM depois, se der. Leads quentes esfriam, orçamento e prazo ficam só na memória, e quando o CRM está fora do ar naquele momento o contato simplesmente se perde.

**O que o workflow faz.** Um workflow no n8n recebe a transcrição da ligação, extrai nome, empresa, orçamento, prazo, objeções e o próximo passo prometido pela atendente, calcula uma prioridade (quente, morna, fria) e cria o lead no CRM. Pedidos de suporte não viram lead. Se o CRM falhar nas 3 tentativas, o lead é guardado numa fila de cartas mortas, a operação recebe um alerta e o fluxo responde normalmente em vez de quebrar.

**Ganho estimado (honesto).** Estimativa, não medição: ~15 ligações comerciais por semana x ~4 min para registrar = cerca de 4 h por mês, e nenhum lead se perde quando o CRM cai. Dados fictícios. O reenvio das cartas mortas ainda é manual neste exemplo.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
