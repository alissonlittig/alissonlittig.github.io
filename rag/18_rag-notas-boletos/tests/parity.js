const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8")), T = ix.tests;
const qs = T.questions.map(x => x.q).concat(T.oos, ["Qual o maior boleto de agosto?", "Quais notas do mercado em outubro de 2026?"]);
console.log(JSON.stringify({ ask: qs.map(q => { const r = E.answer(ix, q); return { q, status: r.status, total: r.total, count: r.count, docs: r.docs, agg: r.parsed.agg, max: r.max }; }), ev: E.evaluate(ix, T) }));
