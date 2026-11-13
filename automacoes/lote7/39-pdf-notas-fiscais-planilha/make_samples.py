"""Gera as notas de exemplo (fictícias) em data/pdfs com reportlab. Um dos PDFs é só imagem (sem texto)."""
import pathlib
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
OUT = pathlib.Path(__file__).parent / "data/pdfs"; OUT.mkdir(parents=True, exist_ok=True)


def nota(name, numero, data, prest, cnpj, itens, total, iss):
    c = canvas.Canvas(str(OUT / name), pagesize=A4); y = 790
    lines = ["NOTA FISCAL DE SERVICO ELETRONICA", f"Numero: {numero}", f"Data de emissao: {data}", f"Prestador: {prest}", f"CNPJ: {cnpj}", "Descricao  Qtd  Valor unitario"] + [f"{d} {q} x {v}" for d, q, v in itens] + [f"Valor total: R$ {total}", f"ISS: R$ {iss}"]
    for ln in lines: c.drawString(60, y, ln); y -= 22
    c.save()


nota("nf_1024.pdf", 1024, "05/10/2026", "Grafica Norte Ltda", "11.222.333/0001-81", [("Impressao de folders", 2, "450,00"), ("Arte final", 1, "350,00")], "1.250,00", "62,50")
nota("nf_2210.pdf", 2210, "12/10/2026", "Oficina Beta ME", "44.555.666/0001-81", [("Manutencao preventiva", 3, "1.200,00"), ("Pecas", 4, "75,50")], "3.902,00", "195,10")
nota("nf_3005.pdf", 3005, "20/10/2026", "Consultoria Delta SA", "77.888.999/0001-81", [("Consultoria mensal", 1, "5.000,00")], "5.500,00", "275,00")
nota("nf_4001.pdf", 4001, "28/10/2026", "Papelaria Sul Ltda", "12.345.000/0001-99", [("Resmas A4", 10, "27,90")], "279,00", "13,95")
nota("nf_1024_copia.pdf", 1024, "05/10/2026", "Grafica Norte Ltda", "11.222.333/0001-81", [("Impressao de folders", 2, "450,00"), ("Arte final", 1, "350,00")], "1.250,00", "62,50")
c = canvas.Canvas(str(OUT / "nf_escaneada.pdf"), pagesize=A4); c.rect(60, 600, 400, 150); c.save()  # só desenho, sem texto
print("ok", sorted(p.name for p in OUT.iterdir()))
