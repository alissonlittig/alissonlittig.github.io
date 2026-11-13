"""OCR de recibo -> planilha. Lê a imagem com RapidOCR (modelos locais ONNX, sem chave, sem nuvem), junta as caixas de texto em linhas,
extrai loja, CNPJ, data, itens e total, CONFERE a conta (qtd x unitário, soma dos itens x total impresso, data válida) e marca "revisar" o que não fecha,
em vez de gravar número duvidoso como certo. Saída: Excel com abas Itens e Recibos.
Amostras: recibos fictícios gerados por make_samples.py (não são notas reais).
Uso: python ocr_recibo.py [pasta_ou_imagem ...] [-o saida.xlsx]   (padrão: amostras/ -> output/recibos.xlsx)"""
import datetime as dt, json, pathlib, re, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

MONEY = r"\d{1,6}[.,]\d{2}"; CONF_MIN = 0.7


def ocr_boxes(path, engine=[]):
    """-> [(y_centro, x_esq, texto, conf)] já lidos da imagem. O motor é criado uma vez."""
    if not engine:
        from rapidocr_onnxruntime import RapidOCR; engine.append(RapidOCR())
    res, _ = engine[0](str(path)); return [(sum(p[1] for p in b) / 4, b[0][0], t, float(c)) for b, t, c in (res or [])]


def group_lines(boxes, tol=23):
    """Caixas na mesma altura (+-tol px do centro da linha) viram uma linha, da esquerda para a direita. -> (texto, conf_media)."""
    rows = []
    for y, x, t, c in sorted(boxes):
        if rows and abs(y - sum(r[0] for r in rows[-1]) / len(rows[-1])) <= tol: rows[-1].append((y, x, t, c))
        else: rows.append([(y, x, t, c)])
    return "\n".join(" ".join(t for _, _, t, _ in sorted(r, key=lambda b: b[1])) for r in rows), round(sum(b[3] for b in boxes) / len(boxes), 3) if boxes else 0.0


def money(s): return round(float(s.replace(",", ".")), 2)


def parse(text, conf):
    """Texto das linhas (como o OCR devolveu) + confiança média -> dict com itens, total e avisos. Nada é corrigido às escondidas."""
    L = [l.strip() for l in text.splitlines() if l.strip()]; av = []
    loja = L[0] if L else ""; m = re.search(r"CNPJ\s*([\d./-]+)", text); cnpj = m.group(1) if m else None
    d = re.search(r"(\d{2})/(\d{2})/(\d{4})", text); data = None
    if d:
        try: data = dt.date(int(d.group(3)), int(d.group(2)), int(d.group(1))).isoformat()
        except ValueError: pass
    if not data: av.append("data não lida")
    itens, total, notas = [], None, []
    for l in L[1:]:
        if re.search(r"TOTAL", l, re.I):
            nums = re.findall(MONEY, l)
            if nums: total = money(nums[-1])
            continue
        m = re.match(rf"^(\d{{1,2}})\s*[xX]\s*(.*?)\s*({MONEY})(?:\s+({MONEY}))?$", l)
        if m: q, desc = int(m.group(1)), m.group(2).strip(); unit, tot = (money(m.group(3)), money(m.group(4))) if m.group(4) else (None, money(m.group(3)))
        else:  # o OCR às vezes perde o "2x" do começo: com unitário e total na linha dá para inferir a quantidade, e isso fica anotado
            m = re.match(rf"^(.*[A-Za-z].*?)\s+({MONEY})\s+({MONEY})$", l)
            if not m: continue
            desc, unit, tot = m.group(1).strip(), money(m.group(2)), money(m.group(3)); q = round(tot / unit) if unit else 0
            if q < 1 or abs(q * unit - tot) > 0.01: av.append(f"{desc}: quantidade não lida e não dá para inferir ({unit:.2f} -> {tot:.2f})"); continue
            notas.append(f"{desc}: quantidade {q} inferida de {tot:.2f} / {unit:.2f}")
        if unit is not None and abs(q * unit - tot) > 0.01: av.append(f"{desc or '?'}: {q} x {unit:.2f} = {q * unit:.2f}, mas a linha diz {tot:.2f}")
        itens.append({"desc": desc, "qtd": q, "unit": unit, "total": tot})
    soma = round(sum(i["total"] for i in itens), 2)
    if not itens: av.append("nenhum item lido")
    if total is None: av.append("total não lido")
    elif itens and abs(soma - total) > 0.01: av.append(f"soma dos itens {soma:.2f} difere do total impresso {total:.2f}")
    if conf < CONF_MIN: av.append(f"confiança média do OCR baixa ({conf:.2f} < {CONF_MIN})")
    return {"loja": loja, "cnpj": cnpj, "data": data, "itens": itens, "soma": soma, "total": total, "conf": conf, "avisos": av, "notas": notas, "status": "revisar" if av else "ok"}


def process(path):
    text, conf = group_lines(ocr_boxes(path)); r = parse(text, conf); r["arquivo"] = pathlib.Path(path).name; r["texto"] = text; return r


def write_xlsx(rs, out):
    wb = Workbook(); it = wb.active; it.title = "Itens"; it.append(["Arquivo", "Loja", "Data", "Descrição", "Qtd", "Unitário", "Total", "Status do recibo"])
    for r in rs:
        for i in r["itens"]: it.append([r["arquivo"], r["loja"], r["data"], i["desc"], i["qtd"], i["unit"], i["total"], r["status"]])
    rc = wb.create_sheet("Recibos"); rc.append(["Arquivo", "Loja", "CNPJ", "Data", "Itens", "Soma dos itens", "Total impresso", "Confiança OCR", "Status", "Avisos", "Notas"])
    red = PatternFill("solid", fgColor="F8D7DA")
    for r in rs:
        rc.append([r["arquivo"], r["loja"], r["cnpj"], r["data"], len(r["itens"]), r["soma"], r["total"], r["conf"], r["status"], "; ".join(r["avisos"]), "; ".join(r["notas"])])
        if r["status"] == "revisar":
            for c in rc[rc.max_row]: c.fill = red
    for s in wb:
        for c in s[1]: c.font = Font(bold=True)
        s.freeze_panes = "A2"
        for col in s.columns: s.column_dimensions[col[0].column_letter].width = 22
    wb.save(out)


if __name__ == "__main__":
    here = pathlib.Path(__file__).parent; a = sys.argv[1:]; out = here / "output" / "recibos.xlsx"
    if "-o" in a: k = a.index("-o"); out = pathlib.Path(a[k + 1]); a = a[:k] + a[k + 2:]
    files = []
    for p in (a or [str(here / "amostras")]): p = pathlib.Path(p); files += sorted(p.glob("*.png")) if p.is_dir() else [p]
    rs = [process(f) for f in files]; out.parent.mkdir(exist_ok=True); write_xlsx(rs, out)
    for r in rs: print(f"{r['arquivo']:<24} {r['status']:<8} total={r['total']} soma={r['soma']} conf={r['conf']}  {'; '.join(r['avisos'])}")
    print("->", out)
