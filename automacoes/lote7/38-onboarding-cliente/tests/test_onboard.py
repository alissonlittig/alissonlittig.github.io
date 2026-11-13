import sys, pathlib, json, tempfile
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import onboard as O
n = 0
def check(c, m):
    global n; assert c, m; n += 1; print("ok", m)
f = json.loads((H / "data/form.json").read_text("utf-8")); TODAY = "2026-11-13"
r = O.build(f, TODAY)
check(r["ok"] and r["slug"] == "padaria-pao-quente-ltda", "slug sem acento e sem símbolos")
check("R$ 1.500,00 por mês" in r["contract"] and "Início em 01/12/2026" in r["contract"] and "Nº 2026-001" in r["contract"], "contrato: valor em R$, data BR e número")
check("Olá, Marina," in r["email"] and "plano Pro" in r["email"], "e-mail usa o primeiro nome e o plano")
check(O.brl(123456789) == "1.234.567,89" and O.brl(5) == "0,05", "formato de moeda")
check(not O.build({**f, "email": "marina@"}, TODAY)["ok"], "e-mail inválido é recusado")
check(not O.build({**f, "start": "2026-11-01"}, TODAY)["ok"], "data no passado é recusada")
check(not O.build({**f, "plan": "gold"}, TODAY)["ok"], "plano desconhecido é recusado")
check(len(O.build({"plan": "x"}, TODAY)["errors"]) >= 6, "formulário vazio lista todos os erros de uma vez")
check(O.build({**f, "value": "0"}, TODAY)["errors"] == ["value: deve ser maior que zero"], "valor zero recusado")
with tempfile.TemporaryDirectory() as t:
    base = O.write(r, f, t)
    check((base / "01_contrato/contrato.txt").exists() and (base / "email_rascunho.txt").exists() and (base / "03_entregas").is_dir(), "pasta, contrato e rascunho criados")
    try: O.write(r, f, t); check(False, "segunda execução deveria recusar")
    except FileExistsError: check(True, "cliente existente não é sobrescrito")
print(f"{n} checks ok")
