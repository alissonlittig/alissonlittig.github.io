# RAG 11 · Code RAG answering with file:line / RAG de código com arquivo:linha

> Study prototype, **not in production anywhere**. Fictional example repository. / Protótipo de estudo, **não está em produção em lugar nenhum**. Repositório de exemplo fictício.

## EN
Ask questions (in Portuguese) about a small fictional Python package (`data/repo/frete`: shipping cost, delivery time, CEP, orders, tracking). Code is split with Python's `ast` into module, class, function, method and constant chunks, each with file and line range. Identifiers are split (`calcular_frete` → `calcular frete`) and indexed with docstring and body (BM25 + n-gram cosine, RRF). The answer is the first docstring line of the best chunk (or the constant's own line), cited as `file:line`; below 50% weighted coverage it refuses. The demo shows the code with line numbers and the cited line highlighted.

```
.py files -> ast chunks (file, start-end, def line) -> identifier splitting -> BM25 + n-grams -> RRF
question -> top chunk -> docstring line + [1] = file:line      (coverage < 50% -> "I don't know")
```
**Real:** AST chunking; a test opens each file and checks the cited line really is the `def`/`class`/constant; the answer is literal text from the file; the example repo has a passing smoke test; browser = Python (parity test).
**Simulated / limits:** no LLM (it does not explain code), no neural embeddings, no synonym glossary (asking "somar" does not find "soma"; "como o frete urgente é cobrado?" is refused), Python only, 7 files.

Run: `python rag.py "como validar um CEP?"` · `python tests/test_rag_11.py` · `python build_index.py` · demo: `demo/index.html`.

## PT
Pergunte (em português) sobre um pacote Python fictício pequeno (`data/repo/frete`). O código é cortado com `ast` em módulo, classe, função, método e constante, cada um com arquivo e faixa de linhas. Identificadores são separados e indexados com docstring e corpo (BM25 + n-gramas, RRF). A resposta é a 1ª linha da docstring do melhor trecho (ou a própria linha da constante), citada como `arquivo:linha`; com cobertura < 50% recusa. A demo mostra o código com números de linha e a linha citada destacada.

**Real:** corte por AST; o teste abre cada arquivo e confere que a linha citada é mesmo o `def`/`class`/constante; a resposta é texto literal do arquivo; o repositório de exemplo tem teste de fumaça; navegador = Python (paridade).
**Simulado / limites:** sem LLM (não explica o código), sem embeddings neurais, sem glossário ("somar" não acha "soma"; "como o frete urgente é cobrado?" é recusada), só Python, 7 arquivos.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
