/* Espelho de rag.py (RAG de código) para o navegador. Os tokens dos chunks vêm pré-calculados no índice (o AST do Python não roda aqui). */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, r4 = x => +x.toFixed(4);
  function answer(ix, question, k = 4) {
    const qt = R.tokens(question), qv = R.ngVec(qt, ix.ng_idf), toks = ix.toks;
    const b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x)), fused = R.rrf([R.rank(b), R.rank(v)]).slice(0, k);
    const res = { terms: qt, status: "refused", answer: null, sources: [], coverage: 0, hits: fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: r4(b[i]), cos: r4(v[i]) })) };
    if (!qt.length) { res.reason = "só palavras comuns na pergunta"; return res; }
    if (!fused.length) { res.reason = "nenhum trecho de código tem relação com a pergunta"; return res; }
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => Math.log(1 + (N - df[t] + .5) / (df[t] + .5)), unk = Math.log(1 + (N + .5) / .5), w = t => t in df ? idf(t) : unk;
    const top = new Set(toks[fused[0][0]]), qs = [...new Set(qt)].sort();
    res.coverage = +(qs.filter(t => top.has(t)).reduce((a, t) => a + w(t), 0) / qs.reduce((a, t) => a + w(t), 0)).toFixed(2);
    if (res.coverage < 0.5) { res.reason = `não encontrei isso no repositório (cobertura ${Math.round(res.coverage * 100)}% < 50%)`; return res; }
    const c = ix.chunks[fused[0][0]];
    Object.assign(res, { status: "answered", answer: `${c.doc || c.sig} [1]`, sources: [{ id: c.id, ref: `${c.file}:${c.line}`, kind: c.kind, name: c.name }] });
    return res;
  }
  g.Engine = { answer }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
