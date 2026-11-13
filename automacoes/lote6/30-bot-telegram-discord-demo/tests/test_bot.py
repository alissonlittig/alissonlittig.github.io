import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, bot
R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
tx = lambda k, i: R[k][i]["payload"].get("text") or R[k][i]["payload"]["content"]
p = R["pedido"]; check(p[0]["payload"]["method"] == "sendMessage" and p[0]["payload"]["chat_id"] == 111 and "Ana" in tx("pedido", 0), "telegram: /start responde com sendMessage para o chat certo")
check("enviado" in tx("pedido", 1) and "2026-11-14" in tx("pedido", 1), "/pedido 1042 do dono mostra status e previsão")
check(tx("pedido", 2) == "Não encontrei esse pedido na sua conta.", "pedido de OUTRA pessoa (2001) não vaza: mesma resposta de inexistente")
check("sem estoque" in tx("pedido", 3), "/estoque aceita minúsculas (can-gel -> sem estoque)")
f = R["novo"]; check([x["route"] for x in f] == ["flow"] * 5 and "Número inválido" in tx("novo", 2) and "P-5001 registrado: 2 x Mochila" in tx("novo", 4), "fluxo /novo: valida a quantidade, pede de novo, confirma e numera o pedido")
d = R["discord"]; check("channel_id" in d[0]["payload"] and d[0]["payload"]["content"].startswith("Mochila: 7"), "discord: payload no formato de create message")
check("previsão 2026-11-09" in tx("discord", 1), "/comando@NomeDoBot funciona (sufixo removido)")
check(d[2]["route"] == "unknown" and "/ajuda" in tx("discord", 2), "texto solto cai no fallback com ajuda")
a = R["admin"]; check(a[0]["route"] == "admin_denied" and a[1]["route"] == "command" and "3 pedidos" in tx("admin", 1), "admin: usuário comum negado, admin autorizado")
fl = R["flood"]; check([x["route"] for x in fl] == ["command"] * 5 + ["limited", "command"], "limite: 6ª mensagem em 3 s é barrada; depois da janela volta ao normal")
st = bot.new_state(); r1 = bot.process(st, bot.make_update("telegram", "111", "Ana", "/novo", 1)); r2 = bot.process(st, bot.make_update("telegram", "111", "Ana", "/cancelar", 5))
check("cancelado" in r2[1]["text"] and st["users"]["111"]["flow"] is None, "/cancelar limpa a conversa em andamento")
try: bot.normalize({"edited_message": {}}); check(False, "evento inesperado")
except ValueError: check(True, "evento que não é mensagem de texto é recusado com erro claro")
print(n, "ok")
