# RAG 02 · Hybrid search, reranking and retrieval metrics / Busca híbrida, reranking e métricas

> Study prototype, **not in production anywhere**. Fictional data. / Protótipo de estudo, **não está em produção em lugar nenhum**. Dados fictícios.

## EN
Compares 5 retrieval strategies over a fictional IT/HR wiki (37 passages, PT-BR) with 34 questions whose right passage is known, using **recall@k** and **MRR**.

```
             +-- BM25 (words) ------------------+
question ----+-- sparse vector (3-gram TF-IDF) --+-- RRF fusion (k=60) -- top-10 -- heuristic reranker
             +-- dense LSA (SVD, 24 dims) -------+
```
| strategy | recall@1 | recall@3 | recall@5 | MRR |
|---|--:|--:|--:|--:|
| BM25 | 0.794 | 0.912 | 0.941 | 0.860 |
| sparse vector | 0.853 | 0.941 | 0.941 | 0.892 |
| dense LSA | 0.824 | 0.941 | 0.941 | 0.882 |
| hybrid (RRF) | 0.853 | 0.971 | 0.971 | 0.907 |
| hybrid + rerank | 0.853 | 0.971 | 0.971 | 0.907 |

**Honest reading:** the hybrid is best on recall@3/5 and MRR here, but the corpus is tiny and the questions were written by the author for it; one question is 2.9 points. The reranker (coverage + bigrams + title: a heuristic, **not** a cross-encoder) changes nothing on this set. The dense part is LSA, a local statistical method, **not** neural embeddings. No answer generation, retrieval only.
**Real:** all five rankings, scores and metrics; a test checks the browser demo gives identical rankings, scores and metrics. **Simulated:** data and questions; the "dense" retriever is not neural.

Run: `python rag.py "como pedir férias?"` · `python rag.py --eval` · `python tests/test_rag_02.py` · `python build_index.py` · demo: open `demo/index.html`. Python 3.10+ and numpy (LSA, build time only).

## PT
Compara 5 estratégias de recuperação sobre uma wiki fictícia de TI/RH (37 trechos) com 34 perguntas de resposta conhecida, por **recall@k** e **MRR** (tabela acima).

**Leitura honesta:** o híbrido é o melhor em recall@3/5 e MRR, mas o corpus é minúsculo e as perguntas foram escritas pelo autor para ele; uma pergunta vale 2,9 pontos. O reranker (cobertura + bigramas + título; heurística, **não** cross-encoder) não muda nada neste conjunto. O "denso" é LSA (estatístico, local), **não** embeddings neurais. Sem geração de resposta, só recuperação.
**Real:** os cinco rankings, scores e métricas; o teste confere que a demo no navegador dá o mesmo. **Simulado:** dados e perguntas; o denso não é neural.
