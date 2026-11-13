# RAG 03 · E-commerce FAQ with an "I do not know" guardrail / FAQ de e-commerce com guardrail "não sei"

> Study prototype, **not in production anywhere**. Fictional store ("Loja Brisa"). / Protótipo de estudo, **não está em produção em lugar nenhum**. Loja fictícia.

## EN
A support bot over 28 fictional FAQ entries. It answers **only with the stored FAQ text** (never generated) and only when evidence is strong.

```
question -> normalize + glossary -> BM25 + 3-gram TF-IDF (RRF) -> candidate FAQ
   confidence = 0.5 * min(1, cos/0.6) + 0.5 * term_coverage
   conf >= T        -> answer
   conf >= T-0.15   -> "did you mean...?" (2 FAQs, no answer)
   otherwise        -> "I do not know" + handoff to a human
```
The threshold was chosen on the DEV half of 42 questions (28 answerable, 14 out of scope; split by even/odd index) and measured on the TEST half. At **T = 0.50**:

| half | right | wrong | suggested | idk | out-of-scope answered | coverage | precision |
|---|--:|--:|--:|--:|--:|--:|--:|
| DEV (21) | 10 | 1 | 3 | 0 | 1 / 7 | 0.714 | 0.833 |
| TEST (21) | 10 | 1 | 2 | 1 | 0 / 7 | 0.714 | 0.909 |

Without the synonym glossary, TEST coverage drops to 0.429 (full sweep in `results/metrics.json` and in the demo).
**Honest reading:** the guardrail does fail: "vocês vendem iphone?" matches the "we sell to companies" entry and gets answered. The glossary was drafted knowing the questions and all questions come from the same author, so the numbers are optimistic; with 21 questions per half, one question moves ~5 points. No LLM, no neural embeddings.

Run: `python rag.py "quanto tempo demora a entrega?" [--t 0.5]` · `python rag.py --eval` · `python tests/test_rag_03.py` (6 groups) · `python build_index.py` · demo: open `demo/index.html` (threshold slider).

## PT
Bot de suporte sobre 28 FAQs fictícias. Responde **só com o texto cadastrado** (nunca gerado) e só com evidência forte; com evidência média sugere perguntas parecidas; com fraca diz "não sei" e encaminha para um atendente. Limiar escolhido na metade DEV das 42 perguntas e medido na metade TESTE (tabela acima, T = 0,50). Sem o glossário de sinônimos, a cobertura no TESTE cai para 0,429.
**Leitura honesta:** o guardrail erra: "vocês vendem iphone?" casa com "vendem para empresas" e é respondida. O glossário foi feito conhecendo as perguntas e todas são do mesmo autor, então os números são otimistas; com 21 perguntas por metade, uma pergunta mexe ~5 pontos. Sem LLM e sem embeddings neurais.
