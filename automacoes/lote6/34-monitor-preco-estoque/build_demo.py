"""Roda o monitor real (run_scenarios + check), grava respostas e gera a demo interativa."""
import json, pathlib, sys, copy
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import monitor, run_scenarios
from _build_lib import B, txt, sel, build
run_scenarios.main()
W = {w["id"]: w for w in json.loads((HERE / "data/watchlist.json").read_text("utf-8"))}
seed = {}
for pid, price, stock in (("notebook", "4.299,00", "in"), ("fone", "349,90", "out"), ("cafe", "589,00", "in")):
    monitor.check(seed, W[pid], lambda: monitor.page(W[pid]["name"], price, stock))
inp = lambda p, price, stock, pg="ok": {"product": p, "price": price, "stock": stock, "page": pg}
P = [("1. Notebook cai 12%", "1. Laptop drops 12%", inp("notebook", "3.783,00", "in")), ("2. Fone volta ao estoque", "2. Headphones back in stock", inp("fone", "349,90", "in")),
     ("3. Cafeteira bate a meta", "3. Coffee maker hits the target", inp("cafe", "449,00", "in")), ("4. Loja mudou o layout", "4. Shop changed its layout", inp("notebook", "3.783,00", "in", "layout")),
     ("5. Servidor da loja fora (clique 3x)", "5. Shop server down (click 3x)", inp("notebook", "3.783,00", "in", "500")), ("6. Preço suspeito (49,00)", "6. Suspicious price (49,00)", inp("cafe", "49,00", "in"))]
seq = [P[0][2], P[1][2], P[2][2], P[3][2], P[4][2], P[4][2], P[4][2], P[5][2]]
st = copy.deepcopy(seed); recorded = []
for i, r in enumerate(seq):
    w = W[r["product"]]
    def g(r=r, w=w):
        if r["page"] == "500": raise monitor.FetchError("HTTP Error 500")
        return monitor.page(w["name"], r["price"], r["stock"]) if r["page"] == "ok" else "<html><h1>x</h1></html>"
    a = monitor.check(st, w, g); rec = {"input": r, "expect": {"id": w["id"], "alerts": a, "price": st[w["id"]]["price"], "fails": st[w["id"]]["fails"]}}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
js = (HERE / "demo_logic.js").read_text("utf-8").replace("__WATCH__", json.dumps(W, ensure_ascii=False)).replace("__SEED__", json.dumps(seed))
nodes = [("start", "Schedule tick", "webhook", 0, 0, B("a cada hora", "every hour")), ("fetch", "GET product page", "http", 1, 0, B("urllib, timeout 3 s", "urllib, 3 s timeout")), ("down", "Count failure", "file", 1, 1, B("avisa só na 3ª", "alerts only on the 3rd")),
         ("parse", "Parse price+stock", "code", 2, 0, B("regex + formato BR", "regex + BR format")), ("layout", "Layout alert", "bell", 2, 1, B("não grava nada", "saves nothing")), ("guard", "Sanity check", "if", 3, 0, B("salto > 50%?", "jump > 50%?")),
         ("suspect", "Suspicious alert", "bell", 3, 1, B("não grava", "not saved")), ("compare", "Compare history", "code", 4, 0, B("queda, meta, estoque", "drop, target, stock")), ("notify", "Write alert", "bell", 5, 0, B("arquivo local", "local file")), ("quiet", "Save quietly", "file", 5, 1, B("sem aviso", "no alert"))]
edges = [{"from": "start", "to": "fetch"}, {"from": "fetch", "to": "parse", "when": "ok", "label": "200"}, {"from": "fetch", "to": "down", "when": "err", "label": "error"}, {"from": "parse", "to": "guard", "when": "ok", "label": "ok"}, {"from": "parse", "to": "layout", "when": "bad", "label": "no element"},
         {"from": "guard", "to": "compare", "when": "ok", "label": "ok"}, {"from": "guard", "to": "suspect", "when": "sus", "label": "suspicious"}, {"from": "compare", "to": "notify", "when": "alert", "label": "alert"}, {"from": "compare", "to": "quiet", "when": "quiet", "label": "nothing"}]
d = P[0][2]
fields = [sel("product", [(k, B(v["name"], v["name"])) for k, v in W.items()], B("Produto", "Product")), txt("price", d["price"], B("Preço na página (R$)", "Price on the page (R$)")), sel("stock", [("in", B("Em estoque", "In stock")), ("out", B("Esgotado", "Out of stock"))], B("Estoque", "Stock")),
          sel("page", [("ok", B("Página normal", "Normal page")), ("500", B("Servidor com erro 500", "Server error 500")), ("layout", B("Layout mudou", "Layout changed"))], B("Estado da loja", "Shop state"))]
build(HERE, "34-monitor-preco-estoque", B("Monitor de preço e estoque com alerta que não enche o saco", "Price and stock monitor whose alerts are worth reading"), B("Python · HTTP · histórico", "Python · HTTP · history"),
      B("A cada hora o script abre a página de cada produto, lê preço e estoque, compara com o histórico e só avisa quando importa: queda grande, meta atingida, volta ao estoque. Se a loja mudar o layout, o preço dá um salto absurdo ou o servidor cair, ele não grava lixo: avisa o que houve (o erro de servidor só depois de 3 falhas seguidas).",
        "Every hour the script opens each product page, reads price and stock, compares with the history and only alerts when it matters: a big drop, a target reached, back in stock. If the shop changes its layout, the price jumps absurdly or the server goes down, it does not save garbage: it says what happened (a server error only after 3 failures in a row)."),
      B("Execução agendada (a cada hora)", "Scheduled run (every hour)"),
      B("O histórico (3 produtos, preços de partida) vale enquanto a página está aberta. Rode os exemplos em ordem; o 5 precisa de 3 cliques para virar alerta. Metas: notebook R$ 3.500, fone R$ 299, cafeteira R$ 450.", "History (3 products, starting prices) lasts while the page is open. Run the examples in order; example 5 needs 3 clicks to become an alert. Targets: laptop R$ 3,500, headphones R$ 299, coffee maker R$ 450."),
      [(B(a, b), r) for a, b, r in P], fields, nodes, edges,
      {"problem": B("Acompanhar preço e estoque de produtos à mão é abrir dez abas todo dia. Ferramentas prontas avisam de tudo, o alerta vira ruído e quando a loja muda o site o robô passa a gravar lixo sem ninguém notar.", "Tracking prices and stock by hand means opening ten tabs every day. Off-the-shelf tools alert on everything, the alert becomes noise, and when the shop changes its site the bot starts saving garbage unnoticed."),
       "solution": B("Um monitor em Python (biblioteca padrão): busca com timeout, lê o preço no formato brasileiro, compara com o histórico e dispara só 4 tipos de aviso úteis (queda mínima, meta, volta ao estoque) mais 3 de saúde (layout mudou, fonte fora após 3 falhas, preço suspeito). Meta atingida não se repete enquanto o preço fica abaixo.", "A Python monitor (standard library): fetches with a timeout, reads the Brazilian price format, compares with history and fires only useful alerts (minimum drop, target, back in stock) plus 3 health alerts (layout changed, source down after 3 failures, suspicious price). A reached target is not repeated while the price stays below it."),
       "gain": B("Estimativa, não medição: conferir 10 produtos em 3 lojas à mão leva ~10 min por rodada; 2 rodadas por dia são ~7 h por mês. O script roda em segundos; o ganho real depende de quantas páginas a loja deixa ler (respeite o robots.txt e os termos).", "An estimate, not a measurement: checking 10 products in 3 shops by hand takes ~10 min per round; 2 rounds a day is ~7 h a month. The script runs in seconds; the real gain depends on how many pages the shop lets you read (respect robots.txt and the terms)."),
       "stack": ["Python 3.13", "urllib", "re", "http.server (loja fictícia)"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["python monitor.py data/watchlist.json state.json (agende a cada hora)", "Loja fictícia + 8 ciclos reais: python run_scenarios.py", "Testes: python tests/test_monitor.py"], ["python monitor.py data/watchlist.json state.json (schedule hourly)", "Fictional shop + 8 real cycles: python run_scenarios.py", "Tests: python tests/test_monitor.py"])},
      B("O código é o monitor.py portado para JavaScript linha a linha; a loja e o HTTP são simulados na página, e a lógica foi conferida contra os alertas reais gravados de 8 ciclos feitos com HTTP de verdade contra uma loja local. Produtos, lojas e preços são fictícios. Nada é enviado: o alerta vai para um arquivo local; o envio por e-mail/chat não foi escrito.", "The code is monitor.py ported to JavaScript line by line; the shop and HTTP are simulated on the page, and the logic was checked against the real alerts recorded in 8 cycles over real HTTP against a local shop. Products, shops and prices are fictional. Nothing is sent: the alert goes to a local file; e-mail/chat delivery was not written."),
      recorded, js, ["monitor.py"], "Monitor de preço e estoque com alerta", "Demo interativa de um monitor de preço e estoque que só avisa o que importa.")
