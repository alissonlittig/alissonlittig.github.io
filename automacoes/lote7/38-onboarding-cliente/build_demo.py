"""Roda o onboard.py real, grava as saídas esperadas e gera a demo interativa (modelos de texto injetados do Python)."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import onboard as O
from _build_lib import B, txt, sel, build
TODAY = "2026-11-13"
base = json.loads((HERE / "data/form.json").read_text("utf-8"))
P = [("1. Plano Pro (válido)", "1. Pro plan (valid)", base),
     ("2. Enterprise, nome com acento", "2. Enterprise, accented name", {**base, "company": "Clínica São José & Filhos", "contact": "Dr. Álvaro Lima", "email": "alvaro@saojose.example", "plan": "enterprise", "value": "12345.50", "start": "2027-01-10", "city": "Londrina"}),
     ("3. Formulário com erros", "3. Form with errors", {**base, "email": "marina@", "plan": "gold", "value": "mil", "start": "2026-11-01"})]
recorded = []
for i, (_, _, f) in enumerate(P):
    rec = {"input": f, "expect": O.build(f, TODAY)}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
js = (HERE / "demo_logic.js").read_text("utf-8").replace("__PLANS__", json.dumps(O.PLANS, ensure_ascii=False)).replace("__CONTRACT__", json.dumps(O.CONTRACT, ensure_ascii=False)).replace("__EMAIL__", json.dumps(O.EMAIL, ensure_ascii=False)).replace("__CHECK__", json.dumps(O.CHECK, ensure_ascii=False))
nodes = [("start", "Form received", "webhook", 0, 0, B("empresa, contato, plano", "company, contact, plan")), ("validate", "Valid?", "if", 1, 0, B("e-mail, plano, valor, data", "e-mail, plan, amount, date")), ("reject", "Reject with reasons", "bell", 1, 1, B("nada é criado", "nothing is created")),
         ("folder", "Create folders", "file", 2, 0, B("clientes/<slug>/", "clientes/<slug>/")), ("contract", "Fill contract", "pdf", 3, 0, B("modelo + dados", "template + data")), ("email", "E-mail draft", "mail", 4, 0, B("arquivo, não envia", "file, never sends"))]
edges = [{"from": "start", "to": "validate"}, {"from": "validate", "to": "folder", "when": "ok", "label": "ok"}, {"from": "validate", "to": "reject", "when": "invalid", "label": "invalid"}, {"from": "folder", "to": "contract"}, {"from": "contract", "to": "email"}]
d = base
fields = [txt("company", d["company"], B("Empresa", "Company")), txt("contact", d["contact"], B("Contato", "Contact")), txt("email", d["email"], B("E-mail", "E-mail")), txt("city", d["city"], B("Cidade", "City")),
          sel("plan", [("basic", "Basic"), ("pro", "Pro"), ("enterprise", "Enterprise")], B("Plano", "Plan"), "pro"), txt("value", d["value"], B("Valor mensal (ponto decimal)", "Monthly amount (decimal point)")), txt("start", d["start"], B("Início (AAAA-MM-DD; hoje na demo = 2026-11-13)", "Start (YYYY-MM-DD; today in the demo = 2026-11-13)"))]
build(HERE, "38-onboarding-cliente", B("Onboarding de cliente: formulário vira pasta, contrato e rascunho de e-mail", "Client onboarding: a form becomes a folder, a contract and an e-mail draft"), B("Python · JSON", "Python · JSON"),
      B("Quando o cliente fecha, os dados do formulário entram no script. Ele valida (e-mail, plano, valor, data), cria a pasta do cliente com subpastas, preenche o contrato com os dados e o plano, escreve um rascunho de e-mail de boas-vindas e um checklist. Nada é enviado: a pessoa revisa e manda. Se o cliente já existe, o script recusa em vez de sobrescrever.",
        "When the client signs, the form data goes into the script. It validates (e-mail, plan, amount, date), creates the client folder with subfolders, fills the contract with the data and plan, writes a welcome e-mail draft and a checklist. Nothing is sent: a person reviews and sends. If the client already exists the script refuses instead of overwriting."),
      B("Evento: formulário de novo cliente enviado", "Event: new-client form submitted"),
      B("Rode o exemplo, depois mude o plano ou estrague o e-mail para ver a recusa com todos os motivos de uma vez.", "Run the example, then change the plan or break the e-mail to see the rejection with every reason at once."),
      [(B(a, b), v) for a, b, v in P], fields, nodes, edges,
      {"problem": B("Cada cliente novo vira o mesmo ritual: criar pasta, copiar o contrato antigo, trocar nome e valor (e esquecer um), escrever o e-mail de boas-vindas.", "Every new client becomes the same ritual: create a folder, copy the old contract, swap name and amount (and miss one), write the welcome e-mail."),
       "solution": B("Um modelo de contrato e de e-mail com campos, validação antes de criar qualquer coisa, estrutura de pasta padrão e checklist. Humano só revisa e envia.", "A contract and e-mail template with fields, validation before anything is created, a standard folder structure and a checklist. A human only reviews and sends."),
       "gain": B("Estimativa, não medição: ~25 min por cliente à mão; com 6 clientes novos por mês são ~2,5 h. O script leva segundos, mas a revisão do contrato continua sendo humana (o modelo é de demonstração e não substitui revisão jurídica).", "An estimate, not a measurement: ~25 min per client by hand; with 6 new clients a month that is ~2.5 h. The script takes seconds, but contract review stays human (the template is a demo and does not replace legal review)."),
       "stack": ["Python 3.13", "json", "re", "unicodedata"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python onboard.py data/form.json output 2026-11-13", "Testes: python tests/test_onboard.py"], ["python onboard.py data/form.json output 2026-11-13", "Tests: python tests/test_onboard.py"])},
      B("O código é o onboard.py portado para JavaScript, com os modelos de contrato e e-mail injetados do próprio Python; a lógica foi conferida contra as saídas reais em 3 casos. Dados e empresa fictícios. Na demo a pasta não é criada (o navegador não grava em disco) e 'hoje' é fixo em 13/11/2026. Envio de e-mail e assinatura digital não foram escritos.", "The code is onboard.py ported to JavaScript, with the contract and e-mail templates injected from the Python itself; the logic was checked against the real outputs in 3 cases. Fictional data and company. In the demo the folder is not created (a browser does not write to disk) and 'today' is fixed at 2026-11-13. E-mail sending and digital signature were not written."),
      recorded, js, ["onboard.py"], "Onboarding de cliente automático", "Demo interativa de onboarding: formulário vira pasta, contrato e rascunho de e-mail.")
