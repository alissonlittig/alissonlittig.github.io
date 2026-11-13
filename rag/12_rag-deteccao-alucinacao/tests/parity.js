// Roda o verificador JS nas respostas de data/respostas.json e imprime JSON (o teste Python compara com rag.py).
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const rs = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/respostas.json"), "utf8"));
console.log(JSON.stringify(rs.map(x => { const r = E.check(ix, x.q, x.answer); return { hits: r.hits.map(h => h.id), s: r.sentences.map(s => [s.label, s.support, s.issues]), summary: r.summary }; })));
