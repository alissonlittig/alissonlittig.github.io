"""Scraping educado + relatório. Alvo: books.toscrape.com, site de prática feito para isso (sem dados pessoais, sem robots.txt).
Respeita robots.txt, identifica-se no User-Agent, espera entre páginas, para em 403/429/5xx (não insiste) e NUNCA entrega relatório calado quando o layout muda:
se uma página não tem o formato esperado, levanta LayoutChanged e o relatório sai marcado PARCIAL.
Uso: python scraper.py --live [--pages 3]   (padrão: fixtures/ salvas, sem rede)"""
import html, json, pathlib, re, statistics, sys, time, urllib.request, urllib.error, urllib.parse
from urllib.robotparser import RobotFileParser

BASE = "https://books.toscrape.com/"; UA = "portfolio-demo-scraper/1.0 (learning project)"; DELAY = 1.0
RATING = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
POD = re.compile(r'<article class="product_pod">(.*?)</article>', re.S)
NEXT = re.compile(r'<li class="next"><a href="([^"]+)"')


class LayoutChanged(Exception): pass


def parse_page(text):
    pods = POD.findall(text)
    if not pods: raise LayoutChanged("no product_pod blocks found")
    books = []
    for p in pods:
        m = re.search(r'<h3><a href="([^"]+)" title="([^"]*)"', p); pr = re.search(r'class="price_color">[^\d]*([\d.]+)<', p); ra = re.search(r'class="star-rating (One|Two|Three|Four|Five)"', p)
        if not (m and pr and ra): raise LayoutChanged("a product block is missing title, price or rating")
        books.append({"title": html.unescape(m.group(2)), "url": m.group(1), "price": float(pr.group(1)), "rating": RATING[ra.group(1)], "in_stock": "In stock" in p})
    n = NEXT.search(text); return books, (n.group(1) if n else None)


def robots_allows(fetch, base=BASE, path="catalogue/page-1.html"):
    st, body = fetch(urllib.parse.urljoin(base, "robots.txt"))
    if st == 404: return True  # sem robots.txt = sem restrição declarada
    if st != 200: return False  # robots ilegível: na dúvida, não coleta
    rp = RobotFileParser(); rp.parse(body.splitlines()); return rp.can_fetch(UA, urllib.parse.urljoin(base, path))


def crawl(fetch, max_pages=3, delay=DELAY, sleep=time.sleep, start="page-1.html"):
    out = {"status": "ok", "error": None, "requests": [], "sleeps": [], "pages": 0, "books": []}
    if not robots_allows(fetch): out.update(status="blocked", error="robots.txt disallows this path"); return out
    url, seen = start, set()
    while url and out["pages"] < max_pages:
        if out["pages"]: sleep(delay); out["sleeps"].append(delay)
        st, text = fetch(BASE + "catalogue/" + url); out["requests"].append(url)
        if st != 200: out.update(status="partial", error=f"HTTP {st} on {url}: stopped, not retried"); break
        try: books, url = parse_page(text)
        except LayoutChanged as e: out.update(status="partial", error=f"layout changed on {out['requests'][-1]}: {e}"); break
        out["pages"] += 1
        for b in books:
            if b["url"] not in seen: seen.add(b["url"]); out["books"].append(b)
    return out


def report(r):
    b = r["books"]
    if not b: return None
    pr = sorted(x["price"] for x in b); by = {str(k): sum(1 for x in b if x["rating"] == k) for k in range(1, 6)}
    good = sorted((x for x in b if x["rating"] >= 4 and x["in_stock"]), key=lambda x: (x["price"], x["title"]))[:3]
    return {"books": len(b), "pages": r["pages"], "avg": round(sum(pr) / len(pr), 2), "median": round(statistics.median(pr), 2), "min": min(b, key=lambda x: (x["price"], x["title"]))["title"] + f" ({pr[0]:.2f})", "max": max(b, key=lambda x: (x["price"], x["title"]))["title"] + f" ({pr[-1]:.2f})",
            "by_rating": by, "out_of_stock": sum(1 for x in b if not x["in_stock"]), "best_value": [[x["title"], x["price"], x["rating"]] for x in good]}


def render_md(r, rep):
    head = {"ok": "# Book price report", "partial": "# Book price report (PARTIAL)", "blocked": "# Book price report (NOT COLLECTED)"}[r["status"]]
    L = [head, ""]
    if r["error"]: L += [f"> {r['error']}", ""]
    if rep:
        L += [f"{rep['books']} books from {rep['pages']} page(s). Average £{rep['avg']:.2f}, median £{rep['median']:.2f}.", f"Cheapest: {rep['min']}. Most expensive: {rep['max']}.", "Ratings 1-5: " + " / ".join(str(rep["by_rating"][str(k)]) for k in range(1, 6)) + f". Out of stock: {rep['out_of_stock']}.", "", "Best value (4+ stars, in stock, cheapest):"]
        L += [f"- {t} · £{p:.2f} · {s} stars" for t, p, s in rep["best_value"]]
    return "\n".join(L)


def fixture_fetch(root):
    def fetch(url):
        name = url.rsplit("/", 1)[-1]; f = pathlib.Path(root) / (name + ".txt")  # .txt: HTML de terceiros salvo como dado, fora do gate de HTML
        return (200, f.read_text("utf-8")) if f.exists() else (404, "")
    return fetch


def live_fetch(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=15) as r: return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e: return e.code, ""


if __name__ == "__main__":
    n = int(sys.argv[sys.argv.index("--pages") + 1]) if "--pages" in sys.argv else 3
    r = crawl(live_fetch if "--live" in sys.argv else fixture_fetch(pathlib.Path(__file__).parent / "fixtures"), max_pages=n)
    print(render_md(r, report(r)))
