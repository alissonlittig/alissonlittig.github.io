"""Price/stock monitor: fetch a product page, parse price+stock, compare with history, alert only when it matters.
Python standard library only. Alerts are written to a local file (nothing is sent). Fictional shop."""
import json, re, sys, urllib.request, urllib.error, pathlib

PRICE_RE = re.compile(r'<span class="price"[^>]*>\s*R\$\s*([\d.]+,\d{2})\s*</span>')
STOCK_RE = re.compile(r'<span class="stock" data-status="(in|out)"')
PAGE = '<html><body><h1>{name}</h1><span class="price">R$ {price}</span><span class="stock" data-status="{stock}">{label}</span></body></html>'
FAILS_BEFORE_ALERT = 3


class FetchError(Exception): pass
class ParseError(Exception): pass


def brl(p):
    s = f"{p:,.2f}"; return s.replace(",", "_").replace(".", ",").replace("_", ".")


def page(name, price_text, stock):
    return PAGE.format(name=name, price=price_text, stock=stock, label="Em estoque" if stock == "in" else "Esgotado")


def parse_page(html):
    m, s = PRICE_RE.search(html), STOCK_RE.search(html)
    if not m or not s: raise ParseError("price or stock element not found (layout changed?)")
    return {"price": float(m.group(1).replace(".", "").replace(",", ".")), "in_stock": s.group(1) == "in"}


def fetch(url, timeout=3):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r: return r.read().decode("utf-8")
    except (urllib.error.URLError, OSError) as e: raise FetchError(str(getattr(e, "reason", e)))


def check(state, watch, get_html):
    """state: dict of per-product dicts (mutated). watch: {id,name,target,min_drop_pct}. get_html() -> str or raises FetchError.
    Returns a list of alerts [{kind, text}]."""
    st = state.setdefault(watch["id"], {"price": None, "in_stock": None, "fails": 0, "layout_alerted": False, "below_target": False})
    name = watch["name"]; alerts = []
    try: html = get_html()
    except FetchError as e:
        st["fails"] += 1
        if st["fails"] == FAILS_BEFORE_ALERT: alerts.append({"kind": "source_down", "text": f"{name}: source failed {st['fails']} times in a row ({e}). Last known price kept."})
        return alerts
    st["fails"] = 0
    try: obs = parse_page(html)
    except ParseError as e:
        if not st["layout_alerted"]: st["layout_alerted"] = True; alerts.append({"kind": "layout_changed", "text": f"{name}: {e}. Nothing was saved; fix the parser."})
        return alerts
    st["layout_alerted"] = False
    p, prev = obs["price"], st["price"]
    if prev is not None and (p > prev * 1.5 or p < prev * 0.3):
        return [{"kind": "suspicious", "text": f"{name}: price jumped from R$ {brl(prev)} to R$ {brl(p)}. Not saved until it repeats or a person confirms."}]
    if prev is None: st.update(price=p, in_stock=obs["in_stock"], below_target=p <= watch["target"]); return alerts  # baseline: no alert
    drop = (prev - p) / prev * 100
    if drop >= watch["min_drop_pct"]: alerts.append({"kind": "drop", "text": f"{name}: R$ {brl(prev)} -> R$ {brl(p)} (-{drop:.1f}%)"})
    below = p <= watch["target"]
    if below and not st["below_target"]: alerts.append({"kind": "target", "text": f"{name}: R$ {brl(p)} reached the target of R$ {brl(watch['target'])}"})
    if obs["in_stock"] and st["in_stock"] is False: alerts.append({"kind": "restock", "text": f"{name}: back in stock at R$ {brl(p)}"})
    st.update(price=p, in_stock=obs["in_stock"], below_target=below)
    return alerts


def run_all(watches, state, alerts_file):
    out = []
    for w in watches:
        try: a = check(state, w, lambda: fetch(w["url"]))
        except Exception as e: a = [{"kind": "bug", "text": f"{w['name']}: unexpected {type(e).__name__}: {e}"}]
        out += a
    with open(alerts_file, "a", encoding="utf-8") as f:
        for a in out: f.write(json.dumps(a, ensure_ascii=False) + "\n")
    return out


if __name__ == "__main__":
    watches = json.loads(pathlib.Path(sys.argv[1]).read_text("utf-8")); sp = pathlib.Path(sys.argv[2])
    state = json.loads(sp.read_text("utf-8")) if sp.exists() else {}
    for a in run_all(watches, state, "alerts.jsonl"): print(a["kind"], "|", a["text"])
    sp.write_text(json.dumps(state, indent=1), "utf-8")
