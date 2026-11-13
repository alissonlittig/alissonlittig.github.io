/* Porta fiel de scraper.py (parse_page, robots, crawl, report, render_md) para JavaScript. As 3 páginas abaixo são cópias salvas de books.toscrape.com (site de prática): a demo NÃO acessa a internet.
   O parser é por expressão regular, igual ao Python: serve para este layout conhecido e por isso o código avisa (LayoutChanged) quando o formato muda. Conferido contra as saídas gravadas. */
(function () {
  var PAGES = /*PAGES*/;
  var RATING = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 }, DELAY = 1.0;
  function unescapeHtml(s) { return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
  function parsePage(text) {
    var re = /<article class="product_pod">([\s\S]*?)<\/article>/g, m, books = [];
    while ((m = re.exec(text))) {
      var p = m[1], t = /<h3><a href="([^"]+)" title="([^"]*)"/.exec(p), pr = /class="price_color">[^\d]*([\d.]+)</.exec(p), ra = /class="star-rating (One|Two|Three|Four|Five)"/.exec(p);
      if (!(t && pr && ra)) throw new Error('a product block is missing title, price or rating');
      books.push({ title: unescapeHtml(t[2]), url: t[1], price: parseFloat(pr[1]), rating: RATING[ra[1]], in_stock: p.indexOf('In stock') >= 0 });
    }
    if (!books.length) throw new Error('no product_pod blocks found');
    var n = /<li class="next"><a href="([^"]+)"/.exec(text); return { books: books, next: n ? n[1] : null };
  }
  function f2(x) { return x.toFixed(2); }
  function r2(x) { return Number(x.toFixed(2)); }
  function cmp(a, b) { return a.price - b.price || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0); }
  function report(books, pages) {
    if (!books.length) return null;
    var pr = books.map(function (b) { return b.price; }).sort(function (a, b) { return a - b; }), sum = pr.reduce(function (s, x) { return s + x; }, 0), mid = pr.length >> 1;
    var med = pr.length % 2 ? pr[mid] : (pr[mid - 1] + pr[mid]) / 2, by = {}, k;
    for (k = 1; k <= 5; k++) by[String(k)] = books.filter(function (b) { return b.rating === k; }).length;
    var sorted = books.slice().sort(cmp), good = books.filter(function (b) { return b.rating >= 4 && b.in_stock; }).sort(cmp).slice(0, 3);
    return { books: books.length, pages: pages, avg: r2(sum / pr.length), median: r2(med), min: sorted[0].title + ' (' + f2(pr[0]) + ')', max: sorted[sorted.length - 1].title + ' (' + f2(pr[pr.length - 1]) + ')', by_rating: by, out_of_stock: books.filter(function (b) { return !b.in_stock; }).length, best_value: good.map(function (b) { return [b.title, b.price, b.rating]; }) };
  }
  function renderMd(status, error, rep) {
    var L = [{ ok: '# Book price report', partial: '# Book price report (PARTIAL)', blocked: '# Book price report (NOT COLLECTED)' }[status], ''];
    if (error) L.push('> ' + error, '');
    if (rep) {
      L.push(rep.books + ' books from ' + rep.pages + ' page(s). Average £' + f2(rep.avg) + ', median £' + f2(rep.median) + '.', 'Cheapest: ' + rep.min + '. Most expensive: ' + rep.max + '.',
        'Ratings 1-5: ' + [1, 2, 3, 4, 5].map(function (k) { return rep.by_rating[String(k)]; }).join(' / ') + '. Out of stock: ' + rep.out_of_stock + '.', '', 'Best value (4+ stars, in stock, cheapest):');
      rep.best_value.forEach(function (x) { L.push('- ' + x[0] + ' · £' + f2(x[1]) + ' · ' + x[2] + ' stars'); });
    }
    return L.join('\n');
  }
  function fetchPage(ctx, name) { // o "site" simulado: fixtures + o estado escolhido
    ctx.http.push(name);
    if (name === 'page-2.html' && ctx.site === 'forbidden') return { st: 403, text: '' };
    if (!PAGES[name]) return { st: 404, text: '' };
    return { st: 200, text: name === 'page-2.html' && ctx.site === 'layout' ? PAGES[name].split('product_pod').join('book-card') : PAGES[name] };
  }
  function finish(ctx, status, error) { var rep = report(ctx.books, ctx.pages); ctx.res = { status: status, error: error, requests: ctx.requests, sleeps: ctx.sleeps, http: ctx.http, report: rep, markdown: renderMd(status, error, rep), csv_rows: ctx.books.length }; return ctx.res; }
  window.DEMO = {
    start: 'start',
    init: function () { return {}; },
    verify: function (e, ctx) { var r = ctx.res; return !!r && r.status === e.status && r.error === e.error && JSON.stringify(r.requests) === JSON.stringify(e.requests) && JSON.stringify(r.sleeps) === JSON.stringify(e.sleeps) && JSON.stringify(r.http) === JSON.stringify(e.http) && JSON.stringify(r.report) === JSON.stringify(e.report) && r.markdown === e.markdown && r.csv_rows === e.csv_rows; },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.max = Math.max(1, Math.min(3, parseInt(b.pages, 10) || 1)); ctx.site = b.site; ctx.books = []; ctx.seen = {}; ctx.pages = 0; ctx.requests = []; ctx.sleeps = []; ctx.http = []; ctx.url = 'page-1.html'; ctx.res = null; return { out: { target: 'books.toscrape.com/catalogue/', max_pages: ctx.max, user_agent: 'portfolio-demo-scraper/1.0 (learning project)' }, ms: 4 }; },
      robots: function (i, ctx) {
        ctx.http.push('robots.txt');
        if (ctx.site === 'robots') { finish(ctx, 'blocked', 'robots.txt disallows this path'); return { out: { 'robots.txt': '200', rule: 'Disallow: /catalogue/', allowed: false }, branch: 'no', ms: 150 }; }
        return { out: { 'robots.txt': '404', allowed: true, note: 'no robots.txt = no declared restriction' }, branch: 'ok', ms: 150 };
      },
      blocked: function (i, ctx) { return { out: { status: ctx.res.status, error: ctx.res.error }, ms: 1, end: true }; },
      fetch: function (i, ctx) {
        var r = fetchPage(ctx, ctx.url); ctx.requests.push(ctx.url); ctx.text = r.text;
        if (r.st !== 200) { finish(ctx, 'partial', 'HTTP ' + r.st + ' on ' + ctx.url + ': stopped, not retried'); return { out: { url: ctx.url, status: r.st }, branch: 'err', ms: 180 }; }
        return { out: { url: ctx.url, status: 200, bytes: r.text.length }, branch: 'ok', ms: 220 };
      },
      parse: function (i, ctx) {
        var p; try { p = parsePage(ctx.text); } catch (e) { finish(ctx, 'partial', 'layout changed on ' + ctx.url + ': ' + e.message); return { out: { error: e.message }, branch: 'layout', ms: 3 }; }
        ctx.pages += 1; var added = 0; p.books.forEach(function (b) { if (!ctx.seen[b.url]) { ctx.seen[b.url] = 1; ctx.books.push(b); added++; } }); ctx.next = p.next;
        return { out: { books_on_page: p.books.length, new: added, total: ctx.books.length, next: p.next }, branch: 'ok', ms: 8 };
      },
      next: function (i, ctx) {
        if (ctx.next && ctx.pages < ctx.max) { ctx.url = ctx.next; return { out: { next: ctx.next }, branch: 'more', ms: 1 }; }
        return { out: { done: true, pages: ctx.pages }, branch: 'done', ms: 1 };
      },
      wait: function (i, ctx) { ctx.sleeps.push(DELAY); return { out: { slept_s: DELAY }, ms: DELAY * 1000 }; },
      report: function (i, ctx) { finish(ctx, 'ok', null); return { out: { books: ctx.res.report.books, avg: ctx.res.report.avg, median: ctx.res.report.median }, ms: 6, end: true }; },
      partial: function (i, ctx) { return { out: { status: 'partial', error: ctx.res.error, books_kept: ctx.books.length }, ms: 6, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var res = c.res;
      if (res.status === 'blocked') o.push({ kind: 'error', title: { pt: 'robots.txt proíbe: nenhuma página pedida', en: 'robots.txt disallows: no page requested' }, text: { pt: 'O robô leu o robots.txt, viu a regra Disallow e parou. É assim que um scraper educado se comporta.', en: 'The bot read robots.txt, saw the Disallow rule and stopped. This is how a polite scraper behaves.' } });
      if (res.status === 'partial') o.push({ kind: 'error', title: { pt: 'Relatório PARCIAL (não é silencioso)', en: 'PARTIAL report (not silent)' }, text: { pt: res.error + '. O relatório sai marcado como parcial com o que já foi coletado, em vez de números errados sem aviso.', en: res.error + '. The report is marked partial with what was already collected instead of silently wrong numbers.' } });
      o.push({ kind: 'email', title: { pt: 'Relatório (report.md)', en: 'Report (report.md)' }, subject: 'report.md', to: 'output/', text: res.markdown });
      if (c.books.length) o.push({ kind: 'sheet', title: { pt: 'books.csv (primeiras 8 linhas)', en: 'books.csv (first 8 rows)' }, cols: ['title', 'price_gbp', 'rating', 'in_stock'], rows: c.books.slice(0, 8).map(function (b) { return [b.title, b.price, b.rating, b.in_stock]; }) });
      o.push({ title: { pt: 'Requisições feitas', en: 'Requests made' }, json: { http: res.http, pauses_s: res.sleeps } });
      return o;
    }
  };
})();
