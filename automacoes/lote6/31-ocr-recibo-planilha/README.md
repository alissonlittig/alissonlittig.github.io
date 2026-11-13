# 31 · Receipt OCR to spreadsheet / OCR de recibo para planilha

![demo](prints/demo_1366.png)

## EN
**Problem.** Typing receipts into a spreadsheet is slow and error-prone; an OCR that "reads everything" without checking stores wrong numbers silently.

**What it does.** `ocr_recibo.py`:
1. Reads the image with **RapidOCR** (local ONNX models, no key, no cloud).
2. Groups text boxes by height into lines, extracts store, tax ID, date, items and total by rules.
3. **Checks the math**: qty x unit = line total, sum of items = printed total, valid date, OCR confidence >= 0.7. If the OCR dropped the leading `2x` but unit and total are on the line, the quantity is inferred and recorded in `Notas`.
4. Anything that does not add up gets status `revisar` (human review) with the reasons; nothing is silently "corrected".
5. Writes an `.xlsx` (sheets `Itens`, `Recibos`; review rows highlighted).

**Real result on the 5 samples (`python ocr_recibo.py`).** 3 `ok` (87.30, 123.00, 53.10), 1 `revisar` (printed total 220.00 vs items 221.40, wrong on purpose), 1 `revisar` (blurry, tilted, noisy image: nothing readable, nothing invented).

**Honest gain.** ~1 min/receipt typing vs seconds (estimate); review items still need a person.

**Run.** `pip install rapidocr-onnxruntime openpyxl pillow` · `python make_samples.py` · `python ocr_recibo.py` · `python run_scenarios.py` · `python tests/test_ocr.py` (13 checks, incl. ground truth from what was drawn). Demo: `../_demo/demos/31-ocr-recibo-planilha/` (OCR text is recorded from the real run; the browser re-runs extraction and checks).

**Limits.** Samples are **fictional receipts I generated** (clean monospace font, fake stores/tax IDs), not photos of real receipts; real thermal paper will do worse. Rules fit this layout. Tesseract was not used (not installed).

## PT
**Problema.** Digitar recibo é lento e erra; OCR que "lê tudo" sem conferir grava número errado sem ninguém ver.

**O que faz.** OCR local (RapidOCR), linhas por altura, extração por regras, **conferência da conta** (qtd × unitário, soma × total impresso, data válida, confiança do OCR). Quantidade perdida pelo OCR com unitário e total na linha é inferida e anotada. O que não fecha vira `revisar` com o motivo; nada é "corrigido" em silêncio. Saída em Excel (abas `Itens` e `Recibos`).

**Resultado real nas 5 amostras.** 3 ok, 1 revisar (total impresso 220,00 contra itens 221,40, errado de propósito), 1 revisar (imagem borrada/torta: nada legível, nada inventado).

**Como rodar:** comandos acima (13 verificações). **Limites:** recibos **fictícios gerados por mim**, em fonte limpa, não fotos de notas reais; regras servem a este layout; Tesseract não foi usado (não instalado).
