"""HTTP smoke test against a running site (WordPress Playground or any PHP host).
usage: python tests/smoke.py http://127.0.0.1:9420
Exit code 0 = all checks passed."""
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

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


s, home = get("/")
check("home 200", s == 200)
check("home has 3 featured dishes", home.count('class="dish"') == 3)
s, menu = get("/cardapio/")
check("menu lists 15 dishes", s == 200 and menu.count('class="dish"') == 15)
check("menu has 4 sections", len(re.findall(r'class="section menu-section"', menu)) == 4)
s, dish = get("/cardapio/feijao-tropeiro/")
check("single dish 200 with price", s == 200 and "R$ 58" in dish)
check("404 page", get("/?p=999999")[0] == 404)

nonce = re.search(r'name="_wpnonce" value="([^"]+)"', home).group(1)
tomorrow = (date.today() + timedelta(days=1)).isoformat()
good = {"action": "tacho_booking", "_wpnonce": nonce, "nome": "Maria Teste", "telefone": "(41) 99999-0000", "data": tomorrow, "hora": "20:00", "pessoas": "4", "obs": ""}
ref = B + "/"


def flag(**over):
    loc = post({**good, **over}, ref)
    m = re.search(r"reserva=(\w+)", loc)
    return m.group(1) if m else loc


check("valid booking -> ok", flag() == "ok")
check("bad nonce rejected", flag(_wpnonce="x") == "nonce")
check("honeypot rejected", flag(website="http://spam") == "spam")
check("short phone rejected", flag(telefone="123") == "telefone")
check("past date rejected", flag(data="2020-01-01") == "data")
check("unknown time slot rejected", flag(hora="03:00") == "hora")
check("13 people rejected", flag(pessoas="13") == "pessoas")
check("empty name rejected", flag(nome=" ") == "nome")
print("%d failure(s)" % bad)
sys.exit(1 if bad else 0)
