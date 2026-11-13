import sys, pathlib, json
H = pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0, str(H))
import sync
rep, st = sync.run(H / "data/crm.csv", H / "data/planilha.csv", H / "output"); n = 0
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)
find = lambda side, e: next(r for r in st[side] if r["email"] == e)
check(len(st["crm"]) == len(st["sheet"]) == 5, "both sides end with the same 5 people")
a = find("crm", "ana.souza@lojaviva.example"); check(a["company"] == "Loja Viva Ltda" and a["updated"] == "2026-11-09", "newest value wins (company from the sheet, 11-08)")
check(a["phone"] == "41999991111", "'Ana S.' (no e-mail) matched to Ana by phone: same-side duplicate merged")
check(find("sheet", "diego@vitrine.example")["phone"] == "41977773333", "+55 and punctuation normalised")
check(find("crm", "eva@graos.example")["company"] == "Grãos da Serra", "record only in the sheet is created in the CRM")
check(find("crm", "carla@portoeng.example")["phone"] == "4133334444", "empty phone is filled from the other side")
check(len(rep["rejected"]) == 3 and {(r["file"], r["line"]) for r in rep["rejected"]} == {("crm", 6), ("sheet", 7), ("sheet", 8)}, "3 bad rows rejected with file+line (no name, bad e-mail, bad date)")
check(find("crm", "bruno@norteacos.example")["company"] == "Norte Aço", "same date, different company: CRM value kept")
check(rep["conflicts"] and rep["conflicts"][0]["fields"] == ["company"], "conflict reported with the field")
before = json.dumps(st, sort_keys=True); st2 = {k: [dict(r) for r in v] for k, v in st.items()}
for side in ("crm", "sheet"):
    for r in list(st[side]): sync.upsert(st2, side, r)
check(json.dumps(st2, sort_keys=True) == before, "running the sync again changes nothing (idempotent)")
check(sync.upsert({"crm": [], "sheet": []}, "crm", {"name": "X", "email": "x@y.example", "updated": "2026-01-01"})["actions"][1] == "created in sheet", "single record is created on both sides")
print(n, "ok")
