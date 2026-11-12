/* Porta fiel de stock.ps1 (um arquivo por vez) para JavaScript. O XML é lido com DOMParser (no teste em Node, com um leitor mínimo equivalente); estoque e ledger ficam na memória da página; a lógica foi conferida contra as execuções reais do PowerShell. */
(function () {
  var START = { 'BOX-04': 60, 'KET-03': 8, 'MUG-02': 25, 'TEA-01': 40 };
  function tag(xml, t) { var m = new RegExp('<' + t + '>([\\s\\S]*?)</' + t + '>').exec(xml); return m ? m[1].trim() : ''; }
  function wellFormed(xml) { // navegador: DOMParser; Node (teste): pilha de tags simples
    if (typeof DOMParser !== 'undefined') { var d = new DOMParser().parseFromString(xml, 'application/xml'); return !d.getElementsByTagName('parsererror').length; }
    var st = [], re = /<(\/?)([A-Za-z][\w-]*)([^>]*?)(\/?)>/g, m, body = xml.replace(/<\?[\s\S]*?\?>/g, '');
    if (!body.trim()) return false;
    re.lastIndex = 0; while ((m = re.exec(body))) { if (m[4] === '/') continue; if (m[1]) { if (st.pop() !== m[2]) return false; } else st.push(m[2]); } return st.length === 0;
  }
  function items(xml) { var out = [], re = /<item\s+([^>]*?)\/>/g, m; while ((m = re.exec(xml))) { var a = {}, r2 = /(\w+)="([^"]*)"/g, k; while ((k = r2.exec(m[1]))) a[k[1]] = k[2]; out.push(a); } return out; }
  function res(file, inv, status, reason, lines) { return { file: file, invoice: inv, status: status, reason: reason, lines: lines || [] }; }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { stock: JSON.parse(JSON.stringify(START)), ledger: [], r: null, xml: '', moved: [] }; },
    verify: function (expect, ctx) { var r = ctx.r; return JSON.stringify(r) === JSON.stringify(expect.result) && JSON.stringify(sorted(ctx.stock)) === JSON.stringify(sorted(expect.stock_after)); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.xml = String(b.xml); ctx.file = b.file || 'invoice.xml'; ctx.r = null; return { out: { event: 'new file in inbox', file: ctx.file, bytes: ctx.xml.length }, ms: 5 }; },
      parse: function (i, ctx) {
        if (!wellFormed(ctx.xml)) { ctx.r = res(ctx.file, '', 'rejected', 'malformed XML'); return { out: { error: 'Cannot convert value to type System.Xml.XmlDocument' }, branch: 'bad', ms: 8 }; }
        return { out: { xml: 'well-formed' }, branch: 'ok', ms: 8 };
      },
      fields: function (i, ctx) {
        var x = ctx.xml, n = tag(x, 'number'), d = tag(x, 'date'), dir = tag(x, 'direction'), it = items(x);
        ctx.inv = { n: n, date: d, dir: dir, items: it };
        if (!n || !d || ['in', 'out'].indexOf(dir) < 0 || it.length === 0) { ctx.r = res(ctx.file, n, 'rejected', 'missing or invalid number/date/direction/items'); return { out: { number: n, date: d, direction: dir, items: it.length }, branch: 'bad', ms: 3 }; }
        return { out: { number: n, date: d, direction: dir, items: it.length }, branch: 'ok', ms: 3 };
      },
      dup: function (i, ctx) {
        var n = ctx.inv.n;
        if (ctx.ledger.some(function (l) { return l.invoice === n; })) { ctx.r = res(ctx.file, n, 'duplicate', 'invoice ' + n + ' already in the ledger; stock untouched'); return { out: { found_in_ledger: true }, branch: 'dup', ms: 6 }; }
        return { out: { found_in_ledger: false }, branch: 'new', ms: 6 };
      },
      duplicate: function (i, ctx) { ctx.moved.push('duplicates\\' + ctx.file); return { out: ctx.r, ms: 4, end: true }; },
      check: function (i, ctx) {
        var delta = {}, bad = null, sign = ctx.inv.dir === 'in' ? 1 : -1, it = ctx.inv.items;
        for (var k = 0; k < it.length; k++) {
          var s = it[k].sku, q = it[k].qty;
          if (!(s in ctx.stock)) { bad = 'unknown SKU ' + s; break; }
          if (!/^[+-]?\d+$/.test(q || '') || parseInt(q, 10) <= 0) { bad = 'qty for ' + s + ' must be an integer > 0'; break; }
          delta[s] = (delta[s] || 0) + sign * parseInt(q, 10);
        }
        if (!bad) Object.keys(delta).some(function (s) { if (ctx.stock[s] + delta[s] < 0) { bad = 'insufficient stock for ' + s + ' (have ' + ctx.stock[s] + ', need ' + (-delta[s]) + ')'; return true; } return false; });
        if (bad) { ctx.r = res(ctx.file, ctx.inv.n, 'rejected', bad); return { out: { error: bad, applied: false }, branch: 'bad', ms: 7 }; }
        ctx.delta = delta; return { out: { delta: delta }, branch: 'ok', ms: 7 };
      },
      apply: function (i, ctx) {
        var lines = [];
        Object.keys(ctx.delta).forEach(function (s) { var b = ctx.stock[s]; ctx.stock[s] = b + ctx.delta[s]; lines.push({ sku: s, delta: ctx.delta[s], before: b, after: ctx.stock[s] }); });
        ctx.inv.items.forEach(function (it) { ctx.ledger.push({ invoice: ctx.inv.n, date: ctx.inv.date, direction: ctx.inv.dir, sku: it.sku, qty: it.qty, unit_cost: it.unit_cost }); });
        ctx.r = res(ctx.file, ctx.inv.n, 'applied', '', lines); return { out: { stock_csv: 'rewritten', ledger_lines_added: ctx.inv.items.length }, ms: 25 };
      },
      processed: function (i, ctx) { ctx.moved.push('processed\\' + ctx.file); return { out: ctx.r, ms: 4, end: true }; },
      reject: function (i, ctx) { ctx.moved.push('rejected\\' + ctx.file + '  (+ .reason.txt)'); return { out: ctx.r, ms: 5, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, x = c.r, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (x.status === 'rejected') o.push({ kind: 'error', title: { pt: 'Nota recusada · estoque intacto', en: 'Invoice rejected · stock untouched' }, text: { pt: 'Motivo: ' + x.reason + '. O arquivo foi para rejected\\ com um .reason.txt ao lado, e nada foi aplicado (a nota é tudo ou nada). Saída 2.', en: 'Reason: ' + x.reason + '. The file went to rejected\\ with a .reason.txt beside it, and nothing was applied (an invoice is all or nothing). Exit 2.' } });
      else if (x.status === 'duplicate') o.push({ kind: 'error', title: { pt: 'Nota repetida · ignorada', en: 'Repeated invoice · ignored' }, text: { pt: x.reason + '. O arquivo foi para duplicates\\.', en: x.reason + '. The file went to duplicates\\.' } });
      else o.push({ kind: 'sheet', title: { pt: 'Nota ' + x.invoice + ' aplicada', en: 'Invoice ' + x.invoice + ' applied' }, cols: ['sku', 'change', 'before', 'after'], rows: x.lines.map(function (l) { return [l.sku, (l.delta > 0 ? '+' : '') + l.delta, l.before, l.after]; }) });
      o.push({ kind: 'sheet', title: { pt: 'stock.csv agora (memória desta página)', en: 'stock.csv now (this page memory)' }, cols: ['sku', 'on_hand'], rows: Object.keys(c.stock).sort().map(function (s) { return [s, c.stock[s]]; }) });
      o.push({ title: { pt: 'Arquivo movido para', en: 'File moved to' }, json: c.moved[c.moved.length - 1] });
      return o;
    }
  };
  function sorted(o) { var r = {}; Object.keys(o).sort().forEach(function (k) { r[k] = o[k]; }); return r; }
})();
