"""Bot de atendimento para Telegram e Discord em MODO DEMO: nenhum token, nenhuma rede. Recebe eventos no formato real das duas plataformas
(Telegram update / Discord MESSAGE_CREATE), normaliza num formato só, roteia (comandos, conversa em etapas, admin, limite de mensagens)
e devolve o payload que seria enviado (sendMessage / create message). Dados fictícios.
Uso: python bot.py   (conversa de exemplo no terminal, sem rede)"""
import re

ORDERS = {"1042": {"owner": "111", "status": "enviado", "eta": "2026-11-14", "itens": 3}, "1043": {"owner": "111", "status": "em separação", "eta": "2026-11-17", "itens": 1}, "2001": {"owner": "222", "status": "entregue", "eta": "2026-11-09", "itens": 2}}
STOCK = {"CAD-96": ("Caderno 96f", 41), "CAN-GEL": ("Caneta gel", 0), "MOC-01": ("Mochila", 7)}
ADMINS = {"222"}; WINDOW, LIMIT = 10, 5
HELP = "Comandos: /pedido <numero> · /estoque <sku> · /novo · /cancelar · /ajuda"


def make_update(platform, uid, name, text, ts):
    """Monta o evento como a plataforma entregaria (usado nos testes e na demo)."""
    if platform == "telegram": return {"update_id": int(ts * 1000), "message": {"message_id": 1, "date": int(ts), "from": {"id": int(uid), "first_name": name}, "chat": {"id": int(uid)}, "text": text}}
    return {"t": "MESSAGE_CREATE", "d": {"id": str(int(ts * 1000)), "channel_id": "c-" + uid, "author": {"id": uid, "username": name}, "content": text, "timestamp": ts}}


def normalize(ev):
    if "message" in ev and "text" in ev["message"]:
        m = ev["message"]; return {"platform": "telegram", "uid": str(m["from"]["id"]), "name": m["from"].get("first_name", ""), "chat": str(m["chat"]["id"]), "text": m["text"].strip(), "ts": m["date"]}
    if ev.get("t") == "MESSAGE_CREATE":
        d = ev["d"]; return {"platform": "discord", "uid": d["author"]["id"], "name": d["author"]["username"], "chat": d["channel_id"], "text": d["content"].strip(), "ts": d["timestamp"]}
    raise ValueError("evento não suportado (só mensagem de texto)")


def render(msg, text):
    if msg["platform"] == "telegram": return {"method": "sendMessage", "chat_id": int(msg["chat"]), "text": text}
    return {"channel_id": msg["chat"], "content": text}


def new_state(): return {"users": {}, "seq": 5001}


def _step_text(f):
    return {"item": "Qual item você quer pedir?", "qtd": "Quantas unidades (1 a 99)?"}.get(f["step"]) or f"Confirma {f['qtd']} x {f['item']}? Responda sim ou não."


def handle(state, msg):
    """-> {'route': ..., 'text': ...}. Rotas: limited · command · flow · admin_denied · unknown. Estado por usuário em state['users'][uid]."""
    u = state["users"].setdefault(msg["uid"], {"flow": None, "times": []}); u["times"] = [t for t in u["times"] if t > msg["ts"] - WINDOW] + [msg["ts"]]
    if len(u["times"]) > LIMIT: return {"route": "limited", "text": "Calma, são muitas mensagens seguidas. Tente de novo em alguns segundos."}
    t = msg["text"]; cmd, _, arg = t.partition(" "); cmd = cmd.lower().split("@")[0]; arg = arg.strip()
    if cmd == "/cancelar": u["flow"] = None; return {"route": "command", "text": "Pedido cancelado. Nada foi registrado."}
    if u["flow"]:
        f = u["flow"]
        if f["step"] == "item":
            if not t or t.startswith("/"): return {"route": "flow", "text": "Escreva o nome do item. " + _step_text(f)}
            f["item"] = t[:40]; f["step"] = "qtd"
        elif f["step"] == "qtd":
            if not re.fullmatch(r"\d{1,2}", t) or int(t) < 1: return {"route": "flow", "text": "Número inválido. " + _step_text(f)}
            f["qtd"] = int(t); f["step"] = "ok"
        else:
            if t.lower() in ("sim", "s"): n = state["seq"]; state["seq"] += 1; u["flow"] = None; return {"route": "flow", "text": f"Pedido P-{n} registrado: {f['qtd']} x {f['item']}. (demo: nada foi gravado em sistema real)"}
            if t.lower() in ("não", "nao", "n"): u["flow"] = None; return {"route": "flow", "text": "Ok, descartei. Use /novo para recomeçar."}
            return {"route": "flow", "text": "Responda sim ou não."}
        return {"route": "flow", "text": _step_text(f)}
    if cmd in ("/start", "/ajuda"): return {"route": "command", "text": f"Oi, {msg['name']}! Sou o bot de atendimento (demo). " + HELP}
    if cmd == "/pedido":
        o = ORDERS.get(arg)
        if not o or o["owner"] != msg["uid"]: return {"route": "command", "text": "Não encontrei esse pedido na sua conta."}  # não revela pedido de outra pessoa
        return {"route": "command", "text": f"Pedido {arg}: {o['status']}, {o['itens']} item(ns), previsão {o['eta']}."}
    if cmd == "/estoque":
        s = STOCK.get(arg.upper())
        if not s: return {"route": "command", "text": "SKU não encontrado. Exemplos: CAD-96, CAN-GEL, MOC-01."}
        return {"route": "command", "text": f"{s[0]}: " + (f"{s[1]} em estoque." if s[1] else "sem estoque no momento.")}
    if cmd == "/novo": u["flow"] = {"step": "item"}; return {"route": "flow", "text": _step_text(u["flow"])}
    if cmd == "/admin_resumo":
        if msg["uid"] not in ADMINS: return {"route": "admin_denied", "text": "Esse comando é só para administradores."}
        return {"route": "command", "text": f"Resumo: {len(ORDERS)} pedidos na base, {sum(1 for s in STOCK.values() if s[1] == 0)} SKU sem estoque, {len(state['users'])} usuário(s) ativos."}
    return {"route": "unknown", "text": "Não entendi. " + HELP}


def process(state, ev):
    """Evento bruto -> (route, payload de envio). É o caminho completo que o webhook percorreria."""
    msg = normalize(ev); r = handle(state, msg); return r["route"], render(msg, r["text"])


if __name__ == "__main__":
    st = new_state()
    for i, tx in enumerate(["/start", "/pedido 1042", "/estoque can-gel", "/novo", "Mochila", "2", "sim"]):
        print("> " + tx); print(process(st, make_update("telegram", "111", "Ana", tx, 1000 + i * 3))[1]["text"])
