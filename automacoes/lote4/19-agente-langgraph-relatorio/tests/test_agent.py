import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from agent import run, critique_text, CORPUS

def test_happy_path_all_cited():
    r = run("market size, pricing, competition and churn for coffee subscriptions")
    assert [s["facet"] for s in r["sections"]] == ["size", "pricing", "competition", "churn"]
    assert all(len(s["sources"]) >= 2 for s in r["sections"]), [s["sources"] for s in r["sections"]]

def test_revision_loop_widens_search():
    r = run("churn and retention for coffee subscriptions")
    nodes = [t["node"] for t in r["trace"]]
    assert "revise" in nodes and len(r["sections"][0]["sources"]) >= 2

def test_source_down_is_reported_not_hidden():
    r = run("pricing for coffee subscriptions", faults={"d03": 99})
    assert "d03" not in r["report"].split("## Sources")[1] and "unreachable" in r["report"]

def test_transient_failure_recovers():
    r = run("competition for coffee subscriptions", faults={"d08": 1})
    assert "d08" in r["sections"][0]["sources"] and "unreachable" not in r["report"]

def test_short_question_stops_cleanly():
    assert run("hi")["error"] == "question too short to plan"

def test_critic_catches_fabricated_number_and_unretrieved_source():
    docs = [CORPUS["d03"], CORPUS["d07"]]
    assert critique_text("Bags cost US$ 99.00. [d03] Shipping is cheap. [d07]", docs) == ["number 99.00 not in cited sources"]
    assert "cites d01 which was not retrieved" in critique_text("x [d01] y [d03]", docs)

if __name__ == "__main__":
    for k, f in list(globals().items()):
        if k.startswith("test_"): f(); print("ok", k)
