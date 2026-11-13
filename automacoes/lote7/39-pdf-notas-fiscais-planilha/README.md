# 39 · Invoice PDFs to spreadsheet / Notas fiscais em PDF para planilha

![demo](prints/demo_1366.png)

## EN
**Problem.** Someone types number, date and amounts from each PDF; typos and duplicates surface at month end.
**What it does.** `nfe_extract.py` reads text PDFs (pypdf), extracts number, date, issuer, CNPJ, items, total, ISS; checks CNPJ check digits, item sum = total, valid date, duplicates (same CNPJ + number). Writes `notas.csv` (;-separated, BR format) and `notas.xlsx` (numeric totals). Failures are marked `revisar`; image-only PDFs ask for OCR instead of becoming empty rows.
**Honest gain.** Estimate: ~4 min per invoice; 60/month ≈ 4 h. Works only for the sample layout and PDFs with text; real municipal layouts need rule tweaks (not tested).
**Not done.** OCR.
```
pip install pypdf openpyxl reportlab
python make_samples.py
python nfe_extract.py data/pdfs output
python tests/test_nfe.py     # 10 checks
```
Demo (starts from text extracted from the real sample PDFs): `../_demo/demos/39-pdf-notas-fiscais-planilha/`. Fictional invoices. Not published.

## PT
**Problema.** Digitar número, data e valores de cada PDF gera erro e duplicidade.
**O que faz.** `nfe_extract.py` lê PDFs com texto, extrai os campos, confere dígito do CNPJ, soma dos itens, data e duplicadas; grava `notas.csv` e `notas.xlsx`. O que falha vai `revisar`; PDF escaneado pede OCR.
**Ganho (honesto).** Estimativa: ~4 min por nota; 60/mês ≈ 4 h. Só para o layout de exemplo; layouts reais exigem ajuste.
**Não feito.** OCR.
**Como rodar.** Comandos acima. Dados fictícios. Não publicado.
