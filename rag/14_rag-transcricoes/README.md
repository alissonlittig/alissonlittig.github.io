# RAG 14 · Transcripts with timestamps / Transcrições com timestamp

> Study prototype, **not in production anywhere**. Fictional recordings: two meetings and one video lesson, hand-written as text. No audio, no speech recognition. / Protótipo de estudo, **não está em produção em lugar nenhum**. Gravações fictícias (duas reuniões e uma vídeo-aula) escritas à mão como texto. Sem áudio e sem reconhecimento de fala.

## EN
Search over transcripts where every line has a `mm:ss` and a speaker. The answer is the **line copied from the transcript**, cited as recording + `mm:ss` + speaker; a timeline shows where the hits fall.

```
transcript lines (mm:ss, speaker) -> sliding windows of W=3 lines (keep t_start / t_end)
question -> [optional filter: one recording] -> BM25 + 3-gram TF-IDF (RRF) over windows
  -> drop hits that overlap a better one -> best window -> line with most (idf-weighted) question terms
  -> confidence 0.5*cos + 0.5*term coverage >= 0.45 ? answer "[mm:ss] Speaker: line" : "not found in the recordings"
```
34 hand-written questions (30 with a gold timestamp, 4 out of scope), split by even/odd index (DEV 15 + 2 out of scope, TEST 15 + 2). W = 3 and T = 0.45 were fixed before measuring TEST. "Hit" = the gold time falls inside a returned window.

| half | hit@1 | hit@3 | MRR | cited line is the exact one | out of scope refused |
|---|--:|--:|--:|--:|--:|
| DEV | 0.933 | 1.000 | 0.967 | 11 / 15 | 2 / 2 |
| TEST | 0.867 | 0.933 | 0.889 | 10 / 13 | 2 / 2 |

Window size (all 30 answerable questions): W=1 hit@1 0.667 · W=2 0.900 · **W=3 0.900** · W=5 0.933 (but fewer answers pass the threshold: 26 of 30 vs 28). One line alone loses the context ("and the 6%?"); more than 3-5 dilutes the score.
**Honest reading:** finding the right *window* works better than finding the exact *line* (21 of 28 exact). Example: "when is the raise?" cites the line that asks about the raise (06:28) instead of the one that answers (06:40), 12 seconds apart. Questions and glossary come from the same author as the text, so the numbers are optimistic; 15 questions per half, one question moves ~7 points. No LLM, no timestamps from real audio.

Run: `python rag.py "quando sai o beta?" [--doc kickoff_rota_leve]` · `python rag.py --eval` · `python tests/test_rag_14.py` (8 groups, includes Python × JS parity; Node optional) · `python build_index.py` · demo: open `demo/index.html`.

## PT
Busca em transcrições em que cada fala tem `mm:ss` e quem falou. A resposta é a **fala copiada da transcrição**, citada como gravação + `mm:ss` + falante; uma linha do tempo mostra onde caem os resultados.

Fluxo no diagrama acima: janelas deslizantes de 3 falas (guardam tempo inicial e final) → pré-filtro opcional por gravação → BM25 + n-gramas (RRF) → descarta resultado sobreposto a um melhor → fala com mais termos da pergunta na melhor janela → confiança ≥ 0,45 responde, senão "não achei nas gravações".

34 perguntas escritas à mão (30 com tempo-ouro, 4 fora de escopo), metades por índice par/ímpar; W = 3 e T = 0,45 fixados antes de medir o TESTE (tabela acima). Janela de 1 fala: hit@1 0,667; de 3 falas: 0,900.
**Leitura honesta:** achar a *janela* certa funciona melhor que achar a *fala* exata (21 de 28). Exemplo: "quando sai o reajuste?" cita a fala que pergunta sobre o reajuste (06:28) e não a que responde (06:40), 12 segundos depois. Perguntas e glossário são do mesmo autor do texto, então os números são otimistas; com 15 perguntas por metade, uma pergunta mexe ~7 pontos. Sem LLM e sem tempos de áudio real.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
