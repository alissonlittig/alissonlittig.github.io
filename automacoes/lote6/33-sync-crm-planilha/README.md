# 33 · CRM <-> spreadsheet sync without duplicates / Sincronizar CRM e planilha sem duplicar

![demo](prints/demo_1366.png)

## EN
**Business problem.** A team edits the same people in a CRM and in a spreadsheet; duplicates and diverging phones/companies pile up.

**What it does.** `sync.py` normalises e-mail/phone/name, matches by e-mail else phone, merges same-side duplicates, newest `updated` wins per field, creates missing people on the other side, rejects bad rows with file+line, reports conflicts (same date, different value; existing value kept). Idempotent: a second run changes nothing.

**Honest gain.** ~2 min per diverging row by hand; 150 rows/month = ~5 h. Estimate, not measurement.

**Stack / not done.** Python 3.13, csv, re. No real CRM connector was written.

**Run.**
```
python sync.py data/crm.csv data/planilha.csv output
python tests/test_sync.py      # 11 checks
```
Demo: `../_demo/demos/33-sync-crm-planilha/` (check with `node ../_demo/tools/testar.js 33-sync-crm-planilha`). Fictional data. Not published.

## PT
**Problema.** Equipe edita as mesmas pessoas num CRM e numa planilha; surgem duplicatas e telefones/empresas divergentes.

**O que faz.** `sync.py` padroniza e-mail/telefone/nome, casa por e-mail (senão telefone), junta duplicatas do mesmo lado, o `updated` mais novo vence por campo, cria quem falta do outro lado, recusa linha ruim com arquivo+linha e reporta conflitos (mesma data, valor diferente; fica o valor existente). Idempotente.

**Ganho (honesto).** ~2 min por linha divergente à mão; 150 linhas/mês = ~5 h. Estimativa, não medição.

**Stack / não feito.** Python 3.13, csv, re. O conector para um CRM real não foi escrito.

**Como rodar.** Comandos acima. Demo em `../_demo/demos/33-sync-crm-planilha/`. Dados fictícios. Não publicado.
