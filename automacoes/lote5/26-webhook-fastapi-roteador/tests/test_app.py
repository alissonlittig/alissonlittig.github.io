import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

b = R["big"]; check(b["status"] == 200 and [d["action"] for d in b["body"]["delivered"]] == ["sheet", "mail", "chat"], "big sale: sheet + receipt + chat")
s = R["small"]; check([d["action"] for d in s["body"]["delivered"]] == ["sheet", "mail"], "small sale: no chat alert")
check(R["refund"]["status"] == 200 and R["_state"]["sheet"][2][3] == -300, "refund: negative amount in sheet + chat alert")
check(R["form"]["body"]["delivered"][1]["action"] == "mail", "form: crm row + e-mail")
d = R["duplicate"]; check(d["body"]["status"] == "duplicate" and d["counts"]["sheet"] == 4 == R["form"]["counts"]["sheet"], "replayed event id: no second effect")
check(R["bad_signature"]["status"] == 401 and R["bad_signature"]["counts"] == d["counts"], "bad signature: 401, nothing delivered")
check(R["invalid"]["status"] == 422 and len(R["invalid"]["body"]["errors"]) == 3, "invalid event: 422 with 3 reasons")
check(R["bad_json"]["status"] == 400, "malformed JSON: 400")
f = R["flaky"]; check(f["status"] == 200 and f["body"]["delivered"][2] == {"action": "chat", "attempts": 3} and f["sleeps"] == [0.5, 1.0], "flaky chat: delivered on 3rd attempt after backoff 0.5s, 1s")
dn = R["down"]; check(dn["status"] == 202 and dn["body"]["dead_letter"][0]["action"] == "chat" and len(R["_state"]["dead_letter"]) == 1, "chat down: 202, dead letter kept, sheet+mail still delivered")
print(n, "ok")
