# 37 · Bank reconciliation (statement x ERP) / Conciliação bancária

![demo](prints/demo_1366.png)

## EN
**Problem.** Month-end: someone compares the bank statement with ERP entries line by line.
**What it does.** `reconcile.py` reads two CSVs, matches by exact amount within ±3 days, then by close amount (±2%) + similar description, each ERP entry used once. Writes `divergencias.csv` (amount_diff, bank_only, erp_only) and `relatorio.md`. Read-only: posts nothing.
**Honest gain.** Estimate: ~2 h/month for ~200 lines by hand vs ~15 min reviewing divergences. Matching can err on repeated amounts from different clients.
**Not done.** OFX import, posting to the ERP.
```
python reconcile.py data/bank.csv data/erp.csv output
python tests/test_reconcile.py     # 12 checks
```
Demo: `../_demo/demos/37-conciliacao-bancaria/` (`node ../_demo/tools/testar.js 37-conciliacao-bancaria`). Fictional data. Not published.

## PT
**Problema.** No fechamento, alguém compara extrato e ERP linha a linha.
**O que faz.** `reconcile.py` lê dois CSVs, casa por valor exato (±3 dias) e depois por valor próximo (±2%) com descrição parecida; cada lançamento usado uma vez. Gera `divergencias.csv` e `relatorio.md`. Só lê.
**Ganho (honesto).** Estimativa: ~2 h/mês para ~200 linhas vs ~15 min revisando divergências. Pode errar com valores repetidos de clientes diferentes.
**Não feito.** Importar OFX, lançar no ERP.
**Como rodar.** Comandos acima. Dados fictícios. Não publicado.
