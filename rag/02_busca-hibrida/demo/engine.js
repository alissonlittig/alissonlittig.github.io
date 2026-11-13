/* Espelho de rag.py (search/metrics/evaluate) para o navegador. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, MODES = ["bm25", "vector", "lsa", "hybrid", "rerank"], TOPN = 10;
  const toks = ix => ix._t || (ix._t = ix.passages.map(p => R.tokens(p.title + ". " + p.text)));
  function search(ix, q, topn = TOPN) {
    const qt = R.tokens(q), T = toks(ix), qv = R.ngVec(qt, ix.ng_idf), ql = R.lsaVec(ix.lsa, qt);
    const b = T.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x)), l = ix.lsa_vecs.map(x => R.dot(ql, x)), out = { terms: qt };
    for (const [m, s] of [["bm25", b], ["vector", v], ["lsa", l]]) out[m] = R.rank(s).slice(0, topn).map(i => [i, +s[i].toFixed(4)]);
    const fused = R.rrf([R.rank(b), R.rank(v), R.rank(l)]); out.hybrid = fused.slice(0, topn).map(([i, s]) => [i, +s.toFixed(5)]);
    const top = fused.slice(0, topn), mx = top.length ? top[0][1] : 1;
    out.rerank = top.map(([i, s]) => [R.rerankScore(R.rerankFeatures(qt, ix.passages[i].title, T[i]), s / mx), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(([s, i]) => [i, s]);
    return out;
  }
  function metrics(ids, rel) { const f = ids.findIndex(i => rel.includes(i)); const o = { mrr: f < 0 ? 0 : 1 / (f + 1) }; for (const k of [1, 3, 5]) o["recall@" + k] = ids.slice(0, k).some(i => rel.includes(i)) ? 1 : 0; return o; }
  function evaluate(ix, qs) {
    const acc = Object.fromEntries(MODES.map(m => [m, []]));
    for (const q of qs) { const s = search(ix, q.q); for (const m of MODES) acc[m].push([q.type, metrics(s[m].map(x => x[0]), q.rel)]); }
    const avg = rows => { const o = {}; if (!rows.length) return o; for (const k of Object.keys(rows[0][1])) o[k] = +(rows.reduce((a, r) => a + r[1][k], 0) / rows.length).toFixed(3); return o; };
    const all = {}, by = { L: {}, P: {}, H: {} }; for (const m of MODES) { all[m] = avg(acc[m]); for (const t of "LPH") by[t][m] = avg(acc[m].filter(r => r[0] === t)); }
    return { all, by_type: by, n: qs.length };
  }
  g.Engine = { search, metrics, evaluate, MODES }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
