"""Portal fictício "Atlas Distribuidora" (stdlib). Login, lista de relatórios por filial, download de CSV.
Falhas controláveis para testar o robô: FAULTS["fail"] = {filial: n_erros_500 (-1 = sempre)}, FAULTS["expire_after"] = n requisições até a sessão cair."""
import http.server, threading, pathlib, urllib.parse, secrets

DATA = pathlib.Path(__file__).parent / "data"
USER, PASSWORD = "analista", "demo123"  # credenciais fictícias do portal de teste
BRANCHES = {"curitiba": "Curitiba", "recife": "Recife", "salvador": "Salvador"}
FAULTS = {"fail": {}, "expire_after": None}
SESSIONS = {}  # token -> requisições restantes (None = ilimitado)
LOCK = threading.Lock()

CSS = "body{font:16px system-ui;background:#0f172a;color:#e2e8f0;max-width:640px;margin:40px auto;padding:0 16px}input,button{font:inherit;padding:8px 12px;margin:4px 0;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0}button{background:#f97316;color:#111;border:0;font-weight:700}a{color:#fb923c}li{margin:10px 0}"


def page(title, body): return f"<!doctype html><html lang='en'><meta charset='utf-8'><title>{title}</title><style>{CSS}</style><body><h1>{title}</h1>{body}</body></html>".encode()


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def send(self, code, body, ctype="text/html; charset=utf-8", extra=None):
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(body)))
        for k, v in (extra or {}).items(): self.send_header(k, v)
        self.end_headers(); self.wfile.write(body)

    def authed(self):
        tok = (self.headers.get("Cookie") or "").split("sid=")[-1].split(";")[0] if "sid=" in (self.headers.get("Cookie") or "") else None
        with LOCK:
            if tok not in SESSIONS: return False
            left = SESSIONS[tok]
            if left is not None:
                if left <= 0: del SESSIONS[tok]; return False
                SESSIONS[tok] = left - 1
        return True

    def do_GET(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        if u.path == "/login": return self.send(200, page("Atlas Portal · Sign in", "<form method='post' action='/login'><input name='user' placeholder='user'><br><input name='password' type='password' placeholder='password'><br><button>Sign in</button></form>"))
        if not self.authed(): return self.send(302, b"", extra={"Location": "/login"})
        if u.path == "/reports":
            li = "".join(f"<li>{n} · 2026-10 · <a id='dl-{k}' href='/download?branch={k}&month=2026-10'>Download CSV</a></li>" for k, n in BRANCHES.items())
            return self.send(200, page("Monthly sales reports", f"<ul>{li}</ul>"))
        if u.path == "/download":
            b = (q.get("branch") or [""])[0]; f = DATA / f"{b}_{(q.get('month') or [''])[0]}.csv"
            if b not in BRANCHES or not f.exists(): return self.send(404, page("404", "Report not found"))
            with LOCK:
                n = FAULTS["fail"].get(b, 0)
                if n != 0:
                    if n > 0: FAULTS["fail"][b] = n - 1
                    return self.send(500, page("500", "Internal error generating the report"))
            return self.send(200, f.read_bytes(), "text/csv", {"Content-Disposition": f'attachment; filename="{b}_2026-10.csv"'})
        self.send(404, page("404", "Not found"))

    def do_POST(self):
        if self.path != "/login": return self.send(404, page("404", "Not found"))
        d = urllib.parse.parse_qs(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode())
        if (d.get("user") or [""])[0] == USER and (d.get("password") or [""])[0] == PASSWORD:
            tok = secrets.token_hex(8)
            with LOCK: SESSIONS[tok] = FAULTS["expire_after"]
            return self.send(302, b"", extra={"Location": "/reports", "Set-Cookie": f"sid={tok}; Path=/"})
        self.send(401, page("Atlas Portal · Sign in", "<p>Invalid credentials.</p><a href='/login'>Try again</a>"))


def start(port=0):
    s = http.server.ThreadingHTTPServer(("127.0.0.1", port), H); threading.Thread(target=s.serve_forever, daemon=True).start(); return s


def reset(fail=None, expire_after=None):
    with LOCK: FAULTS["fail"] = dict(fail or {}); FAULTS["expire_after"] = expire_after; SESSIONS.clear()


if __name__ == "__main__":
    s = start(8765); print("portal em http://127.0.0.1:8765  (user analista / senha demo123)"); threading.Event().wait()
