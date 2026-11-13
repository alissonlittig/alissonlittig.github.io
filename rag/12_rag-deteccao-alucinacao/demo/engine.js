/* Espelho de rag.py (verificador de suporte por frase) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const HI = 0.7, LO = 0.5, NEG = new Set("nao nunca proibido proibida sem impossivel".split(" ")), POS = new Set("permitido permitida pode podem liberado liberada".split(" "));
  const prep = ix => ix._toks || (ix._toks = ix.chunks.map(c => R.tokens(c.section + " " + c.text)));
  function retrieve(ix, text, k = 3) {
    const toks = prep(ix), qt = R.tokens(text), qv = R.ngVec(qt, ix.ng_idf), b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return R.rrf([R.rank(b), R.rank(v)]).slice(0, k).map(([i, s]) => ({ id: i, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) }));
  }
  const numbers = s => [...new Set((s.match(/\d+(?:[.,]\d+)?/g) || []).map(m => m.replace(",", ".")))].sort();
  const polarity = s => { const w = new Set(R.norm(s).match(/[a-z]+/g) || []); return [...w].some(x => NEG.has(x)) ? "neg" : [...w].some(x => POS.has(x)) ? "pos" : ""; };
  function check(ix, question, answer, k = 3) {
    const hits = retrieve(ix, question + " " + answer, k), N = ix.bm25.n, df = ix.bm25.df, unk = Math.log(1 + (N + .5) / .5);
    const w = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : unk;
    const ev = hits.flatMap(h => R.sentences(ix.chunks[h.id].text).map(s => [h.id, s, new Set(R.tokens(s))])), out = [];
    for (const s of R.sentences(answer)) {
      const ts = new Set(R.tokens(s)); let best = null;
      for (const [cid, e, te] of ev) { const tot = [...ts].reduce((a, t) => a + w(t), 0), sc = tot ? +([...ts].filter(t => te.has(t)).reduce((a, t) => a + w(t), 0) / tot).toFixed(4) : 0; if (!best || sc > best[0]) best = [sc, cid, e]; }
      const [sc, cid, e] = best || [0, null, ""], issues = []; let label;
      const ns = numbers(s), ne = numbers(e);
      if (!ts.size) label = "na";
      else {
        const bad = ns.filter(n => !ne.includes(n)); if (bad.length) issues.push("número fora da evidência: " + bad.join(", "));
        const ps = polarity(s), pe = polarity(e); if (sc >= LO && ps !== pe && (ps === "neg" || pe === "neg")) issues.push("polaridade oposta à evidência");
        label = (issues.length || sc < LO) ? "sem suporte" : (sc >= HI ? "suportada" : "parcial");
      }
      out.push({ text: s, label, support: sc, issues, evidence: label !== "na" && cid !== null ? { id: cid, sentence: e } : null });
    }
    const n = out.filter(x => x.label !== "na").length, ok = out.filter(x => x.label === "suportada").length;
    return { hits, sentences: out, summary: { n, suportada: ok, parcial: out.filter(x => x.label === "parcial").length, sem_suporte: out.filter(x => x.label === "sem suporte").length, fiel_pct: n ? Math.round(100 * ok / n) : 0 } };
  }
  g.Engine = { check }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
