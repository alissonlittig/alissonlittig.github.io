# RAG 10 · Metadata filters and facets / Filtros por metadados e facetas

> Study prototype, **not in production anywhere**. Fictional data. / Protótipo de estudo, **não está em produção em lugar nenhum**. Dados fictícios.

## EN
31 fictional posts from a tech blog, each with author, category and date. Filters (category, author, year, month range) are applied **before** ranking (pre-filter), so the search still returns up to k results. Facet counts show, for each value, how many matching posts exist given all the *other* filters (the facet's own filter is ignored, so you can still see the alternatives). The demo also shows what a post-filter (top-5 first, filter after) would have returned. Answer: one literal sentence with `[1]` (title, author, date, category); refuses below 50% weighted coverage; an empty question just browses by filter.

```
filters (category, author, date) -> candidate posts
question -> BM25 + n-gram cosine -> RRF over candidates -> top-5 -> sentence + [1]
facets = counts of matching posts per value, ignoring each facet's own filter
```
**Real:** pre-filter, facet counts (checked by hand in a test), hybrid search, refusal; every result passes the filters (test); browser = Python (parity test).
**Simulated / limits:** filters come from controls, not parsed from the question; no LLM, no neural embeddings; tiny corpus, so counts show the mechanism, not scale.

Run: `python rag.py "banco de dados" --cat infraestrutura --de 2026-01` · `python tests/test_rag_10.py` · `python build_index.py` · demo: `demo/index.html`.

## PT
31 posts fictícios de um blog técnico, cada um com autor, categoria e data. Os filtros (categoria, autor, ano, intervalo de meses) valem **antes** do ranking (pré-filtro), então a busca ainda devolve até k resultados. As contagens de faceta mostram, para cada valor, quantos posts casam dado todos os *outros* filtros (o filtro da própria faceta é ignorado). A demo compara com o pós-filtro (top-5 primeiro, filtra depois). Resposta: uma frase literal com `[1]` (título, autor, data, categoria); recusa com cobertura < 50%; pergunta vazia só navega pelos filtros.

**Real:** pré-filtro, facetas (conferidas à mão no teste), busca híbrida, recusa; todo resultado passa nos filtros (teste); navegador = Python (paridade).
**Simulado / limites:** filtros por controles (não extraídos da pergunta); sem LLM e sem embeddings neurais; corpus minúsculo.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
