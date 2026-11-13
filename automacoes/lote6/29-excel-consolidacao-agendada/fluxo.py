"""Fluxo de planilhas agendado (estilo Power Automate / Excel): pega os CSV de vendas das filiais numa pasta de entrada, valida linha a linha,
consolida num Excel com fórmulas (openpyxl) e manda o que falhou para a aba Erros. Arquivo já processado (mesmo conteúdo) é ignorado.
Agenda: 'daily@HH:MM' ou 'every:Nm'. Uso: python fluxo.py [pasta_entrada] [saida.xlsx] [--agendar daily@07:30]  (padrão: fixtures/ok, roda uma vez)"""
import csv, datetime as dt, io, json, pathlib, re, sys, time
from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

COLS = ["data", "produto", "qtd", "preco_unit"]


def fnv(text):  # hash simples (FNV-1a 32 bits) para reconhecer arquivo repetido; igual no JS da demo
    h = 2166136261
    for ch in text.encode("utf-8"): h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return format(h, "08x")


def parse_file(name, text):
    """-> (linhas_ok, erros, rejeitado_motivo). Falta coluna = arquivo inteiro rejeitado; linha ruim = só ela vai para Erros."""
    rd = csv.DictReader(io.StringIO(text)); missing = [c for c in COLS if c not in (rd.fieldnames or [])]
    if missing: return [], [], "faltam colunas: " + ", ".join(missing)
    ok, err = [], []
    for n, r in enumerate(rd, start=2):
        try:
            ds = (r["data"] or "").strip(); p = (r["produto"] or "").strip(); qs = (r["qtd"] or "").strip(); us = (r["preco_unit"] or "").strip()
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", ds): raise ValueError("data inválida")
            try: d = dt.date.fromisoformat(ds)
            except ValueError: raise ValueError("data inválida")  # 2026-02-31
            if not p: raise ValueError("produto vazio")
            if not re.fullmatch(r"\d+", qs): raise ValueError("qtd inválida")
            if not re.fullmatch(r"\d+(\.\d+)?", us): raise ValueError("preco_unit inválido")
            q, u = int(qs), float(us)
            if q <= 0 or u <= 0: raise ValueError("qtd e preco_unit devem ser > 0")
        except ValueError as e:
            err.append({"arquivo": name, "linha": n, "motivo": str(e)}); continue
        ok.append({"filial": name.rsplit(".", 1)[0], "data": d.isoformat(), "produto": p, "qtd": q, "preco": u, "total": round(q * u, 2)})
    return ok, err, None


def consolidate(files, ledger):
    """files: {nome: texto}; ledger: set de hashes já processados (é atualizado). -> resultado."""
    rows, errs, st = [], [], {}
    for name in sorted(files):
        h = fnv(files[name])
        if h in ledger: st[name] = "duplicado"; continue
        r, e, rej = parse_file(name, files[name])
        if rej: st[name] = "rejeitado: " + rej; continue
        ledger.add(h); rows += r; errs += e; st[name] = "processado" + (f" ({len(e)} linha(s) com erro)" if e else "")
    resumo = {}
    for r in rows: resumo[r["filial"]] = round(resumo.get(r["filial"], 0) + r["total"], 2)
    return {"arquivos": st, "linhas": len(rows), "erros": errs, "resumo": resumo, "total": round(sum(resumo.values()), 2), "rows": rows}


def write_xlsx(res, path):
    wb = Workbook(); ws = wb.active; ws.title = "Consolidado"; ws.append(["Filial", "Data", "Produto", "Qtd", "Preço unit.", "Total"])
    for i, r in enumerate(res["rows"], start=2): ws.append([r["filial"], r["data"], r["produto"], r["qtd"], r["preco"], f"=D{i}*E{i}"])
    last = max(len(res["rows"]) + 1, 2)
    rs = wb.create_sheet("Resumo"); rs.append(["Filial", "Total vendido"])
    for i, f in enumerate(sorted(res["resumo"]), start=2): rs.append([f, f'=SUMIF(Consolidado!A2:A{last},A{i},Consolidado!F2:F{last})'])
    n = len(res["resumo"]) + 2; rs.append(["Total geral", f"=SUM(B2:B{n - 1})"]); rs[f"A{n}"].font = rs[f"B{n}"].font = Font(bold=True)
    rs.conditional_formatting.add(f"B2:B{n - 1}", CellIsRule(operator="lessThan", formula=["500"], fill=PatternFill("solid", bgColor="F8D7DA")))  # filial abaixo de 500 destacada
    er = wb.create_sheet("Erros"); er.append(["Arquivo", "Linha", "Motivo"]); [er.append([e["arquivo"], e["linha"], e["motivo"]]) for e in res["erros"]]
    for s in wb:
        for c in s[1]: c.font = Font(bold=True)
        s.freeze_panes = "A2"
        for i in range(1, s.max_column + 1): s.column_dimensions[get_column_letter(i)].width = 18
    ws.auto_filter.ref = f"A1:F{last}"; wb.save(path)


def next_run(now, spec):
    """now: datetime; spec 'daily@HH:MM' ou 'every:Nm' -> próximo datetime (sem segundos)."""
    now = now.replace(second=0, microsecond=0)
    if spec.startswith("daily@"):
        h, m = map(int, spec[6:].split(":")); t = now.replace(hour=h, minute=m)
        return t if t > now else t + dt.timedelta(days=1)
    if spec.startswith("every:") and spec.endswith("m") and spec[6:-1].isdigit() and int(spec[6:-1]) > 0: return now + dt.timedelta(minutes=int(spec[6:-1]))
    raise ValueError("agenda inválida: use daily@HH:MM ou every:Nm")


def run_loop(spec, job, now=dt.datetime.now, sleep=time.sleep, times=None):
    """Executa job() em cada horário da agenda. times=None roda para sempre (Ctrl+C para)."""
    k = 0
    while times is None or k < times:
        t = next_run(now(), spec); sleep(max(0, (t - now()).total_seconds())); job(); k += 1


def load_dir(p): return {f.name: f.read_text("utf-8") for f in sorted(pathlib.Path(p).glob("*.csv"))}


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]; here = pathlib.Path(__file__).parent
    src = a[0] if a else here / "fixtures" / "ok"; out = a[1] if len(a) > 1 else here / "output" / "consolidado.xlsx"
    led = here / "output" / "ledger.json"; ledger = set(json.loads(led.read_text()) if led.exists() else [])
    def job():
        res = consolidate(load_dir(src), ledger); write_xlsx(res, out); led.write_text(json.dumps(sorted(ledger)))
        print(dt.datetime.now().strftime("%H:%M"), res["arquivos"], "linhas:", res["linhas"], "erros:", len(res["erros"]), "total:", res["total"])
    if "--agendar" in sys.argv: spec = sys.argv[sys.argv.index("--agendar") + 1]; print("próxima:", next_run(dt.datetime.now(), spec)); run_loop(spec, job)
    else: job()
