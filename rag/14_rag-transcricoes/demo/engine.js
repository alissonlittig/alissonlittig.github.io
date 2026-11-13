/* Espelho de rag.py (busca em transcrições com timestamp) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const wtext = ss => ss.map(s => s.who + ": " + s.text).join(" ");
  const prep = ix => ix._toks || (ix._toks = ix.wins.map(w => R.tokens(wtext(ix.segs.slice(w.a, w.b + 1)))));
  function confidence(ix, groups, toks, v, top) {
    const N = ix.bm25.n, df = ix.bm25.df, mx = Math.log(1 + (N + .5) / .5);
    const w = gr => { const k = gr.filter(t => t in df); return k.length ? Math.max(0, ...k.map(t => Math.log(1 + (N - df[t] + .5) / (df[t] + .5)))) : mx; };
    const tot = groups.reduce((a, gr) => a + w(gr), 0), cov = groups.length ? groups.filter(gr => gr.some(t => toks[top].includes(t))).reduce((a, gr) => a + w(gr), 0) / tot : 0;
    return [+(0.5 * Math.min(1, v[top] / 0.6) + 0.5 * cov).toFixed(3), +cov.toFixed(3)];
  }
  function ask(ix, q, doc = null, t = 0.45, k = 3) {
    const [groups, qt] = R.expand(ix.glossary, q), toks = prep(ix), qv = R.ngVec(qt, ix.ng_idf);
    const b = toks.map(tk => R.bm25(ix.bm25, qt, tk)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    const fused = R.rrf([R.rank(b), R.rank(v)]).filter(([i]) => !doc || ix.wins[i].doc === doc), hits = [];
    for (const [i, s] of fused) {
      const w = ix.wins[i];
      if (hits.some(h => h.doc === w.doc && !(w.b < h.a || w.a > h.b))) continue;
      hits.push({ id: i, doc: w.doc, a: w.a, b: w.b, t0: w.t0, t1: w.t1, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) });
      if (hits.length === k) break;
    }
    const r = { terms: qt, hits, answer: null, conf: 0 };
    if (!hits.length) return r;
    const top = hits[0].id; [r.conf, r.cov] = confidence(ix, groups, toks, v, top);
    const N = ix.bm25.n, df = ix.bm25.df, wt = x => x in df ? Math.log(1 + (N - df[x] + .5) / (df[x] + .5)) : 0, qs = new Set([...qt, ...groups.flat()]);
    let best = hits[0].a, bs = -1;
    for (let j = hits[0].a; j <= hits[0].b; j++) { const s = +[...new Set(R.tokens(ix.segs[j].who + " " + ix.segs[j].text))].filter(x => qs.has(x)).reduce((a, x) => a + wt(x), 0).toFixed(4); if (s > bs) { bs = s; best = j; } }
    if (r.conf >= t) { const s = ix.segs[best]; r.answer = { seg: best, t: s.t, ts: mmss(s.t), who: s.who, text: s.text, doc: s.doc }; }
    return r;
  }
  g.Engine = { ask, mmss }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
