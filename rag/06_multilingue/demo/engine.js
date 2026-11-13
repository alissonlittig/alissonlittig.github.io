/* Espelho de rag.py (analyze/detect/search/answer/evaluate) para o navegador. Léxico e palavras comuns vêm do índice (mesmos dados do Python). */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const LANGS = ["pt", "en", "es"], MIN = 0.3, MODES = ["concept", "raw", "ngram", "hybrid"];
  const stem = w => w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
  const words = s => R.norm(s).match(/[a-z0-9]+/g) || [];
  const stopSet = ix => ix._stop || (ix._stop = new Set(ix.stop));
  function analyze(ix, text) { const st = stopSet(ix); return words(text).filter(w => w.length >= 2 && !st.has(stem(w))).map(w => [w, stem(w), ix.lex[stem(w)] || stem(w)]); }
  const ids = (ix, t) => analyze(ix, t).map(a => a[2]);
  function detect(ix, q) {
    const ws = words(q).map(stem), sc = {};
    for (const l of LANGS) { const S = new Set([...ix.stop_lang[l], ...ix.lex_lang[l]]); sc[l] = ws.filter(w => S.has(w)).length; }
    const top = Math.max(...Object.values(sc)), best = LANGS.filter(l => sc[l] === top);
    return [best.length === 1 && top > 0 ? best[0] : "?", sc];
  }
  function prep(ix) { if (!ix._ct) { ix._ct = ix.docs.map(d => ids(ix, d.title + ". " + d.text)); ix._rt = ix.docs.map(d => analyze(ix, d.title + ". " + d.text).map(a => a[1])); } }
  function search(ix, q, mode = "concept", k = 3) {
    prep(ix); const an = analyze(ix, q), qc = an.map(a => a[2]), qr = an.map(a => a[1]);
    const bc = ix._ct.map(t => R.bm25(ix.bm_c, qc, t)), br = ix._rt.map(t => R.bm25(ix.bm_r, qr, t)), qv = R.ngVec(qr, ix.ng_idf), vn = ix.ng_vecs.map(v => R.cos(qv, v));
    const fused = mode === "concept" ? R.rank(bc).map(i => [i, bc[i]]) : mode === "raw" ? R.rank(br).map(i => [i, br[i]]) : mode === "ngram" ? R.rank(vn).map(i => [i, vn[i]]) : R.rrf([R.rank(bc), R.rank(vn)]);
    return { hits: fused.slice(0, k).map(([i, s]) => ({ id: i, score: +s.toFixed(5), bm25_concept: +bc[i].toFixed(4), bm25_raw: +br[i].toFixed(4), ngram: +vn[i].toFixed(4) })), an };
  }
  function answer(ix, q, mode = "concept", k = 3) {
    const { hits, an } = search(ix, q, mode, k), res = { lang: detect(ix, q)[0], concepts: an.map(a => a[2]), status: "refused", hits, answer: null, coverage: 0 };
    if (!an.length || !hits.length) { res.reason = "none"; return res; }
    const N = ix.bm_c.n, df = ix.bm_c.df, w = t => t in df ? Math.log(1 + (N - df[t] + .5) / (df[t] + .5)) : Math.log(1 + (N + .5) / .5);
    const qs = [...new Set(res.concepts)], top = hits[0].id, dset = new Set(ix._ct[top]);
    res.coverage = +(qs.filter(t => dset.has(t)).reduce((a, t) => a + w(t), 0) / qs.reduce((a, t) => a + w(t), 0)).toFixed(3);
    if (res.coverage < MIN) { res.reason = "coverage"; return res; }
    const d = ix.docs[top], sents = R.sentences(d.text); let best = 0, bs = -1;
    sents.forEach((s, j) => { const set = new Set(ids(ix, s)), v = +qs.filter(t => set.has(t)).reduce((a, t) => a + w(t), 0).toFixed(4); if (v > bs) { bs = v; best = j; } });
    const qw = {}, dw = {}; an.forEach(a => qw[a[2]] = a[0]); analyze(ix, d.text).forEach(a => dw[a[2]] = a[0]);
    Object.assign(res, { status: "answered", answer: sents[best], doc: top, doc_lang: d.lang, title: d.title, matches: qs.filter(t => t in dw).map(t => ({ concept: t, q: qw[t], d: dw[t] })) }); return res;
  }
  function evaluate(ix, tests, mode = "concept") {
    let r1 = 0, r3 = 0, mrr = 0, n = 0, oos = 0, oosA = 0; const per = {};
    for (const t of tests) {
      if (t.doc === null) { oos++; if (answer(ix, t.q, mode).status === "answered") oosA++; continue; }
      const idl = search(ix, t.q, mode, ix.docs.length).hits.map(h => h.id); n++; const i = idl.indexOf(t.doc), pos = i < 0 ? null : i + 1;
      if (pos === 1) r1++; if (pos && pos <= 3) r3++; if (pos) mrr += 1 / pos;
      const pair = t.lang + ">" + ix.docs[t.doc].lang, p = per[pair] || (per[pair] = [0, 0]); if (pos === 1) p[0]++; p[1]++;
    }
    const r = x => +x.toFixed(3); return { mode, n, recall1: r(r1 / n), recall3: r(r3 / n), mrr: r(mrr / n), oos, oos_answered: oosA, pairs: per };
  }
  g.Engine = { analyze, detect, search, answer, evaluate, MODES, MIN }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
