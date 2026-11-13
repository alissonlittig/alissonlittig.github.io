# RAG 08 · Conversation memory / Memória de conversa

> Study prototype, **not in production anywhere**. Fictional help center of a finance app ("Caderneta"), 16 passages and 8 short dialogues written by me (CC0). / Protótipo de estudo, **não está em produção em lugar nenhum**.

## EN
Follow-ups like "What about the family one?" or "And on iOS?" only make sense with the previous turns. The system rewrites each follow-up into a self-contained query.

```
turn -> entities (plan: free/premium/family; platform: android/ios/web)
     -> new value REPLACES the same type from memory
     -> ellipsis (only entities/pronouns): inherit the TOPIC of the latest turn that used that entity type
        ("And on iOS?" goes back to the Android export turn, not to the price turn)
     -> content of its own: only the entities are carried, as "soft" context (searched, not counted in coverage)
     -> BM25 + 3-gram TF-IDF (RRF) -> coverage check (< 0.5 = refuse) -> passage text + citation
```
Memory window N = number of previous turns considered (N = 0 is plain RAG without memory). Measured on 8 dialogues (8 first questions, 14 follow-ups):

| N | first questions right | follow-ups right |
|--:|--:|--:|
| 0 | 8/8 | 10/14 |
| 1-4 | 8/8 | 13/14 |

**Honest reading:** the corpus is tiny, so memoryless search is right by luck on 10 of 14 follow-ups; memory fixes 3 more ("And on the Web?" after Android, "And for Premium?", "And on premium?"). The miss: "Posso cancelar quando quiser?" ("quiser" appears in no passage and lowers coverage). The word "quem" was added to the ignore list after seeing a failure, so the number is slightly optimistic. Memory is rules over 2 entity types, not a language model; no pronoun resolution beyond ignoring pronouns.
Run: `python rag.py "Quanto custa o plano premium?" "E o família?" [--janela 3]` · `python tests/test_rag_08.py` (8 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html` (chat + window slider).

## PT
Perguntas como "E o família?" ou "E no iOS?" só fazem sentido com os turnos anteriores. O sistema reescreve cada acompanhamento como consulta completa: valor novo de entidade (plano, plataforma) substitui o do mesmo tipo; elipse herda o tópico do último turno que falou daquele tipo; pergunta com conteúdo próprio herda só as entidades, como contexto "mole". Janela N = 0 é o RAG sem memória. **Medido:** 8 diálogos, 14 acompanhamentos: 10/14 sem memória (o corpus é pequeno; parte acerta por sorte) e 13/14 com N ≥ 1. A falha: "Posso cancelar quando quiser?". A palavra "quem" foi adicionada à lista de ignoradas depois de ver uma falha (otimista). Memória por regras, não modelo de linguagem.
