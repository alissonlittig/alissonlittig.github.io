const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8")), T = ix.tests;
const qs = T.questions.map(x => x.q).concat(T.oos);
console.log(JSON.stringify({ ask: qs.map(q => { const r = E.answer(ix, q); return { q, status: r.status, chunk: r.chunk, cov: r.coverage, hits: r.hits }; }), old: E.answer(ix, "Com quantos dias de antecedência peço férias?", true).hits.map(h => h.id), ev: E.evaluate(ix, T) }));
