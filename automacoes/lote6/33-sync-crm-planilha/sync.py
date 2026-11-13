"""Two-way CRM <-> spreadsheet sync with de-duplication. Python standard library only. Fictional data.
Rule: match by e-mail, else by phone; per field the newest `updated` wins; same date + different value = conflict (kept, reported)."""
import csv, re, sys, json, pathlib

FIELDS = ("name", "email", "phone", "company")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")


def normalize(r):
    n = {k: " ".join(str(r.get(k, "") or "").split()) for k in FIELDS}
    n["email"] = n["email"].lower()
    d = re.sub(r"\D", "", n["phone"])
    if len(d) in (12, 13) and d.startswith("55"): d = d[2:]
    n["phone"] = d
    n["name"] = n["name"].title()
    n["updated"] = str(r.get("updated", "") or "").strip()
    return n


def errors(n):
    e = []
    if not n["name"]: e.append("name is required")
    if n["email"] and not EMAIL.match(n["email"]): e.append("email is invalid")
    if not n["email"] and len(n["phone"]) not in (10, 11): e.append("needs a valid e-mail or a phone with 10-11 digits")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", n["updated"]): e.append("updated must be YYYY-MM-DD")
    return e


def find(rows, n):
    for i, r in enumerate(rows):
        if n["email"] and r["email"] == n["email"]: return i
    for i, r in enumerate(rows):
        if n["phone"] and r["phone"] == n["phone"]: return i
    return -1


def merge(a, b):
    """merge b into a. returns (merged, changed_fields, conflicts)"""
    m, ch, cf = dict(a), [], []
    for k in FIELDS:
        if a[k] == b[k]: continue
        if not a[k]: m[k] = b[k]; ch.append(k)
        elif not b[k]: continue
        elif b["updated"] > a["updated"]: m[k] = b[k]; ch.append(k)
        elif b["updated"] == a["updated"]: cf.append(k)
    m["updated"] = max(a["updated"], b["updated"])
    if m["updated"] != a["updated"] and not ch: ch.append("updated")
    return m, ch, cf


def upsert(stores, origin, rec):
    """stores = {'crm': [...], 'sheet': [...]}; applies one incoming record from `origin` to both sides."""
    n = normalize(rec); e = errors(n)
    if e: return {"status": "rejected", "errors": e}
    other = "sheet" if origin == "crm" else "crm"; acts = []; conflicts = []
    i = find(stores[origin], n)
    if i < 0: stores[origin].append(dict(n)); acts.append(f"created in {origin}"); cur = n
    else:
        m, ch, cf = merge(stores[origin][i], n); stores[origin][i] = m; cur = m; conflicts += cf
        acts.append(f"same-side duplicate merged in {origin}" + (f" ({', '.join(ch)})" if ch else " (no change)"))
    j = find(stores[other], cur)
    if j < 0: stores[other].append(dict(cur)); acts.append(f"created in {other}")
    else:
        m, ch, cf = merge(stores[other][j], cur); stores[other][j] = m; conflicts += cf
        acts.append(f"updated in {other} ({', '.join(ch)})" if ch else f"{other} already up to date")
    return {"status": "conflict" if conflicts else "synced", "actions": acts, "conflicts": sorted(set(conflicts))}


def read_csv(p):
    with open(p, encoding="utf-8", newline="") as f: return list(csv.DictReader(f))


def write_csv(p, rows):
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(FIELDS) + ["updated"]); w.writeheader(); w.writerows(rows)


def run(crm_csv, sheet_csv, out_dir):
    """Full sync of two CSV files. Bad rows go to the report with line + reason; the input files are never overwritten."""
    out = pathlib.Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    st = {"crm": [], "sheet": []}; rep = {"rows_in": 0, "rejected": [], "conflicts": [], "counts": {}}
    for origin, p in (("crm", crm_csv), ("sheet", sheet_csv)):
        for ln, r in enumerate(read_csv(p), start=2):
            rep["rows_in"] += 1; res = upsert(st, origin, r)
            if res["status"] == "rejected": rep["rejected"].append({"file": origin, "line": ln, "errors": res["errors"]})
            else:
                for a in res["actions"]: k = a.split(" (")[0]; rep["counts"][k] = rep["counts"].get(k, 0) + 1
                if res["conflicts"]: rep["conflicts"].append({"file": origin, "line": ln, "fields": res["conflicts"]})
    write_csv(out / "crm_synced.csv", st["crm"]); write_csv(out / "sheet_synced.csv", st["sheet"])
    rep["crm_rows"], rep["sheet_rows"] = len(st["crm"]), len(st["sheet"])
    (out / "report.json").write_text(json.dumps(rep, indent=1, ensure_ascii=False), "utf-8"); return rep, st


if __name__ == "__main__":
    rep, _ = run(sys.argv[1], sys.argv[2], sys.argv[3]); print(json.dumps(rep, indent=1, ensure_ascii=False))
