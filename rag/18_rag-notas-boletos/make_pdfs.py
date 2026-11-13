"""Gera os PDFs FICTÍCIOS (notas fiscais e boletos) em data/pdfs/ e o gabarito data/gabarito.json. Rode uma vez: python make_pdfs.py
Empresas, CNPJs (formato inventado, 00.xxx), valores e linhas digitáveis são inventados. Condomínio = 1 PDF de 4 páginas (1 boleto por página)."""
import json, pathlib
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

H = pathlib.Path(__file__).parent; OUT = H / "data" / "pdfs"; OUT.mkdir(parents=True, exist_ok=True)
# (arquivo, tipo, emitente, categoria, descrição, data_emissao_ou_pagamento, valor_centavos, situacao, vencimento)
# tipo: nf (nota fiscal, paga na emissão) | boleto (situacao "pago" com data de pagamento, ou "aberto")
M = [("2026-08", "agosto"), ("2026-09", "setembro"), ("2026-10", "outubro"), ("2026-11", "novembro")]
D = []
def boleto(arq, emit, cat, desc, venc, pago, valor): D.append((arq, "boleto", emit, cat, desc, pago or venc, valor, "pago" if pago else "aberto", venc))
def nf(arq, emit, cat, desc, data, valor): D.append((arq, "nf", emit, cat, desc, data, valor, "pago", data))
for (arq, emit, cat, desc, vals) in [
    ("energia", "Luz Sul Energia S.A.", "energia", "Fornecimento de energia elétrica residencial", [(21840, "2026-08-10"), (24195, "2026-09-10"), (19730, "2026-10-09"), (20510, None)]),
    ("internet", "NetFibra Telecom Ltda.", "internet", "Plano de internet banda larga fibra 500 Mega", [(12990, "2026-08-05"), (12990, "2026-09-04"), (12990, "2026-10-06"), (12990, None)]),
    ("agua", "Águas do Vale Saneamento", "água", "Fornecimento de água e coleta de esgoto", [(7420, "2026-08-12"), (8105, "2026-09-11"), (6990, "2026-10-13"), (7700, None)])]:
    for i, (v, pg) in enumerate(vals):
        ym = M[i][0]; venc = f"{ym}-{15 if cat != 'internet' else 8:02d}"
        boleto(f"{arq}_{ym}.pdf", emit, cat, desc, venc, pg, v)
for emit, cat, desc, itens in [
    ("Mercado Bom Preço Ltda.", "supermercado", "Compras de supermercado (alimentos e limpeza)", [("2026-08-14", 31248), ("2026-08-28", 19876), ("2026-09-11", 27603), ("2026-09-25", 34119), ("2026-10-09", 25560), ("2026-10-23", 28934)]),
    ("Empório Santa Clara Ltda.", "supermercado", "Compras de hortifrúti e padaria", [("2026-09-02", 9420), ("2026-10-16", 11870)]),
    ("Farmácia Saúde Plena Ltda.", "farmácia", "Medicamentos e produtos de higiene", [("2026-08-21", 8990), ("2026-10-02", 14325), ("2026-10-30", 5640)]),
    ("Posto Estrada Azul Ltda.", "combustível", "Abastecimento de gasolina comum", [("2026-08-17", 25000), ("2026-09-14", 23050), ("2026-10-12", 26500)]),
    ("StreamMax Serviços Digitais", "assinatura", "Assinatura mensal de streaming de vídeo", [("2026-08-03", 3990), ("2026-09-03", 3990), ("2026-10-03", 3990)]),
    ("Papelaria Central Ltda.", "papelaria", "Material de escritório e papelaria", [("2026-09-05", 8730)]),
    ("Escritório Contábil Ribeiro S/S", "contabilidade", "Honorários contábeis mensais (serviço)", [("2026-08-07", 45000), ("2026-09-07", 45000), ("2026-10-07", 45000)])]:
    for d, v in itens: nf(f"nf_{emit.split()[0].lower().replace('í','i').replace('á','a').replace('ó','o').replace('ê','e')}_{d}.pdf", emit, cat, desc, d, v)
COND = [("2026-08-10", "2026-08-08", 62000), ("2026-09-10", "2026-09-09", 62000), ("2026-10-10", "2026-10-09", 62000), ("2026-11-10", None, 64500)]  # (venc, pago, valor); nov em aberto, vencido
for venc, pago, v in COND: boleto("condominio_2026_ago_nov.pdf", "Condomínio Residencial Ipê", "condomínio", "Taxa condominial ordinária", venc, pago, v)


def brl(c): return "R$ " + f"{c // 100:,}".replace(",", ".") + f",{c % 100:02d}"
def br(d): return d[8:] + "/" + d[5:7] + "/" + d[:4]


def cnpj(name): n = sum(map(ord, name)); return f"00.{n % 900 + 100:03d}.{(n * 7) % 900 + 100:03d}/0001-{n % 90 + 10}"


def draw(c, d, num):
    arq, tipo, emit, cat, desc, data, valor, sit, venc = d; y = 790
    def line(txt, size=11, bold=False, dy=20):
        nonlocal y; c.setFont("Helvetica-Bold" if bold else "Helvetica", size); c.drawString(56, y, txt); y -= dy
    if tipo == "nf":
        line("NOTA FISCAL ELETRÔNICA (DOCUMENTO FICTÍCIO)", 14, True, 28); line(f"Número: {num:06d}"); line(f"Emitente: {emit}"); line(f"CNPJ: {cnpj(emit)}"); line(f"Data de emissão: {br(data)}")
        line(f"Descrição: {desc}"); line(f"Valor dos tributos (aprox.): {brl(valor * 17 // 100)}"); line(f"Desconto: R$ 0,00"); line(f"Valor total: {brl(valor)}", 12, True); line("Pagamento: à vista, no ato da emissão", 10)
    else:
        line("BOLETO BANCÁRIO (DOCUMENTO FICTÍCIO)", 14, True, 28); line(f"Beneficiário: {emit}"); line(f"CNPJ: {cnpj(emit)}"); line(f"Descrição: {desc}"); line(f"Vencimento: {br(venc)}")
        line(f"Valor do documento: {brl(valor)}", 12, True); line("Juros e multa: R$ 0,00"); dig = f"{34191 + num:05d}.{79001 + num * 13:05d} 43{num:04d}.{200000 + num * 7:06d} 41234.{500000 + num * 11:06d} 8 {9000 + num:04d}{valor:010d}"
        line(f"Linha digitável: {dig}", 9)
        line("Situação: PAGO em " + br(data) if sit == "pago" else "Situação: EM ABERTO", 11, True)
    c.setFont("Helvetica", 8); c.drawString(56, 40, "Documento gerado para estudo. Empresa, CNPJ e valores inventados.")


def main():
    gab = []; by = {}
    for n, d in enumerate(D, start=1): by.setdefault(d[0], []).append((n, d))
    for arq, docs in by.items():
        c = canvas.Canvas(str(OUT / arq), pagesize=A4)
        for page, (n, d) in enumerate(docs, start=1):
            draw(c, d, n); c.showPage()
            gab.append({"file": arq, "page": page, "kind": d[1], "issuer": d[2], "category": d[3], "date": d[5], "amount": d[6], "status": d[7], "due": d[8] if d[1] == "boleto" else None})
        c.save()
    (H / "data" / "gabarito.json").write_text(json.dumps(gab, ensure_ascii=False, indent=1), "utf-8"); print(len(by), "PDFs,", len(gab), "documentos")


if __name__ == "__main__": main()
