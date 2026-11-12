"""Sobe SMTP sink + Node-RED, manda 4 planilhas e guarda respostas e e-mails em output/. Parte do teste ponta a ponta."""
import subprocess, sys, time, json, pathlib, urllib.request, urllib.error, email, shutil, os
H = pathlib.Path(__file__).parent; OUT = H / "output"; sys.path.insert(0, str(H))
import smtp_sink
def post(body):
    r = urllib.request.Request("http://127.0.0.1:1881/expenses", body.encode(), {"Content-Type": "text/csv"})
    try:
        with urllib.request.urlopen(r, timeout=30) as x: return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read())
def main():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    sink = smtp_sink.start(OUT / "inbox")
    nr = subprocess.Popen(["node", "runtime/node_modules/node-red/red.js", "-s", "runtime/settings.js", "-u", "runtime", "flows.json"], cwd=H, stdout=open(OUT / "nodered.log", "w"), stderr=subprocess.STDOUT)
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:1881/", timeout=1); break
            except urllib.error.HTTPError: break
            except Exception: time.sleep(1)
        res = {}
        for name, f in [("clean", "clean.csv"), ("issues", "issues.csv"), ("bad_header", "bad_header.csv")]:
            res[name] = dict(zip(("status", "body"), post((H / "data" / f).read_text("utf-8"))))
        sink.stop()  # SMTP caiu
        res["smtp_down"] = dict(zip(("status", "body"), post((H / "data" / "issues.csv").read_text("utf-8"))))
        mails = [email.message_from_bytes(p.read_bytes()) for p in sorted((OUT / "inbox").glob("*.eml"))]
        res["emails"] = [{"to": m["To"], "subject": m["Subject"], "body": m.get_payload(decode=True).decode().strip()} for m in mails]
        q = OUT / "outbox_retry.jsonl"; res["retry_queue"] = [json.loads(l) for l in q.read_text("utf-8").splitlines()] if q.exists() else []
        (OUT / "results.json").write_text(json.dumps(res, indent=1), "utf-8"); return res
    finally: nr.terminate(); nr.wait(15)
if __name__ == "__main__": print(json.dumps(main(), indent=1))
