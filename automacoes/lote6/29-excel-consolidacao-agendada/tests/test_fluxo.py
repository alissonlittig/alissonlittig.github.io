import csv, datetime as dt, io, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, fluxo
from openpyxl import load_workbook

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

# conferência independente: soma direto dos CSV, sem usar parse_file
tot = sum(int(r["qtd"]) * float(r["preco_unit"]) for t in run_scenarios.OK.values() for r in csv.DictReader(io.StringIO(t)))
ok = R["ok"]; check(ok["linhas"] == 22 and ok["total"] == round(tot, 2) and not ok["erros"], "3 arquivos, 22 linhas; total confere com soma independente")
check(abs(sum(ok["resumo"].values()) - ok["total"]) < 0.01, "resumo por filial soma o total")
b = R["bad_rows"]; check(b["linhas"] == 22 and [(e["linha"], e["motivo"]) for e in b["erros"]] == [(9, "data inválida"), (10, "qtd inválida")], "2 linhas ruins vão para Erros, o resto entra")
check(b["linhas"] == 22 and b["arquivos"]["londrina.csv"].startswith("processado (2"), "linha ruim não derruba o arquivo")
r = R["repeat"]; check(r["arquivos"]["curitiba.csv"] == "duplicado" and r["linhas"] == 13, "arquivo repetido é ignorado (13 linhas = londrina + maringa)")
h = R["bad_header"]; check(h["arquivos"]["maringa.csv"].startswith("rejeitado: faltam colunas: preco_unit") and h["linhas"] == 16, "coluna faltando: só aquele arquivo é rejeitado")
wb = load_workbook(pathlib.Path(__file__).resolve().parent.parent / "output" / "consolidado_ok.xlsx")
check(wb.sheetnames == ["Consolidado", "Resumo", "Erros"] and wb["Consolidado"].max_row == 23 and wb["Consolidado"]["F2"].value == "=D2*E2", "xlsx: 3 abas, 22 linhas, fórmula de total por linha")
check(wb["Resumo"]["B2"].value.startswith("=SUMIF(Consolidado!A2:A23") and wb["Resumo"]["B5"].value == "=SUM(B2:B4)", "xlsx: resumo por SUMIF e total geral")
N = lambda s: dt.datetime.fromisoformat(s)
check(fluxo.next_run(N("2026-11-12 06:10"), "daily@07:30") == N("2026-11-12 07:30") and fluxo.next_run(N("2026-11-12 08:00"), "daily@07:30") == N("2026-11-13 07:30"), "agenda diária: hoje se ainda dá tempo, senão amanhã")
check(fluxo.next_run(N("2026-11-12 23:50:40"), "every:15m") == N("2026-11-13 00:05"), "agenda a cada N min (vira o dia)")
try: fluxo.next_run(N("2026-11-12 08:00"), "toda terça"); check(False, "agenda inválida")
except ValueError: check(True, "agenda inválida levanta erro claro")
clock = [N("2026-11-12 07:00")]; slept = []; ran = []
def sl(s): slept.append(s); clock[0] += dt.timedelta(seconds=s)
fluxo.run_loop("daily@07:30", lambda: ran.append(clock[0]), now=lambda: clock[0], sleep=sl, times=3)
check(slept == [1800, 86400, 86400] and len(ran) == 3, "loop do agendador (relógio falso): 3 execuções, 07:30 de 3 dias seguidos")
print(n, "ok")
