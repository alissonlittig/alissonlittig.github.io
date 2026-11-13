"""Roteador de webhooks estilo Make/Zapier em FastAPI: recebe evento assinado, deduplica, roteia por regra e entrega
nas ações (planilha, chat, e-mail) com retentativa; o que falha de vez vai para a dead letter e a resposta é 202.
Ações aqui são sinks em memória (troque por requests/SMTP reais). uvicorn app:app"""
import hashlib, hmac, json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

ATTEMPTS = 3
BACKOFF = [0.5, 1.0]  # segundos entre tentativas (o sleep é injetável para testar sem esperar)


class Sinks:
    """Destinos fictícios. fail[nome] = quantas chamadas seguidas devem falhar (simula API fora do ar); -1 = sempre."""
    def __init__(self):
        self.sheet, self.chat, self.mail, self.fail, self.calls = [], [], [], {}, {}

    def _go(self, name):
        self.calls[name] = self.calls.get(name, 0) + 1
        n = self.fail.get(name, 0)
        if n != 0:
            self.fail[name] = n - 1 if n > 0 else n
            raise ConnectionError(f"{name}: 503 service unavailable")

    def send(self, action, arg):
        self._go(action)
        {"sheet": self.sheet, "chat": self.chat, "mail": self.mail}[action].append(arg)


def verify(secret: str, body: bytes, header: str) -> bool:
    want = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(want, header or "")


def validate(ev):
    e = []
    if not isinstance(ev, dict): return ["body must be a JSON object"]
    if not str(ev.get("id", "")).strip(): e.append("id is required")
    if ev.get("type") not in ("payment.approved", "payment.refunded", "form.submitted"): e.append("type must be payment.approved|payment.refunded|form.submitted")
    d = ev.get("data")
    if not isinstance(d, dict): e.append("data must be an object")
    elif ev.get("type", "").startswith("payment.") and not (isinstance(d.get("amount"), (int, float)) and d["amount"] > 0): e.append("data.amount must be a number > 0")
    return e


def route(ev):
    """Regras: evento -> lista de (ação, argumento). Equivalente ao 'router' de um cenário Make."""
    t, d = ev["type"], ev["data"]
    if t == "payment.approved":
        acts = [("sheet", [ev["id"], t, d.get("customer", ""), d["amount"]]), ("mail", {"to": d.get("email", ""), "subject": f"Receipt {ev['id']}"})]
        if d["amount"] >= 1000: acts.append(("chat", f"Big sale: {d.get('customer', '?')} paid {d['amount']:.2f}"))
        return acts
    if t == "payment.refunded":
        return [("sheet", [ev["id"], t, d.get("customer", ""), -d["amount"]]), ("chat", f"Refund: {d.get('customer', '?')} {d['amount']:.2f} (check the reason)")]
    return [("sheet", [ev["id"], t, d.get("name", ""), d.get("email", "")]), ("mail", {"to": d.get("email", ""), "subject": "We got your message"})]


def create_app(secret="demo-secret", sinks=None, sleep=lambda s: None):
    app = FastAPI(title="webhook-router"); app.state.sinks = sinks or Sinks(); app.state.seen = {}; app.state.dead = []

    @app.post("/hooks/{source}")
    async def hook(source: str, request: Request):
        body = await request.body()
        if not verify(secret, body, request.headers.get("x-signature", "")):
            return JSONResponse({"status": "rejected", "error": "invalid signature"}, 401)
        try: ev = json.loads(body)
        except ValueError: return JSONResponse({"status": "rejected", "errors": ["malformed JSON"]}, 400)
        errs = validate(ev)
        if errs: return JSONResponse({"status": "rejected", "errors": errs}, 422)
        if ev["id"] in app.state.seen:  # o remetente reenvia quando acha que falhou: não repete efeito
            return {"status": "duplicate", "id": ev["id"], "first_result": app.state.seen[ev["id"]]}
        done, dead = [], []
        for action, arg in route(ev):
            for i in range(ATTEMPTS):
                try: app.state.sinks.send(action, arg); done.append({"action": action, "attempts": i + 1}); break
                except ConnectionError as e:
                    if i < ATTEMPTS - 1: sleep(BACKOFF[i])
                    else: dead.append({"action": action, "error": str(e), "attempts": ATTEMPTS}); app.state.dead.append({"event": ev, "action": action, "arg": arg})
        res = {"status": "partial" if dead else "ok", "id": ev["id"], "source": source, "delivered": done, "dead_letter": dead}
        app.state.seen[ev["id"]] = res["status"]
        return JSONResponse(res, 202 if dead else 200)
    return app
