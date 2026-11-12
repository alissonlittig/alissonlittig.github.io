"""Runs the real stock.ps1 (Windows PowerShell 5.1) one invoice at a time on a shared stock, then a batch run, and records everything."""
import json, pathlib, shutil, subprocess, tempfile, csv
HERE = pathlib.Path(__file__).parent; D = HERE / "data"; PS = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(HERE / "stock.ps1")]

def ps(inbox, data, res):
    p = subprocess.run(PS + ["-Inbox", str(inbox), "-Data", str(data), "-Results", str(res)], capture_output=True, text=True, timeout=120)
    return p.returncode, p.stdout, p.stderr

def stock(data): return {r["sku"]: int(r["on_hand"]) for r in csv.DictReader(open(data / "stock.csv", encoding="utf-8-sig"))}

def main():
    t = pathlib.Path(tempfile.mkdtemp()); R = {"runs": []}
    data, inbox, res = t / "data", t / "inbox", t / "res.json"; data.mkdir(); inbox.mkdir(); shutil.copy(D / "stock_start.csv", data / "stock.csv")
    R["stock_start"] = stock(data)
    for f in sorted((D / "invoices").glob("*.xml")):
        shutil.copy(f, inbox / f.name); code, out, err = ps(inbox, data, res)
        r = json.loads(res.read_text("utf-8-sig"))[0]; R["runs"].append({"file": f.name, "xml": f.read_text("utf-8"), "exit": code, "result": r, "stock_after": stock(data), "stderr": err.strip()})
    R["ledger"] = (data / "ledger.csv").read_text("utf-8").splitlines()
    R["folders"] = {d: sorted(x.name for x in (inbox / d).iterdir()) for d in ("processed", "duplicates", "rejected")}
    # batch: all 7 files at once on a fresh stock must end with the same stock
    t2 = pathlib.Path(tempfile.mkdtemp()); d2, i2 = t2 / "data", t2 / "inbox"; d2.mkdir(); i2.mkdir(); shutil.copy(D / "stock_start.csv", d2 / "stock.csv")
    for f in (D / "invoices").glob("*.xml"): shutil.copy(f, i2 / f.name)
    code, out, err = ps(i2, d2, t2 / "res.json"); R["batch"] = {"exit": code, "stock": stock(d2), "statuses": [x["status"] for x in json.loads((t2 / "res.json").read_text("utf-8-sig"))]}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R

if __name__ == "__main__":
    R = main()
    for r in R["runs"]: print(r["file"], r["exit"], r["result"]["status"], r["result"]["reason"], r["stock_after"], r["stderr"][:100])
    print(R["batch"], R["folders"])
