"""Daily orders pipeline: extract -> schema check -> row validation -> quality gate -> idempotent load -> KPI -> alert.
pandas + sqlite3 + stdlib. Fictional data. Exit codes: 0 loaded, 2 loaded with warnings, 1 halted (nothing loaded), 3 source missing."""
import argparse, datetime as dt, io, json, pathlib, sqlite3, sys, time
import pandas as pd

COLUMNS = ["order_id", "customer_id", "sku", "qty", "unit_price", "order_date", "status"]
STATUS = {"paid", "shipped", "refunded"}
MAX_REJECT = 0.25   # more than 25% rejected rows = the file is suspect, load nothing
MIN_VOLUME = 0.5    # fewer than 50% of the average good rows of earlier days = warning
SCHEMA = """CREATE TABLE IF NOT EXISTS orders(order_id TEXT PRIMARY KEY, customer_id TEXT, sku TEXT, qty INTEGER, unit_cents INTEGER, order_date TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS daily_kpi(day TEXT PRIMARY KEY, orders INTEGER, revenue_cents INTEGER, avg_ticket_cents INTEGER, loaded_rows INTEGER);"""


def row_error(r, run_date, seen):
    if not r["order_id"].strip(): return "missing order_id"
    if r["order_id"] in seen: return "duplicate order_id"
    if not (r["qty"].isdigit() and int(r["qty"]) > 0): return "qty must be an integer > 0"
    try: ok = float(r["unit_price"]) > 0
    except ValueError: ok = False
    if not ok: return "unit_price must be > 0"
    if r["order_date"] != run_date: return "order_date is not the run date"
    if r["status"] not in STATUS: return "unknown status"
    return None


def run(db_path, csv_text, run_date, alert_path=None):
    """csv_text None = source file missing. Returns (exit_code, summary)."""
    S = {"run_date": run_date, "steps": []}
    def step(t): S["steps"].append(t)
    def finish(code, status, alert=None):
        S.update(status=status, exit=code)
        if alert:
            S["alert"] = alert
            if alert_path:
                with open(alert_path, "a", encoding="utf-8") as f: f.write(json.dumps({"day": run_date, "status": status, "alert": alert}) + "\n")
        return code, S
    if csv_text is None:
        step("extract: source file not found"); return finish(3, "no_source", f"orders_{run_date}.csv did not arrive; nothing loaded, yesterday's numbers stay")
    df = pd.read_csv(io.StringIO(csv_text), dtype=str, keep_default_na=False)
    step(f"extract: {len(df)} rows read")
    miss, extra = [c for c in COLUMNS if c not in df.columns], [c for c in df.columns if c not in COLUMNS]
    if miss or extra:
        step(f"schema: missing {miss}, unexpected {extra}"); S.update(rows_in=len(df))
        return finish(1, "halted", f"schema changed (missing {miss}, unexpected {extra}); nothing loaded")
    step("schema: ok")
    if df.empty: return finish(1, "halted", "file has a header but no rows; nothing loaded")
    seen, good, rej = set(), [], []
    for i, r in df.iterrows():
        e = row_error(r, run_date, seen)
        if e: rej.append({"line": i + 2, "reason": e})
        else: seen.add(r["order_id"]); good.append(r)
    S.update(rows_in=len(df), rows_ok=len(good), rows_rejected=len(rej), rejected=rej)
    step(f"validate: {len(good)} ok, {len(rej)} rejected")
    rate = len(rej) / len(df)
    if rate > MAX_REJECT:
        step(f"quality gate: {rate:.0%} rejected > {MAX_REJECT:.0%}, halting")
        return finish(1, "halted", f"{len(rej)} of {len(df)} rows rejected ({rate:.0%} > {MAX_REJECT:.0%}); nothing loaded, check the source system")
    step(f"quality gate: {rate:.0%} rejected, within {MAX_REJECT:.0%}")
    g = pd.DataFrame(good); g["qty"] = g["qty"].astype(int); g["unit_cents"] = (g["unit_price"].astype(float) * 100).round().astype(int)
    db = sqlite3.connect(db_path); db.executescript(SCHEMA)
    prev = db.execute("SELECT AVG(loaded_rows) FROM daily_kpi WHERE day<>?", (run_date,)).fetchone()[0]
    warns = []
    if prev and len(g) < MIN_VOLUME * prev: warns.append(f"volume drop: {len(g)} good rows vs average {prev:.0f} on earlier days")
    if rej: warns.append(f"{len(rej)} rows quarantined")
    with db:  # one transaction: replace the whole day, so a re-run never doubles the numbers
        db.execute("DELETE FROM orders WHERE order_date=?", (run_date,))
        db.executemany("INSERT INTO orders VALUES(?,?,?,?,?,?,?)", g[["order_id", "customer_id", "sku", "qty", "unit_cents", "order_date", "status"]].itertuples(index=False, name=None))
        sold = g[g["status"].isin(["paid", "shipped"])]; rev = int((sold["qty"] * sold["unit_cents"]).sum()); n = len(sold)
        k = {"orders": n, "revenue_cents": rev, "avg_ticket_cents": rev // n if n else 0}
        db.execute("INSERT OR REPLACE INTO daily_kpi VALUES(?,?,?,?,?)", (run_date, k["orders"], k["revenue_cents"], k["avg_ticket_cents"], len(g)))
    S["kpi"] = k; S["warehouse_rows_for_day"] = db.execute("SELECT COUNT(*) FROM orders WHERE order_date=?", (run_date,)).fetchone()[0]; db.close()
    step(f"load: day {run_date} replaced in one transaction, {S['warehouse_rows_for_day']} rows"); S["warnings"] = warns
    return (finish(2, "loaded_with_warnings", "; ".join(warns)) if warns else finish(0, "loaded"))


def next_run(now, hhmm):
    """Next datetime at HH:MM strictly after now (what the --loop mode sleeps until)."""
    h, m = map(int, hhmm.split(":")); t = now.replace(hour=h, minute=m, second=0, microsecond=0)
    return t if t > now else t + dt.timedelta(days=1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--inbox", default="data"); ap.add_argument("--db", default="warehouse.db"); ap.add_argument("--date"); ap.add_argument("--out", default="output")
    ap.add_argument("--loop-at", help="HH:MM: stay running and process yesterday's file every day at this time")
    a = ap.parse_args(); out = pathlib.Path(a.out); out.mkdir(exist_ok=True)
    def once(day):
        f = pathlib.Path(a.inbox) / f"orders_{day}.csv"; code, S = run(a.db, f.read_text("utf-8") if f.exists() else None, day, out / "alerts.jsonl")
        (out / f"summary_{day}.json").write_text(json.dumps(S, indent=1), "utf-8"); print(json.dumps({k: S.get(k) for k in ("run_date", "status", "rows_ok", "rows_rejected", "alert")})); return code
    if not a.loop_at: sys.exit(once(a.date or (dt.date.today() - dt.timedelta(days=1)).isoformat()))
    while True:  # shortcut: simple sleep loop; for production use Windows Task Scheduler / cron (see README)
        nxt = next_run(dt.datetime.now(), a.loop_at); time.sleep(max(0, (nxt - dt.datetime.now()).total_seconds()))
        once((dt.date.today() - dt.timedelta(days=1)).isoformat())
