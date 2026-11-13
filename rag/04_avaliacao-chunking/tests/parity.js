const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
console.log(JSON.stringify({ ev: Object.fromEntries(Object.entries(ix.configs).map(([n, c]) => [n, E.evaluateCfg(c, ix.questions)])), s: ix.questions.map(q => E.search(ix.configs.fixo60_25, q.q)) }));
