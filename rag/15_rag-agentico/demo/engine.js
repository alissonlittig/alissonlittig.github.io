/* Espelho de rag.py (agente por regras: buscar / calcular / perguntar) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g_) {
  const R = typeof require !== "undefined" ? require("./core.js") : g_.RAG;
  const PLANOS = ["solo", "casa", "empresa"], NOME = { solo: "Solo", casa: "Casa", empresa: "Empresa" };
  const brl = v => "R$ " + v.toFixed(2).replace(".", ","), num = s => parseFloat(s.replace(",", ".")), g = x => String(x);
  const rx = (ix, k, f = "") => new RegExp(ix.rules[k], f);
  function calc(expr) {
    const toks = expr.match(/\d+(?:\.\d+)?|[()+\-*/]/g) || []; let pos = 0;
    if (toks.join("") !== expr.replace(/ /g, "")) throw new Error("caractere inválido");
    const peek = () => toks[pos], eat = () => toks[pos++];
    function atom() { const t = eat(); if (t === "(") { const v = add(); eat(); return v; } if (t === "-") return -atom(); return parseFloat(t); }
    function mul() { let v = atom(); while (peek() === "*" || peek() === "/") { const o = eat(), r = atom(); v = o === "*" ? v * r : v / r; } return v; }
    function add() { let v = mul(); while (peek() === "+" || peek() === "-") { const o = eat(), r = mul(); v = o === "+" ? v + r : v - r; } return v; }
    const v = add(); if (pos !== toks.length) throw new Error("sobra texto");
    return Math.round((v + 1e-9) * 100) / 100;
  }
  const prep = ix => ix._toks || (ix._toks = ix.chunks.map(c => R.tokens(c.section + " " + c.text)));
  function search(ix, q, k = 4) {
    const [groups, qt] = R.expand(ix.glossary, q), toks = prep(ix), qv = R.ngVec(qt, ix.ng_idf), b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    const fused = R.rrf([R.rank(b), R.rank(v)]).slice(0, k), N = ix.bm25.n, df = ix.bm25.df, mx = Math.log(1 + (N + .5) / .5);
    const w = gr => { const kk = gr.filter(t => t in df); return kk.length ? Math.max(0, ...kk.map(t => Math.log(1 + (N - df[t] + .5) / (df[t] + .5)))) : mx; };
    let conf = 0;
    if (fused.length) { const top = fused[0][0], tot = groups.reduce((a, gr) => a + w(gr), 0), cov = groups.length ? groups.filter(gr => gr.some(t => toks[top].includes(t))).reduce((a, gr) => a + w(gr), 0) / tot : 0; conf = +(0.5 * Math.min(1, v[top] / 0.6) + 0.5 * cov).toFixed(3); }
    return { conf, hits: fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) })) };
  }
  function parse(ix, nq, raw) {
    const m = rx(ix, "kwh").exec(nq), planos = [];
    for (const x of nq.match(rx(ix, "plano", "g")) || []) if (!planos.includes(x)) planos.push(x);
    const ok = ix.rules.plano_ok.split(" "); let unk = null; for (const mm of raw.matchAll(rx(ix, "plano_x", "g"))) { const n = R.norm(mm[1]); if (!ok.includes(n)) { unk = n; break; } }
    const t = k => rx(ix, k).test(nq);
    const intent = t("compare") ? "compare" : t("economia") ? "economia" : t("qual_plano") ? "qual_plano" : (t("custo") && (m || planos.length || t("custo_ctx"))) ? "custo" : "busca";
    return { intent, kwh: m ? num(m[1]) : null, planos, unk };
  }
  function planFacts(ix, steps, plano) {
    const q = `plano ${plano} tarifa por kWh taxa fixa`, s = search(ix, q), f = s.hits.length ? ix.chunks[s.hits[0].id].facts : {}, ok = f.plano === plano;
    steps.push({ k: "buscar", q, conf: s.conf, hits: s.hits, obs: ok ? `Plano ${NOME[plano]}: tarifa ${brl(f.tarifa)}/kWh, taxa fixa ${brl(f.taxa)}` : "o trecho achado não é o plano pedido" });
    return ok ? [s.hits[0].id, f] : [null, null];
  }
  function doCalc(steps, expr, obs) { const res = calc(expr); steps.push({ k: "calcular", expr, res, obs }); return res; }
  function finish(steps, kind, t, cite = []) { steps.push({ k: kind === "answer" ? "responder" : kind === "refuse" ? "recusar" : "perguntar", t, cite }); return { kind, reply: t, steps, cite }; }
  function agent(ix, msg, state = {}, t = 0.5) {
    const nq = R.norm(msg).trim(), steps = []; let p = parse(ix, nq, msg);
    if (state.pending === "kwh") { const m = rx(ix, "num_only").exec(nq); if (m) { p = { intent: state.intent, kwh: num(m[1]), planos: state.planos, unk: null }; steps.push({ k: "pensar", t: `Recebi o consumo (${g(p.kwh)} kWh). Retomo a pergunta anterior: ${state.intent}.` }); } }
    const out = run(ix, p, nq, steps, t); out.state = out.kind === "ask" ? { pending: "kwh", intent: p.intent, planos: p.planos } : {}; return out;
  }
  function run(ix, p, nq, steps, t) {
    const I = p.intent, kwh = p.kwh; let planos = p.planos;
    if (p.unk) { steps.push({ k: "pensar", t: `A pergunta cita o plano "${p.unk}", que não está no guia (existem Solo, Casa e Empresa).` }); return finish(steps, "refuse", `Não encontrei um plano "${p.unk}" no guia. Os planos são Solo, Casa e Empresa.`); }
    if (I === "busca") {
      const s = search(ix, nq); steps.push({ k: "pensar", t: "Pergunta de consulta, sem conta: basta buscar no guia." }); const top = s.hits.length ? s.hits[0].id : null;
      steps.push({ k: "buscar", q: nq, conf: s.conf, hits: s.hits, obs: top !== null ? ix.chunks[top].text : "nada" });
      if (top !== null && s.conf >= t) return finish(steps, "answer", ix.chunks[top].text, [top]);
      return finish(steps, "refuse", "Não achei isso no guia, então prefiro não responder.");
    }
    if (kwh === null) { steps.push({ k: "pensar", t: `Pergunta de ${I}: preciso do consumo mensal em kWh e a pergunta não traz. Não vou chutar.` }); return finish(steps, "ask", "Qual é o seu consumo mensal, em kWh?"); }
    if (kwh <= 0 || kwh > 100000) return finish(steps, "refuse", "Esse consumo não parece válido. Informe um valor em kWh entre 1 e 100000.");
    if (I === "qual_plano" || ((I === "custo" || I === "economia") && !planos.length)) {
      steps.push({ k: "pensar", t: `Consumo de ${g(kwh)} kWh` + (I !== "qual_plano" ? " e nenhum plano citado: descubro o plano pela faixa de consumo." : ": comparo as faixas dos planos.") });
      const q = "planos tarifa faixa de consumo kWh por mês", s = search(ix, q), fs = {};
      for (const h of s.hits) { const f = ix.chunks[h.id].facts; if ("plano" in f) fs[f.plano] = [h.id, f]; }
      steps.push({ k: "buscar", q, conf: s.conf, hits: s.hits, obs: `achei ${Object.keys(fs).length} de 3 planos` });
      if (Object.keys(fs).length < 3) return finish(steps, "refuse", "Não consegui reunir as três faixas de plano no guia.");
      const best = PLANOS.find(pl => fs[pl][1].min <= kwh && kwh <= fs[pl][1].max);
      steps.push({ k: "pensar", t: `${g(kwh)} kWh cai na faixa do plano ${NOME[best]}.` });
      if (I === "qual_plano") return finish(steps, "answer", `Para ${g(kwh)} kWh por mês, o plano indicado é o ${NOME[best]}: tarifa de ${brl(fs[best][1].tarifa)} por kWh e taxa fixa de ${brl(fs[best][1].taxa)}.`, [fs[best][0]]);
      planos = [best];
    }
    if (I === "compare") {
      if (planos.length < 2) planos = PLANOS; steps.push({ k: "pensar", t: `Comparar ${planos.map(x => NOME[x]).join(", ")} com ${g(kwh)} kWh: busco cada plano e calculo cada fatura.` }); const res = {}, cites = [];
      for (const pl of planos) { const [cid, f] = planFacts(ix, steps, pl); if (cid === null) return finish(steps, "refuse", `Não consegui ler o plano ${NOME[pl]} no guia.`); res[pl] = doCalc(steps, `${g(kwh)}*${g(f.tarifa)}+${g(f.taxa)}`, `fatura do plano ${NOME[pl]}`); cites.push(cid); }
      let lo = planos[0], hi = planos[0]; for (const x of planos) { if (res[x] < res[lo]) lo = x; } for (const x of planos) { if (res[x] > res[hi]) hi = x; }
      const d = doCalc(steps, `${g(res[hi])}-${g(res[lo])}`, "diferença entre o maior e o menor");
      return finish(steps, "answer", `Com ${g(kwh)} kWh: ` + planos.map(x => `${NOME[x]} ${brl(res[x])}`).join("; ") + `. O mais barato é o ${NOME[lo]}, ${brl(d)} a menos que o ${NOME[hi]}.`, cites);
    }
    const pl = planos[0], [cid, f] = planFacts(ix, steps, pl);
    if (cid === null) return finish(steps, "refuse", `Não consegui ler o plano ${NOME[pl]} no guia.`);
    const costE = `${g(kwh)}*${g(f.tarifa)}+${g(f.taxa)}`;
    if (I === "custo") { const r = doCalc(steps, costE, "fatura mensal = consumo × tarifa + taxa fixa"); return finish(steps, "answer", `Com ${g(kwh)} kWh no plano ${NOME[pl]}: ${brl(r)} por mês (${g(kwh)} × ${brl(f.tarifa)} + ${brl(f.taxa)} de taxa fixa).`, [cid]); }
    const q = "tarifa de referência da distribuidora por kWh sem a cooperativa", s = search(ix, q), top = s.hits.length ? s.hits[0].id : null, ref = top !== null ? ix.chunks[top].facts.ref : undefined;
    steps.push({ k: "buscar", q, conf: s.conf, hits: s.hits, obs: ref ? `referência ${brl(ref)}/kWh` : "não achei a referência" });
    if (!ref) return finish(steps, "refuse", "Não achei a tarifa de referência da distribuidora no guia.");
    const r = doCalc(steps, `${g(kwh)}*${g(ref)}-(${costE})`, "economia = consumo × referência − fatura da cooperativa");
    return finish(steps, "answer", r > 0 ? `Com ${g(kwh)} kWh no plano ${NOME[pl]} você economiza cerca de ${brl(r)} por mês em relação à tarifa de referência (${brl(ref)}/kWh).` : `Com ${g(kwh)} kWh no plano ${NOME[pl]} você pagaria ${brl(-r)} a mais por mês que na tarifa de referência: a taxa fixa pesa.`, [cid, top]);
  }
  function simpleRag(ix, q) { const s = search(ix, q); return s.hits.length ? ix.chunks[s.hits[0].id].text : ""; }
  g_.Engine = { agent, calc, simpleRag, search }; if (typeof module !== "undefined") module.exports = g_.Engine;
})(typeof window !== "undefined" ? window : globalThis);
