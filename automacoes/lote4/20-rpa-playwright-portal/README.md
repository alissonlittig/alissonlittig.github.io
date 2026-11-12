# 20 · Python/Playwright RPA: portal, download, consolidation / RPA em Python/Playwright

![demo](prints/demo_1366.png)

## EN

**Business problem.** Every month-end someone signs into the distributor portal, downloads one sales report per branch, opens each CSV, removes odd rows and pastes everything into one sheet. It is repetitive, and one paste mistake changes the total without anyone noticing.

**What it does.** `rpa.py` drives a real headless Chromium against a **fictional** portal (`portal/server.py`, standard library only, runs locally):
1. Fills the login form (wrong password → stops at once, exit code 1, no pointless retries).
2. For each branch clicks the download link, up to 3 attempts with growing waits. HTTP 500 → retry. Session expired → signs in again and repeats the attempt.
3. Validates each CSV row (SKU present, qty integer > 0, price > 0, date inside the month); rejected rows keep their line number and reason.
4. Consolidates in integer cents (no float drift) and writes `consolidated_2026-10.xlsx` with 4 sheets: Consolidated, By branch, Rejected, Missing, plus `summary.json`.
5. A branch that never downloads does not stop the others: it is listed under *Missing* and the exit code is 2 (partial), so nobody receives a total that looks complete.

**Honest gain estimate.** ~25 min per close of 3 branches (download, open, clean, paste, check) becomes ~1 min of robot plus ~5 min reviewing the summary. Estimate, not measurement. Real portals change their HTML, so budget time for selector maintenance. No real site was accessed.

**Stack.** Python 3.13, Playwright (Chromium), openpyxl, `http.server` for the mock portal.

**Run.**
```
pip install playwright openpyxl && python -m playwright install chromium
python portal/server.py            # portal on :8765, test user analista / demo123
python rpa.py --out output/run
python tests/test_rpa.py           # 5 tests: normal, flaky+session expiry, branch down, bad password, validation
```
Real runs are in `output/` (`normal/`, `flaky_session/`, `branch_down/`, `bad_password/`: CSVs, `.xlsx`, `summary.json` with the step log).

**Interactive demo.** `../../demos/20-rpa-playwright-portal/`.

## PT

**Problema de negócio.** Toda virada de mês alguém entra no portal da distribuidora, baixa um relatório de vendas por filial, abre cada CSV, tira linhas estranhas e cola tudo numa planilha. É repetitivo e um erro de colagem muda o total sem ninguém notar.

**O que faz.** `rpa.py` controla um Chromium headless de verdade contra um portal **fictício** (`portal/server.py`, só biblioteca padrão, roda local):
1. Preenche o login (senha errada para na hora, saída 1, sem retry inútil).
2. Para cada filial clica no download, até 3 tentativas com espera crescente. Erro 500 → tenta de novo. Sessão caiu → entra de novo e repete.
3. Valida cada linha (SKU, quantidade inteira > 0, preço > 0, data dentro do mês); linha rejeitada guarda número e motivo.
4. Consolida em centavos inteiros e grava `consolidated_2026-10.xlsx` com 4 abas (Consolidated, By branch, Rejected, Missing) e `summary.json`.
5. Filial que não baixa não derruba as outras: vai para *Missing* e a saída é 2 (parcial).

**Ganho estimado (honesto).** ~25 min por fechamento de 3 filiais viram ~1 min de robô mais ~5 min conferindo o resumo. Estimativa, não medição. Portais reais mudam o HTML: preveja manutenção dos seletores. Nenhum site real foi acessado.

**Stack.** Python 3.13, Playwright (Chromium), openpyxl.

**Como rodar.** Comandos acima. Saídas reais em `output/`. Demo interativa em `../../demos/20-rpa-playwright-portal/`.
