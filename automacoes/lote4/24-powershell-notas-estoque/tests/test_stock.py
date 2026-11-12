import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

r = {x["file"].split("_")[1]: x for x in R["runs"][:5]}; r["again"] = R["runs"][5]; r["noheader"] = R["runs"][6]
check(r["NF-1001"]["result"]["status"] == "applied" and r["NF-1001"]["stock_after"]["TEA-01"] == 100, "purchase invoice adds stock (TEA-01 40 -> 100)")
check(r["NF-1002"]["result"]["status"] == "applied" and r["NF-1002"]["stock_after"]["MUG-02"] == 15, "sales invoice removes stock (MUG-02 25 -> 15)")
check(r["NF-1003"]["exit"] == 2 and r["NF-1003"]["result"]["reason"] == "malformed XML", "broken XML rejected, exit 2")
check(r["NF-1004"]["result"]["reason"] == "unknown SKU PAN-99" and r["NF-1004"]["stock_after"]["TEA-01"] == 65, "unknown SKU rejects the WHOLE invoice (valid line TEA-01 not applied)")
check(r["NF-1005"]["result"]["reason"].startswith("insufficient stock for KET-03"), "stock would go negative: rejected")
check(r["again"]["result"]["status"] == "duplicate" and r["again"]["exit"] == 0 and r["again"]["stock_after"] == r["NF-1005"]["stock_after"], "same invoice twice: duplicate, stock unchanged")
check(r["noheader"]["result"]["status"] == "rejected", "invoice without number rejected")
check(R["batch"]["stock"] == R["runs"][-1]["stock_after"] and R["batch"]["statuses"].count("applied") == 2, "batch of 7 files ends with the same stock as one-by-one")
check(len(R["ledger"]) == 1 + 4 and R["folders"]["duplicates"] == ["06_NF-1001_again.xml"], "ledger has only the 4 applied lines; duplicate filed away")
print(n, "ok")
