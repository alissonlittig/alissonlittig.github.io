import sys, pathlib, csv
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import nfe_extract as N
n = 0
def check(c, m):
    global n; assert c, m; n += 1; print("ok", m)
recs = N.run(H / "data/pdfs", H / "output"); by = {r["arquivo"]: r for r in recs}
a = by["nf_1024.pdf"]
check(a["status"] == "ok" and a["numero"] == "1024" and a["data"] == "2026-10-05" and a["total"] == 125000 and a["iss"] == 6250 and a["itens"] == 2, "nota correta: campos lidos do PDF e soma confere")
check(by["nf_2210.pdf"]["status"] == "ok" and by["nf_2210.pdf"]["total"] == 390200, "milhar com ponto e vários itens (3x1.200,00 + 4x75,50)")
check("soma dos itens (5.000,00) diferente do total (5.500,00)" in by["nf_3005.pdf"]["problemas"], "total que não bate com os itens é marcado")
check(by["nf_4001.pdf"]["problemas"] == ["CNPJ inválido"], "CNPJ com dígito errado é marcado (e só isso)")
check(by["nf_1024_copia.pdf"]["problemas"] == ["duplicada de nf_1024.pdf"], "mesma nota duas vezes é marcada como duplicada")
check(by["nf_escaneada.pdf"]["status"] == "revisar" and "OCR" in by["nf_escaneada.pdf"]["problemas"][0], "PDF sem texto não vira linha vazia 'ok': pede OCR")
check(N.cnpj_ok("11.222.333/0001-81") and not N.cnpj_ok("11.111.111/1111-11"), "validação de dígitos do CNPJ")
check(N.parse_text("Numero: 7\nData de emissao: 31/02/2026")["problemas"][0] == "data inválida", "data impossível (31/02) é marcada")
rows = list(csv.reader(open(H / "output/notas.csv", encoding="utf-8-sig"), delimiter=";"))
check(len(rows) == 7 and rows[1][6] == "1.250,00", "CSV com cabeçalho + 6 notas, valor em formato BR")
try:
    from openpyxl import load_workbook
    ws = load_workbook(H / "output/notas.xlsx").active
    check(ws["G2"].value == 1250 and ws.max_row == 7, "XLSX: total é número (não texto)")
except ImportError: print("openpyxl ausente: xlsx não testado")
print(f"{n} checks ok")
