# Resume screening with scoring and ranking / Triagem de currículos com pontuação e ranking

**Live interactive demo / Demo interativa:** open `index.html` through the portfolio (`automacoes/demos/17-resume-screening-ranking/`). It runs fully in the browser, no backend.

## English

**Problem.** One open job can get 100 resumes and the first read is always the same: look for the must-have skills, check the years of experience, discard what does not fit. It is tiring, inconsistent between people, and good candidates wait days.

**What the workflow does.** An n8n workflow receives the resume text and the job requirements, looks for each must-have and nice-to-have skill, reads the years of experience, computes the score (60 must-haves, 15 nice-to-haves, 20 experience, 5 education), places the candidate in the job's ranking and blocks the same e-mail twice. Anyone above 75 with no must-have missing is shortlisted and the recruiter gets an alert; the decline stays held for a person to send.

**Estimated gain (honest).** An estimate, not a measurement: ~100 resumes per job x ~2 min for the first read = about 3 h per job handed back to the recruiter, with the same criteria for everyone. Fictional data. The score orders the queue; it does not replace the reading by whoever decides.

**Run it on your n8n (free, self-hosted, no cards).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Start n8n from this folder (so `./data/...` resolves) and set `N8N_RESTRICT_FILE_ACCESS_TO` to this folder's `data`. Seed files are in `data/`.
3. Open the `Config` node and set the URLs. The default `notify_url` points at a local stand-in; for the real thing use `https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage`. No credentials are stored in the JSON.
4. Activate the workflow and call the webhook(s):
```
curl -X POST http://localhost:5678/webhook/cv-screen -H 'Content-Type: application/json' -d @sample_input/<file>.json
```
Ready-made payloads are in `sample_input/`.

**Proof of execution.** `example_output/runs.json` holds the real per-node outputs of every run below (local n8n 2.47.3, 11/11/2026); `canvas_executed.png` is the n8n canvas after a run. The browser demo is tested against these recordings (`node _build/testar3.js`).

| Scenario | Steps | HTTP | Result |
|---|---|---|---|
| `strong_shortlist` | 1 | 200 | {"candidate_id": "CV-7376", "decision": "shortlist", "score": 95, "rank": "1 of 4", "matched": "3/3 must-haves |
| `strong_pt_shortlist` | 1 | 200 | {"candidate_id": "CV-8299", "decision": "shortlist", "score": 95, "rank": "1 of 4", "matched": "3/3 must-haves |
| `borderline_maybe` | 1 | 200 | {"candidate_id": "CV-2238", "decision": "maybe", "score": 63, "rank": "3 of 4", "matched": "2/3 must-haves", " |
| `weak_decline_held` | 1 | 200 | {"candidate_id": "CV-7383", "decision": "decline", "score": 25, "rank": "4 of 4", "matched": "0/3 must-haves", |
| `duplicate_blocked` | 1 | 409 | {"status": "duplicate", "candidate_id": "CV-4388", "reason": "already screened for this job", "earlier_score": |
| `telegram_down` | 1 | 200 | {"candidate_id": "CV-7376", "decision": "shortlist", "score": 95, "rank": "1 of 4", "matched": "3/3 must-haves |
| `cv_too_short` | 1 | 500 | CV text too short (25 characters, need 200). Scanned PDF? Send extracted text. [line 31] |
| `bad_email` | 1 | 500 | email is not valid: lucas.moreira@example [line 31] |
| `no_must_have` | 1 | 500 | must_have needs at least one skill [line 31] |

## Português

**Problema.** Uma vaga aberta pode receber 100 currículos e a primeira leitura é sempre a mesma: procurar as habilidades obrigatórias, ver quantos anos de experiência, descartar o que não serve. Cansa, é inconsistente entre pessoas e os bons candidatos esperam dias.

**O que o workflow faz.** Um workflow no n8n recebe o texto do currículo e os requisitos da vaga, procura cada habilidade obrigatória e desejável, lê os anos de experiência, calcula a nota (60 obrigatórias, 15 desejáveis, 20 experiência, 5 formação), coloca o candidato no ranking da vaga e barra o mesmo e-mail duas vezes. Quem passa de 75 sem faltar nenhuma obrigatória é pré-selecionado e o recrutador recebe um alerta; a recusa fica retida para uma pessoa enviar.

**Ganho estimado (honesto).** Estimativa, não medição: ~100 currículos por vaga x ~2 min para a primeira leitura = cerca de 3 h por vaga devolvidas ao recrutador, com o mesmo critério para todos. Dados fictícios. A nota organiza a fila; não substitui a leitura de quem decide.

**Rodar no seu n8n (grátis, self-hosted, sem cartão).**
1. n8n, Workflows, Import from file, `workflow.json`.
2. Inicie o n8n por esta pasta (para `./data/...` funcionar) e aponte `N8N_RESTRICT_FILE_ACCESS_TO` para a pasta `data` dela. Os arquivos de exemplo estão em `data/`.
3. No nó `Config`, ajuste as URLs. O `notify_url` padrão aponta para um servidor local de teste; para o real use `https://api.telegram.org/bot<SEU_TOKEN>/sendMessage`. Nenhuma credencial fica no JSON.
4. Ative o workflow e chame o(s) webhook(s) (comandos acima). Payloads prontos em `sample_input/`.

**Prova de execução.** `example_output/runs.json` tem as saídas reais de cada nó em todos os cenários da tabela (n8n 2.47.3 local, 11/11/2026), incluindo os casos de erro; `canvas_executed.png` mostra o canvas após uma execução. A demo no navegador é testada contra essas gravações.

All data is fictional / Todos os dados são fictícios.
