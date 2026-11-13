# RAG 17 · HR policies: the rule and the page / RH: a regra e a página

> Study prototype, **not in production anywhere**. Invented company, 7 invented policy documents (CC0, written by me). Not labor-law advice. / Protótipo de estudo, **não está em produção em lugar nenhum**. Empresa e políticas inventadas (CC0). Não é orientação trabalhista.

## EN
Ask an HR question, get the **verbatim policy item** with document, item, **page**, effective date and `file:line`. When the policy has a newer version and the number changed (e.g. vacation request notice 30 → 45 days), the answer shows what applied **before**.

```
policy.md (--- page N ---) -> split by section + numbered item (keeps page and line)
                           -> version in force? (superseded file is left out of the search)
question -> BM25 + 3-gram TF-IDF (RRF) + small glossary -> coverage check (< 0.5 = "ask HR")
         -> verbatim item + highlighted amounts/deadlines + page -> "before" (old version) if the numbers differ
```
**Measured (22 questions + 6 out of scope, 62 items):** right item ranked 1st 1.00, within top 3 1.00; out-of-scope answered 0/6. **Optimistic:** the glossary entries (pedir/peço → pedido, entrego → enviado, aceitar → aceitos…) were added after the first run missed some questions, so recall was tuned on these same questions; a new question may miss.
**Real:** page/line tracking, version filter, "what changed" comparison, search, coverage refusal, browser demo (same retrieval as Python, parity test). **Simulated / limits:** documents are Markdown with page markers, not real PDFs (see project 18 for real PDFs); no language model, the answer is an excerpt, not an explanation; one item per answer (rules that must be combined are not combined).

Run: `python rag.py "Com quantos dias peço férias?" [--antigas]` · `python tests/test_rag_17.py` (8 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html`.

## PT
Pergunte sobre uma política de RH e receba o **item literal** com documento, item, **página**, vigência e `arquivo:linha`. Se a política tem versão nova e o número mudou (ex.: prazo para pedir férias de 30 para 45 dias), a resposta mostra o que valia **antes**. **Medido** (22 perguntas + 6 fora do escopo, 62 itens): item certo em 1º 1,00, entre os 3 primeiros 1,00, fora do escopo respondidas 0/6. **Otimista:** o glossário foi completado depois que a primeira rodada errou algumas perguntas, ou seja, ajustei em cima dessas mesmas perguntas. **Real:** página/linha, filtro de versão, comparação "o que mudou", busca, recusa por cobertura, demo no navegador. **Simulado/limites:** documentos em Markdown com marcador de página (PDF real está no projeto 18), sem modelo de linguagem, um item por resposta.
