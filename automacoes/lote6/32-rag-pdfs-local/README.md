# 32 · Ask your PDFs, locally / Pergunte aos seus PDFs, local

![demo](prints/demo_1366.png)

## EN
**Problem.** Company rules are scattered across PDFs; an AI that "answers about the documents" without citing a source can invent a deadline or an amount.

**What it does.** `rag.py` (pypdf + own BM25, no key, no LLM, no embeddings):
1. Extracts text per page and splits it by numbered section into passages (15 passages from 3 fictional PDFs).
2. Normalizes the question (no accents, case, plural `-s`, common words) and ranks passages with BM25.
3. Answers with the **literal sentence(s)** of the best passage (up to 2, chosen by rare-term weight) and cites file, page, section and score.
4. If a question term exists nowhere in the PDFs, the answer is marked `partial` and the term is named; if nothing matches (score 0 or coverage < 50%), it says it did not find it.

Because it is extractive, every sentence returned exists word for word in the cited PDF; the test checks this.

**Honest status.** Study prototype over 3 fictional PDFs made for this (`make_docs.py`). **Not in production anywhere**, not tested with real documents.

**Run.** `pip install pypdf reportlab` · `python make_docs.py` · `python rag.py "qual o prazo para pedir reembolso?"` · `python run_scenarios.py` · `python tests/test_rag.py` (19 checks, incl. BM25 verified by hand: ln 2). Demo: `../_demo/demos/32-rag-pdfs-local/`.

**Limits.** Word search, no synonyms ("gastar" does not find "limite"); no OCR (scanned PDFs fail with a clear error); section detection expects numbered headings ("2. Prazo..."); the answer is the literal sentence, not an explanation; Portuguese stopwords only.

## PT
**Problema.** Regras espalhadas em PDFs; IA que responde sem citar fonte pode inventar prazo ou valor.

**O que faz.** Extrai o texto dos PDFs (pypdf), divide por seção numerada, ranqueia com BM25 próprio e responde com a **frase literal** do documento, citando arquivo, página e seção. Termo que não existe nos PDFs marca a resposta como `partial` e é apontado; sem correspondência, diz que não encontrou. Sem chave, sem LLM, sem embeddings.

**Status honesto.** Protótipo de estudo com 3 PDFs fictícios; **não está em produção em lugar nenhum** e não foi testado com documentos reais.

**Como rodar:** comandos acima (19 verificações). **Limites:** busca por palavra (sem sinônimos), sem OCR, títulos numerados, resposta é frase literal.
