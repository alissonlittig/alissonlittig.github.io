"""Lead qualification service: webhook -> validate -> dedupe -> score -> task / notification / queue.
Python standard library only (http.server, sqlite3, urllib). Fictional data."""
import json, re, sqlite3, sys, datetime as dt, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
FREE = {"gmail.com", "hotmail.com", "yahoo.com", "outlook.com"}
SENIOR = ("ceo", "founder", "owner", "director", "head", "cto", "coo")
SOURCE_PTS = {"referral": 20, "webinar": 10, "ads": 5}
TIER_DAYS = {"hot": 1, "warm": 3}
OWNERS = ["Marina", "Paulo", "Rita"]  # round-robin on lead id
SCHEMA = """
CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, company TEXT, score INTEGER, tier TEXT, seen INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, lead_id INTEGER, owner TEXT, due TEXT, title TEXT);
CREATE TABLE IF NOT EXISTS outbox(id INTEGER PRIMARY KEY, text TEXT, reason TEXT);"""


def validate(p):
    errs = []
    if not isinstance(p, dict): return ["body must be a JSON object"]
    if not str(p.get("name", "")).strip(): errs.append("name is required")
    if not EMAIL.match(str(p.get("email", "")).strip()): errs.append("email is invalid")
    if str(p.get("source", "")).strip() not in ("referral", "webinar", "ads", "organic"): errs.append("source must be referral|webinar|ads|organic")
    for k in ("employees", "budget"):
        v = p.get(k, 0)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or v < 0: errs.append(f"{k} must be a number >= 0")
    return errs


def score(p):
    s, why = 0, []
    def add(n, t):
        nonlocal s
        s += n; why.append(f"{n:+d} {t}")
    e, b = p.get("employees", 0), p.get("budget", 0)
    if e >= 50: add(30, "50+ employees")
    elif e >= 10: add(15, "10+ employees")
    if any(w in str(p.get("role", "")).lower() for w in SENIOR): add(25, "senior role")
    if b >= 5000: add(30, "budget >= 5000")
    elif b >= 1000: add(15, "budget >= 1000")
    if SOURCE_PTS.get(p["source"]): add(SOURCE_PTS[p["source"]], f"source {p['source']}")
    if p["email"].split("@")[1].lower() in FREE: add(-10, "free e-mail domain")
    if re.search(r"\b(urgent|pricing|demo|quote)\b", str(p.get("message", "")).lower()): add(10, "buying words in message")
    return s, why


def tier(s): return "hot" if s >= 70 else "warm" if s >= 40 else "cold"


def post_json(url, body, timeout=2):
    req = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.status


def process(db, p, notify_url, today="2026-11-12"):
    """Returns (http_status, body). Never loses a hot lead: notification failure goes to the outbox (202)."""
    errs = validate(p)
    if errs: return 422, {"status": "rejected", "errors": errs}
    p = {**p, "email": p["email"].strip().lower(), "name": p["name"].strip()}
    s, why = score(p); t = tier(s)
    row = db.execute("SELECT id, score, tier, seen FROM leads WHERE email=?", (p["email"],)).fetchone()
    if row:  # duplicate: merge, keep best score, no second task
        best = max(s, row[1]); db.execute("UPDATE leads SET score=?, tier=?, seen=seen+1 WHERE id=?", (best, tier(best), row[0])); db.commit()
        return 200, {"status": "merged", "lead_id": row[0], "score": best, "tier": tier(best), "seen": row[3] + 1}
    cur = db.execute("INSERT INTO leads(email,name,company,score,tier) VALUES(?,?,?,?,?)", (p["email"], p["name"], p.get("company", ""), s, t)); lid = cur.lastrowid
    out = {"status": "created", "lead_id": lid, "score": s, "tier": t, "why": why}
    if t == "cold":
        db.commit(); out["action"] = "nurture list, no task"; return 200, out
    owner = OWNERS[lid % len(OWNERS)]; due = (dt.date.fromisoformat(today) + dt.timedelta(days=TIER_DAYS[t])).isoformat()
    db.execute("INSERT INTO tasks(lead_id,owner,due,title) VALUES(?,?,?,?)", (lid, owner, due, f"Call {p['name']} ({p.get('company') or 'no company'})")); out.update(owner=owner, due=due)
    if t == "hot":
        text = f"HOT lead {p['name']} ({p.get('company') or '-'}) score {s}, owner {owner}, due {due}"
        try:
            post_json(notify_url, {"text": text}); out["notified"] = True
        except (urllib.error.URLError, OSError) as e:
            db.execute("INSERT INTO outbox(text,reason) VALUES(?,?)", (text, type(getattr(e, "reason", e)).__name__)); db.commit()
            out.update(notified=False, queued=True); return 202, out
    db.commit(); return 200, out


def make_server(db_path, notify_url, port=0):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def _send(self, code, body):
            b = json.dumps(body).encode(); self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
        def do_POST(self):
            if self.path != "/leads": return self._send(404, {"error": "not found"})
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            try: p = json.loads(raw)
            except ValueError: return self._send(400, {"status": "rejected", "errors": ["body is not valid JSON"]})
            db = sqlite3.connect(db_path)
            try: self._send(*process(db, p, notify_url))
            finally: db.close()
    db = sqlite3.connect(db_path); db.executescript(SCHEMA); db.close()
    return ThreadingHTTPServer(("127.0.0.1", port), H)


if __name__ == "__main__":
    srv = make_server(sys.argv[1] if len(sys.argv) > 1 else "crm.db", sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:9100/notify", 8770)
    print("POST http://127.0.0.1:8770/leads"); srv.serve_forever()
