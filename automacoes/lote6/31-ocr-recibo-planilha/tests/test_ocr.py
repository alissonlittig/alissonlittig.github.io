import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, ocr_recibo, make_samples
from openpyxl import load_workbook

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

# verdade de campo: o que o make_samples DESENHOU, calculado sem passar pelo OCR
def truth(k):
    s, c, d, it, ft = make_samples.RECIBOS[k]; return {"loja": s, "cnpj": c.replace("CNPJ ", ""), "data": "-".join(d.split()[0].split("/")[::-1]), "qtds": [q for _, q, _ in it], "soma": round(sum(q * float(u.replace(",", ".")) for _, q, u in it), 2)}
for k, rk in (("recibo_01", "ok"), ("recibo_02", "qtd_inferida"), ("recibo_04", "feira")):
    t, r = truth(k), R[rk]
    check(r["status"] == "ok" and r["loja"] == t["loja"] and r["cnpj"] == t["cnpj"] and r["data"] == t["data"] and [i["qtd"] for i in r["itens"]] == t["qtds"] and r["total"] == r["soma"] == t["soma"], f"{k}: OCR real lê loja, CNPJ, data, quantidades e total = o que foi desenhado ({t['soma']})")
check(any("PASTA A4: quantidade 2 inferida" in x for x in R["qtd_inferida"]["notas"]), "OCR perdeu o '2x' da PASTA A4: quantidade inferida do total/unitário e ANOTADA")
w = R["total_errado"]; check(w["status"] == "revisar" and w["avisos"] == ["soma dos itens 221.40 difere do total impresso 220.00"], "total impresso (220,00) não bate com a soma (221,40): vai para revisão, não é 'corrigido'")
b = R["borrado"]; check(b["status"] == "revisar" and b["itens"] == [] and b["total"] is None and "nenhum item lido" in b["avisos"], "imagem ruim: nada inventado, vai para revisão com os motivos")
P = lambda t, c=0.9: ocr_recibo.parse(t, c)
check(P("LOJA\n1x ARROZ 28,90 28,90\nTOTAL R$ 28,90\n01/02/2026")["status"] == "ok", "parser: recibo mínimo coerente é aceito")
check("data não lida" in P("LOJA\n1x A 1,00 1,00\nTOTAL 1,00\n31/02/2026")["avisos"], "parser: data impossível (31/02) não passa")
check(any("3 x 2.00 = 6.00" in a for a in P("LOJA\n3x A 2,00 7,00\nTOTAL 7,00\n01/02/2026")["avisos"]), "parser: qtd x unitário diferente do total da linha é apontado")
check("confiança média do OCR baixa" in " ".join(P("LOJA\n1x A 1,00 1,00\nTOTAL 1,00\n01/02/2026", 0.5)["avisos"]), "parser: confiança baixa do OCR vira aviso")
check(ocr_recibo.group_lines([(100, 5, "TOTAL", .9), (102, 80, "9,90", .8), (160, 5, "X", .7)])[0] == "TOTAL 9,90\nX", "caixas na mesma altura viram uma linha, da esquerda p/ direita")
wb = load_workbook(pathlib.Path(__file__).resolve().parent.parent / "output" / "recibos.xlsx")
check(wb.sheetnames == ["Itens", "Recibos"] and wb["Itens"].max_row == 1 + 4 + 3 + 2 + 3 and wb["Recibos"].max_row == 6, "xlsx: aba Itens com 12 linhas (4+3+2+3) e aba Recibos com 5")
check([r[8].value for r in wb["Recibos"].iter_rows(min_row=2)] == ["ok", "ok", "revisar", "ok", "revisar"], "xlsx: status por recibo gravado (2 em revisão)")
print(n, "ok")
