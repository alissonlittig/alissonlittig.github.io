import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, agent

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
tools = lambda k: [s["tool"] for s in R[k]["steps"]]

check(tools("refund_auto") == ["get_order", "create_refund"] and "issued" in R["refund_auto"]["answer"], "89.90 refund inside 30 days: issued automatically")
check("human approval" in R["refund_approval"]["answer"] and R["refund_approval"]["ledger"][-1]["status"] == "pending_approval", "249.00 refund: above the 100.00 limit, pending approval (rule lives in the tool)")
check("already refunded" in R["refund_twice"]["answer"] and len(R["refund_twice"]["ledger"]) == 2, "second refund on same order is refused, ledger unchanged")
check(tools("refund_late") == ["get_order", "create_refund"] and "not refundable" in R["refund_late"]["answer"], "45 days: tool refuses, agent explains")
check(tools("status") == ["get_order"] and "2026-11-14" in R["status"]["answer"], "status: one tool call")
check(tools("faq") == ["search_faq"] and "3-7" in R["faq"]["answer"], "FAQ question uses search_faq")
check("could not find order ORD-9999" in R["not_found"]["answer"], "unknown order: tool error becomes an answer, no crash")
check(tools("no_id") == [] and "Which order" in R["no_id"]["answer"], "no order id: asks instead of calling a tool")
s = R["sloppy_model"]["steps"]; check(len(s) == 2 and "missing order_id" in s[0]["result"]["error"] and "result" in s[1] and "error" not in s[1]["result"], "bad arguments are caught, model retries correctly")
l = R["loop_guard"]; check(l["stopped"] and len(l["steps"]) == 6, "runaway model stopped at 6 steps")
check("handing this to a human" in R["unknown_faq"]["answer"], "no FAQ match: hands over to a human")
check(agent.call_tool("create_refund", {"order_id": "ORD-1001", "amount": "9"}, agent.ORDERS, [])["error"].startswith("invalid arguments: wrong type"), "string amount rejected by schema check")
check(agent.call_tool("drop_table", {}, agent.ORDERS, [])["error"] == "unknown tool drop_table", "unknown tool rejected")
print(n, "ok")
