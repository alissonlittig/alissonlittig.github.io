"""Roda o scraper de verdade sobre as páginas salvas em fixtures/ (sem rede), em 4 estados do site, e grava output/scenarios.json + output/report.md."""
import json, pathlib
import scraper
HERE = pathlib.Path(__file__).parent; FIX = HERE / "fixtures"
SEQ = [("ok", 3, "ok"), ("one_page", 1, "ok"), ("layout_changed", 3, "layout"), ("forbidden", 3, "forbidden"), ("robots_disallow", 3, "robots")]


def site(state):
    base = scraper.fixture_fetch(FIX); log = []
    def fetch(url):
        log.append(url.rsplit("/", 1)[-1])
        if url.endswith("robots.txt"): return (200, "User-agent: *\nDisallow: /catalogue/") if state == "robots" else (404, "")
        if url.endswith("page-2.html") and state == "layout": return 200, base(url)[1].replace("product_pod", "book-card")
        if url.endswith("page-2.html") and state == "forbidden": return 403, ""
        return base(url)
    return fetch, log


def main():
    R = {}
    for k, pages, state in SEQ:
        fetch, log = site(state); r = scraper.crawl(fetch, max_pages=pages, sleep=lambda s: None); rep = scraper.report(r)
        R[k] = {"input": {"pages": str(pages), "site": state}, "status": r["status"], "error": r["error"], "requests": r["requests"], "sleeps": r["sleeps"], "http": log, "report": rep, "markdown": scraper.render_md(r, rep), "csv_rows": len(r["books"])}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); (HERE / "output" / "report.md").write_text(R["ok"]["markdown"], "utf-8"); return R


if __name__ == "__main__": main(); print("ok")
