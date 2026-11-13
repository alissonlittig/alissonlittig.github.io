// Roda o motor JS nas mesmas perguntas e imprime JSON (o teste Python compara com rag.py).
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const qs = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));
console.log(JSON.stringify(qs.map(x => { const r = E.answer(ix, x.q); return { status: r.status, answer: r.answer, ids: r.hits.map(h => h.id), coverage: r.coverage }; })));
