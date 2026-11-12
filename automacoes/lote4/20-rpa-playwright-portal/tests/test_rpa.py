import sys, pathlib, tempfile
ROOT = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "portal"))
import server, rpa
S = server.start(); BASE = f"http://127.0.0.1:{S.server_port}"

def go(fail=None, expire=None, pw="demo123"):
    server.reset(fail, expire); return rpa.run(BASE, "analista", pw, tempfile.mkdtemp())

def test_normal():
    s = go(); assert s["missing_branches"] == [] and len(s["by_branch"]) == 3
    assert [x["rows_rejected"] for x in s["by_branch"]] == [0, 3, 0] and len(s["rejected"]) == 3

def test_flaky_and_session_expiry():
    s = go({"curitiba": 2}, expire=4); assert s["missing_branches"] == []
    steps = [(l["step"], l.get("attempt")) for l in s["log"]]
    assert ("download", 3) in steps and any(l["step"] == "relogin" for l in s["log"])
    assert s["total_revenue"] == go()["total_revenue"]  # mesmos números com e sem falha

def test_branch_down_is_partial_not_crash():
    s = go({"salvador": -1}); assert s["missing_branches"] == ["salvador"] and len(s["by_branch"]) == 2

def test_bad_password_stops_clearly():
    try: go(pw="wrong")
    except rpa.LoginError as e: assert "rejected" in str(e)
    else: raise AssertionError("deveria falhar")

def test_validate_unit():
    ok, bad = rpa.validate([{"date": "2026-10-03", "sku": "A", "product": "x", "qty": "2", "unit_price": "1.50", "channel": "store"},
                            {"date": "2026-10-03", "sku": "A", "product": "x", "qty": "abc", "unit_price": "1.50", "channel": "store"}])
    assert len(ok) == 1 and bad[0]["reason"].startswith("unreadable")

if __name__ == "__main__":
    for k, f in list(globals().items()):
        if k.startswith("test_"): f(); print("ok", k)
