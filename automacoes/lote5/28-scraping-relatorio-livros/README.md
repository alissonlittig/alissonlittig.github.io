# 28 · Polite scraping + price report / Scraping educado + relatório de preços

![demo](prints/demo_1366.png)

## EN
**Problem.** Tracking a public catalog by hand is copy-paste; quick scripts break silently when the site changes and nobody notices the wrong numbers.

**What it does.** `scraper.py` (standard library only) collects books.toscrape.com, a practice site built for scraping:
1. Reads `robots.txt` first (no file = no declared restriction; a Disallow = it stops, 0 pages requested).
2. Identified `User-Agent`, 1 s pause between pages, page limit.
3. Stops on 403/429/5xx without retrying; raises `LayoutChanged` if a page lacks the expected blocks. In both cases the report is marked **PARTIAL**, never silent.
4. Report: count, average/median price, cheapest/priciest, ratings, stock, 3 best-value picks (4+ stars, in stock).

**Honest gain.** ~30 min per round by hand (estimate). Scrapers need maintenance when the site changes; prefer an official API when one exists; only scrape sites that allow it.

**Run.** `python scraper.py` (saved pages, no network) · `python scraper.py --live --pages 3` (3 polite requests; run once with 2 pages, it worked) · `python run_scenarios.py` · `python tests/test_scraper.py` (9 checks, one computed independently from the raw HTML). Demo: `../_demo/demos/28-scraping-relatorio-livros/`.

**Limits.** Regex parser: fits this known layout only. 403 and layout change are simulated on saved copies. Prices are the practice site's, not real sales.

## PT
**Problema.** Acompanhar catálogo público à mão é copiar e colar; script rápido quebra calado quando o site muda.

**O que faz.** `scraper.py` lê `robots.txt` antes (Disallow = para sem pedir página), usa User-Agent identificado, pausa de 1 s e limite de páginas; para em 403/429/5xx sem insistir; `LayoutChanged` se o HTML não tem o formato esperado, e nos dois casos o relatório sai **PARCIAL**, nunca calado. Relatório: quantidade, preço médio/mediana, mais barato/caro, notas, estoque e 3 melhores custo-benefício.

**Ganho honesto.** ~30 min por rodada à mão (estimativa). Scraper precisa de manutenção; prefira API oficial; só em site que permite.

**Como rodar.** Comandos acima (9 verificações). **Limites:** parser por regex só serve a este layout; 403 e layout alterado são simulados sobre cópias salvas.
