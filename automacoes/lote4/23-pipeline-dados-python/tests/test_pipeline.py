import sys, pathlib, datetime as dt
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, pipeline

R = run_scenarios.main(); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

check(R["clean"]["exit"] == 0 and R["clean"]["summary"]["rows_ok"] == 12, "clean day: exit 0, 12 rows loaded")
d = R["dirty"]; check(d["exit"] == 2 and [x["reason"] for x in d["summary"]["rejected"]] == ["duplicate order_id", "qty must be an integer > 0"], "dirty day: exit 2, two rows quarantined with reasons")
check(R["rerun"]["summary"]["kpi"] == d["summary"]["kpi"] and R["_warehouse"]["orders_per_day"][1] == ("2026-11-10", 10), "re-run is idempotent (still 10 rows, same KPI)")
check("volume drop" in R["volume_drop"]["summary"]["alert"], "volume drop raises a warning but still loads")
check(R["schema_change"]["exit"] == 1 and R["schema_change"]["summary"]["status"] == "halted", "schema change halts, nothing loaded")
check(R["too_dirty"]["exit"] == 1 and "kpi" not in R["too_dirty"]["summary"], "42% rejected halts, no KPI written")
check(R["no_source"]["exit"] == 3, "missing source: exit 3 and alert")
check(len(R["_warehouse"]["daily_kpi"]) == 3, "halted/missing days left the warehouse untouched (3 KPI days)")
check(pipeline.next_run(dt.datetime(2026, 11, 12, 7, 0), "06:30") == dt.datetime(2026, 11, 13, 6, 30) and pipeline.next_run(dt.datetime(2026, 11, 12, 5, 0), "06:30") == dt.datetime(2026, 11, 12, 6, 30), "scheduler: next_run today or tomorrow")
print(n, "ok")
