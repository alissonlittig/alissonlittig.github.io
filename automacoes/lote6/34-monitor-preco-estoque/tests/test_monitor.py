import sys, pathlib
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import monitor, run_scenarios
R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
kinds = lambda i: [a["kind"] for a in R[i]["alerts"]]
check(kinds(0) == [], "first sight is a baseline: no alert")
check(kinds(1) == ["drop", "restock"] and "-12.0%" in R[1]["alerts"][0]["text"], "12% drop and restock alert, one each")
check(kinds(2) == ["drop", "target"], "coffee maker: drop and target reached")
check(kinds(3) == ["layout_changed"] and R[3]["state"]["notebook"]["price"] == 3783.0, "layout change: alert, last price kept (nothing saved)")
check(kinds(4) == [] and kinds(5) == [] and kinds(6) == ["source_down"], "source down: silent twice, alert on the 3rd failure")
check(kinds(7) == ["suspicious"] and R[7]["state"]["notebook"]["price"] == 3783.0, "price typo 99,00: flagged and not saved")
st = {}; w = {"id": "x", "name": "X", "target": 100.0, "min_drop_pct": 10}
mk = lambda p, s="in": (lambda: monitor.page("X", p, s))
monitor.check(st, w, mk("150,00")); monitor.check(st, w, mk("99,00")); a = monitor.check(st, w, mk("98,00"))
check(a == [], "target alert is not repeated while price stays below it")
check(monitor.parse_page(monitor.page("X", "1.299,90", "out")) == {"price": 1299.9, "in_stock": False}, "Brazilian price format parsed (1.299,90)")
try: monitor.parse_page("<html></html>"); check(False, "must raise")
except monitor.ParseError: check(True, "page without price raises ParseError")
try: monitor.fetch("http://127.0.0.1:1/x", timeout=1); check(False, "must raise")
except monitor.FetchError: check(True, "connection refused becomes FetchError")
print(n, "ok")
