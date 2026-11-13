const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const main = ix.tests.filter(t => !t.set), extra = ix.tests.filter(t => t.set);
console.log(JSON.stringify({
  ask: ix.tests.map(t => { const r = E.answer(ix, t.q); return { q: t.q, status: r.status, doc: r.doc ?? null, cov: r.coverage, lang: r.lang, ans: r.answer, concepts: r.concepts, hits: r.hits }; }),
  modes: E.MODES.map(m => [E.evaluate(ix, main, m), E.evaluate(ix, extra, m)])
}));
