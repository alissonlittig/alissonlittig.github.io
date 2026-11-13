# RAG 06 · Multilingual PT/EN/ES / RAG multilíngue PT/EN/ES

> Study prototype, **not in production anywhere**. Fictional coworking ("Espaço Maré"), 12 short passages written by me (CC0). / Protótipo de estudo, **não está em produção em lugar nenhum**.

## EN
Ask in one language, get a sentence from a document written in another. Each passage is in PT, EN or ES; **every test question is in a different language than its right document**.

```
question -> detect language -> drop stop words (3 languages) -> word -> CONCEPT (hand-written lexicon, ~70 concepts)
         -> BM25 over concepts  (baselines: raw-word BM25, char 3-gram TF-IDF, hybrid RRF)
         -> coverage check (< 0.30 = refuse) -> verbatim sentence in the document's own language + citation
```
| method (24 main questions) | R@1 | R@3 | MRR |
|---|--:|--:|--:|
| concepts (lexicon) | 1.000 | 1.000 | 1.000 |
| raw words, no lexicon | 0.292 | 0.292 | 0.292 |
| char n-grams | 0.500 | 0.667 | 0.605 |
| hybrid (concepts + n-grams) | 0.792 | 1.000 | 0.889 |

**Honest reading:** no neural embeddings and no machine translation; cross-language matching is only as good as the lexicon, which I wrote while looking at those 24 questions, so 1.000 is optimistic. On 9 extra questions written afterwards (lexicon untouched): top-1 correct in 8/9, but the coverage guardrail refused 4 of them (words missing from the lexicon, e.g. "second", "return"). Out-of-scope questions answered: 0 of 5. Language detection (stop words + lexicon): 35 of 38 questions (it fails on short questions with few known words).
Run: `python rag.py "How much is the monthly plan?"` · `python tests/test_rag_06.py` (7 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html`.

## PT
Pergunte em um idioma e receba uma frase de um documento escrito em outro. Cada trecho está em PT, EN ou ES; **toda pergunta de teste está em idioma diferente do documento certo**. Um léxico bilíngue escrito à mão (~70 conceitos) leva "monthly", "mensal" e "mensual" ao mesmo conceito; BM25 roda sobre conceitos. Sem embeddings neurais e sem tradução automática. A tabela acima compara com baselines. **Leitura honesta:** o léxico foi escrito olhando as 24 perguntas, então 1,000 é otimista; nas 9 perguntas extras (escritas depois) o 1º lugar acerta em 8/9, mas o guardrail recusa 4 por palavras fora do léxico. A resposta é sempre uma frase literal do documento, no idioma dele.
