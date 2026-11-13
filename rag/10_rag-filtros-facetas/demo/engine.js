/* Espelho de rag.py (filtros + facetas) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const MIN_COS = 0.2, DIMS = [["cat", "category"], ["autor", "author"], ["ano", null]], r4 = x => +x.toFixed(4);
  const has = (a, x) => !a || !a.length || a.includes(x);
  const passes = (c, f, skip) => (skip === "cat" || has(f.cats, c.category)) && (skip === "autor" || has(f.authors, c.author)) && (skip === "ano" || has(f.years, c.year)) && (!f.frm || c.month >= f.frm) && (!f.to || c.month <= f.to);
  const prep = ix => ix._toks || (ix._toks = ix.chunks.map(c => R.tokens(c.title + " " + c.text)));
  const sortObj = o => Object.fromEntries(Object.entries(o).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  function answer(ix, question, f = {}, k = 5) {
    const toks = prep(ix), qt = R.tokens(question), qv = R.ngVec(qt, ix.ng_idf), ch = ix.chunks;
    const b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    const cand = ch.filter(c => passes(c, f)).map(c => c.id);
    const res = { terms: qt, status: "refused", answer: null, sources: [], hits: [], n_cand: cand.length, coverage: 0 };
    const match = ch.filter(c => !qt.length || b[c.id] > 0 || v[c.id] > MIN_COS), fac = {};
    for (const [key, field] of DIMS) { const cnt = {}; for (const c of match) if (passes(c, f, key)) { const val = key === "ano" ? c.year : c[field]; cnt[val] = (cnt[val] || 0) + 1; } fac[key] = sortObj(cnt); }
    res.facets = fac;
    if (!qt.length) { res.status = "browse"; res.hits = cand.slice().sort((x, y) => ch[y].date < ch[x].date ? -1 : ch[y].date > ch[x].date ? 1 : y - x).slice(0, k).map(id => ({ id, rrf: 0, bm25: 0, cos: 0 })); return res; }
    if (!cand.length) { res.reason = "nenhum post passa nos filtros escolhidos"; return res; }
    const ms = new Set(match.map(c => c.id)), cs = new Set(cand.filter(i => ms.has(i))), n = ch.length;
    const mask = (arr, set) => arr.map((x, i) => set.has(i) ? x : 0);
    const fused = R.rrf([R.rank(mask(b, cs)), R.rank(mask(v, cs))]);
    res.hits = fused.slice(0, k).map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: r4(b[i]), cos: r4(v[i]) }));
    const allf = R.rrf([R.rank(mask(b, ms)), R.rank(mask(v, ms))]).slice(0, k), cset = new Set(cand); res.post_filter_n = allf.filter(([i]) => cset.has(i)).length;
    if (!res.hits.length) { res.reason = "nada nos posts filtrados tem relação com a pergunta"; return res; }
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : 0, unk = Math.log(1 + (N + .5) / .5), w = t => t in df ? idf(t) : unk;
    const top = new Set(toks[res.hits[0].id]), qs = [...new Set(qt)];
    res.coverage = +(qs.filter(t => top.has(t)).reduce((a, t) => a + w(t), 0) / qs.reduce((a, t) => a + w(t), 0)).toFixed(2);
    if (res.coverage < 0.5) { res.reason = `não encontrei isso nos posts filtrados (cobertura ${Math.round(res.coverage * 100)}% < 50%)`; return res; }
    const qset = new Set(qt); let best = null; const c = ch[res.hits[0].id];
    for (const s of R.sentences(c.text)) { const sc = r4([...new Set(R.tokens(s))].filter(t => qset.has(t)).reduce((a, t) => a + idf(t), 0)); if (!best || sc > best[0]) best = [sc, s]; }
    Object.assign(res, { status: "answered", answer: best[1] + " [1]", sources: [{ id: c.id, title: c.title, author: c.author, date: c.date, category: c.category }] });
    return res;
  }
  g.Engine = { answer, passes }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
