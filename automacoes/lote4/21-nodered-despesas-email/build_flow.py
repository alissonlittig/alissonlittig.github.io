"""Monta flows.json (export real do Node-RED) a partir de functions/*.js."""
import json, pathlib
H = pathlib.Path(__file__).parent; F = lambda n: (H / "functions" / f"{n}.js").read_text("utf-8")
T = "expenses-tab"
def fn(id, name, f, x, y, outputs=1, wires=None): return {"id": id, "type": "function", "z": T, "name": name, "func": F(f), "outputs": outputs, "timeout": 0, "noerr": 0, "initialize": "", "finalize": "", "libs": [], "x": x, "y": y, "wires": wires}
flow = [
 {"id": T, "type": "tab", "label": "Expense sheet to finance e-mail", "disabled": False, "info": "POST /expenses (text/csv) -> validate -> policy -> e-mail digest. SMTP failure -> retry queue + 202."},
 {"id": "in", "type": "http in", "z": T, "name": "", "url": "/expenses", "method": "post", "upload": False, "swaggerDoc": "", "x": 110, "y": 120, "wires": [["hdr"]]},
 fn("hdr", "Check header", "validate_header", 280, 120, 2, [["csv"], ["resp"]]),
 {"id": "csv", "type": "csv", "z": T, "name": "Parse CSV", "spec": "rfc", "sep": ",", "hdrin": True, "hdrout": "none", "multi": "mult", "ret": "\n", "temp": "", "skip": "0", "strings": True, "include_empty_strings": True, "include_null_values": False, "x": 450, "y": 100, "wires": [["policy"]]},
 fn("policy", "Validate + policy", "policy", 630, 100, 1, [["sw"]]),
 {"id": "sw", "type": "switch", "z": T, "name": "Needs action?", "property": "report.needs_action", "propertyType": "msg", "rules": [{"t": "true"}, {"t": "false"}], "checkall": "false", "repair": False, "outputs": 2, "x": 810, "y": 100, "wires": [["alert"], ["okm"]]},
 fn("alert", "Build alert e-mail", "mail_alert", 1000, 60, 1, [["mail"]]),
 fn("okm", "Build all-clear e-mail", "mail_ok", 1010, 140, 1, [["mail"]]),
 {"id": "mail", "type": "e-mail", "z": T, "server": "127.0.0.1", "port": "2525", "authtype": "NONE", "saslformat": False, "token": "oauth2Response.access_token", "secure": False, "tls": False, "name": "finance@example.invalid", "dname": "SMTP (local sink)", "x": 1210, "y": 100, "wires": []},
 {"id": "done", "type": "complete", "z": T, "name": "", "scope": ["mail"], "uncaught": False, "x": 1210, "y": 180, "wires": [["rok"]]},
 fn("rok", "Respond 200", "respond_ok", 1210, 240, 1, [["resp"]]),
 {"id": "catch", "type": "catch", "z": T, "name": "", "scope": ["mail"], "uncaught": False, "x": 1210, "y": 320, "wires": [["queue"]]},
 fn("queue", "Queue for retry", "queue_retry", 1010, 320, 1, [["file"]]),
 {"id": "file", "type": "file", "z": T, "name": "outbox_retry.jsonl", "filename": "output/outbox_retry.jsonl", "filenameType": "str", "appendNewline": True, "createDir": True, "overwriteFile": "false", "encoding": "none", "x": 810, "y": 320, "wires": [["rq"]]},
 fn("rq", "Respond 202", "respond_queued", 630, 320, 1, [["resp"]]),
 {"id": "resp", "type": "http response", "z": T, "name": "", "statusCode": "", "headers": {}, "x": 450, "y": 240, "wires": []},
]
(H / "flows.json").write_text(json.dumps(flow, indent=2), "utf-8")
(H / "runtime" / "settings.js").write_text("module.exports={uiPort:1881,flowFile:'flows.json',credentialSecret:false,logging:{console:{level:'warn',metrics:false,audit:false}},editorTheme:{projects:{enabled:false}},functionExternalModules:false};\n", "utf-8")
print("flows.json", len(flow), "nodes")
