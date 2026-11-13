# 26 · FastAPI webhook router (Make/Zapier style) / Roteador de webhooks em FastAPI

![demo](prints/demo_1366.png)

## EN
**Problem.** A payment system sends webhooks, but nobody logs them, finance learns about big sales late, and a resend after a timeout logs the sale twice.

**What it does.** `app.py` (`POST /hooks/{source}`):
1. Verifies `X-Signature` (HMAC-SHA256 of the raw body) → **401** if wrong, nothing is read.
2. Malformed JSON → 400; invalid event → **422** with every reason.
3. Idempotent by event `id`: a replay returns `duplicate` with no new effect.
4. Routes by type/amount: approved payment → sheet + e-mail receipt (+ chat if 1000+); refund → sheet (negative) + chat; form → sheet + e-mail.
5. Each destination gets 3 attempts with 0.5 s / 1 s backoff. What still fails goes to a dead letter and the answer is **202**; the other destinations are still delivered.

**Honest gain.** ~2 min per sale by hand; 40 sales/month ≈ 1h20 (estimate). At low volume Make/Zapier's free plan may be cheaper than hosting this.

**Run.** `pip install fastapi uvicorn httpx` · `python run_scenarios.py` (real app via TestClient, 10 scenarios → `output/scenarios.json`) · `python tests/test_app.py` (10 checks). Demo: `../_demo/demos/26-webhook-fastapi-roteador/`.

**Limits.** Destinations are in-memory sinks, not real APIs; seen ids and the dead letter live in process memory (use a database in production). An event that ends in the dead letter stays marked as seen, so the sender's resend returns "duplicate" and is not redelivered. In the web demo the signature is a simulated field.

## PT
**Problema.** O sistema de pagamento manda webhooks, ninguém lança, o financeiro vê a venda grande tarde e um reenvio por timeout duplica o lançamento.

**O que faz.** `app.py`: confere a assinatura HMAC-SHA256 (**401** se falsa); JSON quebrado → 400, evento inválido → **422** com os motivos; deduplica por `id`; roteia por tipo e valor (planilha, e-mail, chat); 3 tentativas por destino com espera de 0,5 s e 1 s; o que falha de vez vai para a dead letter e a resposta é **202**, sem perder os outros destinos.

**Ganho honesto.** ~2 min por venda à mão; 40 vendas/mês ≈ 1h20 (estimativa). Em volume baixo o plano grátis de Make/Zapier pode sair mais barato.

**Como rodar.** Comandos acima (10 verificações). **Limites:** destinos são sinks em memória; ids vistos e dead letter não sobrevivem a reinício; evento que cai na dead letter continua como visto, então o reenvio do remetente volta "duplicate" e não reentrega; na demo web a assinatura é simulada.
