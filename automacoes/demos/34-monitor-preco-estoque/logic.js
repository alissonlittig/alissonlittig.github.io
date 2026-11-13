/* Porta fiel de monitor.py (parse_page, check) para JavaScript. A loja, o HTTP e o histórico são simulados na memória da página; a lógica foi conferida contra as respostas reais do Python. */
(function () {
  var PRICE_RE = /<span class="price"[^>]*>\s*R\$\s*([\d.]+,\d{2})\s*<\/span>/, STOCK_RE = /<span class="stock" data-status="(in|out)"/;
  var WATCH = {"notebook": {"id": "notebook", "name": "Notebook Aurora 14", "target": 3500.0, "min_drop_pct": 10}, "fone": {"id": "fone", "name": "Fone Pulso BT", "target": 299.0, "min_drop_pct": 15}, "cafe": {"id": "cafe", "name": "Cafeteira Brasa", "target": 450.0, "min_drop_pct": 10}}, SEED = {"notebook": {"price": 4299.0, "in_stock": true, "fails": 0, "layout_alerted": false, "below_target": false}, "fone": {"price": 349.9, "in_stock": false, "fails": 0, "layout_alerted": false, "below_target": false}, "cafe": {"price": 589.0, "in_stock": true, "fails": 0, "layout_alerted": false, "below_target": false}};
  function brl(p) { var s = p.toFixed(2), a = s.split('.'), i = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return i + ',' + a[1]; }
  function page(name, price, stock) { return '<html><body><h1>' + name + '</h1><span class="price">R$ ' + price + '</span><span class="stock" data-status="' + stock + '">' + (stock === 'in' ? 'Em estoque' : 'Esgotado') + '</span></body></html>'; }
  function parse(html) { var m = PRICE_RE.exec(html), s = STOCK_RE.exec(html); if (!m || !s) return null; return { price: parseFloat(m[1].replace(/\./g, '').replace(',', '.')), in_stock: s[1] === 'in' }; }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { state: JSON.parse(JSON.stringify(SEED)), alerts: [], log: [] }; },
    verify: function (expect, ctx) { var st = ctx.state[expect.id]; return JSON.stringify(ctx.alerts) === JSON.stringify(expect.alerts) && st.price === expect.price && st.fails === expect.fails; },
    nodes: {
      start: function (i, ctx) {
        var b = i.body, w = WATCH[b.product]; ctx.w = w; ctx.st = ctx.state[w.id]; ctx.alerts = []; ctx.mode = b.page;
        ctx.html = b.page === 'layout' ? '<html><h1>' + w.name + '</h1><div class=\'p\'>' + b.price + '</div></html>' : page(w.name, b.price, b.stock);
        return { out: { url: 'http://shop.example/' + w.id, target: w.target, min_drop_pct: w.min_drop_pct }, ms: 5 };
      },
      fetch: function (i, ctx) {
        if (ctx.mode === '500') {
          ctx.st.fails += 1; if (ctx.st.fails === 3) ctx.alerts.push({ kind: 'source_down', text: ctx.w.name + ': source failed ' + ctx.st.fails + ' times in a row (HTTP Error 500). Last known price kept.' });
          return { out: { error: 'HTTP 500', consecutive_failures: ctx.st.fails }, branch: 'err', ms: 3000 };
        }
        ctx.st.fails = 0; return { out: { status: 200, bytes: ctx.html.length }, branch: 'ok', ms: 140 };
      },
      down: function (i, ctx) { return { out: { alerts: ctx.alerts, note: ctx.alerts.length ? 'alert after 3 failures' : 'silent: ' + ctx.st.fails + ' of 3 failures' }, ms: 2, end: true }; },
      parse: function (i, ctx) {
        var o = parse(ctx.html);
        if (!o) {
          if (!ctx.st.layout_alerted) { ctx.st.layout_alerted = true; ctx.alerts.push({ kind: 'layout_changed', text: ctx.w.name + ': price or stock element not found (layout changed?). Nothing was saved; fix the parser.' }); }
          return { out: { error: 'ParseError' }, branch: 'bad', ms: 1 };
        }
        ctx.st.layout_alerted = false; ctx.obs = o; return { out: o, branch: 'ok', ms: 1 };
      },
      layout: function (i, ctx) { return { out: { alerts: ctx.alerts, saved: false }, ms: 2, end: true }; },
      guard: function (i, ctx) {
        var p = ctx.obs.price, prev = ctx.st.price;
        if (prev !== null && (p > prev * 1.5 || p < prev * 0.3)) { ctx.alerts = [{ kind: 'suspicious', text: ctx.w.name + ': price jumped from R$ ' + brl(prev) + ' to R$ ' + brl(p) + '. Not saved until it repeats or a person confirms.' }]; return { out: { prev: prev, now: p }, branch: 'sus', ms: 1 }; }
        return { out: { prev: prev, now: p }, branch: 'ok', ms: 1 };
      },
      suspect: function (i, ctx) { return { out: { alerts: ctx.alerts, saved: false }, ms: 2, end: true }; },
      compare: function (i, ctx) {
        var o = ctx.obs, p = o.price, st = ctx.st, w = ctx.w, prev = st.price;
        if (prev === null) { st.price = p; st.in_stock = o.in_stock; st.below_target = p <= w.target; return { out: { baseline: true }, branch: 'quiet', ms: 3 }; }
        var drop = (prev - p) / prev * 100;
        if (drop >= w.min_drop_pct) ctx.alerts.push({ kind: 'drop', text: w.name + ': R$ ' + brl(prev) + ' -> R$ ' + brl(p) + ' (-' + drop.toFixed(1) + '%)' });
        var below = p <= w.target;
        if (below && !st.below_target) ctx.alerts.push({ kind: 'target', text: w.name + ': R$ ' + brl(p) + ' reached the target of R$ ' + brl(w.target) });
        if (o.in_stock && st.in_stock === false) ctx.alerts.push({ kind: 'restock', text: w.name + ': back in stock at R$ ' + brl(p) });
        st.price = p; st.in_stock = o.in_stock; st.below_target = below;
        return { out: { drop_pct: Math.round(drop * 10) / 10, below_target: below, alerts: ctx.alerts.length }, branch: ctx.alerts.length ? 'alert' : 'quiet', ms: 3 };
      },
      notify: function (i, ctx) { return { out: { alerts: ctx.alerts }, ms: 20, end: true }; },
      quiet: function (i, ctx) { return { out: { alerts: [], saved: { price: ctx.st.price, in_stock: ctx.st.in_stock } }, ms: 2, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var cls = { drop: 'b-ok', target: 'b-ok', restock: 'b-ok', source_down: 'b-warm', layout_changed: 'b-warm', suspicious: 'b-warm' };
      if (c.alerts.length) c.alerts.forEach(function (a) { o.push({ kind: 'card', title: { pt: 'Alerta (arquivo local, nada é enviado): ' + a.kind, en: 'Alert (local file, nothing is sent): ' + a.kind }, rows: [[{ pt: 'Texto', en: 'Text' }, a.text, cls[a.kind]]] }); });
      else o.push({ title: { pt: 'Sem alerta', en: 'No alert' }, skipped: { pt: c.st.price === null ? 'Nada salvo.' : 'Nada que valha um aviso: o preço ficou salvo no histórico.', en: c.st.price === null ? 'Nothing saved.' : 'Nothing worth an alert: the price was saved to history.' } });
      var rows = Object.keys(c.state).map(function (k) { var s = c.state[k]; return [WATCH[k].name, s.price === null ? '-' : 'R$ ' + brl(s.price), s.in_stock ? 'in' : 'out', 'R$ ' + brl(WATCH[k].target), String(s.fails)]; });
      o.push({ kind: 'sheet', title: { pt: 'Histórico (memória desta página)', en: 'History (this page memory)' }, cols: ['product', 'last price', 'stock', 'target', 'fails'], rows: rows });
      return o;
    }
  };
})();
