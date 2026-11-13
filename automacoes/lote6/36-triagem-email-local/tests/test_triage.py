import sys, pathlib, json
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import triage
n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
model = triage.train(triage.load_labeled((H / "data/train.txt").read_text("utf-8"))); test = triage.load_labeled((H / "data/test.txt").read_text("utf-8"))
ok, tot = triage.evaluate(model, test); print(f"held-out accuracy: {ok}/{tot}")
check(ok / tot >= 0.85, f"model accuracy on {tot} held-out messages is {ok}/{tot} (>= 85%)")
res = triage.run(H / "data/inbox.csv", model, H / "output"); by = {r["id"]: r for r in res}
check(by[1]["label"] == "billing" and by[1]["source"] == "model", "payment confirmation -> billing (model)")
check(by[2]["label"] == "support" and by[2]["priority"] == "high", "dashboard down -> support, high priority (urgent word)")
check(by[3]["label"] == "sales" and by[3]["priority"] == "high", "sales quote from the VIP sender -> high priority")
check(by[4]["label"] == "spam" and by[4]["source"] == "rule" and by[4]["priority"] == "low", "blocked domain -> spam by rule, low priority")
check(by[5]["label"] == "billing" and by[5]["source"] == "rule", "invoice number -> billing by rule (the model is not asked)")
check(by[6]["label"] == "ignore" and by[6]["route"] == "archive", "out-of-office auto-reply -> archive")
check(by[7]["label"] == "review" and by[7]["route"] == "inbox-human", "vague message -> low confidence -> a person decides")
drafts = sorted(p.name for p in (H / "output/drafts").iterdir())
check("04_spam.txt" not in drafts and "02_support.txt" in drafts, "drafts only for billing/support/sales, none for spam")
check("priority" in (H / "output/drafts/02_support.txt").read_text("utf-8"), "urgent draft mentions priority")
check(triage.classify({"from": "a@b.example", "subject": "zzz", "body": "qqq"}, model)["label"] == "review", "no known words at all -> review, not a guess")
print(n, "ok")
