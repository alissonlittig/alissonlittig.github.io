"""Sobe o app de verdade (TestClient), manda eventos assinados com HMAC e grava cada resposta em output/scenarios.json."""
import hashlib, hmac, json, pathlib
from fastapi.testclient import TestClient
import app as A
HERE = pathlib.Path(__file__).parent; E = json.loads((HERE / "data" / "events.json").read_text("utf-8")); SECRET = "demo-secret"


def sign(raw: bytes) -> str: return "sha256=" + hmac.new(SECRET.encode(), raw, hashlib.sha256).hexdigest()


def main():
    sinks = A.Sinks(); sleeps = []; app = A.create_app(SECRET, sinks, sleeps.append); c = TestClient(app); R = {}
    def send(name, text, sig="valid", chat="up"):
        raw = text.encode(); sinks.fail = {"chat": 2 if chat == "flaky" else (-1 if chat == "down" else 0)}; sleeps.clear()
        r = c.post("/hooks/shop", content=raw, headers={"x-signature": sign(raw) if sig == "valid" else "sha256=" + "0" * 64})
        R[name] = {"input": {"event": text, "sig": sig, "chat": chat}, "status": r.status_code, "body": r.json(), "sleeps": list(sleeps),
                   "counts": {"sheet": len(sinks.sheet), "chat": len(sinks.chat), "mail": len(sinks.mail), "dead": len(app.state.dead)}}
    j = lambda k: json.dumps(E[k], ensure_ascii=False)
    send("big", j("big")); send("small", j("small")); send("refund", j("refund")); send("form", j("form"))
    send("duplicate", j("big")); send("bad_signature", j("small"), sig="bad"); send("invalid", j("invalid")); send("bad_json", "{oops")
    send("flaky", j("flaky"), chat="flaky"); send("down", j("down"), chat="down")
    R["_state"] = {"sheet": sinks.sheet, "chat": sinks.chat, "mail": sinks.mail, "dead_letter": app.state.dead}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__": main(); print("ok")
