// Roda o motor JS nas perguntas DEV e TESTE e imprime JSON (consulta final e posição do trecho certo nos 3 modos); o teste Python compara com rag.py.
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const all = [...ix.dev, ...ix.test];
console.log(JSON.stringify({ q: all.map(x => ["raw", "rewrite", "hyde"].map(m => { const r = E.search(ix, x.q, m); return [r.query, E.rankOf(ix, r, x.gold)]; })), dev: E.evaluate(ix, ix.dev).out, test: E.evaluate(ix, ix.test).out }));
