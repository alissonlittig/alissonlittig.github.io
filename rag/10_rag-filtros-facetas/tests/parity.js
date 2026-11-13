// Roda o motor JS nas mesmas perguntas/filtros de questions.json e imprime JSON (o teste Python compara com rag.py).
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const qs = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));
console.log(JSON.stringify(qs.map(x => { const r = E.answer(ix, x.q, x.f || {}); return { status: r.status, answer: r.answer, ids: r.hits.map(h => h.id), facets: r.facets, post: r.post_filter_n ?? null, n: r.n_cand }; })));
