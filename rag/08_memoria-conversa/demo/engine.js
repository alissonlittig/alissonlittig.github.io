/* Espelho de rag.py (rewrite/search/turn/run/evaluate) para o navegador. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, MIN = 0.5, WINDOW = 3;
  const dedupe = a => [...new Set(a)];
  function rewrite(ix, history, q, window = WINDOW) {
    const tk = R.tokens(q), own = {}, content = [];
    for (const t of tk) { if (t in ix.slot_map) own[ix.slot_map[t][0]] = ix.slot_map[t][1]; else if (!ix.filler.includes(t)) content.push(t); }
    const hist = window > 0 ? history.slice(-window) : [], ellipsis = hist.length > 0 && !content.length; let topic = content.slice(), soft = [];
    if (hist.length) {
      const merged = {}; for (const h of hist) Object.assign(merged, h.own);
      soft = Object.entries(merged).filter(([k]) => !(k in own)).map(([, v]) => v);
      if (ellipsis) { let src = hist[hist.length - 1]; for (let i = hist.length - 1; i >= 0; i--) if (Object.keys(hist[i].own).some(k => k in own)) { src = hist[i]; break; } topic = src.topic.slice(); }
    }
    const cov = dedupe([...Object.values(own), ...content, ...(ellipsis ? topic : [])]);
    return { q, own, content, topic, soft, ellipsis, followup: hist.length > 0, query: dedupe([...cov, ...soft]), cov_terms: cov };
  }
  function search(ix, terms, k = 3) {
    if (!ix._toks) ix._toks = ix.docs.map(d => R.tokens(d.title + ". " + d.text));
    const [, qt] = R.expand(ix.glossary, terms.join(" ")), qv = R.ngVec(qt, ix.ng_idf);
    const b = ix._toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x)), fused = R.rrf([R.rank(b), R.rank(v)]).slice(0, k);
    return { hits: fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) })), toks: ix._toks };
  }
  function turn(ix, history, q, window = WINDOW) {
    const rec = rewrite(ix, history, q, window), { hits, toks } = search(ix, rec.query), res = { ...rec, hits, status: "refused", doc: null, coverage: 0, answer: null };
    if (hits.length && rec.query.length) {
      const N = ix.bm25.n, df = ix.bm25.df, idf = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : 0, unk = Math.log(1 + (N + .5) / .5);
      const groups = R.expand(ix.glossary, rec.cov_terms.join(" "))[0], w = gr => gr.some(t => t in df) ? Math.max(0, ...gr.filter(t => t in df).map(idf)) : unk, top = hits[0].id, set = new Set(toks[top]);
      res.coverage = groups.length ? +(groups.filter(gr => gr.some(t => set.has(t))).reduce((a, gr) => a + w(gr), 0) / groups.reduce((a, gr) => a + w(gr), 0)).toFixed(2) : 0;
      if (res.coverage >= MIN) Object.assign(res, { status: "answered", doc: top, answer: ix.docs[top].text });
    }
    return [res, { own: rec.own, topic: rec.topic }];
  }
  function run(ix, qs, window = WINDOW) { const hist = [], out = []; for (const q of qs) { const [r, rec] = turn(ix, hist, q, window); hist.push(rec); out.push(r); } return out; }
  function evaluate(ix, tests, window = WINDOW) {
    const o = { window, first_ok: 0, first_n: 0, follow_ok: 0, follow_n: 0, wrong: [] };
    for (const d of tests) run(ix, d.turns.map(t => t[0]), window).forEach((r, i) => { const exp = d.turns[i][1], ok = exp === null ? r.status === "refused" : r.status === "answered" && r.doc === exp, k = i === 0 ? "first" : "follow"; o[k + "_n"]++; if (ok) o[k + "_ok"]++; else o.wrong.push(`${d.id}.${i + 1} ${d.turns[i][0]}`); });
    return o;
  }
  g.Engine = { rewrite, search, turn, run, evaluate, MIN, WINDOW }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
