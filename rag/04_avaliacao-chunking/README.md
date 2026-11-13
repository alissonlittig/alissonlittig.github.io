# RAG 04 · Chunking strategy evaluation / Avaliação de estratégias de chunking

> Study prototype, **not in production anywhere**. Fictional documents. / Protótipo de estudo, **não está em produção em lugar nenhum**. Documentos fictícios.

## EN
Same 5 fictional documents (960 words), same 22 questions, same retriever (BM25, top-3); only the chunking changes. A hit = the retrieved chunk contains the whole **gold sentence**.

```
documents -> chunker (11 strategies) -> BM25 index -> top-3 -> hit@1, hit@3, MRR
                                     |-> ceiling: does the gold sentence survive whole in ANY chunk?
                                     |-> cost: words of context delivered in the top-3
```
| strategy | chunks | words/chunk | hit@1 | hit@3 | MRR | ceiling | context |
|---|--:|--:|--:|--:|--:|--:|--:|
| 30 words, 0% overlap | 35 | 27.4 | 0.591 | 0.682 | 0.629 | 0.727 | 78.6 |
| 30 words, 25% | 44 | 28.9 | 0.682 | 0.818 | 0.742 | 0.909 | 81.7 |
| 60 words, 0% | 20 | 48.0 | 0.727 | 0.773 | 0.742 | 0.864 | 153.6 |
| 60 words, 25% | 22 | 55.2 | 0.909 | 0.955 | 0.932 | 1.000 | 156.6 |
| 120 words, 0% | 10 | 96.0 | 0.773 | 0.864 | 0.811 | 0.909 | 254.5 |
| 120 words, 25% | 10 | 111.0 | 0.864 | 1.000 | 0.917 | 1.000 | 293.2 |
| 240 words, 0% / 25% | 5 | 192.0 | 0.955 | 1.000 | 0.970 | 1.000 | 435.3 |
| 2 sentences | 30 | 32.0 | 0.909 | 0.909 | 0.909 | 1.000 | 82.0 |
| 4 sentences | 15 | 64.0 | 0.864 | 0.909 | 0.879 | 1.000 | 168.2 |
| paragraph | 25 | 38.4 | 0.864 | 0.955 | 0.902 | 1.000 | 104.6 |

**Honest reading:** small fixed windows with no overlap cut answers in half (ceiling 0.73); overlap fixes most of that. 240-word windows win on MRR only because they are almost whole documents in a 960-word corpus: they cost 5x the context of 2-sentence chunks, which reach MRR 0.909 with 82 words. Sentence-aware cuts are the best cost/quality trade here, but with 22 author-written questions (one = 4.5 points), fictional data and a tiny corpus, the **method** transfers, the numbers do not. No LLM, no embeddings.

Run: `python rag.py --eval` · `python tests/test_rag_04.py` (6 groups) · `python build_index.py` (writes `results/`) · demo: open `demo/index.html`.

## PT
Mesmos 5 documentos fictícios, mesmas 22 perguntas, mesmo retriever (BM25, top-3); só o chunking muda (tabela acima). Acerto = o trecho recuperado contém a **frase-ouro** inteira; "teto" = a frase-ouro sobrevive inteira em algum trecho; "contexto" = palavras entregues no top-3.
**Leitura honesta:** janelas pequenas sem sobreposição cortam respostas ao meio (teto 0,73); a sobreposição resolve boa parte. Janelas de 240 palavras ganham em MRR só porque, num corpus de 960 palavras, são quase documentos inteiros: custam 5x o contexto de trechos de 2 frases, que chegam a MRR 0,909 com 82 palavras. Cortes por frase são o melhor custo/qualidade aqui, mas com 22 perguntas do próprio autor num corpus minúsculo, o **método** serve e os números não generalizam.
