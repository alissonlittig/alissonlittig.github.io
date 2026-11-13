/* Espelho de rag.py (reescrita de pergunta + HyDE sem LLM) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const prep = ix => ix._toks || (ix._toks = ix.chunks.map(c => R.tokens(c.section + " " + c.text)));
  const words = s => s.match(/[a-z0-9-]+/g) || [];
  function rewrite(ix, q) {
    const nq = R.norm(q), all = words(nq), kept = all.filter(w => !ix.noise.includes(w)), removed = all.filter(w => ix.noise.includes(w));
    const added = ix.rules.filter(([pat]) => new RegExp(pat).test(nq)).map(([pat, terms]) => ({ rule: pat.split("|")[0], terms }));
    return { text: [...kept, ...added.flatMap(a => a.terms.split(" "))].join(" "), removed, added };
  }
  function ranking(ix, text) {
    const qt = R.tokens(text), toks = prep(ix), qv = R.ngVec(qt, ix.ng_idf), b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return R.rrf([R.rank(b), R.rank(v)]).map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) }));
  }
  function prf(ix, text, top) {
    const N = ix.bm25.n, df = ix.bm25.df, have = new Set(R.tokens(text)), sc = {};
    for (const t of R.tokens(ix.chunks[top].section + " " + ix.chunks[top].text)) if (!have.has(t) && t in df) sc[t] = (sc[t] || 0) + Math.log(1 + (N - df[t] + .5) / (df[t] + .5));
    return Object.entries(sc).sort((a, b) => ((+b[1].toFixed(6)) - (+a[1].toFixed(6))) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).slice(0, ix.prf_terms).map(p => p[0]);
  }
  function search(ix, q, mode) {
    if (mode === "raw") return { query: q, ranking: ranking(ix, q) };
    const rw = rewrite(ix, q), r = ranking(ix, rw.text);
    if (mode === "rewrite") return { query: rw.text, rewrite: rw, ranking: r };
    const extra = r.length ? prf(ix, rw.text, r[0].id) : [], text = rw.text + " " + extra.join(" ");
    return { query: text, rewrite: rw, extra, hypothetical: r.length ? ix.chunks[r[0].id].text : "", ranking: ranking(ix, text) };
  }
  const rankOf = (ix, res, key) => { const i = res.ranking.findIndex(h => ix.chunks[h.id].key === key); return i < 0 ? null : i + 1; };
  function evaluate(ix, tests) {
    const n = tests.length, ranks = {}, out = {}; for (const m of ["raw", "rewrite", "hyde"]) ranks[m] = tests.map(x => rankOf(ix, search(ix, x.q, m), x.gold));
    const f3 = x => +x.toFixed(3);
    for (const m in ranks) { const rs = ranks[m]; out[m] = { hit1: f3(rs.filter(r => r === 1).length / n), hit3: f3(rs.filter(r => r !== null && r <= 3).length / n), mrr: f3(rs.reduce((a, r) => a + (r ? 1 / r : 0), 0) / n) }; }
    const big = r => r === null ? 99 : r;
    for (const [a, b] of [["raw", "rewrite"], ["rewrite", "hyde"]]) { out[b].better = ranks[a].filter((x, i) => big(ranks[b][i]) < big(x)).length; out[b].worse = ranks[a].filter((x, i) => big(ranks[b][i]) > big(x)).length; }
    out.n = n; return { out, ranks };
  }
  g.Engine = { rewrite, search, rankOf, evaluate }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
