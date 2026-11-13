// Roda o agente JS nas perguntas de data/tests.json (e uma conversa com pergunta pendente) e imprime JSON; o teste Python compara com rag.py.
const fs = require("fs"), path = require("path"), E = require("../demo/engine.js");
const ix = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/index.json"), "utf8"));
const ts = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/tests.json"), "utf8"));
const sig = r => ({ kind: r.kind, reply: r.reply, steps: r.steps.map(s => [s.k, s.expr || null, s.res === undefined ? null : s.res]) });
const out = ts.map(x => sig(E.agent(ix, x.q)));
const a = E.agent(ix, "quanto economizo no plano Casa?"); out.push(sig(a)); out.push(sig(E.agent(ix, "uns 400 kwh", a.state)));
console.log(JSON.stringify(out));
