"""Extrai o texto dos PDFs reais, roda o nfe_extract.py e grava as saídas esperadas; gera a demo interativa."""
import pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
import nfe_extract as N
from _build_lib import B, area, build
T = lambda n: N.read_pdf(HERE / "data/pdfs" / n).replace("\r", "")
P = [("1. Nota correta", "1. Correct invoice", T("nf_1024.pdf")), ("2. Vários itens, milhar", "2. Several items, thousands", T("nf_2210.pdf")), ("3. Total não bate", "3. Total does not add up", T("nf_3005.pdf")),
     ("4. CNPJ inválido", "4. Invalid CNPJ", T("nf_4001.pdf")), ("5. Texto sem campos", "5. Text without fields", "Recibo avulso\nvalor combinado, sem numero")]
recorded = []
for i, (_, _, t) in enumerate(P):
    rec = {"input": {"text": t}, "expect": N.parse_text(t)}
    if i == 0: rec["fresh"] = True
    recorded.append(rec)
nodes = [("start", "PDF text", "pdf", 0, 0, B("texto da página", "page text")), ("fields", "Read fields", "code", 1, 0, B("número, data, CNPJ, itens", "number, date, CNPJ, items")), ("validate", "Checks pass?", "if", 2, 0, B("CNPJ, soma, data", "CNPJ, sum, date")),
         ("row", "Spreadsheet row", "sheet", 3, 0, B("status ok", "status ok")), ("flag", "Mark 'revisar'", "bell", 3, 1, B("humano confere", "a person checks"))]
edges = [{"from": "start", "to": "fields"}, {"from": "fields", "to": "validate"}, {"from": "validate", "to": "row", "when": "ok", "label": "ok"}, {"from": "validate", "to": "flag", "when": "review", "label": "problem"}]
build(HERE, "39-pdf-notas-fiscais-planilha", B("Notas fiscais em PDF viram planilha, com conferência", "PDF invoices become a spreadsheet, with checks"), B("Python · pypdf · openpyxl", "Python · pypdf · openpyxl"),
      B("O script lê uma pasta de PDFs de notas fiscais (com texto), extrai número, data, prestador, CNPJ, itens e totais e grava uma planilha CSV e XLSX. Antes de aceitar uma linha ele confere o dígito do CNPJ, se a soma dos itens fecha com o total, se a data existe e se a nota não está duplicada. O que não confere vai marcado 'revisar'. PDF só de imagem não é adivinhado: pede OCR.",
        "The script reads a folder of invoice PDFs (with text), extracts number, date, issuer, CNPJ, items and totals and writes a CSV and XLSX spreadsheet. Before accepting a row it checks the CNPJ check digits, that the item sum matches the total, that the date exists and that the invoice is not a duplicate. Anything that fails is marked 'revisar'. Image-only PDFs are not guessed at: they ask for OCR."),
      B("Evento: PDFs novos na pasta", "Event: new PDFs in the folder"),
      B("A demo recebe o texto que o script extraiu de PDFs reais de exemplo. Edite o texto (troque um valor, estrague o CNPJ) e veja a conferência pegar.", "The demo takes the text the script extracted from real sample PDFs. Edit the text (change an amount, break the CNPJ) and watch the check catch it."),
      [(B(a, b), {"text": t}) for a, b, t in P], [area("text", P[0][2], B("Texto da nota (extraído do PDF)", "Invoice text (extracted from the PDF)"), 12)], nodes, edges,
      {"problem": B("Alguém abre cada PDF e digita número, data e valores numa planilha. Dá erro de digitação, nota duplicada e total que não fecha, e só se descobre no fechamento.", "Someone opens each PDF and types number, date and amounts into a spreadsheet. Typos, duplicates and totals that do not add up only show at month end."),
       "solution": B("Extração do texto com pypdf, regras de leitura por rótulo, validação do CNPJ e da soma, detecção de duplicada e marcação 'revisar' para qualquer dúvida. O mesmo formato de nota sai sempre na mesma planilha.", "Text extraction with pypdf, label-based reading rules, CNPJ and sum validation, duplicate detection and a 'revisar' mark for any doubt. The same invoice layout always lands in the same spreadsheet."),
       "gain": B("Estimativa, não medição: ~4 min por nota digitada; 60 notas por mês são ~4 h. O script lê em segundos, mas só funciona bem em notas com o mesmo layout e com texto: layouts novos exigem ajustar as regras e escaneados exigem OCR (não incluído).", "An estimate, not a measurement: ~4 min per typed invoice; 60 a month is ~4 h. The script reads in seconds, but it only works well on invoices with the same layout and with text: new layouts need the rules adjusted and scans need OCR (not included)."),
       "stack": ["Python 3.13", "pypdf", "openpyxl", "reportlab (só gera os exemplos)"]},
      {"title": B("Como rodar", "How to run"), "steps": B(["pip install pypdf openpyxl reportlab", "python make_samples.py", "python nfe_extract.py data/pdfs output", "Testes: python tests/test_nfe.py"], ["pip install pypdf openpyxl reportlab", "python make_samples.py", "python nfe_extract.py data/pdfs output", "Tests: python tests/test_nfe.py"])},
      B("O código é o nfe_extract.py portado para JavaScript; a leitura do PDF em si (pypdf) não roda no navegador, então a demo parte do texto extraído de PDFs reais; a lógica foi conferida contra as saídas reais do Python em 5 casos. Notas e CNPJs fictícios (dígitos válidos, empresas inexistentes). Layout de nota municipal real varia muito: não foi testado.", "The code is nfe_extract.py ported to JavaScript; the PDF reading itself (pypdf) does not run in the browser, so the demo starts from text extracted from real PDFs; the logic was checked against the real Python outputs in 5 cases. Fictional invoices and CNPJs (valid digits, non-existent companies). Real municipal invoice layouts vary a lot: not tested."),
      recorded, (HERE / "demo_logic.js").read_text("utf-8"), ["nfe_extract.py"], "Notas fiscais PDF para planilha", "Demo interativa: notas fiscais em PDF viram planilha com conferência de CNPJ e totais.")
