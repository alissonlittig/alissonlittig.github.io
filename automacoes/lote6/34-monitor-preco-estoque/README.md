# 34 · Price and stock monitor / Monitor de preço e estoque

![demo](prints/demo_1366.png)

## EN
**Business problem.** Checking product pages by hand is slow; generic trackers alert on everything and keep saving garbage when a shop changes its layout.

**What it does.** `monitor.py` fetches pages (timeout), parses BR prices (`1.299,90`) and stock, compares with history. Alerts: drop >= min %, target reached (not repeated while below), back in stock. Health alerts: layout changed (nothing saved), source down (only after 3 failures in a row), suspicious price jump (not saved). Alerts go to a local file; nothing is sent.

**Honest gain.** ~10 min per round by hand; 2 rounds/day = ~7 h/month. Estimate. Respect robots.txt and each shop's terms.

**Stack / not done.** Python 3.13, urllib, re, http.server (fictional shop). E-mail/chat delivery not written.

**Run.**
```
python monitor.py data/watchlist.json state.json
python run_scenarios.py        # 8 cycles over real HTTP -> output/scenarios.json
python tests/test_monitor.py   # 10 checks
```
Demo: `../_demo/demos/34-monitor-preco-estoque/` (check with `node ../_demo/tools/testar.js 34-monitor-preco-estoque`). Fictional data. Not published.

## PT
**Problema.** Conferir páginas de produto à mão é lento; monitores genéricos avisam de tudo e continuam gravando lixo quando a loja muda o layout.

**O que faz.** `monitor.py` busca páginas (timeout), lê preço no formato BR e estoque, compara com o histórico. Avisos: queda >= mínimo, meta atingida (sem repetir), volta ao estoque. Avisos de saúde: layout mudou (nada gravado), fonte fora (só após 3 falhas seguidas), salto suspeito de preço (não grava). Alertas vão para arquivo local; nada é enviado.

**Ganho (honesto).** ~10 min por rodada à mão; 2 rodadas/dia = ~7 h/mês. Estimativa. Respeite robots.txt e os termos da loja.

**Stack / não feito.** Python 3.13, urllib, re, http.server (loja fictícia). Envio por e-mail/chat não escrito.

**Como rodar.** Comandos acima. Demo em `../_demo/demos/34-monitor-preco-estoque/`. Dados fictícios. Não publicado.
