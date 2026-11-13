"""Onboarding de cliente: formulário (JSON) -> valida -> pasta do cliente + contrato preenchido + RASCUNHO de e-mail + checklist. Nunca envia nada."""
import json, pathlib, re, sys, unicodedata
from datetime import date

PLANS = {"basic": ("Basic", 8, "8 horas mensais de suporte e 1 relatório mensal"),
         "pro": ("Pro", 20, "20 horas mensais de suporte, 1 relatório mensal e 1 reunião de acompanhamento"),
         "enterprise": ("Enterprise", 40, "40 horas mensais de suporte, relatório semanal e reuniões quinzenais")}
CONTRACT = """CONTRATO DE PRESTAÇÃO DE SERVIÇOS Nº {num}

CONTRATANTE: {company}, representada por {contact} ({email}), cidade: {city}.
CONTRATADA: Estúdio Exemplo Ltda. (empresa fictícia de demonstração).

1. OBJETO. Plano {plan}: {scope}.
2. VALOR. R$ {value} por mês, pagos todo dia 10.
3. INÍCIO E PRAZO. Início em {start}, por 12 meses, renovável por acordo escrito.
4. RESCISÃO. Qualquer parte pode rescindir com 30 dias de aviso por escrito.

Este texto é um MODELO de demonstração e não substitui revisão jurídica.
"""
EMAIL = """Assunto: Boas-vindas, {company}!

Olá, {first},

Foi um prazer fechar o plano {plan} com a {company}. Deixei o contrato em anexo para sua leitura e assinatura; nosso início está marcado para {start}.

Para começarmos, precisamos de: logo em alta resolução, acessos ao sistema atual e um contato técnico.

Qualquer dúvida, é só responder esta mensagem.

Um abraço
"""
CHECK = ["Revisar o contrato e anexar ao e-mail", "Enviar o e-mail (rascunho abaixo: um humano envia)", "Receber logo, acessos e contato técnico", "Cadastrar o cliente na cobrança do dia 10", "Agendar a reunião de início"]


def slugify(s): return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()).strip("-")


def cents(s):
    s = s.strip()
    if not re.fullmatch(r"\d+(\.\d{1,2})?", s): raise ValueError("valor")
    w, _, f = s.partition("."); return int(w) * 100 + int((f + "00")[:2])


def brl(c): return f"{c // 100:,}".replace(",", ".") + f",{c % 100:02d}"
def br_date(d): y, m, dd = d.split("-"); return f"{dd}/{m}/{y}"


def validate(f, today):
    err = []
    for k in ("company", "contact", "email", "city"):
        if not f.get(k, "").strip(): err.append(f"{k}: obrigatório")
    if f.get("email", "").strip() and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[A-Za-z]{2,}", f["email"].strip()): err.append("email: formato inválido")
    if f.get("plan") not in PLANS: err.append("plan: use basic, pro ou enterprise")
    try:
        if cents(f.get("value", "")) <= 0: err.append("value: deve ser maior que zero")
    except ValueError: err.append("value: use número com ponto, ex. 1500.00")
    try:
        if date.fromisoformat(f.get("start", "")) < date.fromisoformat(today): err.append("start: data já passou")
    except ValueError: err.append("start: use AAAA-MM-DD")
    return err


def build(f, today, seq=1):
    err = validate(f, today)
    if err: return {"ok": False, "errors": err}
    name, _, scope = PLANS[f["plan"]]; company = f["company"].strip(); contact = f["contact"].strip()
    v = dict(num=f"{today[:4]}-{seq:03d}", company=company, contact=contact, email=f["email"].strip(), city=f["city"].strip(), plan=name, scope=scope, value=brl(cents(f["value"])), start=br_date(f["start"]), first=contact.split()[0])
    slug = slugify(company)
    return {"ok": True, "slug": slug, "folders": [f"clientes/{slug}/{d}" for d in ("01_contrato", "02_documentos", "03_entregas")],
            "contract": CONTRACT.format(**v), "email": EMAIL.format(**v), "checklist": CHECK}


def write(res, f, root):
    """Cria a pasta; se já existe, recusa (não sobrescreve cliente existente)."""
    base = pathlib.Path(root) / "clientes" / res["slug"]
    if base.exists(): raise FileExistsError(f"cliente já existe: {base}")
    for d in res["folders"]: (pathlib.Path(root) / d).mkdir(parents=True)
    (base / "01_contrato/contrato.txt").write_text(res["contract"], "utf-8")
    (base / "email_rascunho.txt").write_text(res["email"], "utf-8")
    (base / "checklist.md").write_text("\n".join(f"- [ ] {c}" for c in res["checklist"]) + "\n", "utf-8")
    (base / "cliente.json").write_text(json.dumps(f, ensure_ascii=False, indent=1), "utf-8")
    return base


if __name__ == "__main__":
    if len(sys.argv) != 4: sys.exit("uso: python onboard.py formulario.json saida/ AAAA-MM-DD(hoje)")
    f = json.loads(pathlib.Path(sys.argv[1]).read_text("utf-8")); res = build(f, sys.argv[3])
    if not res["ok"]: sys.exit("formulário inválido:\n- " + "\n- ".join(res["errors"]))
    print("criado:", write(res, f, sys.argv[2]))
