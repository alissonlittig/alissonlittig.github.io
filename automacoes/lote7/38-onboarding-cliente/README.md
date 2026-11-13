# 38 · Client onboarding / Onboarding de cliente

![demo](prints/demo_1366.png)

## EN
**Problem.** Every new client repeats the same ritual: folder, contract copy-paste, welcome e-mail.
**What it does.** `onboard.py` validates the form (e-mail, plan, amount, start date; lists all errors at once), creates `clientes/<slug>/` with subfolders, fills the contract, writes a DRAFT welcome e-mail and a checklist. Never sends. Refuses to overwrite an existing client.
**Honest gain.** Estimate: ~25 min per client by hand; 6 clients/month ≈ 2.5 h. Contract review stays human; the template is a demo, not legal advice.
**Not done.** E-mail sending, digital signature.
```
python onboard.py data/form.json output 2026-11-13
python tests/test_onboard.py     # 11 checks
```
Demo: `../_demo/demos/38-onboarding-cliente/`. Fictional company/data. Not published.

## PT
**Problema.** Todo cliente novo repete: pasta, contrato copiado, e-mail de boas-vindas.
**O que faz.** `onboard.py` valida o formulário (todos os erros de uma vez), cria `clientes/<slug>/`, preenche o contrato, escreve RASCUNHO de e-mail e checklist. Nunca envia. Não sobrescreve cliente existente.
**Ganho (honesto).** Estimativa: ~25 min por cliente; 6/mês ≈ 2,5 h. Revisão do contrato é humana; o modelo é de demonstração.
**Não feito.** Envio de e-mail, assinatura digital.
**Como rodar.** Comandos acima. Dados fictícios. Não publicado.
