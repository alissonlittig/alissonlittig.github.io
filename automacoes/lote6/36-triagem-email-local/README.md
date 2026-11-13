# 36 · E-mail triage with a local model / Triagem de e-mails com modelo local

![demo](prints/demo_1366.png)

## EN
**Business problem.** The inbox mixes billing, support, quotes and junk; the urgent one gets lost.

**What it does.** `triage.py`: fixed rules first (auto-reply, blocked domain, invoice number), then a Naive Bayes model trained locally on 40 invented messages (no API, no cost). Confidence < 0.6 -> `review` (a person decides). Urgent words / VIP sender -> high priority. Routes to a folder/owner and writes DRAFT replies to files; never sends.

**Honest gain.** ~1 min per e-mail by hand; 40/day = ~13 h/month. Estimate. Accuracy 16/16 is on 16 easy synthetic held-out messages; real mail will score lower, so the `review` queue matters.

**Stack / not done.** Python 3.13, re, math, csv. English only. Reading a real mailbox (IMAP) not written.

**Run.**
```
python triage.py data/inbox.csv output
python tests/test_triage.py    # 11 checks incl. held-out accuracy
```
Demo: `../_demo/demos/36-triagem-email-local/` (check with `node ../_demo/tools/testar.js 36-triagem-email-local`). Fictional data. Not published.

## PT
**Problema.** A caixa de entrada mistura cobrança, suporte, orçamento e lixo; o urgente se perde.

**O que faz.** `triage.py`: regras fixas primeiro (resposta automática, domínio bloqueado, número de nota), depois Naive Bayes treinado localmente em 40 mensagens inventadas (sem API, sem custo). Confiança < 0,6 -> `review` (humano decide). Urgência/VIP -> prioridade alta. Roteia e salva RASCUNHOS em arquivo; nunca envia.

**Ganho (honesto).** ~1 min por e-mail à mão; 40/dia = ~13 h/mês. Estimativa. A precisão 16/16 é em 16 mensagens sintéticas fáceis; com e-mail real será menor, por isso a fila `review` importa.

**Stack / não feito.** Python 3.13, re, math, csv. Só inglês. Leitura de caixa real (IMAP) não escrita.

**Como rodar.** Comandos acima. Demo em `../_demo/demos/36-triagem-email-local/`. Dados fictícios. Não publicado.
