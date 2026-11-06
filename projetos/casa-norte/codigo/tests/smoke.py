"""HTTP smoke test against a running site (WordPress Playground or any PHP host).
usage: python tests/smoke.py http://127.0.0.1:9430
Exit code 0 = all checks passed."""
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

B = sys.argv[1].rstrip("/")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


op = urllib.request.build_opener(NoRedirect)
bad = 0


def get(p):
    try:
        r = op.open(B + p)
    except urllib.error.HTTPError as e:
        r = e
    return r.status, r.read().decode("utf-8", "ignore")


def post(fields, referer):
    req = urllib.request.Request(B + "/wp-admin/admin-post.php", urllib.parse.urlencode(fields).encode(), {"Referer": referer})
    try:
        op.open(req)
    except urllib.error.HTTPError as e:
        return e.headers.get("Location", "")
    return ""


def check(name, ok):
    global bad
    print(("PASS " if ok else "FAIL ") + name)
    bad += 0 if ok else 1


def n(path):
    return get(path)[1].count('class="listing"')


s, home = get("/")
check("home 200 with 3 featured", s == 200 and home.count('class="listing"') == 3)
check("archive lists 9", n("/imoveis/") == 9)
check("filter finalidade=aluguel -> 3", n("/imoveis/?finalidade=aluguel") == 3)
check("filter bairro=batel -> 3", n("/imoveis/?bairro=batel") == 3)
check("filter bairro=batel&quartos=3 -> 2", n("/imoveis/?bairro=batel&quartos=3") == 2)
check("filter preco_max=600000 (venda+aluguel) -> 5", n("/imoveis/?preco_max=600000") == 5)
check("filter tipo=casa&finalidade=venda -> 2", n("/imoveis/?tipo=casa&finalidade=venda") == 2)
check("garbage filters ignored", n("/imoveis/?quartos=abc&finalidade=x") == 9)
s, one = get("/imoveis/apartamento-claro-com-varanda-gourmet/")
check("single listing 200 with price", s == 200 and "R$ 1.280.000" in one)
check("404 page", get("/?p=999999")[0] == 404)

nonce = re.search(r'name="_wpnonce" value="([^"]+)"', home).group(1)
good = {"action": "cn_lead", "_wpnonce": nonce, "nome": "Maria Teste", "email": "maria@example.com", "telefone": "(41) 99999-0000", "mensagem": "Quero visitar.", "imovel": "0"}


def flag(**over):
    loc = post({**good, **over}, B + "/")
    m = re.search(r"contato=(\w+)", loc)
    return m.group(1) if m else loc


check("valid lead -> ok", flag() == "ok")
check("bad nonce rejected", flag(_wpnonce="x") == "nonce")
check("honeypot rejected", flag(website="http://spam") == "spam")
check("bad e-mail rejected", flag(email="nao-e-email") == "email")
check("short phone rejected", flag(telefone="123") == "telefone")
check("empty name rejected", flag(nome=" ") == "nome")
print("%d failure(s)" % bad)
sys.exit(1 if bad else 0)
