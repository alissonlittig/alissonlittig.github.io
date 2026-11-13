const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const slim = r => ({ q: r.q, query: r.query, ellipsis: r.ellipsis, soft: r.soft, status: r.status, doc: r.doc, cov: r.coverage, hits: r.hits.map(h => h.id) });
console.log(JSON.stringify({ runs: [0, 1, 3].map(w => ix.tests.map(d => E.run(ix, d.turns.map(t => t[0]), w).map(slim))), ev: [0, 1, 2, 3, 4].map(w => E.evaluate(ix, ix.tests, w)) }));
