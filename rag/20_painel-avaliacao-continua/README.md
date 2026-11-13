# RAG 20 · Continuous evaluation dashboard / Painel de avaliação contínua

> Study prototype, **not in production anywhere**. Invented help base (20 docs, CC0), 44 test questions + 6 out of scope. The 7 "versions" are variants **I wrote** to tell the story; dates are invented. / Protótipo de estudo, **não está em produção em lugar nenhum**. As 7 "versões" são variantes que eu escrevi; datas inventadas.

## EN
Every retriever version is really run on the same questions; the history (rank of the right document, refusal, per question and version) is kept in `results/history.json`. Each version is compared with the previous one: score, questions that **passed and now fail**, status OK / WARNING / REGRESSION.

```
questions (44 + 6 out of scope) x versions v1..v7 (BM25 -> tokenizer -> n-grams+RRF -> glossary -> coverage refusal -> [accent bug] -> fix+reranker)
   -> results/history.json -> analyze(): score delta, flips down/up, status -> dashboard (chart, table, map) | `python rag.py --gate [vN]` exit 1 on regression
```
**Measured:** score 64.0 → 74.2 (v1→v4); v5 (refusal) +11.5 but **6 questions broke** (WARNING: the average hides it); v6 (accent refactor) −1.7 = **REGRESSION** (a question typed without accents stops passing); v7 fixes it. Score = plain mean of hit@1, hit@3, MRR and out-of-scope refusal (my choice, not a standard).
**Real:** the 7 versions run in Python; analysis, gate (exit code) and dashboard (same analysis code in JS, parity test). **Simulated / limits:** versions and dates are staged, the v6 bug is planted; glossary and refusal threshold 0.3 were chosen looking at these questions (optimistic); the browser shows the history, it does not run the versions; retrieval and refusal only, no answer grading.

Run: `python rag.py` · `python rag.py --gate v6` (exit 1) · `python tests/test_rag_20.py` (11 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html`.

## PT
Cada versão do recuperador roda de verdade nas mesmas perguntas; o histórico fica em `results/history.json` e cada versão é comparada com a anterior (nota, perguntas que passavam e falham, status OK/ALERTA/REGRESSÃO). **Medido:** nota 64,0 → 74,2 (v1→v4); v5 (recusa) +11,5 mas **6 perguntas quebraram** (ALERTA: a média esconde); v6 (acentos) −1,7 = **REGRESSÃO**; v7 corrige. `python rag.py --gate v6` sai com código 1. **Limites:** versões e datas encenadas, bug da v6 plantado, glossário e limiar escolhidos olhando estas perguntas (otimista), o navegador só mostra o histórico, sem avaliação de resposta.
