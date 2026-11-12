# 22 · Python CRM: lead qualification and tasks / CRM em Python: qualificação de leads

![demo](prints/demo_1366.png)

## EN

**Business problem.** Leads arrive by form, e-mail and ads. Someone copies them into a sheet, guesses which are hot and forgets to tell sales. A repeated lead becomes two conversations; a good lead waits days.

**What it does.** `crm.py` is a webhook service (`POST /leads`, standard library only):
1. Validates the payload (name, e-mail, source, numeric fields). Invalid → **422** with every reason; malformed JSON → 400. Nothing is stored.
2. De-duplicates by e-mail (SQLite `UNIQUE`): a repeat is merged, keeps the best score, opens no second task.
3. Scores with readable reasons (company size, senior role, budget, source, free e-mail, buying words) → hot / warm / cold.
4. Warm/hot: creates a task with a due date and a round-robin owner. Cold: nurture list, no task.
5. Hot: posts to the team chat webhook. If the chat is unreachable the alert is saved in an `outbox` table and the answer is **202**, not 200.

**Honest gain estimate.** ~4 min of manual triage per lead; at 60 leads a month ≈ 4 h. Estimate, not measurement. The score rules are examples and must be calibrated with real sales data.

**Stack.** Python 3.13, `http.server`, `sqlite3`, `urllib`. No framework, no account. Note: the original plan named Activepieces self-hosted; it is not on npm and needs Docker (not installed here), so it was not run and this was built in plain Python instead.

**Run.**
```
python crm.py crm.db http://127.0.0.1:9100/notify   # server on :8770
python run_scenarios.py                              # real server + local chat, 7 scenarios -> output/scenarios.json
python tests/test_crm.py                             # 8 checks
```
Real runs: `output/scenarios.json` (hot, warm, cold, duplicate, invalid, bad JSON, chat down). **Demo:** `../../demos/22-crm-leads-python/`.

## PT

**Problema de negócio.** Leads chegam por formulário, e-mail e anúncio. Alguém copia para uma planilha, adivinha quem é quente e esquece de avisar o vendedor. Lead repetido vira duas conversas; lead bom espera dias.

**O que faz.** `crm.py` é um serviço webhook (`POST /leads`, só biblioteca padrão):
1. Valida o payload. Inválido → **422** com todos os motivos; JSON quebrado → 400. Nada é gravado.
2. Deduplica por e-mail (SQLite `UNIQUE`): repetido é mesclado, mantém a maior nota, sem segunda tarefa.
3. Pontua com motivos legíveis → quente / morno / frio.
4. Morno/quente: cria tarefa com prazo e dono em rodízio. Frio: lista de nutrição, sem tarefa.
5. Quente: avisa o chat da equipe. Se o chat estiver fora, o aviso fica na tabela `outbox` e a resposta é **202**, não 200.

**Ganho estimado (honesto).** ~4 min de triagem manual por lead; com 60 leads por mês ≈ 4 h. Estimativa, não medição. As regras de nota são exemplos e precisam ser calibradas.

**Stack.** Python 3.13, `http.server`, `sqlite3`, `urllib`. O plano citava Activepieces self-host; ele não está no npm e exige Docker (não instalado aqui), então não foi executado e a automação foi feita em Python puro.

**Como rodar.** Comandos acima. Saídas reais em `output/`. Demo em `../../demos/22-crm-leads-python/`.
