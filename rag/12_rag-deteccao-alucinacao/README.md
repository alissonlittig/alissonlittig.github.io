# RAG 12 · Hallucination detection / Detecção de alucinação

> Study prototype, **not in production anywhere**. Fictional documents and hand-written answers. / Protótipo de estudo, **não está em produção em lugar nenhum**. Documentos fictícios e respostas escritas à mão.

## EN
Given a question and a candidate answer, the checker retrieves the top-3 passages (query = question + answer), splits the answer into sentences, finds the best evidence sentence for each and marks it **supported**, **partial** or **unsupported**. Support = idf-weighted share of the sentence's terms found in the evidence (≥ 0.7 supported, 0.5-0.7 partial, < 0.5 unsupported). Also unsupported: a number absent from the evidence, or opposite polarity (forbidden × allowed). Thresholds were fixed before measuring the TEST split.

```
question + answer -> top-3 passages -> answer sentences -> best evidence sentence each
support score + number check + polarity check -> supported | partial | unsupported (+ evidence shown)
```
**Real:** the checker runs (Python and browser, parity test); a sentence copied from the document is always approved (test). Measured on 15 hand-written answers (2 fictional documents), unsupported = "invented" sentence: DEV 6 invented sentences, precision 1.00, recall 0.67; TEST 7 invented, precision 1.00, recall 0.86 (6 of 7).
**Simulated / limits:** no LLM, the candidate answers are hand-written to imitate a generator; the checker is lexical, not an NLI model. Known misses (kept in tests): a count written as a word ("renewed twice" vs "once") and a true sentence mixed with a false detail ("open on Sundays, 9h-13h"). Tiny sets: the numbers show behavior, not general accuracy.

Run: `python rag.py "Qual a multa?" "A multa é de R$ 1,00 por dia."` · `python tests/test_rag_12.py` · `python build_index.py` · demo: `demo/index.html`.

## PT
Dada uma pergunta e uma resposta candidata, o verificador recupera os 3 melhores trechos (consulta = pergunta + resposta), divide a resposta em frases, acha a melhor frase de evidência para cada uma e marca **suportada**, **parcial** ou **sem suporte**. Suporte = fatia (ponderada por idf) dos termos da frase achada na evidência (≥ 0,7 suportada, 0,5-0,7 parcial, < 0,5 sem suporte). Também é sem suporte: número que não está na evidência, ou polaridade oposta (proibido x permitido). Os limiares foram fixados antes de medir o TESTE.

**Real:** o verificador roda (Python e navegador, paridade); frase copiada do documento sempre é aprovada (teste). Medido em 15 respostas escritas à mão (2 documentos fictícios), "sem suporte" = frase inventada: DEV 6 inventadas, precisão 1,00, recall 0,67; TESTE 7 inventadas, precisão 1,00, recall 0,86 (6 de 7).
**Simulado / limites:** sem LLM, as respostas candidatas são escritas à mão para imitar um gerador; o verificador é lexical, não um modelo de inferência (NLI). Erros conhecidos (mantidos nos testes): contagem por extenso ("duas vezes" x "uma vez") e frase verdadeira misturada com detalhe falso ("abre aos domingos, 9h às 13h"). Conjuntos minúsculos: mostram comportamento, não acurácia geral.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
