# 30 · Support bot for Telegram and Discord (demo mode) / Bot de atendimento (modo demo)

![demo](prints/demo_1366.png)

## EN
**Problem.** Repeated customer questions eat support time; a hastily built bot leaks other customers' data or accepts any command.

**What it does.** `bot.py` receives events in the real Telegram (`update`) or Discord (`MESSAGE_CREATE`) shape and:
1. Normalizes both into one message format.
2. Rate-limits (more than 5 messages in 10 s from one user gets one "slow down" reply).
3. Routes: `/pedido <n>` (only the owner sees an order; someone else's order answers exactly like a missing one), `/estoque <sku>`, `/novo` (guided order: item, quantity, confirmation, with validation), `/cancelar`, `/admin_resumo` (fixed admin list), fallback with help. `/cmd@BotName` works.
4. Renders the reply in each platform's shape (`sendMessage` / create message).

**DEMO MODE.** No token, no network, no bot created on either platform. The code returns the payload that *would* be sent; the adapter that calls the real API was **not written**.

**Honest gain.** ~1 h/day of support if 30 simple questions take ~2 min each (estimate; assumes repetitive questions).

**Run.** `python bot.py` · `python run_scenarios.py` · `python tests/test_bot.py` (12 checks). Demo: `../_demo/demos/30-bot-telegram-discord-demo/`.

**Limits.** Fictional orders/stock/users in memory; conversation state is in-process (lost on restart); text messages only.

## PT
**Problema.** Pergunta repetida de cliente consome o atendimento; bot feito às pressas vaza dado de outro cliente ou aceita qualquer comando.

**O que faz.** `bot.py` recebe eventos no formato real do Telegram ou do Discord, normaliza, aplica limite de mensagens (mais de 5 em 10 s = uma resposta pedindo calma), roteia (`/pedido` só mostra pedido do dono; `/estoque`; `/novo` em etapas com validação; `/cancelar`; `/admin_resumo` só para lista de admins; fallback com ajuda) e monta a resposta no formato de cada plataforma.

**MODO DEMO.** Sem token, sem rede, nenhum bot criado nas plataformas. O adaptador que chama a API de verdade **não foi escrito**; o código devolve o payload que seria enviado.

**Ganho honesto.** ~1 h/dia (estimativa). **Como rodar:** comandos acima (12 verificações). **Limites:** dados fictícios em memória; estado da conversa se perde ao reiniciar; só mensagem de texto.
