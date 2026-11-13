const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8")), out = { rep: {}, ret: ix.stream.map(x => E.retrieve(ix, x.q)), rep_rows: {}, report: E.report(ix) };
for (const k of ix.kinds) for (const t of [0.4, 0.6, 0.8]) { const r = E.replay(ix, ix.stream, k, t); out.rep[k + "|" + t] = [r.hits, r.false_hits, r.wrong, r.saved_pct]; out.rep_rows[k + "|" + t] = r.rows.map(x => x.hit); }
console.log(JSON.stringify(out));
