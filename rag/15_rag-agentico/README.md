# RAG 15 · Agentic RAG: search, calculate or ask back / RAG agêntico: buscar, calcular ou perguntar

> Study prototype, **not in production anywhere**. Fictional solar-energy co-op guide. **No LLM**: the "agent" is a rule-based planner. / Protótipo de estudo, **não está em produção em lugar nenhum**. Guia fictício de cooperativa de energia solar. **Sem LLM**: o "agente" é um planejador por regras.

## EN
For each question the agent picks one of four moves and shows every step in the demo: **search** the guide (BM25 + 3-gram TF-IDF, RRF), **calculate** with numbers it just extracted from the retrieved passages (rate, fee, range), **ask back** when a needed field is missing, or **refuse** when there is no evidence.

```
question -> understand: intent (lookup | cost | savings | compare | which plan) + fields (kWh, plan)
  lookup                          -> search -> confidence >= 0.5 ? answer + cited passage : refuse
  needs kWh and it is missing     -> ask back "what is your monthly consumption?"  (state remembers it; next message resumes)
  cost / savings / compare        -> search plan(s) [+ reference tariff] -> calculate -> answer with the formula
  no plan named, kWh known        -> search the plan ranges -> pick the range that contains kWh -> continue
  unknown proper-name plan        -> refuse (does not guess "Casa")
```
The calculator is its own parser for `+ - * /` and parentheses (no `eval`); tests reject `__import__(...)`, `2**3`, `1+`. Rates and ranges are extracted by regex from the passages when the index is built, and the steps cite the passage line.

29 hand-written questions (11 lookups, 9 calculations or plan picks, 4 ask-backs, 5 refusals), split by even/odd index; threshold 0.5 fixed beforehand. The expected route is the sequence of tools:

| half | n | right kind | right route | right answer |
|---|--:|--:|--:|--:|
| DEV | 15 | 15 | 15 | 15 |
| TEST | 14 | 14 | 14 | 14 |

Baseline, plain RAG (always search, return the best passage): finds 11 of 11 lookup answers, **0 of 7 calculations**, and cannot ask or refuse.
**Honest reading:** 100% looks great and is not general: the rules, regexes and glossary were written by the same author as the questions, and four DEV questions were fixed while debugging (adding two glossary words, gating the cost intent on billing context, a capitalised-name rule for unknown plans); the TEST half was not touched. "Do you serve São Paulo?" is **refused** even though the right passage is found (confidence 0.45): the guide only says "Paraná and Santa Catarina", and a "no" cannot be derived. Phrasings outside the templates ("what if I use 20% more?") are not understood. The "thinking" lines are template text, not an LLM's reasoning.

Run: `python rag.py "quanto vou pagar com 350 kWh no plano Casa?"` · `python rag.py --eval` · `python tests/test_rag_15.py` (8 groups, includes Python × JS parity of every step; Node optional) · `python build_index.py` · demo: open `demo/index.html`.

## PT
A cada pergunta o agente escolhe um de quatro caminhos e mostra cada passo na demo: **buscar** no guia (BM25 + n-gramas, RRF), **calcular** com números que acabou de extrair dos trechos (tarifa, taxa, faixa), **perguntar de volta** quando falta um dado, ou **recusar** quando não há evidência. Fluxo no diagrama acima. A pergunta pendente fica no estado e a próxima mensagem retoma a conta ("uns 400 kwh").

A calculadora é um analisador próprio de `+ - * /` e parênteses (sem `eval`); os testes rejeitam `__import__(...)`, `2**3`, `1+`. Tarifas e faixas são extraídas por regex dos trechos ao montar o índice.

29 perguntas escritas à mão (11 consultas, 9 contas ou escolha de plano, 4 de volta, 5 recusas), metades par/ímpar, limiar 0,5 fixado antes (tabela acima: DEV 15/15 e TESTE 14/14). Linha de base, RAG simples (sempre busca): acha 11 de 11 consultas, **0 de 7 contas**, e não pergunta nem recusa.
**Leitura honesta:** 100% não é geral: regras, regex e glossário foram escritos pelo mesmo autor das perguntas, e quatro perguntas do DEV foram corrigidas durante a depuração (duas palavras no glossário, intenção de custo exigindo contexto de fatura, regra de nome próprio para plano inexistente); o TESTE não foi tocado. "Vocês atendem em São Paulo?" é **recusada** mesmo achando o trecho certo (confiança 0,45): o guia só diz "Paraná e Santa Catarina" e um "não" não se deduz. Frases fora dos moldes ("e se eu usar 20% a mais?") não são entendidas. As linhas de "raciocínio" são texto de modelo, não pensamento de um LLM.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
