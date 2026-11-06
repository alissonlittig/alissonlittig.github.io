"""Crawl a running WordPress (Playground) site into a static copy with relative links.
usage: export_static.py <base_url> <out_dir> [form_note]
The contact/booking form is neutralised (no PHP behind a static host)."""
import re, os, sys, shutil, urllib.request, urllib.error

B, OUT = sys.argv[1].rstrip("/"), sys.argv[2]
NOTE = sys.argv[3] if len(sys.argv) > 3 else "Demo estática: envio desativado"
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)


def get(p):
    try:
        return urllib.request.urlopen(B + p).read(), 200
    except urllib.error.HTTPError as e:
        return e.read(), e.code


# discover internal pages (breadth-first)
todo, pages = ["/"], []
while todo:
    p = todo.pop(0)
    if p in pages:
        continue
    pages.append(p)
    html = get(p)[0].decode("utf-8", "ignore")
    for h in re.findall(r'href="%s(/[^"#?]*)' % re.escape(B), html):
        if h.endswith("/") and not re.search(r"/(feed|category|author|wp-json|wp-admin|wp-content|wp-includes)/", h) and h not in pages:
            todo.append(h)
pages.append("/pagina-inexistente/")  # fetched from /?p=999999 below
assets = set()
for p in pages:
    raw, code = get("/?p=999999" if p == "/pagina-inexistente/" else p)
    html = raw.decode("utf-8", "ignore")
    html = re.sub(r"<link[^>]*rel=.(?:alternate|https://api\.w\.org/|EditURI|shortlink|dns-prefetch|pingback)[^>]*>\s*", "", html)
    html = re.sub(r'<script id="wp-emoji[^>]*>.*?</script>', "", html, flags=re.S)
    html = re.sub(r'<script type="importmap".*?</script>', "", html, flags=re.S)
    html = re.sub(r'action="[^"]*admin-post\.php"', 'action="#" data-static="1"', html)
    html = re.sub(r'<input type="hidden" name="(?:_wpnonce|_wp_http_referer)"[^>]*>', "", html)
    for m in re.findall(r"""(?:src|href)=["'](%s/(?:wp-content|wp-includes)/[^"'?#]+)""" % re.escape(B), html):
        assets.add(m[len(B):])
    for m in re.findall(r"url\(\s*'?(%s/wp-content[^')?]+)" % re.escape(B), html):
        assets.add(m[len(B):])
    d = 0 if p == "/pagina-inexistente/" else p.count("/") - 1
    pre = "../" * d if d else "./"
    html = html.replace(B + "/wp-content", pre + "wp-content").replace(B + "/wp-includes", pre + "wp-includes")

    def link(m):
        path, frag = m.group(1) or "/", m.group(2) or ""
        return 'href="%s%s%s"' % (pre, path.lstrip("/") + ("index.html" if path.endswith("/") else ""), frag)

    html = re.sub(r'href="%s(/[^"#]*)?(#[^"]*)?"' % re.escape(B), link, html)
    html = html.replace(B, "")
    html = html.replace("</body>", '<script>document.querySelectorAll("form[data-static]").forEach(function(f){f.addEventListener("submit",function(e){e.preventDefault();var b=f.querySelector("button[type=submit]");if(f.checkValidity()){b.textContent=%r;b.disabled=true}else{f.reportValidity()}})})</script></body>' % NOTE, 1)
    dest = os.path.join(OUT, "404.html") if p == "/pagina-inexistente/" else os.path.join(OUT, p.strip("/"), "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(html)
for a in sorted(assets):
    data, _ = get(a)
    f = os.path.join(OUT, a.lstrip("/"))
    os.makedirs(os.path.dirname(f), exist_ok=True)
    open(f, "wb").write(data)
print(len(pages), "pages", len(assets), "assets")
