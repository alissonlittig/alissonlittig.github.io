/* Espelho de rag_core.py no navegador (sem dependências). Conferido contra o Python por tests/parity. */
(function (g) {
  const K1 = 1.5, B = 0.75, RRF_K = 60;
  const STOP = new Set("a o as os um uma uns umas de do da dos das em no na nos nas por para com e ou que qual quais quando como se ao aos e sao ser tem ter pode posso preciso quero meu minha seu sua sobre mais ate quanto quantos quantas quanta onde ha foi vai fazer faco existe suas seus ja nao sim eu voce meus minhas pra pro esta estao".split(" "));
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const tokens = s => { const o = []; for (const t of (norm(s).match(/[a-z0-9]+/g) || [])) { if (t.length < 2 || STOP.has(t)) continue; o.push(t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t); } return o; };
  const sentences = t => t.replace(/\s+/g, " ").trim().split(/(?<=[a-zà-ú0-9][.!?])\s+/i).filter(Boolean);
  const count = (a, t) => { let n = 0; for (const x of a) if (x === t) n++; return n; };
  function bm25(ix, q, dt) { let s = 0; for (const t of new Set(q)) { const tf = count(dt, t); if (tf) { const n = ix.df[t]; s += Math.log(1 + (ix.n - n + .5) / (n + .5)) * tf * (K1 + 1) / (tf + K1 * (1 - B + B * dt.length / ix.avgdl)); } } return s; }
  function grams(toks, n = 3) { const o = []; for (const t of toks) { const p = "#" + t + "#"; for (let i = 0; i < Math.max(1, t.length + 2 - n + 1); i++) o.push(p.slice(i, i + n)); } return o; }
  function l2(v) { let z = 0; for (const k in v) z += v[k] * v[k]; z = Math.sqrt(z) || 1; const o = {}; for (const k in v) o[k] = v[k] / z; return o; }
  function ngVec(toks, idf) { const tf = {}; for (const g of grams(toks)) tf[g] = (tf[g] || 0) + 1; const v = {}; for (const g in tf) if (g in idf) v[g] = (1 + Math.log(tf[g])) * idf[g]; return l2(v); }
  function cos(a, b) { let s = 0; for (const k in a) if (k in b) s += a[k] * b[k]; return s; }
  function lsaVec(l, toks) {
    if (!l._ix) { l._ix = {}; l.vocab.forEach((t, i) => l._ix[t] = i); }
    const tf = {}; for (const t of toks) if (t in l._ix) tf[t] = (tf[t] || 0) + 1;
    const w = {}; let z = 0; for (const t in tf) { w[t] = (1 + Math.log(tf[t])) * l.idf[t]; z += w[t] * w[t]; } z = Math.sqrt(z) || 1;
    const out = new Array(l.k).fill(0); for (const t in w) { const row = l.proj[l._ix[t]]; for (let j = 0; j < l.k; j++) out[j] += w[t] / z * row[j]; }
    z = Math.sqrt(out.reduce((a, x) => a + x * x, 0)); return out.map(x => z > 1e-9 ? x / z : 0);
  }
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const rank = sc => sc.map((s, i) => [i, s]).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(p => p[0]);
  function rrf(rankings, k = RRF_K) { const sc = {}; for (const r of rankings) r.forEach((i, pos) => sc[i] = (sc[i] || 0) + 1 / (k + pos + 1)); return Object.entries(sc).map(([i, s]) => [+i, s]).sort((a, b) => b[1] - a[1] || a[0] - b[0]); }
  function rerankFeatures(q, heading, dt) {
    const qs = new Set(q), ds = new Set(dt), hs = new Set(tokens(heading)); const n = qs.size || 1;
    const cov = [...qs].filter(t => ds.has(t)).length / n;
    const pairs = new Set(); for (let i = 0; i < dt.length - 1; i++) pairs.add(dt[i] + "\u0001" + dt[i + 1]);
    let b = 0; for (let i = 0; i < q.length - 1; i++) if (pairs.has(q[i] + "\u0001" + q[i + 1])) b++;
    return [q.length ? cov : 0, q.length > 1 ? b / (q.length - 1) : 0, q.length ? [...qs].filter(t => hs.has(t)).length / n : 0];
  }
  const rerankScore = (f, fn) => +(0.35 * f[0] + 0.25 * f[1] + 0.15 * f[2] + 0.25 * fn).toFixed(5);
  function expand(gl, q) { const groups = tokens(q).map(t => [t, ...(gl[t] || []).filter(s => s !== t)]); const flat = []; for (const gr of groups) for (const t of gr) if (!flat.includes(t)) flat.push(t); return [groups, flat]; }
  g.RAG = { expand, norm, tokens, sentences, bm25, grams, ngVec, cos, lsaVec, dot, rank, rrf, rerankFeatures, rerankScore };
  if (typeof module !== "undefined") module.exports = g.RAG;
})(typeof window !== "undefined" ? window : globalThis);
