/* Porta fiel de dashboard.py (summarize) para JavaScript; conferida contra as saídas reais do Python. O HTML estático completo é o arquivo baixável. */
(function () {
  function cents(s) { if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('preço'); var p = s.split('.'); return parseInt(p[0], 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10); }
  function brl(c) { return 'R$ ' + String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + ('0' + (c % 100)).slice(-2); }
  function validDate(s) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s); if (!m) return false; var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]; }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function load(text) {
    var lines = text.trim().split(/\r?\n/).filter(function (l) { return l.trim() !== ''; }), head = lines.shift().split(',').map(function (h) { return h.trim(); }), rows = [], rej = [];
    lines.forEach(function (l, i) {
      var c = l.split(','), r = {}; head.forEach(function (h, k) { r[h] = (c[k] || '').trim(); });
      try {
        var q = r.qty || '', name = r.product || '', rg = r.region || '', p = cents(r.unit_price || '');
        if (!validDate(r.date || '') || !/^\d+$/.test(q) || parseInt(q, 10) < 1 || !name || !rg) throw new Error('campo');
        rows.push({ ym: r.date.slice(0, 7), name: name, rg: rg, q: parseInt(q, 10), v: parseInt(q, 10) * p });
      } catch (e) { rej.push(i + 2); }
    });
    return { rows: rows, rej: rej };
  }
  function summarize(L) {
    var tot = 0, month = {}, prod = {}, reg = {};
    L.rows.forEach(function (r) { tot += r.v; month[r.ym] = (month[r.ym] || 0) + r.v; reg[r.rg] = (reg[r.rg] || 0) + r.v; var a = prod[r.name] || (prod[r.name] = [0, 0]); a[0] += r.v; a[1] += r.q; });
    var ms = Object.keys(month).sort().map(function (k) { return [k, month[k]]; }), mom = null, n = L.rows.length;
    if (ms.length >= 2 && ms[ms.length - 2][1] > 0) mom = Math.floor((ms[ms.length - 1][1] - ms[ms.length - 2][1]) * 100 / ms[ms.length - 2][1]);
    return { revenue: tot, orders: n, avg_ticket: n ? Math.floor(tot / n) : 0, by_month: ms, mom_pct: mom,
      top_products: Object.keys(prod).map(function (k) { return [k, prod[k][0], prod[k][1]]; }).sort(function (a, b) { return b[1] - a[1] || cmp(a[0], b[0]); }).slice(0, 5),
      by_region: Object.keys(reg).map(function (k) { return [k, reg[k]]; }).sort(function (a, b) { return b[1] - a[1] || cmp(a[0], b[0]); }), rejected_lines: L.rej };
  }
  function S(o) { return JSON.stringify(o); }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { r: null }; },
    verify: function (expect, ctx) { return S(ctx.r) === S(expect); },
    nodes: {
      start: function (i, ctx) { ctx.r = null; ctx.L = load(i.body.csv || ''); return { out: { valid_rows: ctx.L.rows.length, rejected_lines: ctx.L.rej }, ms: 8 }; },
      kpis: function (i, ctx) { ctx.r = summarize(ctx.L); return { out: { revenue: ctx.r.revenue, orders: ctx.r.orders, avg_ticket: ctx.r.avg_ticket, mom_pct: ctx.r.mom_pct }, ms: 3 }; },
      groups: function (i, ctx) { return { out: { months: ctx.r.by_month.length, products: ctx.r.top_products.length, regions: ctx.r.by_region.length }, ms: 3 }; },
      html: function (i, ctx) { return { out: { file: 'dashboard.html', static: true, scripts: 0 }, ms: 5, end: true }; }
    },
    outputs: function (r) {
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var s = r.ctx.r, mom = s.mom_pct === null ? '—' : (s.mom_pct >= 0 ? '+' : '') + s.mom_pct + '%';
      var o = [{ kind: 'card', title: { pt: 'Indicadores (topo do dashboard.html)', en: 'KPIs (top of dashboard.html)' }, rows: [[{ pt: 'Faturamento', en: 'Revenue' }, brl(s.revenue)], [{ pt: 'Pedidos', en: 'Orders' }, String(s.orders)], [{ pt: 'Ticket médio', en: 'Average ticket' }, brl(s.avg_ticket)], [{ pt: 'Variação vs. mês anterior', en: 'Change vs. previous month' }, mom, s.mom_pct !== null && s.mom_pct < 0 ? 'b-warm' : 'b-ok'], [{ pt: 'Linhas ignoradas', en: 'Ignored lines' }, s.rejected_lines.length ? s.rejected_lines.join(', ') : { pt: 'nenhuma', en: 'none' }, s.rejected_lines.length ? 'b-warm' : 'b-ok']] }];
      o.push({ kind: 'sheet', title: { pt: 'Faturamento por mês', en: 'Revenue by month' }, cols: ['mês', 'faturamento'], rows: s.by_month.map(function (x) { return [x[0], brl(x[1])]; }) });
      o.push({ kind: 'sheet', title: { pt: 'Top 5 produtos', en: 'Top 5 products' }, cols: ['produto', 'faturamento', 'unidades'], rows: s.top_products.map(function (x) { return [x[0], brl(x[1]), x[2]]; }) });
      o.push({ kind: 'sheet', title: { pt: 'Por região', en: 'By region' }, cols: ['região', 'faturamento'], rows: s.by_region.map(function (x) { return [x[0], brl(x[1])]; }) });
      return o;
    }
  };
})();
