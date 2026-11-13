/* Espelho de rag.py (search/answer) para o navegador. Usa ../../_shared/core.js (copiado em demo/core.js). */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const MIN = 0.5;
  function expand(ix, q) { const groups = R.tokens(q).map(t => [t, ...(ix.glossary[t] || []).filter(s => s !== t)]); const flat = []; for (const gr of groups) for (const t of gr) if (!flat.includes(t)) flat.push(t); return [groups, flat]; }
  function prep(ix) { if (!ix._toks) ix._toks = ix.chunks.map(c => R.tokens(c.section + " " + c.text)); return ix._toks; }
  function search(ix, q, k = 3) {
    const toks = prep(ix), qt = expand(ix, q)[1], qv = R.ngVec(qt, ix.ng_idf);
    const b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    const fused = R.rrf([R.rank(b), R.rank(v)]).slice(0, k);
    return { hits: fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) })), q: qt, toks };
  }
  function answer(ix, question, k = 3) {
    const { hits, q, toks } = search(ix, question, k), groups = expand(ix, question)[0];
    const res = { terms: q, status: "refused", answer: null, coverage: 0, sources: [], hits };
    if (!q.length) { res.reason = "só palavras comuns na pergunta"; return res; }
    if (!hits.length) { res.reason = "nenhum trecho tem relação com a pergunta"; return res; }
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : 0, unk = Math.log(1 + (N + .5) / .5);
    const w = gr => gr.some(t => t in df) ? Math.max(0, ...gr.filter(t => t in df).map(idf)) : unk;
    const top = new Set(toks[hits[0].id]);
    res.coverage = +(groups.filter(gr => gr.some(t => top.has(t))).reduce((a, gr) => a + w(gr), 0) / groups.reduce((a, gr) => a + w(gr), 0)).toFixed(2);
    if (res.coverage < MIN) { res.reason = `não encontrei isso nos documentos (cobertura ${Math.round(res.coverage * 100)}% < ${MIN * 100}%)`; return res; }
    const cand = [], qs = new Set(q);
    hits.forEach((h, pos) => R.sentences(ix.chunks[h.id].text).forEach((s, sp) => cand.push([+[...new Set(R.tokens(s))].filter(t => qs.has(t)).reduce((a, t) => a + idf(t), 0).toFixed(4), pos, sp, s])));
    cand.sort((a, b) => b[0] - a[0] || a[1] - b[1] || a[2] - b[2]); const best = cand[0];
    const pick = [best, ...cand.slice(1).filter(c => c[0] > 0 && c[0] >= .8 * best[0] && c[3] !== best[3]).slice(0, 1)];
    const src = [], parts = [];
    for (const [, pos, , s] of pick) { const cid = hits[pos].id; if (!src.some(x => x.id === cid)) { const c = ix.chunks[cid]; src.push({ id: cid, doc: c.doc, title: c.title, section: c.section, line: c.line }); } parts.push(`${s} [${src.findIndex(x => x.id === cid) + 1}]`); }
    Object.assign(res, { status: "answered", answer: parts.join(" "), sources: src, picked: pick.map(p => p[3]) }); return res;
  }
  g.Engine = { answer, search, expand }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
