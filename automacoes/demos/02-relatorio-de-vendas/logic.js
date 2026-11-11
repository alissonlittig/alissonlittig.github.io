/* Nós Code = mesmo código do workflow.json (adaptado de $input/$() para argumentos e ctx). */
(function () {
  var CFG = { data_dir: './data', sales_file: 'sample_sales.csv', currency: 'R$', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  function parseCsv(txt) { // extractFromFile (CSV): cabeçalho vira chaves
    var lines = String(txt || '').split(/\r?\n/).filter(function (l) { return l.trim(); }); if (!lines.length) return [];
    var h = lines[0].split(',');
    return lines.slice(1).map(function (l) { var c = l.split(','), o = {}; h.forEach(function (k, i) { o[k] = c[i] != null ? c[i] : ''; }); return o; });
  }
  function summarize(cfg, rows) { // Code "Summarize day"
    var day = cfg.report_date || rows.map(function (r) { return r.date; }).sort().pop();
    var prev = new Date(day + 'T00:00:00Z'); prev.setUTCDate(prev.getUTCDate() - 1);
    var pd = prev.toISOString().slice(0, 10);
    var sum = function (d) { return rows.filter(function (r) { return r.date === d; }).reduce(function (a, r) { return a + Number(r.total); }, 0); };
    var today = rows.filter(function (r) { return r.date === day; });
    if (!today.length) throw new Error('No sales for ' + day);
    var by = function (k) { var m = {}; today.forEach(function (r) { m[r[k]] = (m[r[k]] || 0) + Number(r.total); }); return Object.keys(m).map(function (x) { return [x, m[x]]; }).sort(function (a, b) { return b[1] - a[1]; }); };
    var total = sum(day), prevTotal = sum(pd), n = today.length;
    var money = function (v) { return cfg.currency + ' ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
    var delta = prevTotal ? ((total - prevTotal) / prevTotal * 100) : null;
    var dtxt = delta === null ? 'n/a' : (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
    var top = by('product').slice(0, 3), pay = by('payment'), store = by('store');
    var li = function (a) { return a.map(function (p) { return '- ' + p[0] + ': ' + money(p[1]); }).join('\n'); };
    var md = '# Daily sales report - ' + day + '\n\n- Revenue: **' + money(total) + '** (' + n + ' sales, avg ticket ' + money(total / n) + ')\n- Vs ' + pd + ': ' + dtxt + ' (' + money(prevTotal) + ')\n\n## Top products\n' + li(top) + '\n\n## By payment\n' + li(pay) + '\n\n## By store\n' + li(store) + '\n';
    var text = 'Sales ' + day + ': ' + money(total) + ' | ' + n + ' sales | ticket ' + money(total / n) + ' | vs prev day ' + dtxt + ' | top: ' + top[0][0];
    return { json: { day: day, total: total, n: n, text: text }, md: md, kpi: { revenue: money(total), avg: money(total / n), delta: dtxt, prev: money(prevTotal), pd: pd }, top: top.map(function (p) { return [p[0], money(p[1])]; }), pay: pay.map(function (p) { return [p[0], money(p[1])]; }), store: store.map(function (p) { return [p[0], money(p[1])]; }) };
  }
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'trigger', summarize: summarize, parseCsv: parseCsv,
    init: function () { return { files: {} }; },
    nodes: {
      trigger: function (i, ctx) { ctx.form = i.body; ctx.rep = null; ctx.rows = []; return { out: { timestamp: new Date().toISOString(), mode: 'schedule 20:00' }, ms: 4 }; },
      config: function (i, ctx) { var o = copy(CFG); o.report_date = ctx.form.report_date || ''; return { out: o, ms: 3 }; },
      read: function (i, ctx) { var n = String(ctx.form.csv || '').length; return { out: { fileName: CFG.sales_file, mimeType: 'text/csv', fileSize: n + ' B', binary: true }, ms: 11 }; },
      rows: function (i, ctx) { ctx.rows = parseCsv(ctx.form.csv); return { out: { _itens: ctx.rows.length, _mostrando: 2, primeiros: ctx.rows.slice(0, 2) }, ms: 8 }; },
      sum: function (i, ctx) {
        if (!ctx.rows.length) throw new Error('No sales for ' + (ctx.form.report_date || 'the file (empty CSV)'));
        var cfg = copy(CFG); cfg.report_date = ctx.form.report_date || '';
        ctx.rep = summarize(cfg, ctx.rows); return { out: ctx.rep.json, ms: 14 };
      },
      save: function (i, ctx) { ctx.files['report_' + i.day + '.md'] = ctx.rep.md; return { out: { json: i, binary: { data: { fileName: 'report_' + i.day + '.md', mimeType: 'text/markdown' } }, saved_to: CFG.data_dir + '/report_' + i.day + '.md' }, ms: 16 }; },
      notify: function (i, ctx) {
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error }, text: i.input.json.text }, ms: 0, end: true };
        return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: i.json.text } }, ms: 187, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed || !c.rep) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. Nenhum relatório foi gravado nem enviado: melhor falhar alto do que mandar um relatório vazio.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. No report was saved or sent: better to fail loudly than to send an empty report.' } }];
      var R = c.rep, nt = T('notify', r);
      var ok = nt && nt.out && nt.out.ok;
      o.push(ok ? { kind: 'telegram', title: { pt: 'Resumo no Telegram', en: 'Telegram summary' }, from: 'Relatório Loja', text: R.json.text, time: '20:00' }
        : { kind: 'error', title: { pt: 'Resumo no Telegram', en: 'Telegram summary' }, text: { pt: 'O Telegram ficou fora do ar. O relatório já estava salvo em data/report_' + R.json.day + '.md (Continue On Fail); um alerta de erro iria para a equipe.', en: 'Telegram stayed down. The report was already saved at data/report_' + R.json.day + '.md (Continue On Fail); an error alert would go to the team.' } });
      o.push({ kind: 'card', title: { pt: 'Números do dia ' + R.json.day, en: 'Numbers for ' + R.json.day }, rows: [[{ pt: 'Receita', en: 'Revenue' }, R.kpi.revenue], [{ pt: 'Vendas', en: 'Sales' }, String(R.json.n)], [{ pt: 'Ticket médio', en: 'Average ticket' }, R.kpi.avg], [{ pt: 'Contra ' + R.kpi.pd, en: 'Vs ' + R.kpi.pd }, R.kpi.delta + ' (' + R.kpi.prev + ')']] });
      o.push({ kind: 'sheet', title: { pt: 'Mais vendidos', en: 'Top products' }, cols: ['product', 'total'], rows: R.top });
      o.push({ kind: 'sheet', title: { pt: 'Por pagamento e por loja', en: 'By payment and by store' }, cols: ['grupo', 'total'], rows: R.pay.concat(R.store) });
      o.push({ kind: 'email', title: { pt: 'Arquivo gravado: report_' + R.json.day + '.md', en: 'File saved: report_' + R.json.day + '.md' }, to: 'data/report_' + R.json.day + '.md', subject: 'Daily sales report - ' + R.json.day, text: R.md });
      return o;
    },
    verify: function (exp, ctx) { var R = ctx.rep; return R && R.json.text === exp.text && exp.md_has.every(function (s) { return R.md.indexOf(s) >= 0; }); }
  };
})();
