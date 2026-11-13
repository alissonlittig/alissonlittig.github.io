"""Roda o bot de verdade em 5 conversas simuladas (Telegram e Discord) e grava output/scenarios.json. Cada item: mensagem + intervalo (s) desde a anterior."""
import json, pathlib
import bot
HERE = pathlib.Path(__file__).parent
P = lambda plat, user, text, gap="3": {"platform": plat, "user": user, "text": text, "gap": gap}
SCEN = {
    "pedido": [P("telegram", "111", "/start"), P("telegram", "111", "/pedido 1042"), P("telegram", "111", "/pedido 2001"), P("telegram", "111", "/estoque can-gel")],
    "novo": [P("telegram", "111", "/novo"), P("telegram", "111", "Mochila"), P("telegram", "111", "abc"), P("telegram", "111", "2"), P("telegram", "111", "sim")],
    "discord": [P("discord", "222", "/estoque MOC-01"), P("discord", "222", "/pedido@Atendimento 2001"), P("discord", "222", "oi, tudo bem?")],
    "admin": [P("telegram", "111", "/admin_resumo"), P("telegram", "222", "/admin_resumo")],
    "flood": [P("telegram", "111", "/ajuda", "0.5")] * 6 + [P("telegram", "111", "/ajuda", "12")],
}
UID = {"111": "Ana", "222": "Bruno"}


def play(items, state=None, t0=1000.0):
    state = state or bot.new_state(); t = t0; out = []
    for it in items:
        t += float(it["gap"]); ev = bot.make_update(it["platform"], it["user"], UID[it["user"]], it["text"], t)
        route, payload = bot.process(state, ev); out.append({"input": it, "event": ev, "route": route, "payload": payload})
    return out


def main():
    R = {k: play(v) for k, v in SCEN.items()}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__": main(); print("ok")
