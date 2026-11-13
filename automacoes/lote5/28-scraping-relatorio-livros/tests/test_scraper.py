import pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, scraper

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

# conferência independente: contagem e média direto do HTML, sem usar o parser
raw = "".join((run_scenarios.FIX / f"page-{i}.html.txt").read_text("utf-8") for i in (1, 2, 3))
prices = [float(x) for x in re.findall(r"price_color\">.([\d.]+)<", raw)]
ok = R["ok"]; check(ok["report"]["books"] == raw.count('class="product_pod"') == 60, "60 books = 3 pages x 20 (counted straight from the HTML)")
check(ok["report"]["avg"] == round(sum(prices) / len(prices), 2), "average price matches an independent computation")
check(sum(ok["report"]["by_rating"].values()) == 60 and ok["csv_rows"] == 60, "rating buckets add up to 60")
check(ok["sleeps"] == [1.0, 1.0] and ok["http"][0] == "robots.txt", "robots.txt first, 1 s pause between pages")
check(R["one_page"]["http"] == ["robots.txt", "page-1.html"], "max_pages respected: 1 page = 1 request")
l = R["layout_changed"]; check(l["status"] == "partial" and "layout changed on page-2.html" in l["error"] and l["report"]["books"] == 20 and "PARTIAL" in l["markdown"], "layout change: stops, report marked PARTIAL, never silent")
f = R["forbidden"]; check(f["status"] == "partial" and "HTTP 403" in f["error"] and f["http"].count("page-2.html") == 1, "403: stops and does not retry")
b = R["robots_disallow"]; check(b["status"] == "blocked" and b["http"] == ["robots.txt"] and b["report"] is None, "robots.txt disallow: not a single page requested")
check(scraper.parse_page('<article class="product_pod"><h3><a href="x" title="Tom &amp; Jerry">T</a></h3><p class="star-rating Two"></p><p class="price_color">£9.50</p>In stock</article>')[0][0] == {"title": "Tom & Jerry", "url": "x", "price": 9.5, "rating": 2, "in_stock": True}, "entities decoded, fields parsed")
print(n, "ok")
