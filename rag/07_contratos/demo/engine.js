/* Espelho de rag.py (search/answer/evaluate) para o navegador. Flags e destaques são calculados no build (Python) e vêm no índice. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, MIN = 0.5;
  function expand(ix, q) { const groups = R.tokens(q).map(t => [t, ...(ix.glossary[t] || []).filter(s => s !== t)]); const flat = []; for (const gr of groups) for (const t of gr) if (!flat.includes(t)) flat.push(t); return [groups, flat]; }
  function search(ix, q, tipo = null, k = 3) {
    if (!ix._toks) ix._toks = ix.chunks.map(c => R.tokens(c.ctitle + " " + c.text));
    const [groups, qt] = expand(ix, q), qv = R.ngVec(qt, ix.ng_idf), ok = i => !tipo || ix.chunks[i].type === tipo;
    const b = ix._toks.map((t, i) => ok(i) ? R.bm25(ix.bm25, qt, t) : 0), v = ix.ng_vecs.map((x, i) => ok(i) ? R.cos(qv, x) : 0);
    const fused = R.rrf([R.rank(b), R.rank(v)]).slice(0, k);
    return { hits: fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) })), groups, qt, toks: ix._toks };
  }
  function answer(ix, q, tipo = null, k = 3) {
    const { hits, groups, qt, toks } = search(ix, q, tipo, k), res = { terms: qt, status: "refused", hits, coverage: 0, chunk: null };
    if (!qt.length) { res.reason = "none"; return res; } if (!hits.length) { res.reason = "no_hits"; return res; }
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : 0, unk = Math.log(1 + (N + .5) / .5);
    const w = gr => gr.some(t => t in df) ? Math.max(0, ...gr.filter(t => t in df).map(idf)) : unk, top = hits[0].id, set = new Set(toks[top]);
    res.coverage = +(groups.filter(gr => gr.some(t => set.has(t))).reduce((a, gr) => a + w(gr), 0) / groups.reduce((a, gr) => a + w(gr), 0)).toFixed(2);
    if (res.coverage < MIN) { res.reason = "coverage"; return res; }
    res.status = "answered"; res.chunk = top; return res;
  }
  function evaluate(ix, T) {
    let r1 = 0, r3 = 0, n = 0, oosA = 0;
    for (const x of T.questions) { const ids = search(ix, x.q, null, 3).hits.map(h => ix.chunks[h.id].key); n++; if (ids.length && x.ok.includes(ids[0])) r1++; if (ids.some(i => x.ok.includes(i))) r3++; }
    for (const q of T.oos) if (answer(ix, q).status === "answered") oosA++;
    const got = new Set(), ep = new Set(); ix.chunks.forEach(c => c.flags.forEach(f => got.add(c.key + "|" + f))); Object.entries(T.flags).forEach(([k, v]) => v.forEach(f => ep.add(k + "|" + f)));
    const r = x => +x.toFixed(3);
    return { n, recall1: r(r1 / n), recall3: r(r3 / n), oos: T.oos.length, oos_answered: oosA, flag_tp: [...got].filter(x => ep.has(x)).length, flag_fp: [...got].filter(x => !ep.has(x)).sort(), flag_fn: [...ep].filter(x => !got.has(x)).sort() };
  }
  g.Engine = { search, answer, evaluate, MIN }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
