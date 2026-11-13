# RAG 13 · WhatsApp-style support (simulated) / Atendimento estilo WhatsApp (simulado)

> Study prototype, **not in production anywhere**. Fictional shop ("Casa Tramonto"), **no WhatsApp integration**: the chat is simulated and nothing is sent. / Protótipo de estudo, **não está em produção em lugar nenhum**. Loja fictícia, **sem integração com WhatsApp**: a conversa é simulada e nada é enviado.

## EN
A support bot over 14 products (price, stock) and 16 FAQ policies. It answers **only with registered fields** (price, stock, FAQ text; nothing is generated) and hands the conversation to a human, with a ticket (reason, priority, last messages), when it has no evidence.

```
message -> rules: greeting | thanks | "human please" | sensitive topic | order number  -> handoff + ticket
        -> BM25 + 3-gram TF-IDF (RRF) over products and policies -> confidence = 0.5*cos + 0.5*term coverage
        -> product family without a variant in the question ("vaso aurora") -> ask back (Medium or Large?)
        -> conf >= 0.50 -> answer + source | otherwise -> handoff ("no basis in catalog/FAQ")
```
Measured on 40 hand-written messages (24 answerable, 2 ask-back, 12 handoff, greeting, thanks), split by even/odd index. The threshold 0.50 was **fixed beforehand, not tuned**:

| half | right | wrong document | answered what should be handed off | handed off what could be answered |
|---|--:|--:|--:|--:|
| DEV (20) | 19 | 0 | 0 | 1 |
| TEST (20) | 18 | 0 | 0 | 2 |

**Honest reading:** the errors lean to the safe side (handing off too much), but the guardrail does fail: "vocês vendem iphone?" matches "we sell wholesale" and is answered (kept in the tests). The glossary was written knowing the questions and all come from the same author, so the numbers are optimistic; with 20 messages per half, one message moves 5 points. Orders are not looked up (any order number goes to a human). No LLM.

Run: `python rag.py "quanto custa o vaso aurora grande?"` · `python rag.py --eval` · `python tests/test_rag_13.py` (7 groups, includes Python × JS parity; Node optional) · `python build_index.py` · demo: open `demo/index.html` (threshold slider, ticket panel).

## PT
Bot de suporte sobre 14 produtos (preço, estoque) e 16 políticas de FAQ. Responde **só com campos cadastrados** (preço, estoque, texto da FAQ; nada é gerado) e passa a conversa a um humano, com um chamado (motivo, prioridade, últimas mensagens), quando não tem evidência.

Fluxo no diagrama acima: regras (saudação, agradecimento, "quero atendente", tema sensível, número de pedido) → recuperação (BM25 + n-gramas, RRF) → confiança (0,5·cos + 0,5·cobertura) → pergunta de volta se faltar a variante do produto → responde com a fonte ou encaminha.

Medido em 40 mensagens escritas à mão, metades por índice par/ímpar; limiar 0,50 **fixado antes, sem ajuste** (tabela acima: DEV 19/20, TESTE 18/20, nenhum documento errado, nenhuma resposta que devia ser encaminhada).
**Leitura honesta:** os erros caem para o lado seguro (encaminhar demais), mas o guardrail erra: "vocês vendem iphone?" casa com "vendem no atacado" e é respondida (mantido nos testes). O glossário foi escrito conhecendo as perguntas e todas são do mesmo autor, então os números são otimistas; com 20 mensagens por metade, uma mensagem mexe 5 pontos. Não consulta pedidos (qualquer número de pedido vai para um humano). Sem LLM.

Rodar: comandos acima. Demo: `demo/index.html` (duplo clique).
