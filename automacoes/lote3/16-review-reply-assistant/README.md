# Review replies with brand tone and low-rating alert / Respostas a avaliações com tom da marca e alerta de nota baixa

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/16-review-reply-assistant/`). It runs fully in the browser, no backend.

## English

**Problem.** Replying to reviews pays off (and counts in local search), but it is easy to postpone, and a 1-star review with a threat can sit for days unseen. Copy-pasted replies also sound cold.

**What the workflow does.** An n8n workflow takes each review, detects language and topics (service, wait, price, quality, cleanliness, delivery), writes the reply in a warm or formal tone without promising refunds or inventing facts, and classifies: 4-5 stars are ready to post, 3 go to review, 1-2 or risk terms (lawsuit, food poisoning) alert the owner on Telegram. Everything lands in a queue.

**Estimated gain (honest).** An estimate, not a measurement: ~10 reviews a week x ~5 min to read, think and write = about 3.5 h a month, and the owner sees a bad review in minutes, not days. Fictional data.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/review-reply -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `five_stars_ready` | 1 | 200 | {"review_id": "RV-2846", "status": "ready_to_post", "rating": 5, "topics": ["service", "quality"], "owner_aler |
| `low_rating_pt_alert` | 1 | 200 | {"review_id": "RV-3338", "status": "needs_owner", "rating": 2, "topics": ["service", "quality"], "owner_alert" |
| `three_stars_formal` | 1 | 200 | {"review_id": "RV-2815", "status": "needs_review", "rating": 3, "topics": ["price", "quality"], "owner_alert": |
| `escalated_health_threat` | 1 | 200 | {"review_id": "RV-1130", "status": "escalated", "rating": 1, "topics": [], "owner_alert": "sent"} |
| `stars_only_no_text` | 1 | 200 | {"review_id": "RV-3334", "status": "ready_to_post", "rating": 4, "topics": [], "owner_alert": "not_needed"} |
| `telegram_down` | 1 | 200 | {"review_id": "RV-3338", "status": "needs_owner", "rating": 2, "topics": ["service", "quality"], "owner_alert" |
| `rating_out_of_range` | 1 | 500 | rating must be an integer from 1 to 5 [line 16] |
| `missing_reviewer` | 1 | 500 | reviewer is missing [line 16] |

## Português

**Problema.** Responder avaliações dá retorno (e pesa na busca local), mas é fácil deixar para depois, e uma avaliação de 1 estrela com ameaça fica dias sem ninguém ver. Resposta copiada e colada também soa fria.

**O que o workflow faz.** Um workflow no n8n recebe cada avaliação, detecta idioma e temas (atendimento, espera, preço, qualidade, limpeza, entrega), escreve a resposta no tom caloroso ou formal, sem prometer reembolso nem inventar fatos, e classifica: 4-5 estrelas ficam prontas para publicar, 3 vão para revisão, 1-2 ou termos de risco (processo, intoxicação) alertam o dono no Telegram. Tudo cai numa fila.

**Ganho estimado (honesto).** Estimativa, não medição: ~10 avaliações por semana x ~5 min para ler, pensar e escrever = cerca de 3,5 h por mês, e o dono vê a nota baixa em minutos, não em dias. Dados fictícios.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
