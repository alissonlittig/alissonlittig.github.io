"""Agente de suporte com tool calling, sem chave paga e sem rede.
O "LLM" aqui é SIMULADO (sim_llm: regras fixas que devolvem tool_calls no formato de chat de função). O que é real é o laço do agente:
validação de argumentos contra o schema, erro de ferramenta devolvido ao modelo, trava de passos, política de reembolso fora do modelo.
Para usar um modelo de verdade, troque sim_llm por uma função com a mesma assinatura: llm(messages) -> {"content": str} | {"tool_calls": [{"name", "arguments"}]}."""
import json, re

ORDERS = {"ORD-1001": {"status": "delivered", "days": 12, "total": 89.90}, "ORD-1002": {"status": "delivered", "days": 5, "total": 249.00},
          "ORD-1003": {"status": "shipped", "days": 0, "total": 59.00, "eta": "2026-11-14"}, "ORD-1004": {"status": "delivered", "days": 45, "total": 120.00}}
FAQ = [(("shipping", "delivery", "prazo", "entrega"), "Standard delivery takes 3-7 business days."), (("refund", "return", "policy", "devolução"), "Refunds are accepted within 30 days of delivery. Refunds above 100.00 need human approval."),
       (("invoice", "nota", "receipt"), "Invoices are e-mailed when the order ships.")]
AUTO_LIMIT, WINDOW_DAYS = 100.0, 30  # política: fica no código das ferramentas, não no prompt do modelo


def get_order(order_id, orders=ORDERS, **_):
    o = orders.get(order_id); return {"order_id": order_id, **o} if o else {"error": "order not found"}


def search_faq(query, **_):
    q = query.lower(); hits = [a for ks, a in FAQ if any(k in q for k in ks)]; return {"answer": hits[0]} if hits else {"error": "no faq match"}


def create_refund(order_id, amount, orders=ORDERS, ledger=None, **_):
    o = orders.get(order_id)
    if not o: return {"error": "order not found"}
    if o["status"] != "delivered" or o["days"] > WINDOW_DAYS: return {"error": f"not refundable (status {o['status']}, {o['days']} days)"}
    if any(r["order_id"] == order_id for r in ledger): return {"error": "already refunded or pending"}
    if not 0 < amount <= o["total"]: return {"error": f"amount must be between 0 and {o['total']}"}
    st = "refunded" if amount <= AUTO_LIMIT else "pending_approval"; ledger.append({"order_id": order_id, "amount": amount, "status": st}); return {"order_id": order_id, "amount": amount, "status": st}


TOOLS = {"get_order": (get_order, {"order_id": str}, ["order_id"]), "search_faq": (search_faq, {"query": str}, ["query"]), "create_refund": (create_refund, {"order_id": str, "amount": (int, float)}, ["order_id", "amount"])}


def call_tool(name, args, orders, ledger):
    """Valida antes de executar; qualquer problema vira {"error": ...} para o modelo corrigir, nunca exceção."""
    if name not in TOOLS: return {"error": f"unknown tool {name}"}
    fn, props, req = TOOLS[name]
    if not isinstance(args, dict): return {"error": "invalid arguments: must be an object"}
    miss = [k for k in req if k not in args]
    if miss: return {"error": "invalid arguments: missing " + ", ".join(miss)}
    bad = [k for k, v in args.items() if k in props and (not isinstance(v, props[k]) or isinstance(v, bool))]
    if bad: return {"error": "invalid arguments: wrong type for " + ", ".join(bad)}
    return fn(**{k: v for k, v in args.items() if k in props}, orders=orders, ledger=ledger)


def sim_llm(mode="good"):
    """LLM simulado. mode: good | sloppy (1ª chamada com argumento faltando) | loop (nunca para de chamar get_order)."""
    def llm(messages):
        user = messages[0]["content"]; tools = [m for m in messages if m["role"] == "tool"]; last = tools[-1] if tools else None
        oid = (re.search(r"ORD-\d+", user.upper()) or [None])[0]; refund = bool(re.search(r"refund|reembols|devol", user.lower())); status = bool(re.search(r"where|status|track|rastre|cad[eê]", user.lower()))
        call = lambda n, a: {"tool_calls": [{"name": n, "arguments": a}]}
        if mode == "loop" and oid: return call("get_order", {"order_id": oid})
        if last is None:
            if (refund or status) and oid: return call("get_order", {} if mode == "sloppy" else {"order_id": oid})
            if refund or status: return {"content": "Which order is this about? Please send the order id (ORD-xxxx)."}
            return call("search_faq", {"query": user})
        r = json.loads(last["content"])
        if last["name"] == "search_faq": return {"content": r.get("answer", "I could not find that in the FAQ, so I am handing this to a human agent.")}
        if last["name"] == "get_order":
            if "error" in r: return call("get_order", {"order_id": oid}) if r["error"].startswith("invalid arguments") else {"content": f"I could not find order {oid}. Please check the id."}
            if not refund: return {"content": f"Order {oid} is {r['status']}" + (f", expected on {r['eta']}." if r.get("eta") else f" ({r['days']} days ago).")}
            return call("create_refund", {"order_id": oid, "amount": r["total"]})
        if "error" in r: return {"content": "I cannot refund this order: " + r["error"] + "."}
        return {"content": f"Refund of {r['amount']:.2f} for {r['order_id']} issued." if r["status"] == "refunded" else f"Refund of {r['amount']:.2f} for {r['order_id']} is above the automatic limit and was sent for human approval."}
    return llm


def run(user, llm, orders=ORDERS, ledger=None, max_steps=6):
    ledger = [] if ledger is None else ledger; msgs = [{"role": "user", "content": user}]; steps = []
    for n in range(1, max_steps + 1):
        m = llm(msgs)
        if "tool_calls" not in m: return {"answer": m["content"], "steps": steps, "stopped": False}
        msgs.append({"role": "assistant", "tool_calls": m["tool_calls"]})
        for c in m["tool_calls"]:
            res = call_tool(c["name"], c["arguments"], orders, ledger); steps.append({"n": n, "tool": c["name"], "args": c["arguments"], "result": res})
            msgs.append({"role": "tool", "name": c["name"], "content": json.dumps(res)})
    return {"answer": f"I could not finish within {max_steps} steps, so a human agent will take over.", "steps": steps, "stopped": True}
