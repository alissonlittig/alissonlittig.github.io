# RAG 07 · Contracts with clause highlights / Contratos com destaque de cláusulas

> **Not legal advice. / Não é aconselhamento jurídico.** Study prototype, **not in production anywhere**. Two invented contracts (services and residential rental), 39 numbered items, written by me (CC0). / Protótipo de estudo, **não está em produção em lugar nenhum**.

## EN
Ask a question, get the **verbatim contract item** with its source (`file, clause, item, line`), amounts/deadlines/percentages highlighted and "points of attention" from simple rules.

```
contract.md -> split by clause + numbered item (keeps file:line) -> clause type (from the title)
question -> BM25 + 3-gram TF-IDF (RRF) [optional type filter] -> coverage check (< 0.5 = refuse)
         -> verbatim item + highlights + attention flags (auto-renewal, notice < 15 days, penalty >= 20%,
            exclusivity, uncapped liability, one-sided decision, court outside the parties' city)
```
**Measured (20 questions + 5 out of scope):** right item ranked 1st 0.80, within top 3 1.00; out-of-scope answered 0/5; attention flags 8 right, 0 false, 0 missed on the 2 contracts (the rules were written looking at these two contracts, so that is optimistic). The dog question is refused: "apartamento" is not in the right item.
**Real:** splitting with real line numbers, search, coverage refusal, type filter, highlights and flags, browser demo (same retrieval as Python, parity test). **Simulated / limits:** no language model and no legal reasoning; flags are 7 regex/number rules, not an opinion; short invented contracts.

Run: `python rag.py "O contrato renova sozinho?" [--tipo rescisao_multa]` · `python tests/test_rag_07.py` (10 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html`.

## PT
Pergunte e receba o **item literal do contrato** com a fonte (`arquivo, cláusula, item, linha`), valores/prazos/percentuais destacados e "pontos de atenção" por regras simples. Dois contratos inventados (serviços e locação), 39 itens. **Medido:** item certo em 1º 0,80 e entre os 3 primeiros 1,00; fora do escopo respondidas 0/5; pontos de atenção 8 certos, 0 falsos, 0 perdidos (regras escritas olhando esses contratos: otimista). **Não é aconselhamento jurídico:** sem modelo de linguagem, sem raciocínio jurídico; os alertas são regras, não parecer. Um contrato real exige advogado(a).
