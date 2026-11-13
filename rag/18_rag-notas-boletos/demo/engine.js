/* Espelho de rag.py (parse_q/answer/evaluate) para o navegador. A extração dos PDFs (pypdf) acontece no build, em Python; aqui entra o índice pronto. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const MESES = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  const NOME_MES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const IGNORE = new Set("paguei gastei gasto gastos pago paga pagos pagas total valor valores mes meses ano conta contas documento documentos nota notas fiscal fiscais boleto boletos maior mais caro cara quais liste lista quantas quantos quantidade aberto devo pagar pendente pendentes vencer vence vencido falta tudo soma somar custou custa foi fui ainda".split(" "));
  const has = (ws, a) => a.some(w => ws.includes(w));
  const brl = c => "R$ " + String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + String(c % 100).padStart(2, "0");
  function parseQ(ix, q) {
    const qt = R.tokens(q), words = R.norm(q).match(/[a-z0-9]+/g) || [], months = [...new Set(words.filter(w => w in MESES).map(w => MESES[w]))].sort((a, b) => a - b);
    const years = [...new Set((q.match(/\b20\d\d\b/g) || []).map(Number))].sort(); let best = null; const qs = new Set(qt);
    for (const e of ix.entities) for (const m of e.match) if (m.every(t => qs.has(t))) {
      const k = [m.length, e.kind === "emitente" ? 1 : 0]; if (!best || k[0] > best[0][0] || (k[0] === best[0][0] && k[1] > best[0][1])) best = [k, e];
    }
    const known = new Set([...ix.vocab, ...IGNORE, ...Object.keys(MESES).map(w => R.tokens(w)[0])]);
    const unknown = qt.filter(t => !known.has(t) && !/^\d+$/.test(t));
    const st = has(words, ["aberto", "devo", "pagar", "pendente", "pendentes", "vencer", "vence", "vencido", "falta"]) ? "aberto" : "pago";
    const agg = has(words, ["quantas", "quantos", "quantidade"]) ? "count" : (words.includes("maior") || (words.includes("mais") && has(words, ["caro", "cara"]))) ? "max" : has(words, ["quais", "liste", "lista"]) ? "list" : "sum";
    return { tokens: qt, months, years, entity: best ? best[1] : null, unknown, status: st, agg };
  }
  function answer(ix, q) {
    const p = parseQ(ix, q), res = { status: "refused", parsed: { ...p, entity: p.entity ? p.entity.name : null }, docs: [], total: 0, count: 0, by_month: {}, max: null };
    if (p.unknown.length) { res.reason = "unknown"; return res; } if (!p.entity && !p.months.length) { res.reason = "none"; return res; }
    const e = p.entity, sel = [];
    for (const d of ix.docs) {
      if (d.status !== p.status) continue;
      if (e && !((e.kind === "emitente" && d.issuer === e.name) || (e.kind === "categoria" && d.category === e.name))) continue;
      if (p.months.length && !p.months.includes(+d.date.slice(5, 7))) continue; if (p.years.length && !p.years.includes(+d.date.slice(0, 4))) continue; sel.push(d.id);
    }
    if (!ix._toks) ix._toks = ix.docs.map(d => R.tokens(d.issuer + " " + d.category + " " + d.desc));
    res.docs = sel.map(i => ({ id: i, bm25: +R.bm25(ix.bm25, p.tokens, ix._toks[i]).toFixed(4) }));
    for (const i of sel) { const d = ix.docs[i]; res.total += d.amount; res.by_month[d.ym] = (res.by_month[d.ym] || 0) + d.amount; }
    res.count = sel.length; res.max = sel.length ? sel.reduce((a, b) => ix.docs[b].amount > ix.docs[a].amount ? b : a) : null; res.status = "answered"; return res;
  }
  function evaluate(ix, T) {
    let ok = 0, oosA = 0; const wrong = [];
    for (const x of T.questions) { const r = answer(ix, x.q), good = r.status === "answered" && r.total === x.total && r.count === x.count; if (good) ok++; else wrong.push(x.q); }
    for (const q of T.oos) if (answer(ix, q).status === "answered") oosA++;
    return { n: T.questions.length, exact: +(ok / T.questions.length).toFixed(3), wrong, oos: T.oos.length, oos_answered: oosA };
  }
  g.Engine = { parseQ, answer, evaluate, brl, NOME_MES }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
