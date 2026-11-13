const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
console.log(JSON.stringify({ search: ix.questions.map(q => E.search(ix, q.q)), ev: E.evaluate(ix, ix.questions) }));
