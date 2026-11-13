/* Porta fiel de report.py (parse_rows, summarize) para JavaScript. O PDF (reportlab) não é gerado no navegador: a página mostra o conteúdo que iria para o PDF, conferido contra o resumo real do Python. */
(function () {
  var MAX_BAD = 0.2, DAY = 86400000;
  function brl(c) { var s = (c / 100).toFixed(2).split('.'); return 'R$ ' + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m) return null; var t = Date.UTC(+m[1], +m[2] - 1, +m[3]), d = new Date(t); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? t : null; }
  function weekOf(t) { var d = new Date(t), dow = (d.getUTCDay() + 6) % 7, th = t + (3 - dow) * DAY, y = new Date(th).getUTCFullYear(), j1 = Date.UTC(y, 0, 1); return y + '-W' + pad(Math.floor((th - j1) / DAY / 7) + 1); }
  function mondayOf(week) { var y = +week.slice(0, 4), w = +week.slice(6), j4 = Date.UTC(y, 0, 4), dow = (new Date(j4).getUTCDay() + 6) % 7; return j4 - dow * DAY + (w - 1) * 7 * DAY; }
  function splitCsv(text) {
    var lines = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim() !== ''; });
    if (!lines.length) return [];
    var head = lines[0].split(',').map(function (h) { return h.trim(); });
    return lines.slice(1).map(function (l, i) { var c = l.split(','), r = { _ln: i + 2 }; head.forEach(function (h, k) { r[h] = c[k] === undefined ? '' : c[k]; }); return r; });
  }
  function parseRows(text) {
    var rows = [], bad = [];
    splitCsv(text).forEach(function (r) {
      var e = [], d = isoDate((r.date || '').trim()); if (d === null) e.push('date must be YYYY-MM-DD');
      var prod = (r.product || '').trim(), reg = (r.region || '').trim(); if (!prod) e.push('product is empty'); if (!reg) e.push('region is empty');
      var qs = (r.qty || '').trim(), q = 0; if (/^[+-]?\d+$/.test(qs)) { q = parseInt(qs, 10); if (!(q > 0)) e.push('qty must be > 0'); } else e.push('qty must be an integer');
      var ps = (r.unit_price || '').trim().replace(',', '.'), c = 0; if (ps !== '' && isFinite(Number(ps))) { c = Math.round(Number(ps) * 100); if (!(c > 0)) e.push('unit_price must be > 0'); } else e.push('unit_price must be a number');
      if (e.length) bad.push({ line: r._ln, errors: e }); else rows.push({ date: d, product: prod, region: reg, qty: q, cents: q * c });
    });
    return { rows: rows, bad: bad };
  }
  function summarize(text, week) {
    var p = parseRows(text), rows = p.rows, bad = p.bad, total = rows.length + bad.length;
    if (!total || !rows.length) return { status: 'empty', rejected: bad };
    if (bad.length / total > MAX_BAD) return { status: 'review', rejected: bad, reason: bad.length + ' of ' + total + ' rows are invalid (limit ' + Math.floor(MAX_BAD * 100) + '%)' };
    var mx = Math.max.apply(null, rows.map(function (r) { return r.date; }));
    week = week || weekOf(mx);
    var prevWeek = weekOf(mondayOf(week) - 7 * DAY);
    var cur = rows.filter(function (r) { return weekOf(r.date) === week; }), prev = rows.filter(function (r) { return weekOf(r.date) === prevWeek; });
    if (!cur.length) return { status: 'empty', rejected: bad, reason: 'no rows in ' + week };
    var sum = function (a) { return a.reduce(function (s, r) { return s + r.cents; }, 0); }, rev = sum(cur), prevRev = sum(prev);
    function group(key) {
      var g = {}, order = [];
      cur.forEach(function (r) { if (!g[r[key]]) { g[r[key]] = { cents: 0, units: 0 }; order.push(r[key]); } g[r[key]].cents += r.cents; g[r[key]].units += r.qty; });
      return order.map(function (k) { return { k: k, cents: g[k].cents, units: g[k].units }; }).sort(function (a, b) { return b.cents - a.cents || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0); });
    }
    var mon = mondayOf(week), daily = [], zero = [], i;
    for (i = 0; i < 7; i++) { var c = sum(cur.filter(function (r) { return r.date === mon + i * DAY; })); daily.push(c); if (c === 0 && i < 5) { var d = new Date(mon + i * DAY); zero.push(d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())); } }
    return { status: 'ok', week: week, revenue: rev / 100, units: cur.reduce(function (s, r) { return s + r.qty; }, 0), orders: cur.length, prev_revenue: prevRev / 100,
      delta_pct: prevRev ? Math.round((rev - prevRev) / prevRev * 1000) / 10 : null,
      top: group('product').slice(0, 3).map(function (z) { return { product: z.k, revenue: z.cents / 100, units: z.units }; }),
      regions: group('region').map(function (z) { return { region: z.k, revenue: z.cents / 100, share: Math.round(z.cents / rev * 1000) / 10 }; }),
      daily: daily.map(function (c) { return c / 100; }), zero_days: zero, rejected: bad };
  }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { s: null }; },
    verify: function (expect, ctx) { return JSON.stringify(ctx.s) === JSON.stringify(expect); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.csv = b.csv; ctx.week = (b.week || '').trim() || null; ctx.s = null; return { out: { file: 'vendas.csv', bytes: b.csv.length, week: ctx.week || 'latest in file' }, ms: 10 }; },
      parse: function (i, ctx) { var p = parseRows(ctx.csv); return { out: { valid_rows: p.rows.length, rejected: p.bad }, ms: 4 }; },
      gate: function (i, ctx) {
        var s = summarize(ctx.csv, ctx.week); ctx.s = s;
        return { out: { status: s.status, reason: s.reason || null }, branch: s.status === 'ok' ? 'ok' : 'stop', ms: 2 };
      },
      stop: function (i, ctx) { return { out: { status: ctx.s.status, reason: ctx.s.reason || 'no data', pdf: null }, ms: 1, end: true }; },
      aggregate: function (i, ctx) { var s = ctx.s; return { out: { week: s.week, revenue: s.revenue, units: s.units, orders: s.orders, top: s.top, regions: s.regions }, ms: 6 }; },
      compare: function (i, ctx) { var s = ctx.s; return { out: { prev_revenue: s.prev_revenue, delta_pct: s.delta_pct, zero_days: s.zero_days }, ms: 2 }; },
      pdf: function (i, ctx) { return { out: { file: 'weekly_' + ctx.s.week + '.pdf', pages: 1, note: 'built by reportlab in the Python version' }, ms: 180 }; },
      save: function (i, ctx) { return { out: { saved: 'output/weekly_' + ctx.s.week + '.pdf', summary: 'output/summary.json' }, ms: 5, end: true }; }
    },
    outputs: function (r) {
      var s = r.ctx.s, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (s.status !== 'ok') return [{ kind: 'error', title: s.status === 'review' ? { pt: 'Sem relatório: dados para revisar', en: 'No report: data needs review' } : { pt: 'Sem relatório: sem dados', en: 'No report: no data' }, text: { pt: 'Nenhum PDF foi gerado. ' + (s.reason || 'O arquivo não tem linhas válidas.') + (s.rejected.length ? ' Linhas recusadas: ' + s.rejected.map(function (x) { return x.line; }).join(', ') + '.' : ''), en: 'No PDF was generated. ' + (s.reason || 'The file has no valid rows.') + (s.rejected.length ? ' Rejected lines: ' + s.rejected.map(function (x) { return x.line; }).join(', ') + '.' : '') } }];
      o.push({ kind: 'card', title: { pt: 'Página 1 do PDF: ' + s.week, en: 'PDF page 1: ' + s.week }, rows: [[{ pt: 'Faturamento', en: 'Revenue' }, brl(Math.round(s.revenue * 100))], [{ pt: 'Unidades / pedidos', en: 'Units / orders' }, s.units + ' / ' + s.orders], [{ pt: 'Variação', en: 'Change' }, s.delta_pct === null ? 'n/a' : (s.delta_pct > 0 ? '+' : '') + s.delta_pct.toFixed(1) + '% vs ' + brl(Math.round(s.prev_revenue * 100)), s.delta_pct !== null && s.delta_pct < 0 ? 'b-warm' : 'b-ok'], [{ pt: 'Faturamento por dia (seg-dom)', en: 'Daily revenue (Mon-Sun)' }, s.daily.map(function (v) { return Math.round(v); }).join(' · ')], [{ pt: 'Dias úteis sem venda', en: 'Weekdays with no sales' }, s.zero_days.length ? s.zero_days.join(', ') : { pt: 'nenhum', en: 'none' }], [{ pt: 'Linhas recusadas', en: 'Rejected rows' }, s.rejected.length ? s.rejected.map(function (x) { return x.line; }).join(', ') : { pt: 'nenhuma', en: 'none' }]] });
      o.push({ kind: 'sheet', title: { pt: 'Top produtos', en: 'Top products' }, cols: ['product', 'revenue', 'units'], rows: s.top.map(function (z) { return [z.product, brl(Math.round(z.revenue * 100)), String(z.units)]; }) });
      o.push({ kind: 'sheet', title: { pt: 'Por região', en: 'By region' }, cols: ['region', 'revenue', 'share'], rows: s.regions.map(function (z) { return [z.region, brl(Math.round(z.revenue * 100)), z.share + '%']; }) });
      return o;
    }
  };
})();
