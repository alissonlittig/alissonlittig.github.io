/* Porta fiel de reconcile.py (cents, parse, reconcile) para JavaScript; conferida contra as saídas reais do Python. */
(function () {
  var WINDOW = 3, TOL_PCT = 2;
  function cents(s) { s = s.trim(); var neg = s[0] === '-'; s = s.replace(/^[+-]+/, ''); if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('valor inválido: ' + s); var p = s.split('.'), v = parseInt(p[0], 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10); return neg ? -v : v; }
  function days(a, b) { return Math.abs(Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000)); }
  function words(t) { var o = {}; (t.toLowerCase().match(/[a-z]{3,}/g) || []).forEach(function (w) { o[w] = 1; }); return o; }
  function share(a, b) { var x = words(a), y = words(b); return Object.keys(x).some(function (w) { return y[w]; }); }
  function money(c) { return (c < 0 ? '-' : '') + Math.floor(Math.abs(c) / 100) + '.' + ('0' + (Math.abs(c) % 100)).slice(-2); }
  function parse(text, erp) {
    var lines = text.trim().split(/\r?\n/).filter(function (l) { return l.trim(); }), head = lines.shift().split(',').map(function (h) { return h.trim(); });
    return lines.map(function (l, i) { var c = l.split(','), r = {}; head.forEach(function (h, k) { r[h] = (c[k] || '').trim(); });
      if (!r.date || !r.description || r.amount == null) throw new Error('linha ' + (i + 2) + ': faltam colunas'); return { id: erp ? r.id : 'B' + (i + 1), date: r.date, desc: r.description, amt: cents(r.amount) }; });
  }
  function best(b, erp, used, ok) {
    var c = []; erp.forEach(function (e, k) { if (!used[k] && days(b.date, e.date) <= WINDOW && ok(b, e)) c.push([Math.abs(b.amt - e.amt), days(b.date, e.date), k]); });
    c.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; }); return c[0] || null;
  }
  function pass1(bank, erp, ctx) { bank.forEach(function (b) { var m = best(b, erp, ctx.used, function (b, e) { return b.amt === e.amt; }); if (m) { ctx.used[m[2]] = 1; ctx.done[b.id] = 1; ctx.matched.push({ bank: b.id, erp: erp[m[2]].id, kind: 'exact', diff: 0 }); } }); }
  function pass2(bank, erp, ctx) { bank.forEach(function (b) { if (ctx.done[b.id]) return;
    var m = best(b, erp, ctx.used, function (b, e) { return (b.amt > 0) === (e.amt > 0) && Math.abs(b.amt - e.amt) * 100 <= TOL_PCT * Math.abs(e.amt) && share(b.desc, e.desc); });
    if (m) { ctx.used[m[2]] = 1; ctx.done[b.id] = 1; ctx.matched.push({ bank: b.id, erp: erp[m[2]].id, kind: 'amount_diff', diff: b.amt - erp[m[2]].amt }); } }); }
  function S(o) { return JSON.stringify(o, function (k, v) { if (v && typeof v === 'object' && !Array.isArray(v)) { return Object.keys(v).sort().reduce(function (a, k) { a[k] = v[k]; return a; }, {}); } return v; }); }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { r: null }; },
    verify: function (expect, ctx) { return S(ctx.r) === S(expect); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.bank = parse(b.bank, false); ctx.erp = parse(b.erp, true); ctx.used = {}; ctx.done = {}; ctx.matched = []; ctx.r = null; return { out: { bank_rows: ctx.bank.length, erp_rows: ctx.erp.length }, ms: 6 }; },
      exact: function (i, ctx) { pass1(ctx.bank, ctx.erp, ctx); return { out: { exact_matches: ctx.matched.length, window_days: WINDOW }, ms: 4 }; },
      tolerance: function (i, ctx) { var n = ctx.matched.length; pass2(ctx.bank, ctx.erp, ctx); return { out: { tolerance_matches: ctx.matched.length - n, tolerance_pct: TOL_PCT }, ms: 4 }; },
      report: function (i, ctx) {
        var bank = ctx.bank, erp = ctx.erp, bank_only = bank.filter(function (b) { return !ctx.done[b.id]; }).map(function (b) { return b.id; }), erp_only = erp.filter(function (e, k) { return !ctx.used[k]; }).map(function (e) { return e.id; });
        var bt = bank.reduce(function (s, b) { return s + b.amt; }, 0), et = erp.reduce(function (s, e) { return s + e.amt; }, 0);
        ctx.r = { matched: ctx.matched, bank_only: bank_only, erp_only: erp_only, summary: { bank_total: bt, erp_total: et, gap: bt - et, matched: ctx.matched.length, divergences: bank_only.length + erp_only.length + ctx.matched.filter(function (m) { return m.diff; }).length } };
        return { out: ctx.r.summary, ms: 5, end: true };
      }
    },
    outputs: function (r) {
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var x = r.ctx.r, s = x.summary, bi = {}, ei = {}; r.ctx.bank.forEach(function (b) { bi[b.id] = b; }); r.ctx.erp.forEach(function (e) { ei[e.id] = e; });
      var rows = []; x.matched.forEach(function (m) { if (m.diff) rows.push(['amount_diff', m.bank, m.erp, bi[m.bank].desc, money(bi[m.bank].amt), money(ei[m.erp].amt), money(m.diff)]); });
      x.bank_only.forEach(function (i) { rows.push(['bank_only', i, '', bi[i].desc, money(bi[i].amt), '', money(bi[i].amt)]); });
      x.erp_only.forEach(function (i) { rows.push(['erp_only', '', i, ei[i].desc, '', money(ei[i].amt), money(-ei[i].amt)]); });
      var o = [{ kind: 'card', title: { pt: 'Resumo da conciliação', en: 'Reconciliation summary' }, rows: [[{ pt: 'Conciliados', en: 'Matched' }, String(s.matched), 'b-ok'], [{ pt: 'Divergências', en: 'Divergences' }, String(s.divergences), s.divergences ? 'b-warm' : 'b-ok'], [{ pt: 'Total extrato', en: 'Bank total' }, money(s.bank_total)], [{ pt: 'Total ERP', en: 'ERP total' }, money(s.erp_total)], [{ pt: 'Diferença', en: 'Gap' }, money(s.gap)]] }];
      if (rows.length) o.push({ kind: 'sheet', title: { pt: 'divergencias.csv', en: 'divergencias.csv' }, cols: ['tipo', 'extrato', 'erp', 'descricao', 'valor_extrato', 'valor_erp', 'diferenca'], rows: rows });
      else o.push({ title: { pt: 'divergencias.csv', en: 'divergencias.csv' }, skipped: { pt: 'Nenhuma divergência: tudo conciliado.', en: 'No divergence: everything reconciled.' } });
      return o;
    }
  };
})();
