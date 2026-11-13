# RAG: 4 projetos de estudo para o portfólio (S-1062, 13/11/2026)
Todos locais, sem chave paga, sem LLM, sem rede. Cada um: `rag.py` (código), `tests/` (verde), `data/`, `build_index.py` -> `demo/` (HTML/JS puro; abre por duplo clique), README EN+PT. `_shared/` = núcleo comum (`sync.py` copia para cada projeto).
- 01_assistente-documentos: manuais em Markdown, resposta extrativa com [n] (doc, seção, linha), recusa por cobertura.
- 02_busca-hibrida: BM25 x n-gramas x LSA x RRF x reranker, recall@k e MRR.
- 03_faq-ecommerce: FAQ com guardrail "não sei", limiar com DEV/TESTE, slider na demo.
- 04_avaliacao-chunking: 11 estratégias de corte, tabela e visualização do corte.
Rodar: `python NN_*/tests/test_rag_NN.py` (Node opcional, só para a paridade JS). NÃO publicado.
