"""Gera data/vendas.csv (fictício, semente fixa) e data/tests.json (valor esperado calculado SEM usar o parser)."""
import csv, json, pathlib, random
H = pathlib.Path(__file__).parent / "data"; H.mkdir(exist_ok=True)
R = random.Random(2026)
PROD = {"Escrita": [("Caneta Gel", 6), ("Lapiseira", 14), ("Marca Texto", 5)], "Papelaria": [("Resma A4", 32), ("Bloco de Notas", 9), ("Caderno Espiral", 21)],
        "Escritório": [("Grampeador", 27), ("Pasta Arquivo", 12), ("Organizador de Mesa", 38)], "Arte": [("Tinta Guache", 18), ("Pincel Chato", 11), ("Papel Canson", 24)]}
CID = ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"]; VEN = ["Ana", "Bruno", "Carla", "Diego"]; MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho"]
rows = []
for n in range(96):
    m = n * 6 // 96; cat = R.choice(list(PROD)); p, preco = R.choice(PROD[cat]); qtd = R.randint(1, 12)
    rows.append([f"P-{1001 + n}", f"2026-{m + 1:02d}-{R.randint(1, 28):02d}", MES[m], R.choice(CID), cat, p, R.choice(VEN), qtd, preco, qtd * preco])
with open(H / "vendas.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f); w.writerow(["pedido", "data", "mes", "cidade", "categoria", "produto", "vendedor", "qtd", "preco", "total"]); w.writerows(rows)
I = dict(cidade=3, categoria=4, produto=5, vendedor=6, mes=2, qtd=7, preco=8, total=9)
S = lambda f=lambda r: True, c="total": sum(r[I[c]] for r in rows if f(r))
G = lambda col, f=lambda r: True, c="total": sorted({k: sum(r[I[c]] for r in rows if f(r) and r[I[col]] == k) for k in {r[I[col]] for r in rows if f(r)}}.items(), key=lambda p: (-p[1], p[0]))
eq = lambda col, v: (lambda r: r[I[col]] == v)
T = []
def add(q, kind, exp): T.append({"q": q, "kind": kind, "expect": exp})
add("Quanto vendemos no total?", "value", S())
add("Qual o faturamento de Curitiba?", "value", S(eq("cidade", "Curitiba")))
add("Quanto a Ana vendeu em março?", "value", S(lambda r: r[I["vendedor"]] == "Ana" and r[I["mes"]] == "março"))
add("Quantos pedidos foram feitos em Londrina?", "value", sum(1 for r in rows if r[I["cidade"]] == "Londrina"))
add("Quantas unidades de caneta gel foram vendidas?", "value", S(eq("produto", "Caneta Gel"), "qtd"))
add("Qual a média de venda por pedido em Maringá?", "value", round(S(eq("cidade", "Maringá")) / sum(1 for r in rows if r[I["cidade"]] == "Maringá"), 2))
add("Qual a maior venda do Bruno?", "value", max(r[I["total"]] for r in rows if r[I["vendedor"]] == "Bruno"))
add("Qual a menor venda de Arte?", "value", min(r[I["total"]] for r in rows if r[I["categoria"]] == "Arte"))
add("Total vendido de grampeador em maio", "value", S(lambda r: r[I["produto"]] == "Grampeador" and r[I["mes"]] == "maio"))
add("Quantos pedidos tiveram a Carla como vendedora?", "value", sum(1 for r in rows if r[I["vendedor"]] == "Carla"))
add("Qual o faturamento de Escrita em abril?", "value", S(lambda r: r[I["categoria"]] == "Escrita" and r[I["mes"]] == "abril"))
add("Quantas unidades vendemos em janeiro?", "value", S(eq("mes", "janeiro"), "qtd"))
add("Qual cidade vendeu mais?", "first", G("cidade")[0][0])
add("Qual vendedor vendeu menos?", "first", G("vendedor")[-1][0])
add("Qual categoria faturou mais em junho?", "first", G("categoria", eq("mes", "junho"))[0][0])
add("Qual produto vendeu mais unidades?", "first", sorted({k: S(eq("produto", k), "qtd") for k in {r[5] for r in rows}}.items(), key=lambda p: (-p[1], p[0]))[0][0])
add("Qual mês teve o maior faturamento?", "first", G("mes")[0][0])
add("Faturamento por cidade", "first", G("cidade")[0][0])
add("Total por categoria em Curitiba", "first", G("categoria", eq("cidade", "Curitiba"))[0][0])
add("Vendas por mês", "first", "janeiro")
add("Qual a margem de lucro?", "refuse", None)
add("Quanto gastamos com frete?", "refuse", None)
add("Qual cliente comprou mais?", "refuse", None)
add("Quantos pedidos foram feitos em Florianópolis?", "refuse", None)
add("Como fazer um bolo de cenoura?", "refuse", None)
add("Qual o estoque de canetas?", "refuse", None)

X = []
def addx(q, kind, exp): X.append({"q": q, "kind": kind, "expect": exp, "set": "extra"})
addx("Quanto a loja de Londrina arrecadou em fevereiro?", "value", S(lambda r: r[I["cidade"]] == "Londrina" and r[I["mes"]] == "fevereiro"))
addx("Me diz o ticket médio do Diego", "value", round(S(eq("vendedor", "Diego")) / sum(1 for r in rows if r[I["vendedor"]] == "Diego"), 2))
addx("Número de pedidos da categoria Escritório", "value", sum(1 for r in rows if r[I["categoria"]] == "Escritório"))
addx("Quanto rendeu a Resma A4?", "value", S(eq("produto", "Resma A4")))
addx("Quem é o melhor vendedor?", "first", G("vendedor")[0][0])
addx("Em qual filial se vendeu menos?", "first", G("cidade")[-1][0])
addx("Soma das unidades vendidas por produto", "first", sorted({k: S(eq("produto", k), "qtd") for k in {r[5] for r in rows}}.items(), key=lambda p: (-p[1], p[0]))[0][0])
addx("Qual o preço médio da Caneta Gel?", "value", round(S(eq("produto", "Caneta Gel"), "preco") / sum(1 for r in rows if r[5] == "Caneta Gel"), 2))
addx("Qual o lucro de Curitiba?", "refuse", None)
addx("Quantos clientes novos tivemos em março?", "refuse", None)
addx("Qual a previsão de vendas para julho?", "refuse", None)
T += X
(H / "tests.json").write_text(json.dumps(T, ensure_ascii=False, indent=1), "utf-8"); print(len(rows), "linhas,", len(T), "perguntas; total geral", S())
