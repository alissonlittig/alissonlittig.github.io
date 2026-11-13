"""E-mail triage with NO paid API: deterministic rules first, then a small local Naive Bayes model (standard library only).
It only labels, routes and writes DRAFT replies to files. It never sends anything. Fictional data."""
import csv, io, json, math, re, sys, pathlib

STOP = set("the a an and or to of in on for is are was were be i we you your my our it this that with at as from by have has can could please hello hi thanks thank dear regards".split())
VIP = {"ceo@bigclient.example"}
BLOCK = {"promo-deals.example", "lucky-winner.example"}
URGENT = re.compile(r"\b(urgent|asap|outage|down|cannot access|chargeback|lawyer|legal action)\b", re.I)
INVOICE = re.compile(r"\binv-\d{3,}\b", re.I)
AUTO = re.compile(r"^\s*(automatic reply|out of office)", re.I)
MIN_CONF = 0.6
ROUTE = {"billing": "finance@team.example", "support": "support@team.example", "sales": "sales@team.example", "spam": "trash", "ignore": "archive", "review": "inbox-human"}
DRAFT = {"billing": "Hello,\n\nWe received your billing message and passed it to our finance team.{urgent}\nA person will confirm the details with you.\n\nBest regards",
         "support": "Hello,\n\nWe received your support request and passed it to our support team.{urgent}\nIt would help if you could send a screenshot and the steps to reproduce the problem.\n\nBest regards",
         "sales": "Hello,\n\nThank you for your interest. Your message went to our sales team, who will get back to you with details.{urgent}\n\nBest regards"}


def tokens(t): return [w for w in re.findall(r"[a-z]{3,}", t.lower()) if w not in STOP]


def load_labeled(text): return [tuple(l.split("|", 1)) for l in text.splitlines() if "|" in l]


def train(rows):
    labels = {}
    for lab, txt in rows:
        d = labels.setdefault(lab, {"docs": 0, "total": 0, "counts": {}}); d["docs"] += 1
        for w in tokens(txt): d["counts"][w] = d["counts"].get(w, 0) + 1; d["total"] += 1
    vocab = sorted({w for d in labels.values() for w in d["counts"]})
    return {"docs": len(rows), "vocab": vocab, "labels": labels}


def predict(model, text):
    vs = set(model["vocab"]); V = len(vs); toks = [w for w in tokens(text) if w in vs]; sc = {}
    for lab, d in model["labels"].items():
        sc[lab] = math.log(d["docs"] / model["docs"]) + sum(math.log((d["counts"].get(w, 0) + 1) / (d["total"] + V)) for w in toks)
    m = max(sc.values()); e = {k: math.exp(v - m) for k, v in sc.items()}; z = sum(e.values())
    p = {k: v / z for k, v in e.items()}; best = max(sorted(p), key=lambda k: p[k])
    return best, round(p[best], 3), len(toks)


def classify(msg, model):
    subj, body, frm = msg.get("subject", ""), msg.get("body", ""), msg.get("from", "").strip().lower(); dom = frm.split("@")[-1]
    text = subj + " " + body; why = []
    if AUTO.match(subj): label, src, conf = "ignore", "rule", 1.0; why.append("auto-reply subject")
    elif dom in BLOCK: label, src, conf = "spam", "rule", 1.0; why.append(f"sender domain {dom} is blocked")
    elif INVOICE.search(text): label, src, conf = "billing", "rule", 1.0; why.append("invoice number found")
    else:
        label, conf, known = predict(model, text); src = "model"; why.append(f"model: {label} {conf} ({known} known words)")
        if conf < MIN_CONF: label, src = "review", "review"; why.append(f"confidence below {MIN_CONF}: a person decides")
    urgent = bool(URGENT.search(text)) or frm in VIP
    if urgent: why.append("urgent word or VIP sender")
    prio = "low" if label in ("spam", "ignore") else "high" if urgent else "normal"
    draft = DRAFT[label].format(urgent="\nWe are treating it as a priority." if prio == "high" else "") if label in DRAFT else None
    return {"label": label, "source": src, "confidence": conf, "priority": prio, "route": ROUTE[label], "why": why, "draft": draft}


def evaluate(model, rows):
    ok = sum(predict(model, t)[0] == l for l, t in rows); return ok, len(rows)


def run(inbox_csv, model, out_dir):
    out = pathlib.Path(out_dir); (out / "drafts").mkdir(parents=True, exist_ok=True); res = []
    for i, m in enumerate(csv.DictReader(io.StringIO(pathlib.Path(inbox_csv).read_text("utf-8"))), start=1):
        r = classify(m, model); res.append({"id": i, "from": m["from"], "subject": m["subject"], **{k: r[k] for k in ("label", "source", "confidence", "priority", "route")}, "why": "; ".join(r["why"])})
        if r["draft"]: (out / "drafts" / f"{i:02d}_{r['label']}.txt").write_text(r["draft"], "utf-8")
    with open(out / "triage.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(res[0])); w.writeheader(); w.writerows(res)
    return res


if __name__ == "__main__":
    here = pathlib.Path(__file__).parent; model = train(load_labeled((here / "data/train.txt").read_text("utf-8")))
    for r in run(sys.argv[1], model, sys.argv[2]): print(r["id"], r["label"], r["source"], r["confidence"], r["priority"], "->", r["route"])
