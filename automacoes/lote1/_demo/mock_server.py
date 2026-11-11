"""Local stand-in for Telegram, a shop page and an OpenAI-compatible LLM. Port 8099. Nothing leaves the machine."""
import json, os, re, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, "out"); os.makedirs(OUT, exist_ok=True)
SHOP = os.path.join(D, "shop_state.json")
if not os.path.exists(SHOP):
    json.dump({"name": "Tênis Corrida Aero 2", "price": "299.90", "stock": "12"}, open(SHOP, "w"))

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype="application/json"):
        b = body if isinstance(body, bytes) else body.encode()
        self.send_response(code); self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/shop"):
            s = json.load(open(SHOP, encoding="utf-8"))
            self._send(200, f'<html><body><div class="product"><h1 class="name">{s["name"]}</h1>'
                f'<span class="price">R$ {s["price"]}</span><span class="stock">{s["stock"]} em estoque</span></div></body></html>', "text/html")
        elif self.path.startswith("/notifications"):
            p = os.path.join(OUT, "notifications.jsonl")
            self._send(200, open(p, encoding="utf-8").read() if os.path.exists(p) else "")
        else: self._send(404, "{}")
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); raw = self.rfile.read(n).decode("utf-8", "replace")
        if "sendMessage" in self.path or self.path.startswith("/notify"):
            with open(os.path.join(OUT, "notifications.jsonl"), "a", encoding="utf-8") as f:
                f.write(json.dumps({"t": time.strftime("%H:%M:%S"), "body": json.loads(raw or "{}")}, ensure_ascii=False) + "\n")
            self._send(200, '{"ok":true}')
        elif self.path.startswith("/v1/chat/completions"):
            txt = raw.lower()
            cat = "billing" if re.search(r"refund|charge|invoice|reembols|cobran", txt) else "bug" if re.search(r"error|crash|erro|not working", txt) else "question"
            out = json.dumps({"category": cat, "urgency": "high" if "urgent" in txt or "urgente" in txt else "normal",
                              "reply": "Thanks for reaching out. We are on it and will get back to you shortly."})
            self._send(200, json.dumps({"choices": [{"message": {"role": "assistant", "content": out}}]}))
        elif self.path.startswith("/shop/set"):
            json.dump(json.loads(raw), open(SHOP, "w")); self._send(200, '{"ok":true}')
        else: self._send(404, "{}")
ThreadingHTTPServer(("127.0.0.1", 8099), H).serve_forever()
