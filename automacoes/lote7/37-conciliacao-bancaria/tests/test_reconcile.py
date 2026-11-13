import sys, pathlib
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import reconcile as R
n = 0
def check(c, m):
    global n; assert c, m; n += 1; print("ok", m)
bank = R.parse((H / "data/bank.csv").read_text("utf-8"), False); erp = R.parse((H / "data/erp.csv").read_text("utf-8"), True)
r = R.reconcile(bank, erp); by = {m["bank"]: m for m in r["matched"]}
check(R.cents("-1234.5") == -123450 and R.cents("0.07") == 7, "cents sem float")
check(by["B1"]["erp"] == "E101" and by["B1"]["kind"] == "exact", "valor igual, mesma data -> exact")
check(by["B2"]["erp"] == "E102", "ERP 2 dias antes ainda casa (janela de 3)")
check(by["B4"]["erp"] == "E104", "ERP 3 dias antes casa")
check(by["B6"]["erp"] == "E105" and by["B6"]["kind"] == "amount_diff" and by["B6"]["diff"] == -2200, "taxa do cartão 1,1%: casa por valor próximo, diferença -22.00")
check(r["bank_only"] == ["B5", "B8"], "tarifa e cobrança duplicada ficam só no extrato")
check(by["B7"]["erp"] == "E106", "só uma das duas cobranças iguais consome o lançamento")
check(r["erp_only"] == ["E108"], "venda sem entrada no banco")
check(r["summary"]["divergences"] == 4, "4 divergências (2 bank_only, 1 erp_only, 1 amount_diff)")
bad = R.reconcile([{"id": "B1", "date": "2026-10-01", "desc": "x", "amt": 10000}], [{"id": "E1", "date": "2026-10-20", "desc": "x", "amt": 10000}])
check(bad["matched"] == [], "fora da janela de datas não casa")
try: R.cents("12,5x"); check(False, "valor inválido deve falhar")
except ValueError: check(True, "valor inválido levanta erro (não é engolido)")
rows = R.report(r, bank, erp, H / "output"); check(len(rows) == 4 and (H / "output/divergencias.csv").exists(), "relatório gravado")
print(f"{n} checks ok")
