// Roda o motor JS nas perguntas de data/tests.json e imprime JSON (o teste Python compara com rag.py).
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const ts = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/tests.json"), "utf8"));
console.log(JSON.stringify(ts.map(x => { const r = E.ask(ix, x.q); return { hits: r.hits.map(h => h.id), conf: r.conf, seg: r.answer && r.answer.seg }; })));
