/* Espelho de rag.py (GraphRAG simples) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const W_LEX = 0.6, r6 = x => +x.toFixed(6), r4 = x => +x.toFixed(4);
  const findEnts = (ix, text) => { const t = R.norm(text); return ix.entities.filter(e => e.alias_norm.some(a => new RegExp("\\b" + a + "\\b").test(t))).map(e => e.id); };
  const prep = ix => ix._toks || (ix._toks = ix.chunks.map(c => R.tokens(c.section + " " + c.text)));
  function lexical(ix, q) {
    const toks = prep(ix), qt = R.tokens(q), qv = R.ngVec(qt, ix.ng_idf);
    const b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return { fused: R.rrf([R.rank(b), R.rank(v)]), qt, toks, b, v };
  }
  function neighborhood(ix, seeds, hops) {
    const adj = {}; for (const [a, b] of ix.edges) { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }
    const dist = {}, par = {}; for (const s of seeds) { dist[s] = 0; par[s] = null; }
    let fr = [...seeds].sort((a, b) => a - b);
    for (let d = 1; d <= hops; d++) { const nxt = []; for (const u of fr) for (const v of (adj[u] || []).slice().sort((a, b) => a - b)) if (!(v in dist)) { dist[v] = d; par[v] = u; nxt.push(v); } fr = nxt.sort((a, b) => a - b); }
    return { dist, par };
  }
  function pathNames(ix, par, e) { const p = []; while (e !== null && e !== undefined) { p.push(ix.entities[e].name); e = par[e]; } return p.reverse(); }
  function answer(ix, question, hops = 1, k = 4) {
    const { fused, qt, toks, b, v } = lexical(ix, question), mb = Math.max(...b, 1e-9), mv = Math.max(...v, 1e-9), base = fused.slice(0, 3).map(p => p[0]);
    let seeds = findEnts(ix, question), how = "pergunta";
    if (!seeds.length && fused.length) { seeds = [...new Set(base.slice(0, 2).flatMap(i => ix.chunks[i].ents))].sort((a, b) => a - b); how = "trechos"; }
    const { dist, par } = seeds.length ? neighborhood(ix, seeds, hops) : { dist: {}, par: {} };
    const res = { terms: qt, seeds, seed_from: how, dist, baseline: base, hits: [], status: "refused", answer: null, sources: [] };
    if (!qt.length) { res.reason = "só palavras comuns na pergunta"; return res; }
    const qs = new Set(qt), cov = Math.max(0, ...toks.map(t => { const s = new Set(t); return [...qs].filter(x => s.has(x)).length / qs.size; }));
    if (how === "trechos" && (!fused.length || cov < 0.5)) { res.reason = `nenhuma entidade na pergunta e cobertura ${Math.round(cov * 100)}% < 50%`; return res; }
    const sc = [];
    for (const c of ix.chunks) {
      const gs = c.ents.filter(e => e in dist).map(e => 1 / (1 + dist[e])), gg = gs.length ? Math.max(...gs) : 0, l = (b[c.id] / mb + v[c.id] / mv) / 2, s = r6(W_LEX * l + (1 - W_LEX) * gg);
      if (s > 0) sc.push([c.id, s, r4(l), r4(gg)]);
    }
    sc.sort((x, y) => y[1] - x[1] || x[0] - y[0]);
    const N = ix.bm25.n, df = ix.bm25.df, idf = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : 0;
    for (const [i, s, l, gg] of sc.slice(0, k)) {
      const near = ix.chunks[i].ents.filter(e => e in dist).sort((x, y) => dist[x] - dist[y] || x - y), best = near.length ? near[0] : null;
      res.hits.push({ id: i, score: s, lex: l, graph: gg, via: best !== null && dist[best] > 0 ? pathNames(ix, par, best) : [] });
    }
    const parts = [];
    for (const h of res.hits.slice(0, 3)) {
      const sents = R.sentences(ix.chunks[h.id].text), sw = sents.map(s => r4([...new Set(R.tokens(s))].filter(t => qs.has(t)).reduce((a, t) => a + idf(t), 0)));
      let j = 0; sw.forEach((x, n) => { if (x > sw[j]) j = n; });
      if (!parts.some(p => p[0] === sents[j])) parts.push([sents[j], h.id]);
    }
    if (!parts.length) { res.reason = "nada recuperado"; return res; }
    const cites = []; for (const [, i] of parts) if (!cites.includes(i)) cites.push(i);
    Object.assign(res, { status: "answered", answer: parts.map(([s, i]) => `${s} [${cites.indexOf(i) + 1}]`).join(" "), sources: cites.map(i => ({ id: i, doc: ix.chunks[i].doc, section: ix.chunks[i].section, line: ix.chunks[i].line })) });
    return res;
  }
  g.Engine = { answer }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
