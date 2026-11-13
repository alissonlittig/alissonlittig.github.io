/* Espelho de analyze() de rag.py: compara cada versão com a anterior (nota, perguntas que pioraram, status). Os resultados por pergunta vêm do histórico gerado em Python. */
(function (g) {
  const passed = (q, r) => q.oos ? r.refused : (r.rank !== null && r.rank <= 3 && !r.refused);
  const r2 = x => Math.round(x * 100) / 100;
  function analyze(h, tol, fa) {
    return h.versions.map((v, n) => {
      if (!n) return { id: v.id, nota: r2(v.metrics.nota), delta: null, down: [], up: [], status: "base" };
      const p = h.versions[n - 1], down = [], up = [];
      h.questions.forEach((q, i) => { const a = passed(q, p.per_q[i]), b = passed(q, v.per_q[i]); if (a && !b) down.push(i); if (!a && b) up.push(i); });
      const d = r2(v.metrics.nota - p.metrics.nota);
      return { id: v.id, nota: r2(v.metrics.nota), delta: d, down, up, status: d < -tol ? "regressao" : down.length >= fa ? "alerta" : "ok" };
    });
  }
  function cell(q, r) { if (q.oos) return r.refused ? "ok" : "bad"; if (r.refused) return "ref"; return r.rank === 1 ? "ok" : r.rank && r.rank <= 3 ? "t3" : r.rank ? "low" : "miss"; }
  g.Engine = { passed, analyze, cell }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
