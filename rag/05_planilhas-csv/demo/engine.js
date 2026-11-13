/* Espelho de rag.py (parse/ask/evaluate) para o navegador. Usa core.js (RAG.*). */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const CATS = ["mes", "cidade", "categoria", "produto", "vendedor"];
  const st = w => w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
  const S = s => new Set(s.split(" ").map(st));
  const HEAD = { cidade: S("cidade filial loja"), vendedor: S("vendedor vendedora atendente"), categoria: S("categoria"), produto: S("produto item artigo"), mes: S("mes meses mensal mensais") };
  const MEAS = { qtd: S("unidade unidades quantidade qtd pecas peca"), preco: S("preco precos") };
  const AVG = S("media medio ticket"), MAX = S("maior maximo caro melhor top"), MIN = S("menor minimo barato pior");
  const SUMW = S("total soma faturamento receita vendeu vendemos vender faturou rendeu venda vendas vendido vendidos vendida vendidas valor quanto"), DESC = S("mais maior melhor top ranking"), ASC = S("menos menor pior");
  const GROUPPRE = S("por cada qual quais ranking");
  const KNOWN = new Set([...Object.values(HEAD).flatMap(x => [...x]), ...Object.values(MEAS).flatMap(x => [...x]), ...AVG, ...MAX, ...MIN, ...SUMW, ...DESC, ...ASC, ...GROUPPRE, ...S("pedido pedidos numero contagem quantos quantas foram foi feito feitos feitas tiveram teve tivemos como vendedora total media data coluna linha")]);
  const has = (a, b) => [...a].some(x => b.has(x));
  function vocab(ix) { if (!ix._vocab) { const v = new Set(); ix.columns.forEach(c => R.tokens(c).forEach(t => v.add(t))); ix.rows.forEach(r => r.slice(0, 2).forEach(x => R.tokens(String(x)).forEach(t => v.add(t)))); ix._vocab = v; } return ix._vocab; }
  function parse(ix, q) {
    const raw = R.norm(q).match(/[a-z0-9]+/g) || [], W = raw.map(st), tk = R.tokens(q), used = tk.map(() => false);
    const cand = []; CATS.forEach(c => ix.values[c].forEach(v => cand.push([c, v, R.tokens(String(v))])));
    cand.sort((a, b) => b[2].length - a[2].length || CATS.indexOf(a[0]) - CATS.indexOf(b[0]));
    const filters = {};
    for (const [c, v, vt] of cand) {
      const pos = vt.map(x => tk.findIndex((t, i) => t === x && !used[i]));
      if (vt.length && pos.every(p => p >= 0)) { pos.forEach(p => used[p] = true); (filters[c] = filters[c] || []).push(v); }
    }
    let group = null;
    W.forEach((w, i) => { for (const c in HEAD) if (HEAD[c].has(w) && i > 0 && GROUPPRE.has(W[i - 1]) && group === null) group = c; });
    const ws = new Set(W), rs = new Set(raw); let measure = has(ws, MEAS.qtd) ? "qtd" : has(ws, MEAS.preco) ? "preco" : "total", agg;
    if (has(ws, AVG)) agg = "avg";
    else if ((rs.has("quantos") || rs.has("quantas") || rs.has("numero")) && measure !== "qtd") { agg = "count"; measure = "pedido"; }
    else if (has(ws, MAX) && !group) agg = "max";
    else if (has(ws, MIN) && !group) agg = "min";
    else if (has(ws, SUMW) || group || measure === "qtd") agg = "sum"; else agg = null;
    if (group && filters[group] && filters[group].length === 1 && !(has(ws, DESC) || has(ws, ASC))) group = null;
    const order = has(ws, ASC) ? "asc" : has(ws, DESC) ? "desc" : null, V = vocab(ix);
    const unknown = tk.filter((t, i) => !used[i] && !KNOWN.has(t) && !V.has(t));
    return { agg, measure, group, filters, order, unknown, terms: tk };
  }
  function agg(vals, a) { if (a === "count") return vals.length; const s = vals.reduce((x, y) => x + y, 0); if (a === "avg") return Math.round((s / vals.length + 1e-9) * 100) / 100; return a === "sum" ? s : a === "max" ? Math.max(...vals) : Math.min(...vals); }
  function ask(ix, q) {
    const it = parse(ix, q), col = c => ix.columns.indexOf(c), res = { status: "refused", intent: it, table: null, value: null, sources: [], n: 0 };
    if (it.unknown.length) { res.reason = "unknown"; return res; }
    let rows = []; ix.rows.forEach((r, n) => { if (Object.entries(it.filters).every(([c, vs]) => vs.includes(r[col(c)]))) rows.push([n + 2, r]); });
    const sc = {}; rows.forEach(([n, r]) => sc[n] = R.bm25(ix.bm25, it.terms, R.tokens(r.join(" "))));
    if (!it.agg && !it.group) { if (!Object.keys(it.filters).length) { res.reason = "no_intent"; return res; } res.status = "rows"; }
    if (!rows.length) { res.reason = "no_rows"; res.status = "refused"; return res; }
    res.n = rows.length; const m = it.measure, vals = rs => rs.map(([, r]) => m === "pedido" ? 1 : r[col(m)]);
    if (it.group) {
      const gi = col(it.group), keys = [...new Set(rows.map(([, r]) => r[gi]))], tab = keys.map(k => [k, agg(vals(rows.filter(x => x[1][gi] === k)), it.agg)]);
      if (it.group !== "mes" || it.order) tab.sort((a, b) => { const d = it.order === "asc" ? a[1] - b[1] : b[1] - a[1]; return d || (String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0); });
      Object.assign(res, { status: "answered", table: { columns: [it.group, it.agg + " " + m], rows: tab }, value: tab[0][1], first: tab[0][0] }); rows = rows.filter(x => x[1][gi] === tab[0][0]);
    } else if (it.agg) { const v = agg(vals(rows), it.agg); Object.assign(res, { status: "answered", value: v }); if (it.agg === "max" || it.agg === "min") rows = rows.filter(x => x[1][col(m)] === v); }
    res.sources = rows.slice().sort((a, b) => sc[b[0]] - sc[a[0]] || a[0] - b[0]).slice(0, 5).map(([n, r]) => ({ line: n, row: r, bm25: +sc[n].toFixed(4) }));
    return res;
  }
  function evaluate(ix, tests) {
    const o = { value_ok: 0, value_n: 0, first_ok: 0, first_n: 0, refuse_ok: 0, refuse_n: 0, wrong: [] };
    for (const t of tests) { const r = ask(ix, t.q), k = t.kind; o[k + "_n"]++; const ok = k === "refuse" ? r.status === "refused" : r.status === "answered" && (k === "value" ? Math.abs(r.value - t.expect) < 0.006 : r.first === t.expect); if (ok) o[k + "_ok"]++; else o.wrong.push(t.q); }
    return o;
  }
  g.Engine = { parse, ask, evaluate }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
