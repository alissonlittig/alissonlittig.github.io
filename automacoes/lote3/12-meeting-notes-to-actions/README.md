# Meeting notes to tasks, CRM note and recap / Ata de reunião vira tarefas, nota no CRM e resumo

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/12-meeting-notes-to-actions/`). It runs fully in the browser, no backend.

## English

**Problem.** After every meeting someone rewrites the summary, remembers who owns what and pastes a note into the CRM. It is nearly always late, and actions without an owner or date disappear.

**What the workflow does.** An n8n workflow takes the transcript (from any recorder), splits decisions from actions, finds the owner (who was asked or who volunteered) and the due date ("by Friday", "tomorrow", a date), writes the tasks, saves the note to the CRM with 3 retries and sends the recap in the meeting's language. Anything without an owner or date goes to the organizer on Telegram.

**Estimated gain (honest).** An estimate, not a measurement: ~8 meetings a week and ~10 min of recap and CRM work each = about 1 h 20 a week handed back; the bigger win is no forgotten action. Fictional data; the real figure depends on your volume.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/meeting-notes -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `complete_en` | 1 | 200 | {"meeting": "Q4 launch sync", "decisions": 1, "actions": 3, "needs_review": 0, "crm": "saved"} |
| `needs_review_pt` | 1 | 200 | {"meeting": "Reunião com cliente: proposta", "decisions": 1, "actions": 2, "needs_review": 2, "crm": "saved"} |
| `crm_down` | 1 | 200 | {"meeting": "Q4 launch sync", "decisions": 1, "actions": 3, "needs_review": 0, "crm": "queued"} |
| `transcript_too_short` | 1 | 500 | Transcript too short: need at least 3 "Name: text" lines (got 2) [line 44] |
| `no_attendees` | 1 | 500 | No attendees listed [line 44] |

## Português

**Problema.** Depois de cada reunião alguém reescreve o resumo, lembra quem ficou com o quê e cola uma nota no CRM. Quase sempre atrasa, e as ações sem dono ou data somem.

**O que o workflow faz.** Um workflow no n8n recebe a transcrição (de qualquer gravador), separa decisões e ações, descobre o responsável (quem pediu a alguém ou quem se ofereceu) e o prazo ("até sexta", "amanhã", data), grava as tarefas, salva a nota no CRM com 3 tentativas e manda o resumo no idioma da reunião. O que ficou sem dono ou data vai para o organizador no Telegram.

**Ganho estimado (honesto).** Estimativa, não medição: ~8 reuniões por semana e ~10 min de resumo e CRM cada = cerca de 1h20 por semana devolvidas; o ganho maior é nenhuma ação esquecida. Dados fictícios; o real depende do seu volume.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
