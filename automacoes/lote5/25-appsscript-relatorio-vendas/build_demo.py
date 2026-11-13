"""Roda o Code.gs de verdade no harness (node), grava output/ e gera a demo (Code.gs + encaixe = logic.js)."""
import json, pathlib, subprocess, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE.parent / "_demo" / "tools"))
from dl import *
SLUG = "25-appsscript-relatorio-vendas"
subprocess.run(["node", str(HERE / "harness.js")], check=True, stdout=subprocess.DEVNULL)
R = json.loads((HERE / "output" / "scenarios.json").read_text("utf-8")); L = json.loads((HERE / "data" / "vendas.json").read_text("utf-8"))
csv = lambda rows: "\n".join(";".join(str(c) for c in r) for r in rows)
form = lambda rows, quota="ok": {"rows": csv(rows), "today": "2026-11-08", "quota": quota}
seq = [("normal", L["normal"], "ok", True), ("repetido", L["normal"], "ok", False), ("dados_sujos", L["sujo"], "ok", True), ("cota_estourada", L["normal"], "quota", True), ("retentativa_ok", L["normal"], "ok", False)]
recorded = []
for k, rows, q, fresh in seq:
    r = R[k]; rec = {"input": form(rows, q), "expect": {"result": r["result"], "log": r["log"], "mails_sent": r["mails_sent"], "mail": r["mail"]}}
    if fresh: rec["fresh"] = True
    recorded.append(rec)
code = (HERE / "Code.gs").read_text("utf-8")
logic = "/* Code.gs real (buildReport, renderEmail, CONFIG) + encaixe da demo. Conferido contra as saídas gravadas do harness. */\n(function () {\n" + code + (HERE / "demo_wrapper.js").read_text("utf-8")
nodes = [("start", "Trigger semanal", "bell", 0, 0, B("time-driven", "time-driven")), ("check", "Semana já enviada?", "if", 1, 0, B("lê aba Relatórios", "reads Relatórios")), ("skip", "Sai sem enviar", "respond", 1, 1, B("idempotente", "idempotent")),
         ("read", "Ler Vendas", "sheet", 2, 0, B("getValues()", "getValues()")), ("build", "buildReport", "code", 3, 0, B("pagas · semana · variação", "paid · week · delta")), ("send", "MailApp", "mail", 4, 0, B("sendEmail()", "sendEmail()")),
         ("logok", "Log: OK", "sheet", 5, 0, B("appendRow", "appendRow")), ("logerr", "Log: ERRO", "sheet", 5, 1, B("tenta no próximo gatilho", "retries next trigger"))]
edges = [{"from": "start", "to": "check"}, {"from": "check", "to": "read", "when": "new", "label": "new"}, {"from": "check", "to": "skip", "when": "dup", "label": "sent already"}, {"from": "read", "to": "build"}, {"from": "build", "to": "send"},
         {"from": "send", "to": "logok", "when": "sent", "label": "sent"}, {"from": "send", "to": "logerr", "when": "error", "label": "quota"}]
n = form(L["normal"])
cfg = {"slug": SLUG, "title": B("Google Apps Script: planilha de vendas vira relatório semanal por e-mail", "Google Apps Script: a sales sheet becomes a weekly e-mail report"), "tag": B("Apps Script · Planilhas · MailApp", "Apps Script · Sheets · MailApp"),
 "summary": B("Toda semana um gatilho lê a aba Vendas, ignora o que não está pago, aponta linhas com dado ruim, compara com a semana anterior e manda o resumo ao financeiro. Rodar duas vezes não duplica o e-mail; se a cota do Google estourar, o erro fica no log e o próximo gatilho tenta de novo.",
              "Every week a trigger reads the Sales tab, ignores what is not paid, flags rows with bad data, compares with the previous week and e-mails the summary to finance. Running twice does not duplicate the e-mail; if Google's quota runs out the error is logged and the next trigger retries."),
 "input": {"nosim": True, "trigger": B("Gatilho semanal (Triggers > Time-driven) · sendWeeklyReport()", "Weekly trigger (Triggers > Time-driven) · sendWeeklyReport()"),
  "note": B("Uma venda por linha: data;vendedor;produto;valor;status. A aba Relatórios guarda a memória enquanto a página está aberta: clique em Rodar duas vezes para ver a idempotência.", "One sale per line: date;seller;product;value;status. The Reports tab keeps memory while the page is open: click Run twice to see idempotency."),
  "presets": [{"label": B("1. Semana normal", "1. Normal week"), "values": n}, {"label": B("2. Com 3 linhas sujas", "2. With 3 dirty rows"), "values": form(L["sujo"])}, {"label": B("3. Cota de e-mail estourada", "3. E-mail quota exceeded"), "values": form(L["normal"], "quota")}],
  "fields": [area("rows", n["rows"], B("Aba Vendas (sem cabeçalho)", "Sales tab (no header)"), 7), txt("today", "2026-11-08", B("Fim da semana (hoje)", "Week end (today)")), sel("quota", [("ok", B("Normal", "Normal")), ("quota", B("Cota estourada", "Quota exceeded"))], B("MailApp", "MailApp"))]},
 "nodes": nodes_of(nodes), "edges": edges,
 "case": {"problem": B("Toda segunda alguém abre a planilha, filtra a semana, soma por vendedor, copia para um e-mail e às vezes esquece uma linha ou conta venda pendente como paga.", "Every Monday someone opens the sheet, filters the week, sums per seller, pastes into an e-mail and sometimes misses a row or counts a pending sale as paid."),
  "solution": B("Um script ligado à própria planilha (sem servidor, sem custo): só conta vendas pagas, compara com a semana anterior, lista linhas com erro em vez de escondê-las e registra cada envio. Gatilho repetido não duplica; falha de envio não derruba nada.", "A script bound to the sheet itself (no server, no cost): counts paid sales only, compares with the previous week, lists bad rows instead of hiding them and logs every send. A repeated trigger does not duplicate; a send failure breaks nothing."),
  "gain": B("Estimativa, não medição: ~20 min por semana montando o relatório à mão ≈ 1h20 por mês, e o risco de somar errado some. A cota gratuita do MailApp (cerca de 100 destinatários/dia em conta Gmail comum) cobre um relatório semanal com folga; confira o limite vigente na documentação do Google.", "An estimate, not a measurement: ~20 min a week building the report by hand ≈ 1h20 a month, and the risk of a wrong sum goes away. MailApp's free quota (about 100 recipients/day on a regular Gmail account) covers a weekly report easily; check the current limit in Google's docs."),
  "stack": ["Google Apps Script (JavaScript)", "SpreadsheetApp", "MailApp", "Triggers"],
  "run": {"title": B("Como rodar", "How to run"), "steps": B(["Na planilha: Extensões > Apps Script, cole Code.gs, crie as abas Vendas e Relatórios", "Triggers > Adicionar > sendWeeklyReport > Time-driven > semanal", "Fora do Google: node harness.js (simula SpreadsheetApp/MailApp em memória)", "Testes: node tests/test_report.js"], ["In the sheet: Extensions > Apps Script, paste Code.gs, create the Vendas and Relatórios tabs", "Triggers > Add > sendWeeklyReport > Time-driven > weekly", "Outside Google: node harness.js (simulates SpreadsheetApp/MailApp in memory)", "Tests: node tests/test_report.js"]),
          "files": [{"href": "Code.gs", "label": B("Baixar Code.gs", "Download Code.gs")}]},
  "honesty": B("O Code.gs desta demo é o arquivo real, sem alteração; só SpreadsheetApp, MailApp e Utilities são simulados na memória da página (e no harness de testes em Node). Não foi executado dentro de uma conta Google: o runtime do Google pode diferir em detalhes (fuso horário, cotas). Dados e e-mails são fictícios (.example); nada é enviado.", "The Code.gs in this demo is the real file, unchanged; only SpreadsheetApp, MailApp and Utilities are simulated in page memory (and in the Node test harness). It was not run inside a Google account: Google's runtime may differ in details (time zone, quotas). Data and e-mails are fictional (.example); nothing is sent.")},
 "footer": B("Dados fictícios. Nada é enviado: tudo roda no seu navegador.", "Fictional data. Nothing is sent: everything runs in your browser."), "recorded": recorded}
finish(HERE, SLUG, cfg, logic, "Apps Script: relatório semanal de vendas", "Demo interativa de um script do Google Apps Script que transforma uma planilha em relatório semanal por e-mail.", ["Code.gs"])
