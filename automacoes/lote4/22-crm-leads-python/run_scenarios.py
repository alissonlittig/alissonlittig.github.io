"""Starts the real service + a local chat sink, sends scenarios, records every answer in output/."""
import json, pathlib, sqlite3, tempfile, threading, urllib.request, urllib.error, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import crm
HERE = pathlib.Path(__file__).parent; L = json.loads((HERE / "data" / "leads.json").read_text("utf-8"))


def sink():
    got = []
    class S(BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_POST(self):
            got.append(json.loads(self.rfile.read(int(self.headers["Content-Length"])))); self.send_response(200); self.send_header("Content-Length", "0"); self.end_headers()
    s = ThreadingHTTPServer(("127.0.0.1", 0), S); threading.Thread(target=s.serve_forever, daemon=True).start(); return s, got


def send(url, body, raw=False):
    req = urllib.request.Request(url, body if raw else json.dumps(body).encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.load(r)
    except urllib.error.HTTPError as e: return e.code, json.load(e)


def main():
    tmp = tempfile.mkdtemp(); db = os.path.join(tmp, "crm.db"); chat, got = sink()
    notify = f"http://127.0.0.1:{chat.server_port}/notify"
    api = crm.make_server(db, notify); threading.Thread(target=api.serve_forever, daemon=True).start(); url = f"http://127.0.0.1:{api.server_port}/leads"
    R = {}
    def rec(name, payload, **kw):
        st, body = send(url, payload, **kw); R[name] = {"input": payload if not kw else payload.decode(), "status": st, "body": body}
    rec("hot", L["hot"]); rec("warm", L["warm"]); rec("cold", L["cold"]); rec("duplicate", {**L["hot"], "budget": 100, "employees": 3})
    rec("invalid", L["invalid"]); rec("bad_json", b"{oops", raw=True)
    chat.shutdown(); chat.server_close()  # the notification channel really goes down: connection refused
    hot2 = {**L["hot"], "name": "Ivo Barros", "email": "ivo@portoeng.example", "company": "Porto Eng"}
    rec("chat_down", hot2); api.shutdown(); api.server_close()
    d = sqlite3.connect(db)
    R["_db"] = {"leads": d.execute("SELECT id,email,score,tier,seen FROM leads").fetchall(), "tasks": d.execute("SELECT lead_id,owner,due,title FROM tasks").fetchall(), "outbox": d.execute("SELECT text,reason FROM outbox").fetchall(), "chat_messages": got}
    d.close()
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__":
    for k, v in main().items(): print(k, json.dumps(v, ensure_ascii=False)[:260])
