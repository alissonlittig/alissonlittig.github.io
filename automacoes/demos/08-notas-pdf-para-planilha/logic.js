/* Nós Code = mesmo código do workflow.json. As planilhas (invoices.csv e invoices_review.csv) viram ctx.ok / ctx.review e persistem entre execuções. */
(function () {
  var CFG = { data_dir: './data', pdf_glob: './data/invoices/*.pdf', ok_file: 'invoices.csv', review_file: 'invoices_review.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var COLS = ['invoice_no', 'vendor', 'date', 'currency', 'subtotal', 'tax', 'total', 'file', 'issues'];
  function splitPdfs(txt) { // um bloco por PDF: "### arquivo.pdf" + texto
    var parts = String(txt || '').split(/^###\s*/m).filter(function (p) { return p.trim(); });
    return parts.map(function (p) { var nl = p.indexOf('\n'); return { file: (nl < 0 ? p : p.slice(0, nl)).trim(), text: nl < 0 ? '' : p.slice(nl + 1) }; }).sort(function (a, b) { return a.file < b.file ? -1 : a.file > b.file ? 1 : 0; });
  }
  function parseOne(file, text) { // Code "Parse invoice fields" (1 item)
    var num = function (s) { return s ? Number(String(s).replace(/,/g, '')) : null; };
    var t = String(text || '').replace(/\s+/g, ' ');
    var m = function (re) { var r = t.match(re); return r ? r[1] : null; };
    var vendor = m(/^(.*?)\s*Fictional sample/i) || m(/^(.{3,40}?)\s+INVOICE/i);
    var tot = t.match(/Total(?: due)?:\s*([A-Z]{3})\s*([\d,]+\.\d{2})/i);
    var inv = { file: file, vendor: vendor, invoice_no: m(/Invoice\s*(?:No\.?|#|Number)\s*[:\-]?\s*([A-Z0-9-]+)/i), date: m(/(?:Invoice date|Date)\s*:\s*(\d{4}-\d{2}-\d{2})/i), currency: tot ? tot[1] : null, subtotal: num(m(/Subtotal:\s*([\d,]+\.\d{2})/i)), tax: num(m(/(?:VAT|Tax):\s*([\d,]+\.\d{2})/i)), total: tot ? num(tot[2]) : null };
    var issues = [];
    ['vendor', 'invoice_no', 'date', 'total'].forEach(function (k) { if (!inv[k]) issues.push('missing ' + k); });
    if (inv.subtotal != null && inv.total != null && Math.abs(inv.subtotal + (inv.tax || 0) - inv.total) > 0.01) issues.push('total mismatch (' + inv.subtotal + ' + ' + (inv.tax || 0) + ' != ' + inv.total + ')');
    inv.issues = issues; return inv;
  }
  function route(rows, seenKeys) { // Code "Route: ok / review / duplicate"
    var seen = new Set(seenKeys), out = [];
    rows.forEach(function (r) {
      var key = r.vendor + '|' + r.invoice_no, rt = r.issues.length ? 'review' : 'ok';
      if (r.invoice_no && seen.has(key)) rt = 'duplicate'; else if (rt === 'ok') seen.add(key);
      var o = copy(r); o.route = rt; out.push(o);
    });
    return out;
  }
  function summarize(rows) { // Code "Summarize"
    var ok = rows.filter(function (r) { return r.route === 'ok'; }), rv = rows.filter(function (r) { return r.route === 'review'; }), du = rows.filter(function (r) { return r.route === 'duplicate'; });
    var sum = ok.reduce(function (a, r) { return a + r.total; }, 0).toFixed(2);
    var text = 'Invoices: ' + ok.length + ' booked (USD ' + sum + '), ' + rv.length + ' sent to review (' + rv.map(function (r) { return r.file + ': ' + r.issues.join(', '); }).join(' | ') + '), ' + du.length + ' duplicate skipped (already booked or in review).';
    return { text: text, booked: ok.length, review: rv.length, duplicate: du.length };
  }
  var line = function (r) { return COLS.map(function (k) { return k === 'issues' ? (r.route === 'review' ? r.issues.join('; ') : '') : String(r[k] == null ? '' : r[k]); }); };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'trigger', resetMemory: true, parseOne: parseOne, route: route, summarize: summarize,
    init: function () { return { ok: [], review: [] }; },
    nodes: {
      trigger: function (i, ctx) { ctx.form = i.body; ctx.files = splitPdfs(i.body.pdfs); ctx.parsed = []; ctx.routed = []; ctx.sum = null; return { out: { timestamp: new Date().toISOString(), mode: 'schedule weekday 08:00' }, ms: 4 }; },
      config: function () { return { out: copy(CFG), ms: 3 }; },
      read: function (i, ctx) { return { out: { _itens: ctx.files.length, arquivos: ctx.files.map(function (f) { return f.file; }) }, ms: 14 }; },
      extract: function (i, ctx) { return { out: { _itens: ctx.files.length, _mostrando: 1, primeiro: { file: ctx.files[0] ? ctx.files[0].file : '', text: ctx.files[0] ? ctx.files[0].text.replace(/\s+/g, ' ').slice(0, 140) + '...' : '' } }, ms: 61 }; },
      parse: function (i, ctx) { ctx.parsed = ctx.files.map(function (f) { return parseOne(f.file, f.text); }); return { out: { _itens: ctx.parsed.length, notas: ctx.parsed }, ms: 9 }; },
      collect: function (i, ctx) { return { out: { rows: ctx.parsed.length + ' notas' }, ms: 3 }; },
      exist: function (i, ctx) { return { out: { existing_ok: ctx.ok.length, existing_review: ctx.review.length, binary: true }, ms: 10 }; },
      route: function (i, ctx) {
        var keys = ctx.ok.concat(ctx.review).map(function (r) { return r[1] + '|' + r[0]; });
        ctx.routed = route(ctx.parsed, keys); ctx.sum = summarize(ctx.routed);
        return { out: { _itens: ctx.routed.length, rotas: ctx.routed.map(function (r) { return r.file + ' -> ' + r.route; }) }, ms: 12, next: ['switch', 'summarize'] };
      },
      switch: function (i, ctx) {
        var c = { ok: 0, review: 0, duplicate: 0 }; ctx.routed.forEach(function (r) { c[r.route]++; });
        var nx = []; if (c.ok) nx.push('a_ok'); if (c.review) nx.push('a_review'); if (c.duplicate) nx.push('skip');
        return { out: c, ms: 2, next: nx.length ? nx : ['none'] };
      },
      a_ok: function (i, ctx) { var rs = ctx.routed.filter(function (r) { return r.route === 'ok'; }); rs.forEach(function (r) { ctx.ok.push(line(r)); }); return { out: { appended_rows: rs.length, file: CFG.ok_file }, ms: 17, end: true }; },
      a_review: function (i, ctx) { var rs = ctx.routed.filter(function (r) { return r.route === 'review'; }); rs.forEach(function (r) { ctx.review.push(line(r)); }); return { out: { appended_rows: rs.length, file: CFG.review_file }, ms: 17, end: true }; },
      skip: function (i, ctx) { return { out: { skipped: ctx.routed.filter(function (r) { return r.route === 'duplicate'; }).map(function (r) { return r.file; }), writes: 0 }, ms: 1, end: true }; },
      summarize: function (i, ctx) { return { out: ctx.sum, ms: 5 }; },
      notify: function (i, ctx) {
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error } }, ms: 0, end: true };
        return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: ctx.sum.text } }, ms: 193, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], S = c.sum;
      if (r.failed || !S) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.' } }];
      var nt = T('notify', r);
      o.push(nt && nt.out && nt.out.ok ? { kind: 'telegram', title: { pt: 'Resumo no Telegram', en: 'Telegram summary' }, from: 'Contas a pagar', text: S.text, time: '08:00' }
        : { kind: 'error', title: { pt: 'Resumo no Telegram', en: 'Telegram summary' }, text: { pt: 'O Telegram ficou fora do ar. As planilhas já foram atualizadas, só o resumo não saiu (Continue On Fail).', en: 'Telegram stayed down. The sheets were already updated, only the summary did not go out (Continue On Fail).' } });
      o.push({ kind: 'card', title: { pt: 'Resultado da rodada', en: 'Run result' }, rows: [[{ pt: 'Lançadas', en: 'Booked' }, String(S.booked), 'b-hot'], [{ pt: 'Em revisão', en: 'Under review' }, String(S.review), 'b-warm'], [{ pt: 'Duplicadas ignoradas', en: 'Duplicates skipped' }, String(S.duplicate), 'b-cold']] });
      o.push({ kind: 'sheet', title: { pt: 'invoices.csv (lançadas)', en: 'invoices.csv (booked)' }, cols: COLS.slice(0, 8), rows: c.ok.length ? c.ok.map(function (x) { return x.slice(0, 8); }) : [['—', '', '', '', '', '', '', '']] });
      o.push({ kind: 'sheet', title: { pt: 'invoices_review.csv (fila de revisão, com o motivo)', en: 'invoices_review.csv (review queue, with the reason)' }, cols: COLS, rows: c.review.length ? c.review : [['—', '', '', '', '', '', '', '', '']] });
      return o;
    },
    verify: function (exp, ctx) {
      var okk = ctx.ok.map(function (x) { return x[0]; }), rv = ctx.review.map(function (x) { return x[0] + '|' + x[8]; });
      return JSON.stringify(okk) === JSON.stringify(exp.ok) && JSON.stringify(rv) === JSON.stringify(exp.review) && ctx.sum.text === exp.text;
    }
  };
})();
