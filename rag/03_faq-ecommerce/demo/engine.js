/* Espelho de rag.py (retrieve/confidence/ask/evaluate) para o navegador. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG, BAND = 0.15, T_DEFAULT = 0.5;
  const toks = ix => ix._t || (ix._t = ix.faq.map(f => R.tokens(f.q + ". " + f.q + ". " + f.a)));
  function retrieve(ix, q, useGloss = true) {
    const [groups, qt] = R.expand(useGloss ? ix.glossary : {}, q), T = toks(ix), qv = R.ngVec(qt, ix.ng_idf);
    const b = T.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return { groups, qt, T, b, v, fused: R.rrf([R.rank(b), R.rank(v)]).slice(0, 3) };
  }
  function confidence(ix, groups, T, v, top) {
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => Math.log(1 + (N - df[t] + .5) / (df[t] + .5)), unk = Math.log(1 + (N + .5) / .5);
    const w = gr => gr.some(t => t in df) ? Math.max(0, ...gr.filter(t => t in df).map(idf)) : unk, set = new Set(T[top]);
    const cov = groups.length ? groups.filter(gr => gr.some(t => set.has(t))).reduce((a, gr) => a + w(gr), 0) / groups.reduce((a, gr) => a + w(gr), 0) : 0;
    return [+(0.5 * Math.min(1, v[top] / 0.6) + 0.5 * cov).toFixed(3), +cov.toFixed(3)];
  }
  function ask(ix, q, t = T_DEFAULT, useGloss = true) {
    const { groups, qt, T, b, v, fused } = retrieve(ix, q, useGloss), r = { terms: qt, decision: "idk", conf: 0, faq: null, answer: null, suggest: [], cands: [] };
    if (!fused.length) return r; const top = fused[0][0];
    [r.conf, r.cov] = confidence(ix, groups, T, v, top); r.cos = +v[top].toFixed(4);
    r.cands = fused.map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) }));
    if (r.conf >= t) { r.decision = "answer"; r.faq = top; r.answer = ix.faq[top].a; } else if (r.conf >= t - BAND) { r.decision = "suggest"; r.suggest = fused.slice(0, 2).map(x => x[0]); }
    return r;
  }
  function evaluate(ix, tests, t, useGloss = true) {
    const c = { correct: 0, wrong: 0, suggested: 0, idk: 0, oos_answered: 0, oos_refused: 0 };
    for (const x of tests) { const r = ask(ix, x.q, t, useGloss); if (x.faq === null) c[r.decision === "answer" ? "oos_answered" : "oos_refused"]++; else if (r.decision === "answer") c[r.faq === x.faq ? "correct" : "wrong"]++; else c[r.decision === "suggest" ? "suggested" : "idk"]++; }
    const ins = c.correct + c.wrong + c.suggested + c.idk, oos = c.oos_answered + c.oos_refused, ans = c.correct + c.wrong + c.oos_answered, r3 = x => +x.toFixed(3);
    return Object.assign(c, { t, in_scope: ins, oos, coverage: ins ? r3(c.correct / ins) : 0, precision: ans ? r3(c.correct / ans) : 1, false_answer_rate: oos ? r3(c.oos_answered / oos) : 0 });
  }
  const split = tests => [tests.filter((_, i) => i % 2 === 0), tests.filter((_, i) => i % 2 === 1)];
  g.Engine = { ask, evaluate, split, T_DEFAULT, SWEEP: Array.from({ length: 11 }, (_, i) => +(0.30 + 0.05 * i).toFixed(2)) }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
