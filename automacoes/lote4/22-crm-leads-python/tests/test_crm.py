import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

h = R["hot"]; check(h["status"] == 200 and h["body"]["tier"] == "hot" and h["body"]["notified"], "hot lead: task + chat message")
check(R["warm"]["body"]["tier"] == "warm" and "notified" not in R["warm"]["body"], "warm lead: task, no chat message")
check(R["cold"]["body"]["tier"] == "cold" and "owner" not in R["cold"]["body"], "cold lead (free e-mail, score<0): no task")
d = R["duplicate"]["body"]; check(d["status"] == "merged" and d["score"] == 115 and d["seen"] == 2, "duplicate merges, keeps best score")
check(R["invalid"]["status"] == 422 and len(R["invalid"]["body"]["errors"]) == 4, "invalid payload: 422 with 4 reasons")
check(R["bad_json"]["status"] == 400, "malformed JSON: 400")
c = R["chat_down"]; check(c["status"] == 202 and c["body"]["queued"], "chat down: 202 and queued, not 200")
db = R["_db"]; check(len(db["tasks"]) == 3 and len(db["outbox"]) == 1 and len(db["chat_messages"]) == 1, "db: 3 tasks (no duplicate task), 1 outbox row, 1 delivered message")
print(n, "ok")
