# RAG: 12 projetos de estudo (portfólio, 13/11/2026)
Todos locais, sem chave paga, sem LLM, sem rede. Cada um: `rag.py` (código), `tests/` (verde), `data/`, `build_index.py` -> `demo/` (HTML/JS puro; abre por duplo clique), README EN+PT. `_shared/` = núcleo comum (`sync.py` copia para cada projeto).
- 01_assistente-documentos: manuais em Markdown, resposta extrativa com [n] (doc, seção, linha), recusa por cobertura.
- 02_busca-hibrida: BM25 x n-gramas x LSA x RRF x reranker, recall@k e MRR.
- 03_faq-ecommerce: FAQ com guardrail "não sei", limiar com DEV/TESTE, slider na demo.
- 04_avaliacao-chunking: 11 estratégias de corte, tabela e visualização do corte.
- 05_planilhas-csv: perguntas sobre planilhas CSV.
- 06_multilingue: RAG PT/EN/ES.
- 07_contratos: contratos com destaque de cláusulas (não é aconselhamento jurídico).
- 08_memoria-conversa: memória de conversa entre perguntas.
- 09_graphrag-simples: grafo de entidades e busca por vizinhança. Limite: as entidades vêm de um dicionário escrito à mão (sem NER); uma pergunta com entidade fora do dicionário (ex.: "Qual rio influencia o laboratório?") é recusada.
- 10_rag-filtros-facetas: filtros por metadados e facetas, pré x pós-filtro.
- 11_rag-de-codigo: RAG de código com resposta arquivo:linha.
- 12_rag-deteccao-alucinacao: marca frases de uma resposta como suportadas ou sem suporte.
Rodar: `python NN_*/tests/test_rag_NN.py` (Node opcional, só para a paridade JS). Publicado em https://alissonlittig.github.io/#rag
