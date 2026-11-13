/* Espelho de rag.py (retrieve, embed, replay, pick, report) para o navegador. Gerador e custo continuam SIMULADOS; tempos de busca e de consulta ao cache são medidos de verdade (performance.now). */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const sim = (kind, a, b) => kind === "lsa" ? R.dot(a, b) : R.cos(a, b), r4 = x => +x.toFixed(4);
  function retrieve(ix, q, k = 3) {
    if (!ix._toks) ix._toks = ix.docs.map(d => R.tokens(d.title + " " + d.text));
    const [, qt] = R.expand(ix.glossary, q), qv = R.ngVec(qt, ix.ng_idf), b = ix._toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return R.rrf([R.rank(b), R.rank(v)]).slice(0, k).map(p => p[0]);
  }
  function embed(ix, q, kind) { if (kind === "ng") return R.ngVec(R.tokens(q), ix.ng_idf); if (kind === "ngx") return R.ngVec(R.expand(ix.glossary, q)[1], ix.ng_idf); return R.lsaVec(ix.lsa, R.tokens(q)); }
  function llmCost(ix, q, top) {
    const s = ix.sim, w = t => t.split(/\s+/).filter(Boolean).length * s.tok_per_word, tin = s.sys_tokens + w(q) + top.reduce((a, i) => a + w(ix.docs[i].text), 0), tout = top.length ? w(ix.docs[top[0]].text) : 0;
    return { tin: Math.round(tin), tout: Math.round(tout), ms: Math.round(s.llm_base_ms + s.ms_per_out_token * tout), usd: (tin * s.usd_per_m_in + tout * s.usd_per_m_out) / 1e6 };
  }
  function lookup(cache, v, kind) { let best = [0, -1]; cache.forEach((e, n) => { const s = sim(kind, v, e.v); if (best[1] < 0 || s > best[0]) best = [s, n]; }); return best; }
  function replay(ix, queries, kind, t) {
    const cache = [], rows = []; let hits = 0, fh = 0, wrong = 0, bw = 0, usd = 0, busd = 0, ms = 0, bms = 0;
    for (const x of queries) {
      const top = retrieve(ix, x.q), ans = top.length ? ix.docs[top[0]].id : null, c = llmCost(ix, x.q, top); busd += c.usd; bms += c.ms; if (ans !== x.intent) bw++;
      const v = embed(ix, x.q, kind), best = lookup(cache, v, kind);
      if (best[1] >= 0 && best[0] >= t) { const e = cache[best[1]]; hits++; if (e.ans !== x.intent) { fh++; wrong++; } rows.push({ q: x.q, hit: true, sim: r4(best[0]), from: e.q, served: e.ans, ok: e.ans === x.intent }); }
      else { usd += c.usd; ms += c.ms; if (ans !== x.intent) wrong++; cache.push({ v, ans, q: x.q }); rows.push({ q: x.q, hit: false, sim: r4(Math.max(best[0], 0)), from: null, served: ans, ok: ans === x.intent }); }
    }
    const n = queries.length;
    return { n, hits, hit_rate: r4(hits / n), false_hits: fh, false_hit_rate: hits ? r4(fh / hits) : 0, wrong, base_wrong: bw, llm_calls: n - hits, usd, base_usd: busd, saved_pct: +(100 * (1 - usd / busd)).toFixed(1), sim_ms: Math.round(ms), base_sim_ms: Math.round(bms), rows };
  }
  function pick(ix, kind) { const dev = ix.stream.filter(x => x.dev); let best = null; for (const t of ix.thresholds) { const r = replay(ix, dev, kind, t); if (r.false_hit_rate <= ix.max_false && (!best || r.saved_pct >= best[1])) best = [t, r.saved_pct]; } return best ? best[0] : 1.01; }
  function report(ix) { const test = ix.stream.filter(x => !x.dev), out = {}; for (const k of ix.kinds) { const t = pick(ix, k), r = replay(ix, test, k, t); delete r.rows; out[k] = { threshold: t, ...r }; } return out; }
  g.Engine = { retrieve, embed, sim, lookup, llmCost, replay, pick, report }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
