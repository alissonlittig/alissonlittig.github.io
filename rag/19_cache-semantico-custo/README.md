# RAG 19 · Semantic cache with cost and latency / Cache semântico com custo e latência

> Study prototype, **not in production anywhere**. Invented vet-clinic FAQ (20 answers, CC0), 100 test questions with paraphrases. **The generator (LLM), its cost and its latency are SIMULATED.** / Protótipo de estudo, **não está em produção em lugar nenhum**. **O gerador (LLM), seu custo e sua latência são SIMULADOS.**

## EN
Question → vector → nearest already-answered question → if similarity ≥ threshold, return the stored answer (**hit**), else run the RAG and store it (**miss**). The point is to measure the trade-off: savings vs **false hits** (the cache served the answer of a different intent).

```
question -> vector (3-gram TF-IDF | + glossary | LSA k=12) -> nearest cached question
         -> sim >= threshold ? stored answer (HIT) : RAG (BM25 + n-grams, RRF) -> [simulated LLM] -> store (MISS)
stream of 100 questions (5 paraphrases per intent, 6 exact repeats) split DEV/TEST by intent;
threshold picked on DEV (max savings with <= 5% false hits), reported on TEST
```
**Measured (TEST half, 50 questions):** n-grams, threshold 0.40: 54% hits, 1 false hit in 27, simulated savings 54%; n-grams + glossary 0.40: 66% hits, 1/33, 66%; **LSA trained on 20 answers: no safe threshold, cache off** (at 0.90 still 18% false hits on the full stream). Without cache the RAG gets all 100 right on this tiny FAQ, so every false hit is damage the cache adds. **Real latency** (Python, this machine): cache lookup ≈ 0.07 ms p50, retrieval ≈ 0.35 ms p50; the demo measures yours live with `performance.now`.
**Simulated:** generator time (700 ms + 22 ms/output token), tokens (1.4/word) and price (US$ 0.50 / 1.50 per million in/out) are my own hypothetical constants, not any provider's price; "savings %" is only as good as they are. **Limits:** vectors are not neural (a real semantic cache uses an embedding model; the slot is swappable); the glossary was written looking at the questions (optimistic); 20 answers / 100 questions is small; no TTL or eviction.

Run: `python rag.py` · `python tests/test_rag_19.py` (11 groups; Node optional, only for JS parity) · `python build_index.py` · demo: open `demo/index.html` (live session, threshold slider, replay, chart).

## PT
Pergunta → vetor → pergunta já respondida mais próxima → se a similaridade passa do limiar, devolve a resposta guardada (**acerto**); senão roda o RAG e guarda (**erro**). O objetivo é medir o trade-off: economia contra **acerto falso** (o cache serviu a resposta de outra intenção). **Medido (metade TESTE, 50 perguntas):** n-gramas 0,40: 54% de acerto, 1 falso em 27, economia simulada 54%; n-gramas + glossário 0,40: 66%, 1/33, 66%; **LSA treinado em 20 respostas: não existe limiar seguro, cache desligado**. Sem cache o RAG acerta as 100 neste FAQ minúsculo, então todo acerto falso é dano causado pelo cache. **Latência real** (Python, esta máquina): consulta ao cache ≈ 0,07 ms, recuperação ≈ 0,35 ms; a demo mede a sua ao vivo. **Simulado:** gerador, tokens e preço são constantes hipotéticas minhas, não preço de fornecedor. **Limites:** vetores não neurais, glossário escrito olhando as perguntas (otimista), base pequena, sem TTL.
