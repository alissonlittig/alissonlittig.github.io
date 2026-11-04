import re, os, urllib.request, shutil, sys
B = "http://127.0.0.1:9410"
OUT = r"C:\SISTEMA\trabalho\wordpress\mansa-vet\estatico"
if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
def get(p):
    return urllib.request.urlopen(B + p).read()
pages = ["/", "/servicos/", "/pagina-inexistente/"]
home = get("/").decode()
pages += sorted(set(re.findall(r'href="%s(/servicos/[^/"#]+/)"' % B, home + get("/servicos/").decode())) - {"/servicos/feed/"})
assets = set()
def depth(p): return p.count("/") - 1
for p in pages:
    try: html = get(p).decode()
    except urllib.error.HTTPError as e: html = e.read().decode()
    # drop WP head noise
    html = re.sub(r'<link rel=.(?:alternate|https://api\.w\.org/|EditURI|shortlink)[^>]*>\s*', '', html)
    html = re.sub(r'<link rel=.(?:alternate)[^>]*>', '', html)
    html = re.sub(r'<link[^>]*rel=.(?:dns-prefetch)[^>]*>', '', html)
    html = re.sub(r'<script id="wp-emoji[^>]*>.*?</script>', '', html, flags=re.S)
    html = re.sub(r'<script type="importmap".*?</script>', '', html, flags=re.S) if False else html
    # static form: no backend
    html = re.sub(r'action="[^"]*admin-post\.php"', 'action="#contato" onsubmit="event.preventDefault();this.querySelector(\'.btn\').textContent=\'Demo estática: pedido não enviado\';"', html)
    html = re.sub(r'<input type="hidden" name="(?:_wpnonce|_wp_http_referer)"[^>]*>', '', html)
    for m in re.findall(r"""(?:src|href)=["'](%s/(?:wp-content|wp-includes)/[^"'?#]+)""" % B, html): assets.add(m[len(B):])
    for m in re.findall(r"url\(\s*'?(%s/wp-content[^')?]+)" % B, html): assets.add(m[len(B):])
    d = depth(p) if p not in ("/", "/pagina-inexistente/") else 0
    pre = "../" * d if d else "./"
    html = html.replace(B + "/wp-content", pre + "wp-content").replace(B + "/wp-includes", pre + "wp-includes")
    def link(m):
        path = m.group(1)
        t = pre + path.lstrip("/") if path != "/" else pre
        return 'href="%s%s"' % (t, "index.html" if t.endswith("/") or t == pre else "")
    html = re.sub(r'href="%s(/[^"#]*)?(#[^"]*)?"' % B, lambda m: 'href="%s%s"' % ((pre + (m.group(1) or "/").lstrip("/") + "index.html") if (m.group(1) or "/") .endswith("/") else pre + m.group(1).lstrip("/"), m.group(2) or ""), html)
    html = html.replace(B, "")
    dest = os.path.join(OUT, p.strip("/").replace("pagina-inexistente", "404"), "index.html") if p != "/pagina-inexistente/" else os.path.join(OUT, "404.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(html)
# assets: also fonts referenced from css
for a in sorted(assets):
    data = get(a)
    f = os.path.join(OUT, a.lstrip("/")); os.makedirs(os.path.dirname(f), exist_ok=True)
    open(f, "wb").write(data)
    if a.endswith(".css"):
        for m in re.findall(r'url\(\s*["\']?([^"\')]+)', data.decode("utf-8", "ignore")):
            if m.startswith("data:") or m.startswith("http"): continue
            u = os.path.normpath(os.path.join(os.path.dirname(a), m)).replace("\\", "/")
            try:
                fd = get(u.split("?")[0]); ff = os.path.join(OUT, u.lstrip("/").split("?")[0]); os.makedirs(os.path.dirname(ff), exist_ok=True); open(ff, "wb").write(fd)
            except Exception as e: print("miss", u, e)
print(len(pages), "pages", len(assets), "assets")
