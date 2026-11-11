# WhatsApp booking assistant / Assistente de agendamento por WhatsApp

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/13-whatsapp-booking-assistant/`). It runs fully in the browser, no backend.

## English

**Problem.** The salon lives on WhatsApp: the owner answers between customers, misses requests, double-books and forgets who cancelled. Anyone who writes at night waits until the next day.

**What the workflow does.** An n8n workflow receives each message, understands what the person wants (service, day, time or period), checks the calendar for conflicts using each service's duration, confirms on the spot or offers the three nearest slots, and cancels on request. Prices are answered automatically; complaints and odd requests go to the owner on Telegram. If WhatsApp goes down, the booking is already saved and the owner is alerted.

**Estimated gain (honest).** An estimate, not a measurement: ~25 booking requests a week and ~4 min of back-and-forth each = about 1 h 40 a week handed back, plus answers outside business hours. Fictional data; the real figure depends on volume.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/wa-booking -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `book_exact` | 1 | 200 | {"received": true, "outcome": "book"} |
| `slot_taken_offers_three` | 1 | 200 | {"received": true, "outcome": "offer"} |
| `period_offers` | 1 | 200 | {"received": true, "outcome": "offer"} |
| `asks_service` | 1 | 200 | {"received": true, "outcome": "offer"} |
| `cancel` | 1 | 200 | {"received": true, "outcome": "cancel"} |
| `price_question` | 1 | 200 | {"received": true, "outcome": "info"} |
| `human_handoff` | 1 | 200 | {"received": true, "outcome": "handoff"} |
| `whatsapp_down` | 1 | 200 | {"received": true, "outcome": "book"} |
| `empty_message` | 1 | 500 | Empty message (media without text is not handled) [line 27] |
| `invalid_phone` | 1 | 500 | Invalid sender phone [line 27] |

## Português

**Problema.** O salão vive no WhatsApp: a dona responde entre um cliente e outro, perde pedido de horário, marca em cima de outro e esquece de avisar quem cancelou. Quem manda mensagem à noite só tem resposta no dia seguinte.

**O que o workflow faz.** Um workflow no n8n recebe cada mensagem, entende o que a pessoa quer (serviço, dia, hora ou período), confere conflitos na agenda levando em conta a duração de cada serviço, confirma na hora ou oferece os três horários mais próximos, e cancela quando pedido. Preço é respondido sozinho; reclamação e assunto estranho vão para a dona no Telegram. Se o WhatsApp cair, o agendamento já está salvo e a dona é avisada.

**Ganho estimado (honesto).** Estimativa, não medição: ~25 pedidos de horário por semana e ~4 min de ida e volta cada = cerca de 1h40 por semana devolvidas, mais respostas fora do expediente. Dados fictícios; o real depende do volume.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
