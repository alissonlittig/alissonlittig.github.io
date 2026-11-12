/* Porta fiel de pipeline.py (run) para JavaScript. pandas e SQLite viram arrays na memória da página; a lógica foi conferida contra os resumos reais gravados. */
(function () {
  var COLS = ['order_id', 'customer_id', 'sku', 'qty', 'unit_price', 'order_date', 'status'], STATUS = ['paid', 'shipped', 'refunded'], MAXREJ = 0.25, MINVOL = 0.5;
  function pyList(a) { return '[' + a.map(function (x) { return "'" + x + "'"; }).join(', ') + ']'; }
  function r0(x) { var r = Math.round(x); if (Math.abs(x % 1) === 0.5 && r % 2) r -= 1; return r; } // arredondamento do Python (par)
  function isFloat(s) { return /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/.test(s); }
  function parse(t) { var L = t.split(/\r?\n/).filter(function (l) { return l.length; }), h = L[0].split(','); return { cols: h, rows: L.slice(1).map(function (l) { var c = l.split(','), r = {}; h.forEach(function (k, i) { r[k] = c[i] === undefined ? '' : c[i]; }); return r; }) }; }
  function rowError(r, day, seen) {
    if (!r.order_id.trim()) return 'missing order_id';
    if (seen[r.order_id]) return 'duplicate order_id';
    if (!(/^\d+$/.test(r.qty) && parseInt(r.qty, 10) > 0)) return 'qty must be an integer > 0';
    if (!(isFloat(r.unit_price) && parseFloat(r.unit_price) > 0)) return 'unit_price must be > 0';
    if (r.order_date !== day) return 'order_date is not the run date';
    if (STATUS.indexOf(r.status) < 0) return 'unknown status';
    return null;
  }
  function finish(ctx, code, status, alert) { ctx.S.status = status; ctx.S.exit = code; if (alert) { ctx.S.alert = alert; ctx.alerts.push({ day: ctx.day, status: status, alert: alert }); } }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { days: {}, alerts: [], S: null, df: null, rej: [] }; },
    verify: function (expect, ctx) {
      var S = ctx.S, e = expect, k;
      var a = { steps: S.steps, status: S.status, exit: S.exit, rows_in: S.rows_in, rows_ok: S.rows_ok, rows_rejected: S.rows_rejected, rejected: S.rejected, kpi: S.kpi, wh: S.warehouse_rows_for_day, alert: S.alert, warnings: S.warnings };
      var b = { steps: e.steps, status: e.status, exit: e.exit, rows_in: e.rows_in, rows_ok: e.rows_ok, rows_rejected: e.rows_rejected, rejected: e.rejected, kpi: e.kpi, wh: e.warehouse_rows_for_day, alert: e.alert, warnings: e.warnings };
      return JSON.stringify(a) === JSON.stringify(b);
    },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.day = b.run_date; ctx.csv = b.source === 'missing' ? null : b.csv; ctx.S = { run_date: ctx.day, steps: [] }; return { out: { cron: '06:30', run_date: ctx.day, file: 'orders_' + ctx.day + '.csv', exists: ctx.csv !== null }, ms: 4 }; },
      extract: function (i, ctx) {
        if (ctx.csv === null) { ctx.S.steps.push('extract: source file not found'); finish(ctx, 3, 'no_source', 'orders_' + ctx.day + ".csv did not arrive; nothing loaded, yesterday's numbers stay"); return { out: { error: 'FileNotFound' }, branch: 'missing', ms: 2 }; }
        ctx.df = parse(ctx.csv); ctx.S.steps.push('extract: ' + ctx.df.rows.length + ' rows read'); return { out: { rows: ctx.df.rows.length, columns: ctx.df.cols }, branch: 'ok', ms: 14 };
      },
      schema: function (i, ctx) {
        var miss = COLS.filter(function (c) { return ctx.df.cols.indexOf(c) < 0; }), extra = ctx.df.cols.filter(function (c) { return COLS.indexOf(c) < 0; });
        if (miss.length || extra.length) { ctx.S.steps.push('schema: missing ' + pyList(miss) + ', unexpected ' + pyList(extra)); ctx.S.rows_in = ctx.df.rows.length; finish(ctx, 1, 'halted', 'schema changed (missing ' + pyList(miss) + ', unexpected ' + pyList(extra) + '); nothing loaded'); return { out: { missing: miss, unexpected: extra }, branch: 'halt', ms: 1 }; }
        ctx.S.steps.push('schema: ok');
        if (!ctx.df.rows.length) { finish(ctx, 1, 'halted', 'file has a header but no rows; nothing loaded'); return { out: { rows: 0 }, branch: 'halt', ms: 1 }; }
        return { out: { schema: 'ok' }, branch: 'ok', ms: 1 };
      },
      validate: function (i, ctx) {
        var seen = {}, good = [], rej = [];
        ctx.df.rows.forEach(function (r, ix) { var e = rowError(r, ctx.day, seen); if (e) rej.push({ line: ix + 2, reason: e }); else { seen[r.order_id] = 1; good.push(r); } });
        ctx.good = good; ctx.S.rows_in = ctx.df.rows.length; ctx.S.rows_ok = good.length; ctx.S.rows_rejected = rej.length; ctx.S.rejected = rej; ctx.rej = rej;
        ctx.S.steps.push('validate: ' + good.length + ' ok, ' + rej.length + ' rejected'); return { out: { ok: good.length, rejected: rej }, ms: 22 };
      },
      gate: function (i, ctx) {
        var S = ctx.S, rate = S.rows_rejected / S.rows_in, pct = r0(rate * 100) + '%';
        if (rate > MAXREJ) { S.steps.push('quality gate: ' + pct + ' rejected > ' + r0(MAXREJ * 100) + '%, halting'); finish(ctx, 1, 'halted', S.rows_rejected + ' of ' + S.rows_in + ' rows rejected (' + pct + ' > ' + r0(MAXREJ * 100) + '%); nothing loaded, check the source system'); return { out: { reject_rate: pct, limit: '25%' }, branch: 'halt', ms: 1 }; }
        S.steps.push('quality gate: ' + pct + ' rejected, within ' + r0(MAXREJ * 100) + '%'); return { out: { reject_rate: pct, limit: '25%' }, branch: 'ok', ms: 1 };
      },
      load: function (i, ctx) {
        var S = ctx.S, good = ctx.good, day = ctx.day, warns = [], prevDays = Object.keys(ctx.days).filter(function (d) { return d !== day; });
        var prev = prevDays.length ? prevDays.reduce(function (a, d) { return a + ctx.days[d].loaded; }, 0) / prevDays.length : null;
        if (prev && good.length < MINVOL * prev) warns.push('volume drop: ' + good.length + ' good rows vs average ' + r0(prev) + ' on earlier days');
        if (ctx.rej.length) warns.push(ctx.rej.length + ' rows quarantined');
        var rev = 0, n = 0;
        good.forEach(function (r) { if (r.status === 'paid' || r.status === 'shipped') { rev += parseInt(r.qty, 10) * r0(parseFloat(r.unit_price) * 100); n++; } });
        var k = { orders: n, revenue_cents: rev, avg_ticket_cents: n ? Math.floor(rev / n) : 0 };
        ctx.days[day] = { loaded: good.length, kpi: k }; S.kpi = k; S.warehouse_rows_for_day = good.length;
        S.steps.push('load: day ' + day + ' replaced in one transaction, ' + good.length + ' rows'); S.warnings = warns; ctx.warns = warns;
        return { out: { replaced_day: day, rows: good.length, kpi: k, warnings: warns }, branch: warns.length ? 'warn' : 'ok', ms: 31 };
      },
      alert: function (i, ctx) {
        if (ctx.S.exit === undefined) finish(ctx, 2, 'loaded_with_warnings', ctx.warns.join('; '));
        return { out: { exit: ctx.S.exit, status: ctx.S.status, alert: ctx.S.alert }, ms: 3, end: true };
      },
      done: function (i, ctx) { finish(ctx, 0, 'loaded'); return { out: { exit: 0, status: 'loaded' }, ms: 2, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, S = c.S, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var loaded = S.exit === 0 || S.exit === 2;
      if (S.alert && S.exit !== 2) o.push({ kind: 'error', title: { pt: 'Alerta · nada foi carregado (saída ' + S.exit + ')', en: 'Alert · nothing was loaded (exit ' + S.exit + ')' }, text: S.alert });
      else if (S.exit === 2) o.push({ kind: 'error', title: { pt: 'Carregado com avisos (saída 2)', en: 'Loaded with warnings (exit 2)' }, text: S.alert });
      var rows = [[{ pt: 'Dia', en: 'Day' }, S.run_date], [{ pt: 'Resultado', en: 'Result' }, S.status, S.exit === 0 ? 'b-ok' : 'b-warm']];
      if (S.rows_in !== undefined) rows.push([{ pt: 'Linhas lidas / boas / rejeitadas', en: 'Rows read / good / rejected' }, S.rows_in + ' / ' + (S.rows_ok === undefined ? '-' : S.rows_ok) + ' / ' + (S.rows_rejected === undefined ? '-' : S.rows_rejected)]);
      if (loaded) rows.push([{ pt: 'Receita do dia', en: 'Day revenue' }, 'US$ ' + (S.kpi.revenue_cents / 100).toFixed(2) + ' · ' + S.kpi.orders + ' pedidos/orders'], [{ pt: 'Ticket médio', en: 'Average ticket' }, 'US$ ' + (S.kpi.avg_ticket_cents / 100).toFixed(2)]);
      o.push({ kind: 'card', title: { pt: 'Resumo da execução', en: 'Run summary' }, rows: rows });
      if (S.rejected && S.rejected.length) o.push({ kind: 'sheet', title: { pt: 'Quarentena · linhas rejeitadas', en: 'Quarantine · rejected rows' }, cols: ['line', 'reason'], rows: S.rejected.map(function (x) { return [x.line, x.reason]; }) });
      var ds = Object.keys(c.days).sort();
      o.push({ kind: 'sheet', title: { pt: 'Tabela daily_kpi (memória desta página)', en: 'daily_kpi table (this page memory)' }, cols: ['day', 'orders', 'revenue', 'avg ticket', 'rows'], rows: ds.length ? ds.map(function (d) { var x = c.days[d]; return [d, x.kpi.orders, (x.kpi.revenue_cents / 100).toFixed(2), (x.kpi.avg_ticket_cents / 100).toFixed(2), x.loaded]; }) : [['-', '-', '-', '-', '-']] });
      o.push({ title: { pt: 'Passos do pipeline', en: 'Pipeline steps' }, json: S.steps });
      return o;
    }
  };
})();
