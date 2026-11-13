const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const [dev, held] = E.split(ix.tests);
console.log(JSON.stringify({ ask: ix.tests.map(x => E.ask(ix, x.q)), ev: E.SWEEP.map(t => [E.evaluate(ix, dev, t), E.evaluate(ix, held, t), E.evaluate(ix, held, t, false)]) }));
