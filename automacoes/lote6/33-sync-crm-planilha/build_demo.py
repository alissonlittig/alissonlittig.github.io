"""Roda o sync real, grava as respostas e gera a demo interativa (conferida depois por node _demo/tools/testar.js)."""
import json, pathlib, sys, copy
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import sync
from _build_lib import B, txt, sel, build
rep, seed = sync.run(HERE / "data/crm.csv", HERE / "data/planilha.csv", HERE / "output")
inc = lambda o, name, email, phone, company, upd: {"origin": o, "name": name, "email": email, "phone": phone, "company": company, "updated": upd}
P = [("1. Edição no CRM (empresa nova)", "1. CRM edit (new company)", inc("crm", "Eva Prado", "EVA@graos.example", "", "Grãos da Serra Ltda", "2026-11-10")),
     ("2. Pessoa nova na planilha", "2. New person in the sheet", inc("sheet", "hugo  AZEVEDO", "hugo@vitrine.example", "+55 41 94444-1212", "Vitrine", "2026-11-10")),
     ("3. Mesmo dia, valor diferente (conflito)", "3. Same day, different value (conflict)", inc("sheet", "Bruno Lima", "bruno@norteacos.example", "", "Norte Aço Brasil", "2026-11-09")),
     ("4. Sem e-mail, casa pelo telefone", "4. No e-mail, matched by phone", inc("sheet", "diego r.", "", "(41) 97777-3333", "Vitrine ERP", "2026-11-11")),
     ("5. Linha inválida", "5. Invalid row", inc("crm", "", "isso-nao-e-email", "12", "", "ontem"))]
st = copy.deepcopy(seed); recorded = []
for i, (_, _, r) in enumerate(P):
    rec = {"input": r, "expect": sync.upsert(st, r["origin"], {k: v for k, v in r.items() if k != "origin"})}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
js = (HERE / "demo_logic.js").read_text("utf-8").replace("__SEED__", json.dumps(seed, ensure_ascii=False))
nodes = [("start", "Row changed", "webhook", 0, 0, B("CRM ou planilha", "CRM or sheet")), ("normalize", "Normalize", "code", 1, 0, B("e-mail, telefone, nome", "e-mail, phone, name")), ("validate", "Valid?", "if", 2, 0, B("campos mínimos", "minimum fields")),
         ("reject", "Reject row", "respond", 2, 1, B("linha e motivo no relatório", "line and reason in report")), ("own", "Own side", "sheet", 3, 0, B("cria ou mescla duplicata", "create or merge duplicate")),
         ("other", "Other side", "sheet", 4, 0, B("o mais novo vence", "newest wins")), ("report", "Report", "file", 5, 0, B("ações e conflitos", "actions and conflicts"))]
edges = [{"from": "start", "to": "normalize"}, {"from": "normalize", "to": "validate"}, {"from": "validate", "to": "own", "when": "ok", "label": "ok"}, {"from": "validate", "to": "reject", "when": "bad", "label": "rejected"},
         {"from": "own", "to": "other"}, {"from": "other", "to": "report"}]
s = P[0][2]; fields = [sel("origin", [("crm", B("CRM", "CRM")), ("sheet", B("Planilha", "Spreadsheet"))], B("Onde mudou", "Where it changed")), txt("name", s["name"], B("Nome", "Name")), txt("email", s["email"], B("E-mail", "E-mail")), txt("phone", s["phone"], B("Telefone", "Phone")), txt("company", s["company"], B("Empresa", "Company")), txt("updated", s["updated"], B("Atualizado em (AAAA-MM-DD)", "Updated on (YYYY-MM-DD)"))]
build(HERE, "33-sync-crm-planilha", B("Sincronizar CRM e planilha sem duplicar", "Sync a CRM and a spreadsheet without duplicates"), B("Python · CSV · deduplicação", "Python · CSV · de-duplication"),
      B("Uma linha muda no CRM ou na planilha. O script padroniza e-mail, telefone e nome, procura a mesma pessoa (por e-mail, senão por telefone), junta duplicatas, deixa o valor mais recente vencer em cada campo, cria a pessoa do outro lado se ela não existe e avisa quando dois valores diferentes têm a mesma data (conflito para uma pessoa decidir).",
        "A row changes in the CRM or the spreadsheet. The script standardises e-mail, phone and name, looks for the same person (by e-mail, else phone), merges duplicates, lets the newest value win per field, creates the person on the other side if missing and flags it when two different values share the same date (a conflict for a person to decide)."),
      B("Evento: linha alterada (CRM ou planilha)", "Event: row changed (CRM or spreadsheet)"),
      B("A memória (CRM e planilha com 5 pessoas) vale enquanto a página está aberta: rode os 5 exemplos em ordem e veja as duas tabelas mudarem. Regra: mais recente vence por campo; mesma data e valores diferentes = conflito, o valor existente fica.",
        "Memory (a CRM and a sheet with 5 people) lasts while the page is open: run the 5 examples in order and watch both tables change. Rule: newest wins per field; same date and different values = conflict, the existing value stays."),
      [(B(a, b), r) for a, b, r in P], fields, nodes, edges,
      {"problem": B("A equipe usa um CRM e uma planilha ao mesmo tempo. Cada um corrige uma ponta, a mesma pessoa aparece duas ou três vezes com telefone escrito de jeitos diferentes, e ninguém sabe qual versão é a certa.",
                    "The team uses a CRM and a spreadsheet at the same time. Each fixes one side, the same person shows up two or three times with phones written in different ways, and nobody knows which version is right."),
       "solution": B("Um script que lê os dois CSVs, padroniza, casa por e-mail ou telefone, junta duplicatas, aplica 'o mais novo vence' por campo e escreve os dois arquivos de volta iguais. Linha inválida vai para o relatório com número da linha. Rodar de novo não muda nada (idempotente). Conflito não é decidido sozinho.",
                     "A script that reads both CSVs, standardises, matches by e-mail or phone, merges duplicates, applies 'newest wins' per field and writes both files back identical. An invalid row goes to the report with its line number. Running it again changes nothing (idempotent). A conflict is never decided silently."),
       "gain": B("Estimativa, não medição: conferir e corrigir à mão ~2 min por linha duplicada ou divergente. Com 150 linhas divergentes por mês são ~5 h. O script faz em segundos e deixa para a pessoa só os conflitos reais.",
                 "An estimate, not a measurement: checking and fixing by hand ~2 min per duplicate or diverging row. With 150 diverging rows a month that is ~5 h. The script does it in seconds and leaves only real conflicts for a person."),
       "stack": ["Python 3.13", "csv", "re", "json"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python sync.py data/crm.csv data/planilha.csv output", "Testes: python tests/test_sync.py"], ["python sync.py data/crm.csv data/planilha.csv output", "Tests: python tests/test_sync.py"])},
      B("O código é o sync.py portado para JavaScript linha a linha; os dois CSVs são simulados em memória na página, e a lógica foi conferida contra as respostas reais gravadas do Python. Pessoas e e-mails são fictícios (.example). Nada é enviado nem lido de um CRM de verdade; o conector para um CRM real não foi escrito.",
        "The code is sync.py ported to JavaScript line by line; the two CSVs are simulated in memory on the page, and the logic was checked against recorded answers from the real Python. People and e-mails are fictional (.example). Nothing is sent or read from a real CRM; the connector to a real CRM was not written."),
      recorded, js, ["sync.py"], "Sincronizar CRM e planilha sem duplicar", "Demo interativa de um sincronizador CRM e planilha com deduplicação.")
