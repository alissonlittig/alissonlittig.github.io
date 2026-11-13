# RAG 09 · GraphRAG simples: grafo de entidades e busca por vizinhança

> Study prototype, **not in production anywhere**. Fictional data. / Protótipo de estudo, **não está em produção em lugar nenhum**. Dados fictícios.

## EN
13 fictional paragraphs about a coastal research institute. Entities (people, organizations, projects, places) become graph nodes; two entities in the same paragraph form an edge. A question seeds the graph with the entities it names, a BFS opens an N-hop neighborhood (0-2), and paragraphs are ranked by `0.6 × lexical (BM25 + n-gram cosine) + 0.4 × 1/(1+hops)`. The answer is extractive (literal sentences with `[n]`), and each paragraph found "only by the graph" shows its path (e.g. `Marta Lacerda → Baía de Itaúna`). The demo draws the graph (SVG, positions precomputed with networkx).

```
paragraphs -> entity dictionary -> co-occurrence graph
question -> seed entities -> BFS (N hops) -> score = 0.6 lexical + 0.4 graph -> sentences + [n] + path
```
**Real:** entity matching, graph, BFS, ranking, extraction, refusal; edge counts checked by hand in a test; every shown path is a chain of real edges; browser = Python (parity test).
**Simulated / limits:** entities come from a hand-written dictionary (no NER model), co-occurrence only (no typed relations), no LLM. **Honest result:** in this 13-paragraph corpus plain lexical search already finds almost everything: on 8 questions with a gold set, recall@3 is 0.854 (lexical) vs 0.812 (graph). The graph here adds *explanation* (paths, neighbors), not recall. The weights were not tuned for a win.

Run: `python rag.py "O que liga Otávio Brandão ao Projeto Maré Alta?" --hops 2` · `python tests/test_rag_09.py` (Node optional, for parity) · `python build_index.py` · demo: open `demo/index.html`. Needs `networkx` only to rebuild the index.

## PT
13 parágrafos fictícios sobre um instituto de pesquisa costeira. Entidades viram nós; duas entidades no mesmo parágrafo formam uma aresta. A pergunta marca as entidades que cita, uma BFS abre a vizinhança de N saltos (0 a 2) e os parágrafos são ordenados por `0,6 × léxica + 0,4 × 1/(1+saltos)`. Resposta extrativa (frases literais com `[n]`); o parágrafo achado "só pelo grafo" mostra o caminho. A demo desenha o grafo.

**Real:** casamento de entidades, grafo, BFS, ranking, extração, recusa; arestas conferidas à mão no teste; caminhos mostrados são cadeias de arestas reais; navegador = Python (paridade).
**Simulado / limites:** entidades de um dicionário escrito à mão (sem modelo de NER), só co-ocorrência, sem LLM. **Resultado honesto:** neste corpus de 13 parágrafos a busca léxica já acha quase tudo: em 8 perguntas com gabarito, recall@3 = 0,854 (léxica) x 0,812 (grafo). O grafo aqui explica (caminhos, vizinhos), não melhora o recall. Os pesos não foram ajustados para "ganhar".

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
