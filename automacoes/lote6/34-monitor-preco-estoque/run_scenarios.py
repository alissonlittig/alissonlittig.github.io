"""Starts a fictional shop on localhost, runs 7 monitoring cycles against it with real HTTP, records the alerts in output/."""
import json, pathlib, sys, threading, tempfile, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE))
import monitor

SHOP = {"notebook": ("Notebook Aurora 14", "4.299,00", "in"), "fone": ("Fone Pulso BT", "349,90", "out"), "cafe": ("Cafeteira Brasa", "589,00", "in")}
MODE = {}  # product -> "ok" | "500" | "layout"


class Shop(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        k = self.path.strip("/"); mode = MODE.get(k, "ok")
        if mode == "500": self.send_response(500); self.end_headers(); return
        n, p, s = SHOP[k]; body = (monitor.page(n, p, s) if mode == "ok" else f"<html><h1>{n}</h1><div class='p'>{p}</div></html>").encode()
        self.send_response(200); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)


def main():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), Shop); threading.Thread(target=srv.serve_forever, daemon=True).start(); base = f"http://127.0.0.1:{srv.server_port}/"
    watches = json.loads((HERE / "data/watchlist.json").read_text("utf-8"))
    for w in watches: w["url"] = base + w["id"]
    state = {}; log = tempfile.mktemp(); R = []
    def cycle(label, **chg):
        for k, v in chg.items():
            if k in ("notebook", "fone", "cafe"): MODE[k] = v
            else: SHOP[k[4:]] = (SHOP[k[4:]][0],) + tuple(v)
        a = monitor.run_all(watches, state, log); R.append({"cycle": label, "alerts": a, "state": json.loads(json.dumps(state))})
    cycle("1 baseline")
    cycle("2 notebook -12%, headphones back in stock", set_notebook=("3.783,00", "in"), set_fone=("349,90", "in"))
    cycle("3 coffee maker hits the target", set_cafe=("449,00", "in"))
    cycle("4 shop layout changed (notebook)", notebook="layout")
    cycle("5 notebook source down (1st failure)", notebook="500"); cycle("6 notebook source down (2nd)"); cycle("7 notebook source down (3rd: alert)")
    MODE["notebook"] = "ok"; SHOP["notebook"] = (SHOP["notebook"][0], "99,00", "in"); cycle("8 price typo 99,00 (suspicious)")
    srv.shutdown(); srv.server_close()
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output/scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__":
    for r in main(): print(r["cycle"], "->", [a["kind"] for a in r["alerts"]])
