# RAG 01 · Document assistant with source citation / Assistente de documentos com citação

> Study prototype, **not in production anywhere**. Fictional documents. / Protótipo de estudo, **não está em produção em lugar nenhum**. Documentos fictícios.

## EN
Ask questions to 3 fictional PT-BR Markdown documents (router manual, remote-work policy, warranty guide). The answer is built **only from literal sentences** of the documents; each carries a `[n]` marker pointing to document, section and line.

```
question -> normalize + glossary (synonyms) -> BM25 ----------------+
                                               char 3-gram cosine --+-> RRF fusion -> top-3 passages
                                                                         -> best 1-2 sentences + [n]
            idf-weighted coverage < 50%  ->  "I do not know" (refuses)
```
**Real:** section chunking (30 passages), BM25, n-gram TF-IDF, RRF, sentence extraction, coverage guardrail. A test checks that every returned sentence exists word for word in a document, and that the browser demo gives the same answers as the Python code.
**Simulated / limits:** no LLM (extractive: it does not explain or merge ideas), no neural embeddings (the "vector" part is n-gram TF-IDF), a hand-written synonym glossary, tiny fictional corpus, Markdown only (no PDF/OCR), PT-BR stopwords only. The 17 test questions (13 answerable, 4 not) were written by the author: they show behavior, not general accuracy.

Run: `python rag.py "como reinicio o roteador?"` · `python tests/test_rag_01.py` (5 groups; JS parity needs Node) · `python build_index.py` (rebuilds `demo/`) · demo: open `demo/index.html`. Python 3.10+, nothing to install.

## PT
Pergunte a 3 documentos fictícios em Markdown (manual de roteador, política de home office, guia de garantia). A resposta usa **só frases literais** dos documentos, cada uma com marcador `[n]` para documento, seção e linha.

**Real:** chunking por seção (30 trechos), BM25, TF-IDF de n-gramas, fusão RRF, extração de frases, guardrail por cobertura ponderada pela raridade dos termos. O teste confere que toda frase devolvida existe palavra por palavra no documento e que a demo do navegador responde igual ao Python.
**Simulado / limites:** sem LLM (extrativo: não explica nem junta ideias), sem embeddings neurais (o "vetorial" é TF-IDF de n-gramas), glossário de sinônimos escrito à mão, corpus minúsculo e fictício, só Markdown (sem PDF/OCR). As 17 perguntas de teste (13 com resposta, 4 sem) foram escritas pelo autor: mostram comportamento, não acurácia geral.

Rodar: comandos acima. Demo: abrir `demo/index.html` (funciona por duplo clique).
