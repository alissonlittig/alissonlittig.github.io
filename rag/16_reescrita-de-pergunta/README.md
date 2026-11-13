# RAG 16 · Query rewriting, before and after / Reescrita de pergunta, antes e depois

> Study prototype, **not in production anywhere**. Fictional vet-clinic manual (29 passages), no LLM. / Protótipo de estudo, **não está em produção em lugar nenhum**. Manual fictício de clínica veterinária (29 trechos), sem LLM.

## EN
People do not ask "my dog has a bad belly" with the word "diarrhea" that the manual uses. Three modes over the same index (BM25 + 3-gram TF-IDF, RRF), compared by the rank of the right passage:

```
raw      question as typed                                   -> search
rewrite  drop filler ("hi", "I wanted to know") + dictionary rules add technical terms
         "barriga ruim" -> + "diarreia vomito"               -> search
hyde*    rewrite -> top-1 result = "hypothetical document" -> add its 4 most characteristic terms -> search again
         (*without an LLM: real HyDE has an LLM WRITE a hypothetical answer; here the document comes from the corpus itself)
```
The dictionary (32 rules) was written from the 17 DEV questions plus general vet vocabulary; the 20 TEST questions were written afterwards and **the dictionary was not tuned on them** (one pattern bug, an accented pattern that can never match normalized text, was fixed after seeing TEST ranks; it did not change any number, and a test now forbids non-ASCII rules).

| set | search | hit@1 | hit@3 | MRR | better / worse |
|---|---|--:|--:|--:|--:|
| DEV (17) *used for the dictionary* | as typed | 0.412 | 0.706 | 0.584 | |
| | rewrite | 1.000 | 1.000 | 1.000 | +10 / −0 |
| | hyde* | 1.000 | 1.000 | 1.000 | +0 / −0 |
| **TEST (20)** | as typed | 0.400 | 0.650 | 0.563 | |
| | rewrite | 0.600 | 0.700 | 0.676 | +5 / −0 |
| | hyde* | 0.600 | 0.750 | 0.679 | +2 / −3 |

**Honest reading:** the DEV 100% is circular and does not count. On TEST, rewriting lifts first-place hits from 40% to 60% and hurts none, but half the questions stay wrong: when the slang is not in the dictionary ("foaming and thrashing" → convulsion, "change the food" → ration) nothing changes. The HyDE-like step improves 2 questions and worsens 3, with no gain in first place: when the first result is wrong, the extra terms pull the query further away. A real LLM-written hypothetical answer was not tested. 20 questions: one question moves 5 points; the author wrote manual, questions and dictionary.

Run: `python rag.py "meu cachorro tá com a barriga ruim"` · `python rag.py --eval` · `python tests/test_rag_16.py` (6 groups, includes Python × JS parity; Node optional) · `python build_index.py` · demo: open `demo/index.html` (two columns, mode toggle, live metrics table).

## PT
Ninguém pergunta "meu cachorro tá com a barriga ruim" com a palavra "diarreia" do manual. Três modos sobre o mesmo índice, comparados pela posição do trecho certo (diagrama acima): **como digitada**, **reescrita** (tira enchimento e um dicionário de regras acrescenta termos técnicos) e **HyDE sem LLM** (o 1º resultado da reescrita vira "documento hipotético" e seus 4 termos mais característicos entram na consulta; o HyDE de verdade pede a um LLM que escreva a resposta hipotética, aqui o documento vem do próprio corpus).

O dicionário (32 regras) foi escrito a partir das 17 perguntas DEV mais vocabulário geral; as 20 do TESTE vieram depois e **o dicionário não foi ajustado nelas** (um bug de padrão com acento, que nunca casa com texto normalizado, foi corrigido depois de ver o TESTE; não mudou nenhum número e um teste agora proíbe regra não ASCII). Tabela acima.
**Leitura honesta:** o 100% do DEV é circular e não vale. No TESTE, a reescrita sobe o 1º lugar de 40% para 60% e não piora nenhuma, mas metade segue errada: quando a gíria não está no dicionário ("espumando e se debatendo", "mudar a comida") nada muda. O passo tipo-HyDE melhora 2 perguntas e piora 3, sem ganho no 1º lugar: com o 1º resultado errado, os termos extras afastam mais a consulta. Resposta hipotética escrita por LLM de verdade não foi testada. Com 20 perguntas, uma mexe 5 pontos; o mesmo autor escreveu manual, perguntas e dicionário.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
