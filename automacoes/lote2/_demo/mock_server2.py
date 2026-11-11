"""Local stand-in for Telegram, an OpenAI-compatible LLM (deterministic tool-planner), a web-search API,
company web pages and a flaky 'System B' REST API. Port 8098. Nothing leaves the machine."""
import json, os, re, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, "out"); os.makedirs(OUT, exist_ok=True)
PRODUCTS = ["kettle", "blender", "air fryer", "toaster", "grill"]
SEARCH = {"kettle": "Review roundup 2026: electric kettles under US$ 60 average US$ 41; 1.7 L models lead.",
          "competitor": "Competitor HomeNest cut blender prices 10% this week (public price page).",
          "default": "No strong public results for this query."}
SITES = {
 "brightpath": ("BrightPath Dental", "Family dental clinic in Austin with online booking and 12 dentists. Built on WordPress.", "hello@brightpath.example", "+1 512 555 0142", "Healthcare"),
 "kilnworks": ("Kilnworks Ceramics", "Handmade ceramics shop. 3 people. Shopify store, ships worldwide.", "studio@kilnworks.example", "", "Retail"),
 "orbitlogix": ("Orbit Logix", "Freight forwarding software for mid-size logistics firms. 85 employees, Series B, hiring operations analysts.", "sales@orbitlogix.example", "+44 20 5550 0188", "Logistics"),
 "greenleaf": ("Greenleaf Accounting", "Bookkeeping and tax services for small businesses. 6 accountants.", "", "", "Finance"),
}
def llm(msgs):
    sysm = msgs[0]["content"]; user = next(m["content"] for m in reversed(msgs) if m["role"] == "user")
    low = user.lower(); done = [m["content"] for m in msgs if m["role"] == "assistant"]
    obs = [m["content"] for m in msgs if m["role"] == "tool"]
    prod = next((p for p in PRODUCTS if p in low), None)
    if not prod:
        mm = re.search(r"last_product=([a-z ]+)", sysm); prod = mm.group(1).strip() if mm else None
    need = []
    if re.search(r"stock|price|cost|how many|how much|available units", low) and prod: need.append(("sheet_lookup", {"query": prod}))
    if re.search(r"meet|free|slot|calendar|schedule|tomorrow|call", low):
        need.append(("calendar_free", {"date": "2026-11-11"}))
    if re.search(r"news|latest|search|competitor|market|reviews", low): need.append(("web_search", {"query": prod or "competitor"}))
    used = [json.loads(d).get("tool") for d in done if '"tool"' in d]
    for t, a in need:
        if t not in used: return json.dumps({"tool": t, "args": a})
    parts = []
    for o in obs:
        j = json.loads(o); parts.append(j.get("summary", ""))
    return json.dumps({"final": " ".join(p for p in parts if p) or "I could not find that. Could you rephrase?", "product": prod})
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ct="application/json"):
        b = body if isinstance(body, bytes) else body.encode()
        self.send_response(code); self.send_header("Content-Type", ct + "; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path
        if p.startswith("/notifications"):
            f = os.path.join(OUT, "notifications.jsonl"); self.send(200, open(f, encoding="utf-8").read() if os.path.exists(f) else "")
        elif p.startswith("/search"):
            q = p.split("q=")[-1].lower(); k = "kettle" if "kettle" in q else "competitor" if "competitor" in q else "default"
            self.send(200, json.dumps({"query": q, "results": [{"title": "Result", "snippet": SEARCH[k]}]}))
        elif p.startswith("/sites/"):
            s = SITES.get(p.split("/")[2].split("?")[0])
            if not s: return self.send(404, "<h1>Not found</h1>", "text/html")
            mail = f'<a href="mailto:{s[2]}">{s[2]}</a>' if s[2] else ""
            self.send(200, f'<html><head><title>{s[0]} - Home</title><meta name="description" content="{s[1]}"></head><body><h1>{s[0]}</h1><p>{s[1]}</p>{mail} <span class="tel">{s[3]}</span><footer>Industry: {s[4]}</footer></body></html>', "text/html")
        elif p.startswith("/systemb/state"):
            f = os.path.join(OUT, "systemb.json"); self.send(200, open(f).read() if os.path.exists(f) else "{}")
        else: self.send(404, "{}")
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); raw = self.rfile.read(n).decode("utf-8", "replace")
        if self.path.startswith("/notify") or "sendMessage" in self.path:
            with open(os.path.join(OUT, "notifications.jsonl"), "a", encoding="utf-8") as f:
                f.write(json.dumps({"t": time.strftime("%H:%M:%S"), "body": json.loads(raw or "{}")}, ensure_ascii=False) + "\n")
            self.send(200, '{"ok":true}')
        elif self.path.startswith("/v1/chat/completions"):
            m = json.loads(raw)["messages"]; self.send(200, json.dumps({"choices": [{"message": {"role": "assistant", "content": llm(m)}}]}))
        elif self.path.startswith("/systemb/orders"):
            f = os.path.join(OUT, "systemb.json"); st = json.load(open(f)) if os.path.exists(f) else {"orders": {}, "attempts": {}}
            o = json.loads(raw); k = self.headers.get("Idempotency-Key", o.get("external_id", "?"))
            st["attempts"][k] = st["attempts"].get(k, 0) + 1; a = st["attempts"][k]
            code, body = 201, {"ok": True, "id": "B-" + k}
            if k in st["orders"]: code, body = 200, {"ok": True, "id": st["orders"][k], "duplicate": True}
            elif k.endswith("-X") or (k.endswith("-F") and a <= 2): code, body = 503, {"error": "System B unavailable"}
            else: st["orders"][k] = "B-" + k
            json.dump(st, open(f, "w")); self.send(code, json.dumps(body))
        else: self.send(404, "{}")
ThreadingHTTPServer(("127.0.0.1", 8098), H).serve_forever()
