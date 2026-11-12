"""Runs the real pipeline on 7 days of a shared warehouse and records every summary in output/."""
import json, pathlib, sqlite3, tempfile, os
import pipeline
HERE = pathlib.Path(__file__).parent; D = HERE / "data"
SEQ = [  # name, file (None = source never arrived), run date
    ("clean", "orders_2026-11-09.csv", "2026-11-09"), ("dirty", "orders_2026-11-10.csv", "2026-11-10"), ("rerun", "orders_2026-11-10.csv", "2026-11-10"),
    ("volume_drop", "orders_2026-11-11.csv", "2026-11-11"), ("schema_change", "orders_2026-11-12_schema.csv", "2026-11-12"),
    ("too_dirty", "orders_2026-11-12_bad.csv", "2026-11-12"), ("no_source", None, "2026-11-12")]

def main():
    tmp = tempfile.mkdtemp(); db = os.path.join(tmp, "wh.db"); alerts = HERE / "output" / "alerts.jsonl"; (HERE / "output").mkdir(exist_ok=True); alerts.unlink(missing_ok=True); R = {}
    for name, f, day in SEQ:
        text = (D / f).read_text("utf-8") if f else None
        code, S = pipeline.run(db, text, day, alerts); R[name] = {"file": f, "csv": text, "run_date": day, "exit": code, "summary": S}
    d = sqlite3.connect(db); R["_warehouse"] = {"daily_kpi": d.execute("SELECT * FROM daily_kpi ORDER BY day").fetchall(), "orders_per_day": d.execute("SELECT order_date, COUNT(*) FROM orders GROUP BY 1 ORDER BY 1").fetchall()}; d.close()
    (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R

if __name__ == "__main__":
    for k, v in main().items(): print(k, v.get("exit"), json.dumps(v.get("summary", v), ensure_ascii=False)[:300])
