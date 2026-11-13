"""Treina o modelo real, classifica os exemplos em Python, grava as saídas e gera a demo interativa."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import triage
from _build_lib import B, txt, area, build
model = triage.train(triage.load_labeled((HERE / "data/train.txt").read_text("utf-8")))
(HERE / "output").mkdir(exist_ok=True); (HERE / "output/model.json").write_text(json.dumps(model, ensure_ascii=False), "utf-8")
m = lambda f, s, b: {"from": f, "subject": s, "body": b}
P = [("1. Cobrança (modelo)", "1. Billing (model)", m("maria@loja.example", "Payment confirmation", "Please confirm that my bank transfer was received and send the receipt.")),
     ("2. Suporte urgente", "2. Urgent support", m("dev@startup.example", "Cannot access dashboard - urgent", "The dashboard is down for the whole team and the export is not working.")),
     ("3. Comercial de cliente VIP", "3. Sales from a VIP client", m("ceo@bigclient.example", "Quote request", "We would like a demo and the pricing of the enterprise plan for our company.")),
     ("4. Remetente bloqueado (regra)", "4. Blocked sender (rule)", m("x@promo-deals.example", "You won!", "Claim your prize now.")),
     ("5. Número de nota (regra)", "5. Invoice number (rule)", m("ana@empresa.example", "Question INV-20451", "The total on this one looks wrong.")),
     ("6. Resposta automática", "6. Auto-reply", m("bot@vendor.example", "Automatic reply: out of office", "I am away until Monday.")),
     ("7. Vago: humano decide", "7. Vague: a person decides", m("joao@gmail.example", "Hello", "Just checking something, can you call me?"))]
recorded = []
for i, (_, _, v) in enumerate(P):
    rec = {"input": v, "expect": triage.classify(v, model)}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
js = (HERE / "demo_logic.js").read_text("utf-8").replace("__MODEL__", json.dumps(model, ensure_ascii=False))
nodes = [("start", "E-mail arrives", "mail", 0, 0, B("de, assunto, corpo", "from, subject, body")), ("rules", "Fixed rules?", "if", 1, 0, B("auto-reply, bloqueio, nota", "auto-reply, block, invoice")), ("model", "Local model", "llm", 2, 0, B("Naive Bayes, sem API", "Naive Bayes, no API")),
         ("confidence", "Confident?", "if", 3, 0, B("mínimo 0,6", "minimum 0.6")), ("review", "Send to a person", "user", 3, 1, B("não chuta", "no guessing")), ("priority", "Priority", "code", 4, 0, B("urgente / VIP", "urgent / VIP")), ("route", "Route + draft", "mail", 5, 0, B("pasta e rascunho", "folder and draft"))]
edges = [{"from": "start", "to": "rules"}, {"from": "rules", "to": "model", "when": "model", "label": "no rule"}, {"from": "rules", "to": "priority", "when": "rule", "label": "rule hit", "route": [[1, 0, "b"], [4, 0, "b"]], "rs": "b", "re": "b"},
         {"from": "model", "to": "confidence"}, {"from": "confidence", "to": "priority", "when": "ok", "label": "ok"}, {"from": "confidence", "to": "review", "when": "low", "label": "low"}, {"from": "review", "to": "priority"}, {"from": "priority", "to": "route"}]
d = P[0][2]
fields = [txt("from", d["from"], B("De", "From")), txt("subject", d["subject"], B("Assunto", "Subject")), area("body", d["body"], B("Mensagem (em inglês: o modelo foi treinado em inglês)", "Message (English: the model was trained in English)"), 4)]
build(HERE, "36-triagem-email-local", B("Triagem de e-mails: regras fixas + modelo local, sem API paga", "E-mail triage: fixed rules + a local model, no paid API"), B("Python · Naive Bayes · regras", "Python · Naive Bayes · rules"),
      B("Cada e-mail passa primeiro por regras que não erram (resposta automática, remetente bloqueado, número de nota). O resto vai para um modelo pequeno treinado localmente, que escolhe cobrança, suporte, comercial ou spam. Se a confiança for baixa, o e-mail vai para uma pessoa em vez de ser chutado. Urgência e clientes VIP sobem a prioridade, e o script escreve só RASCUNHOS de resposta: nada é enviado.",
        "Each e-mail first goes through rules that do not guess (auto-reply, blocked sender, invoice number). The rest goes to a small locally trained model that picks billing, support, sales or spam. If confidence is low the e-mail goes to a person instead of being guessed. Urgency and VIP clients raise the priority, and the script writes DRAFT replies only: nothing is sent."),
      B("Evento: e-mail novo na caixa", "Event: new e-mail in the inbox"),
      B("Rode os 7 exemplos e depois escreva os seus (em inglês). Palavras que o modelo nunca viu não contam; se quase nada é conhecido, a confiança cai e o caso vai para uma pessoa.", "Run the 7 examples and then write your own (in English). Words the model never saw do not count; if almost nothing is known, confidence drops and the case goes to a person."),
      [(B(a, b), v) for a, b, v in P], fields, nodes, edges,
      {"problem": B("A caixa de entrada mistura cobrança, suporte, pedidos de orçamento e lixo. Alguém lê tudo para decidir quem responde, o urgente se perde no meio e o cliente importante espera na fila.", "The inbox mixes billing, support, quote requests and junk. Someone reads everything to decide who answers, the urgent one gets lost and the important client waits in line."),
       "solution": B("Regras fixas para o que é óbvio, um classificador local (Naive Bayes em Python puro, sem chave nem custo) para o resto, limite de confiança que manda dúvida para uma pessoa, prioridade por palavras de urgência e lista VIP, e rascunho de resposta salvo em arquivo.", "Fixed rules for the obvious, a local classifier (Naive Bayes in plain Python, no key and no cost) for the rest, a confidence threshold that sends doubt to a person, priority by urgency words and a VIP list, and a draft reply saved to a file."),
       "gain": B("Estimativa, não medição: ler e rotear um e-mail leva ~1 min; com 40 por dia são ~13 h por mês. O script tria em milissegundos, mas alguém ainda lê a fila 'review' e revisa os rascunhos. A precisão medida (16 de 16) é em 16 mensagens sintéticas e fáceis: com e-mail real será menor.", "An estimate, not a measurement: reading and routing an e-mail takes ~1 min; at 40 a day that is ~13 h a month. The script triages in milliseconds, but someone still reads the 'review' queue and edits the drafts. The measured accuracy (16 of 16) is on 16 easy synthetic messages: on real mail it will be lower."),
       "stack": ["Python 3.13", "re", "math", "csv"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python triage.py data/inbox.csv output", "Testes (inclui a precisão em mensagens não vistas): python tests/test_triage.py"], ["python triage.py data/inbox.csv output", "Tests (including accuracy on unseen messages): python tests/test_triage.py"])},
      B("O código é o triage.py portado para JavaScript linha a linha, com o modelo (contagens de palavras treinadas em Python em 40 mensagens inventadas) embutido; a lógica foi conferida contra as saídas reais do Python em 7 casos. Remetentes e textos são fictícios (.example). Nada é enviado: o rascunho fica em arquivo. A leitura de uma caixa real (IMAP) não foi escrita.", "The code is triage.py ported to JavaScript line by line, with the model (word counts trained in Python on 40 invented messages) embedded; the logic was checked against the real Python outputs in 7 cases. Senders and texts are fictional (.example). Nothing is sent: the draft stays in a file. Reading a real mailbox (IMAP) was not written."),
      recorded, js, ["triage.py"], "Triagem de e-mails com regras e modelo local", "Demo interativa de triagem de e-mails com regras fixas e modelo local.")
