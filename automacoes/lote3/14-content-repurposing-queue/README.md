# One article to LinkedIn, X and newsletter drafts with an approval queue / Um artigo vira posts para LinkedIn, X e newsletter, com fila de aprovação

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/14-content-repurposing-queue/`). It runs fully in the browser, no backend.

## English

**Problem.** Publishing an article is half the job: then someone rewrites it for LinkedIn, builds a thread, summarises it for the newsletter and schedules it all. It usually gets postponed and the article dies on the blog.

**What the workflow does.** An n8n workflow takes the article, picks the three strongest points (numbers and title terms weigh more), writes the three drafts in the requested tone and the text's language, respects X's 280 and LinkedIn's 3,000 character limits, blocks promises like 'guaranteed' or '100%' and schedules Tue to Thu at 9:00, the thread the next day and the newsletter on Friday. Everything lands in a queue as pending approval and the editor is pinged on Telegram.

**Estimated gain (honest).** An estimate, not a measurement: ~1 article a week and ~45 min to adapt and schedule each channel = about 3 h a month handed back, with the bonus that nothing goes unpromoted. Fictional data; the real figure depends on your cadence.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/content-repurpose -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `ready_for_approval` | 1 | 202 | {"content_id": "CT-why-small-teams-should-a", "status": "pending_approval", "scheduled": {"linkedin": "2026-11 |
| `friendly_portuguese` | 1 | 202 | {"content_id": "CT-por-que-pequenas-empresa", "status": "pending_approval", "scheduled": {"linkedin": "2026-11 |
| `flagged_claims_held` | 1 | 200 | {"content_id": "CT-why-small-teams-should-a", "status": "needs_edit", "scheduled": {"linkedin": "2026-11-12 09 |
| `telegram_down` | 1 | 202 | {"content_id": "CT-invoice-follow-ups-the-s", "status": "pending_approval", "scheduled": {"linkedin": "2026-11 |
| `article_too_short` | 1 | 500 | Article too short: 52 characters, need at least 400 [line 20] |
| `bad_url` | 1 | 500 | url must start with http:// or https:// [line 20] |

## Português

**Problema.** Publicar um artigo é só metade do trabalho: depois alguém reescreve para o LinkedIn, monta um fio, resume para a newsletter e agenda tudo. Costuma ficar para depois, e o texto morre no blog.

**O que o workflow faz.** Um workflow no n8n recebe o artigo, escolhe os três pontos mais fortes (números e termos do título pesam mais), escreve os três rascunhos no tom pedido e no idioma do texto, respeita o limite de 280 caracteres do X e de 3.000 do LinkedIn, barra promessas do tipo 'garantido' ou '100%' e agenda terça a quinta às 9h, o fio no dia seguinte e a newsletter na sexta. Tudo entra numa fila como pendente de aprovação e o editor recebe o aviso no Telegram.

**Ganho estimado (honesto).** Estimativa, não medição: ~1 artigo por semana e ~45 min para adaptar e agendar cada canal = cerca de 3 h por mês devolvidas, com a vantagem de que nada fica sem ser divulgado. Dados fictícios; o real depende da sua frequência.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
