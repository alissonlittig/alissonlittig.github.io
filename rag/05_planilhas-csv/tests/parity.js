const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const extra = ["Quanto vendeu a Carla em abril em Maringá?", "Faturamento por vendedor", "pedidos de Arte", "qual o frete?"];
console.log(JSON.stringify(ix.tests.map(t => t.q).concat(extra).map(q => { const r = E.ask(ix, q); return { q, status: r.status, value: r.value, first: r.first ?? null, table: r.table, lines: r.sources.map(s => s.line), bm: r.sources.map(s => s.bm25) }; })));
