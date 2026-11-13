const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const h = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8")), out = {};
for (const tol of [0, 1, 2, 5]) out[tol] = E.analyze(h, tol, h.flips_alert);
console.log(JSON.stringify(out));
