# RAG 05 · Ask a spreadsheet / Perguntas sobre uma planilha (CSV)

> Study prototype, **not in production anywhere**. Fictional data (script-generated, fixed seed, own work, CC0). / Protótipo de estudo, **não está em produção em lugar nenhum**. Dados fictícios.

## EN
Natural-language questions over `data/vendas.csv` (96 fictional orders of a stationery shop). The answer is a **number or table computed over the real rows**, plus the source rows as `file:line` ranked by BM25.

```
question -> normalize -> find columns/values (city, month, seller...) -> intent (sum/avg/count/max/min/ranking/"by column")
         -> filter rows -> compute -> table + source rows (vendas.csv:LINE)
         unknown word (e.g. "margem", "frete") -> refuse
```
**Real:** the calculation, the filters, the BM25 ordering of source rows, the refusal rule, the browser demo (same logic as Python, checked by a parity test).
**Simulated / limits:** "understanding" is Portuguese rules, not a language model. On 26 development questions: 26/26 (optimistic, written together with the rules). On 11 extra rephrased questions not used for tuning: **8/11** (misses: "loja de Londrina arrecadou", "ticket médio do Diego", "melhor vendedor"). One table only, no joins. No LLM, no embeddings, no key.

Run: `python rag.py "qual cidade vendeu mais?"` · `python tests/test_rag_05.py` (7 groups; Node optional, only for the JS parity) · `python make_data.py` · `python build_index.py` · demo: open `demo/index.html`.

## PT
Perguntas em português sobre `data/vendas.csv` (96 pedidos fictícios de uma papelaria). A resposta é um **número ou tabela calculado sobre as linhas reais**, com as linhas de origem (`arquivo:linha`) ordenadas por BM25. Palavra que não existe na planilha (ex.: "margem", "frete") = recusa.
**Real:** conta, filtros, ordenação BM25, regra de recusa e a demo no navegador (mesma lógica do Python, teste de paridade). **Simulado / limites:** a "compreensão" é um conjunto de regras, não um modelo de linguagem. 26/26 nas perguntas de desenvolvimento (otimista) e **8/11** nas 11 reformuladas depois, sem ajuste. Uma tabela só, sem junção.
