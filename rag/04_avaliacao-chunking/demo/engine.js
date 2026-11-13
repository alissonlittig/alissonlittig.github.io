/* Espelho de rag.py (search/evaluateCfg) para o navegador. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, K = 3;
  const toks = c => c._t || (c._t = c.chunks.map(x => R.tokens(x.text)));
  function search(ix, q, k = K) { const qt = R.tokens(q), s = toks(ix).map(t => R.bm25(ix.bm25, qt, t)); return R.rank(s).slice(0, k).map(i => [i, +s[i].toFixed(4)]); }
  function evaluateCfg(ix, qs, k = K) {
    let h1 = 0, h3 = 0, mrr = 0, ceil = 0, ctx = 0;
    for (const q of qs) {
      const r = search(ix, q.q, k), texts = r.map(([i]) => ix.chunks[i].text), ok = texts.map(t => t.includes(q.gold));
      h1 += ok[0] === true ? 1 : 0; h3 += ok.some(Boolean) ? 1 : 0; const f = ok.indexOf(true); mrr += f < 0 ? 0 : 1 / (f + 1);
      ceil += ix.chunks.some(c => c.text.includes(q.gold)) ? 1 : 0; ctx += texts.reduce((a, t) => a + t.split(/\s+/).filter(Boolean).length, 0);
    }
    const n = qs.length, ws = ix.chunks.map(c => c.text.split(/\s+/).filter(Boolean).length), r3 = x => +(x / n).toFixed(3);
    return { chunks: ix.chunks.length, avg_words: +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1), "hit@1": r3(h1), "hit@3": r3(h3), mrr: r3(mrr), ceiling: r3(ceil), ctx_words: +(ctx / n).toFixed(1) };
  }
  g.Engine = { search, evaluateCfg }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
