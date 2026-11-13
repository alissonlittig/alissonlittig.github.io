"""Roda os cenários do agente (ledger de reembolsos compartilhado entre eles) e grava output/scenarios.json."""
import json, pathlib
import agent
HERE = pathlib.Path(__file__).parent
SEQ = [("refund_auto", "I want a refund for order ORD-1001, it arrived broken.", "good"), ("refund_approval", "Please refund ORD-1002", "good"), ("refund_twice", "refund ORD-1001 again please", "good"), ("refund_late", "Quero reembolso do pedido ORD-1004", "good"),
       ("status", "Where is my order ORD-1003?", "good"), ("faq", "How long does shipping take?", "good"), ("not_found", "status of ORD-9999", "good"), ("no_id", "I need a refund", "good"),
       ("sloppy_model", "status ORD-1003", "sloppy"), ("loop_guard", "status ORD-1003", "loop"), ("unknown_faq", "Do you sell gift cards?", "good")]


def main():
    ledger = []; R = {}
    for k, q, mode in SEQ:
        r = agent.run(q, agent.sim_llm(mode), ledger=ledger); R[k] = {"input": {"question": q, "model": mode}, **r, "ledger": [dict(x) for x in ledger]}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__": main(); print("ok")
