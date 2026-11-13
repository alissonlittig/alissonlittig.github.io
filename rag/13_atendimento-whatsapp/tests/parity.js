// Roda o motor JS nas mensagens de data/tests.json e imprime JSON (o teste Python compara com rag.py).
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const ts = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/tests.json"), "utf8"));
console.log(JSON.stringify(ts.map(x => { const r = E.handle(ix, x.q); return { kind: r.kind, doc: r.doc, reply: r.reply, conf: r.conf }; })));
