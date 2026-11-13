# 27 · Tool-calling agent (simulated LLM) / Agente com tool calling (LLM simulado)

![demo](prints/demo_1366.png)

## EN
**Important: the "LLM" is simulated.** `sim_llm` is a fixed-rule planner that returns tool calls in chat-function format. No paid key, no network. The real parts are the agent loop, argument validation, tools and refund policy. Swap `sim_llm` for any `llm(messages)` with the same signature to use a real model; a real model's failure modes were not tested.

**Problem.** Support answers "where is my order / I want a refund" all day and each agent applies the policy differently; a loose agent could refund what it should not.

**What it does.** `agent.py`: the model picks a tool (`get_order`, `search_faq`, `create_refund`); the agent validates the arguments against a schema **before** running; tool errors go back to the model as data; a 6-step guard hands over to a human if the model loops. Policy lives in the tool: 30-day window, automatic refund up to 100.00 (above = pending human approval), one refund per order.

**Honest gain.** ~3 min per repetitive ticket; 150/month ≈ 7h, only the simple cases (status, FAQ) are absorbed (estimate).

**Run.** `python run_scenarios.py` (11 scenarios) · `python tests/test_agent.py` (13 checks). Demo: `../_demo/demos/27-agente-tool-calling/`. Fictional orders.

## PT
**Importante: o "LLM" é simulado.** `sim_llm` é um planejador de regras fixas que devolve chamadas de ferramenta; sem chave paga e sem rede. É real o laço do agente, a validação de argumentos, as ferramentas e a política de reembolso. Troque `sim_llm` por qualquer `llm(messages)` com a mesma assinatura para usar um modelo de verdade (não testado).

**O que faz.** O modelo escolhe a ferramenta; o agente valida os argumentos antes de executar; erro de ferramenta volta ao modelo como dado; trava de 6 passos passa para uma pessoa. Política na ferramenta: janela de 30 dias, reembolso automático até 100,00 (acima fica pendente de aprovação), um por pedido.

**Ganho honesto.** ~3 min por chamado; 150/mês ≈ 7h, só os casos simples (estimativa). **Como rodar:** comandos acima (13 verificações).
