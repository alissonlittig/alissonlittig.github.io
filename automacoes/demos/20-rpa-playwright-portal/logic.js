/* Porte de rpa.py + portal/server.py: o "navegador" e o portal são uma máquina de estados com as mesmas regras do portal real
   (sessão que expira, erro 500, filial fora do ar). validate() e consolidate() são os do robô. */
(function () {
  var CSV = {"curitiba": "date,sku,product,qty,unit_price,channel\n2026-10-28,PRD-105,Protein bar x12,9,32.40,store\n2026-10-01,PRD-101,Cold brew 1 L,5,18.90,store\n2026-10-03,PRD-102,Oat milk 1 L,11,9.50,store\n2026-10-22,PRD-103,Granola 500 g,7,14.20,store\n2026-10-28,PRD-101,Cold brew 1 L,9,18.90,store\n2026-10-19,PRD-101,Cold brew 1 L,2,18.90,phone\n2026-10-07,PRD-104,Green tea box,9,11.00,phone\n2026-10-02,PRD-101,Cold brew 1 L,11,18.90,phone\n2026-10-06,PRD-103,Granola 500 g,11,14.20,store\n2026-10-10,PRD-102,Oat milk 1 L,7,9.50,store\n2026-10-19,PRD-102,Oat milk 1 L,9,9.50,store\n2026-10-14,PRD-102,Oat milk 1 L,6,9.50,store\n2026-10-31,PRD-105,Protein bar x12,8,32.40,store\n2026-10-25,PRD-102,Oat milk 1 L,2,9.50,online\n2026-10-09,PRD-103,Granola 500 g,2,14.20,store\n2026-10-17,PRD-105,Protein bar x12,8,32.40,store\n2026-10-28,PRD-101,Cold brew 1 L,10,18.90,store\n2026-10-13,PRD-103,Granola 500 g,12,14.20,online\n2026-10-21,PRD-106,Sparkling water x6,12,12.60,online\n2026-10-22,PRD-101,Cold brew 1 L,11,18.90,store\n2026-10-27,PRD-102,Oat milk 1 L,7,9.50,online\n2026-10-02,PRD-106,Sparkling water x6,5,12.60,store\n2026-10-19,PRD-103,Granola 500 g,4,14.20,store\n2026-10-26,PRD-104,Green tea box,4,11.00,online\n2026-10-07,PRD-103,Granola 500 g,9,14.20,store\n2026-10-06,PRD-103,Granola 500 g,5,14.20,store\n2026-10-07,PRD-103,Granola 500 g,8,14.20,store\n2026-10-09,PRD-104,Green tea box,11,11.00,store\n2026-10-06,PRD-102,Oat milk 1 L,8,9.50,store\n2026-10-14,PRD-106,Sparkling water x6,6,12.60,online\n2026-10-08,PRD-104,Green tea box,6,11.00,online\n2026-10-29,PRD-103,Granola 500 g,11,14.20,phone\n2026-10-16,PRD-105,Protein bar x12,7,32.40,store\n2026-10-16,PRD-103,Granola 500 g,9,14.20,phone\n2026-10-14,PRD-101,Cold brew 1 L,5,18.90,online\n2026-10-09,PRD-102,Oat milk 1 L,6,9.50,store\n2026-10-05,PRD-106,Sparkling water x6,6,12.60,online\n2026-10-24,PRD-106,Sparkling water x6,5,12.60,store\n", "recife": "date,sku,product,qty,unit_price,channel\n2026-10-31,PRD-102,Oat milk 1 L,6,9.50,store\n2026-10-26,PRD-105,Protein bar x12,8,32.40,online\n2026-10-02,PRD-105,Protein bar x12,11,32.40,store\n2026-10-07,PRD-103,Granola 500 g,12,14.20,store\n2026-10-15,PRD-104,Green tea box,7,11.00,store\n2026-10-14,PRD-103,Granola 500 g,-3,14.20,phone\n2026-10-04,PRD-105,Protein bar x12,4,32.40,store\n2026-10-16,PRD-102,Oat milk 1 L,5,9.50,phone\n2026-10-25,PRD-102,Oat milk 1 L,4,9.50,store\n2026-10-02,PRD-104,Green tea box,7,11.00,store\n2026-10-30,PRD-103,Granola 500 g,7,14.20,online\n2026-10-03,PRD-105,Protein bar x12,6,32.40,phone\n2026-10-05,,Green tea box,3,11.00,store\n2026-10-24,PRD-104,Green tea box,11,11.00,store\n2026-10-02,PRD-104,Green tea box,12,11.00,store\n2026-10-18,PRD-104,Green tea box,4,11.00,online\n2026-10-10,PRD-102,Oat milk 1 L,8,9.50,online\n2026-10-07,PRD-104,Green tea box,5,11.00,online\n2026-10-03,PRD-102,Oat milk 1 L,5,9.50,store\n2026-10-24,PRD-103,Granola 500 g,5,14.20,phone\n2026-09-30,PRD-103,Granola 500 g,5,14.20,store\n2026-10-30,PRD-101,Cold brew 1 L,12,18.90,store\n2026-10-30,PRD-104,Green tea box,11,11.00,online\n2026-10-11,PRD-102,Oat milk 1 L,11,9.50,store\n2026-10-31,PRD-102,Oat milk 1 L,2,9.50,store\n2026-10-20,PRD-103,Granola 500 g,1,14.20,store\n2026-10-27,PRD-106,Sparkling water x6,2,12.60,online\n2026-10-04,PRD-101,Cold brew 1 L,8,18.90,store\n2026-10-16,PRD-104,Green tea box,11,11.00,online\n2026-10-26,PRD-102,Oat milk 1 L,6,9.50,online\n2026-10-11,PRD-106,Sparkling water x6,4,12.60,phone\n2026-10-31,PRD-105,Protein bar x12,3,32.40,online\n2026-10-05,PRD-101,Cold brew 1 L,9,18.90,store\n2026-10-03,PRD-102,Oat milk 1 L,3,9.50,phone\n", "salvador": "date,sku,product,qty,unit_price,channel\n2026-10-07,PRD-103,Granola 500 g,4,14.20,store\n2026-10-06,PRD-102,Oat milk 1 L,11,9.50,phone\n2026-10-18,PRD-103,Granola 500 g,2,14.20,store\n2026-10-12,PRD-104,Green tea box,10,11.00,phone\n2026-10-05,PRD-105,Protein bar x12,1,32.40,store\n2026-10-02,PRD-102,Oat milk 1 L,2,9.50,online\n2026-10-23,PRD-101,Cold brew 1 L,10,18.90,phone\n2026-10-04,PRD-104,Green tea box,2,11.00,online\n2026-10-11,PRD-104,Green tea box,12,11.00,phone\n2026-10-09,PRD-104,Green tea box,3,11.00,phone\n2026-10-15,PRD-102,Oat milk 1 L,4,9.50,online\n2026-10-29,PRD-102,Oat milk 1 L,10,9.50,phone\n2026-10-21,PRD-103,Granola 500 g,7,14.20,phone\n2026-10-14,PRD-106,Sparkling water x6,8,12.60,phone\n2026-10-19,PRD-105,Protein bar x12,7,32.40,online\n2026-10-02,PRD-101,Cold brew 1 L,1,18.90,store\n2026-10-03,PRD-101,Cold brew 1 L,7,18.90,phone\n2026-10-01,PRD-105,Protein bar x12,2,32.40,store\n2026-10-08,PRD-106,Sparkling water x6,7,12.60,phone\n2026-10-10,PRD-104,Green tea box,5,11.00,phone\n2026-10-31,PRD-103,Granola 500 g,1,14.20,online\n2026-10-02,PRD-104,Green tea box,9,11.00,online\n2026-10-22,PRD-105,Protein bar x12,10,32.40,store\n2026-10-09,PRD-106,Sparkling water x6,11,12.60,phone\n2026-10-25,PRD-105,Protein bar x12,4,32.40,online\n2026-10-14,PRD-104,Green tea box,2,11.00,online\n2026-10-25,PRD-104,Green tea box,5,11.00,store\n2026-10-01,PRD-102,Oat milk 1 L,12,9.50,phone\n2026-10-22,PRD-101,Cold brew 1 L,1,18.90,online\n2026-10-18,PRD-102,Oat milk 1 L,8,9.50,store\n2026-10-15,PRD-106,Sparkling water x6,3,12.60,phone\n2026-10-23,PRD-104,Green tea box,10,11.00,store\n2026-10-05,PRD-101,Cold brew 1 L,6,18.90,phone\n2026-10-25,PRD-104,Green tea box,9,11.00,online\n2026-10-18,PRD-103,Granola 500 g,6,14.20,store\n2026-10-31,PRD-106,Sparkling water x6,7,12.60,store\n"}, MONTH = '2026-10', ATTEMPTS = 3, BRANCHES = ['curitiba', 'recife', 'salvador'];
  var SCEN = { none: { fail: {}, expire: null }, flaky: { fail: { curitiba: 2 }, expire: 4 }, down: { fail: { salvador: -1 }, expire: null } };
  var cp = function (o) { return JSON.parse(JSON.stringify(o)); };
  var cents = function (s) { return Math.round(parseFloat(s) * 100); };
  function parseCsv(t) { var L = t.trim().split('\n'), h = L[0].split(','); return L.slice(1).map(function (l) { var c = l.split(','), r = {}; h.forEach(function (k, i) { r[k] = c[i]; }); return r; }); }
  function validate(rows) {
    var ok = [], bad = [];
    rows.forEach(function (r, n) {
      var why = null;
      if (!r.sku.trim()) why = 'empty sku';
      else if (!/^-?\d+$/.test(r.qty)) why = 'unreadable value (ValueError)';
      else if (parseInt(r.qty, 10) <= 0) why = 'qty must be > 0';
      else if (cents(r.unit_price) <= 0) why = 'price must be > 0';
      else if (r.date.indexOf(MONTH + '-') !== 0) why = 'date outside ' + MONTH;
      if (why) bad.push({ line: n + 2, reason: why }); else { var o = cp(r); o.qty = parseInt(r.qty, 10); o.price_cents = cents(r.unit_price); ok.push(o); }
    });
    return [ok, bad];
  }
  function consolidate(per, missing) {
    var by = [], prod = {}, chan = {}, total = 0;
    Object.keys(per).forEach(function (b) {
      var ok = per[b][0], bad = per[b][1], rev = ok.reduce(function (a, r) { return a + r.qty * r.price_cents; }, 0); total += rev;
      by.push({ branch: b, rows_ok: ok.length, rows_rejected: bad.length, revenue: rev / 100 });
      ok.forEach(function (r) { prod[r.product] = (prod[r.product] || 0) + r.qty * r.price_cents; chan[r.channel] = (chan[r.channel] || 0) + r.qty * r.price_cents; });
    });
    var top = Object.keys(prod).map(function (k) { return [k, prod[k]]; }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, 3);
    return { month: MONTH, total_revenue: total / 100, by_branch: by, top_products: top.map(function (x) { return { product: x[0], revenue: x[1] / 100 }; }),
      by_channel: Object.keys(chan).sort().map(function (c) { return { channel: c, revenue: chan[c] / 100 }; }), missing_branches: missing };
  }
  // --- portal + navegador (estado) ---
  function newPortal(sc, pw, user) { return { cfg: cp(SCEN[sc] || SCEN.none), sess: false, left: null, url: 'about:blank', user: user, pw: pw }; }
  function authed(P) { if (!P.sess) return false; if (P.left !== null) { if (P.left <= 0) { P.sess = false; return false; } P.left--; } return true; }
  function goto(P, path) { if (path === '/login') { P.url = '/login'; return; } P.url = authed(P) ? path : '/login'; }
  function doLogin(P) {
    P.url = '/login';
    if (P.user === 'analista' && P.pw === 'demo123') { P.sess = true; P.left = P.cfg.expire; goto(P, '/reports'); return true; }
    return false; // 401: continua em /login
  }
  function click(P, b) { // devolve o CSV se o download aconteceu; senão null (e a URL mostra o motivo)
    if (!authed(P)) { P.url = '/login'; return null; }
    var n = P.cfg.fail[b] || 0;
    if (n !== 0) { if (n > 0) P.cfg.fail[b] = n - 1; P.url = '/download?branch=' + b; return null; }
    return CSV[b];
  }

  window.DEMO = {
    start: 'start',
    init: function () { return { p: null }; },
    verify: function (expect, ctx) {
      var c = ctx.p; if (expect.error) return c.error === expect.error;
      var s = c.summary, e = expect.summary; return JSON.stringify(s) === JSON.stringify(e);
    },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.p = { P: newPortal(b.scenario, b.password, b.user), log: [], per: {}, missing: [], bi: 0, cur: null }; return { out: { user: b.user, scenario: b.scenario, browser: 'chromium (headless)' }, ms: 240 }; },
      login: function (i, ctx) {
        var p = ctx.p, ok = doLogin(p.P);
        if (!ok) { p.error = 'login rejected by the portal (check the credentials)'; return { out: { status: 401, url: p.P.url }, branch: 'err', ms: 180 }; }
        p.log.push({ step: 'login', ok: true }); return { out: { status: 200, url: p.P.url }, branch: 'ok', ms: 320 };
      },
      stop: function (i, ctx) { return { out: { error: ctx.p.error, exit_code: 1 }, ms: 2, end: true }; },
      download: function (i, ctx) {
        var p = ctx.p, P = p.P, b = BRANCHES[p.bi], got = null, tried = [];
        if (i && i.__error) { p.missing.push(b); p.cur = null; p.log.push({ step: 'download', branch: b, attempt: 1, ok: false, why: 'portal error 500' }); return { out: { branch: b, skipped: true, reason: i.__error }, ms: 0 }; }
        for (var attempt = 1; attempt <= ATTEMPTS; attempt++) {
          if (P.url.indexOf('/reports') < 0) goto(P, '/reports');
          if (P.url.indexOf('/login') >= 0) {
            doLogin(P); p.log.push({ step: 'relogin', branch: b }); goto(P, '/reports');
            if (P.url.indexOf('/login') >= 0) throw new Error('session expired and re-login failed');
          }
          var data = click(P, b);
          if (data !== null) { got = data; var e = { step: 'download', branch: b, attempt: attempt, ok: true }; p.log.push(e); tried.push(e); break; }
          var why = P.url.indexOf('/login') >= 0 ? 'session expired' : 'portal error 500', f = { step: 'download', branch: b, attempt: attempt, ok: false, why: why };
          p.log.push(f); tried.push(f);
          if (P.url.indexOf('/login') >= 0) { doLogin(P); p.log.push({ step: 'relogin', branch: b }); tried.push({ step: 'relogin' }); }
          goto(P, '/reports');
        }
        if (got === null) p.missing.push(b);
        p.cur = got; return { out: { branch: b, attempts: tried, file: got ? b + '_' + MONTH + '.csv' : null, saved: !!got }, ms: 900 + 700 * tried.length };
      },
      validate: function (i, ctx) {
        var p = ctx.p, b = BRANCHES[p.bi]; p.bi++;
        if (p.cur === null) return { out: { branch: b, skipped: 'no file' }, ms: 1 };
        var r = validate(parseCsv(p.cur)); p.per[b] = r; return { out: { branch: b, rows_ok: r[0].length, rejected: r[1] }, ms: 12 };
      },
      more: function (i, ctx) { return { out: { next: BRANCHES[ctx.p.bi] || null }, branch: ctx.p.bi < BRANCHES.length ? 'next' : 'done', ms: 1 }; },
      consolidate: function (i, ctx) {
        var p = ctx.p, s = consolidate(p.per, p.missing);
        s.log = p.log; s.rejected = []; Object.keys(p.per).forEach(function (b) { p.per[b][1].forEach(function (x) { s.rejected.push({ branch: b, line: x.line, reason: x.reason }); }); });
        p.summary = s; return { out: { total_revenue: s.total_revenue, missing: s.missing_branches, rejected: s.rejected.length }, ms: 40 };
      },
      report: function (i, ctx) { var s = ctx.p.summary; return { out: { file: 'consolidated_' + MONTH + '.xlsx', sheets: ['Consolidated', 'By branch', 'Rejected', 'Missing'], exit_code: s.missing_branches.length ? 2 : 0 }, ms: 90, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx.p, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (c.error) return [{ kind: 'error', title: { pt: 'Login recusado (código de saída 1)', en: 'Login rejected (exit code 1)' }, text: { pt: 'O robô parou na hora, sem tentar de novo: senha errada não melhora com retry. Mensagem: ' + c.error, en: 'The robot stopped immediately without retrying: a wrong password does not get better with retries. Message: ' + c.error } }];
      var s = c.summary, money = function (v) { return 'US$ ' + v.toFixed(2); };
      o.push({ kind: 'sheet', title: { pt: 'Planilha consolidada · aba "By branch"', en: 'Consolidated workbook · "By branch" sheet' }, cols: ['branch', 'rows ok', 'rows rejected', 'revenue'],
        rows: s.by_branch.map(function (x) { return [x.branch, x.rows_ok, x.rows_rejected, money(x.revenue)]; }).concat([['TOTAL', '', '', money(s.total_revenue)]]), highlightLast: true });
      o.push({ kind: 'card', title: { pt: 'Resumo da execução', en: 'Run summary' }, rows: [
        [{ pt: 'Mês', en: 'Month' }, s.month],
        [{ pt: 'Filiais baixadas', en: 'Branches downloaded' }, String(s.by_branch.length) + ' / 3', s.missing_branches.length ? 'b-warm' : 'b-ok'],
        [{ pt: 'Filiais faltando', en: 'Branches missing' }, s.missing_branches.join(', ') || '-', s.missing_branches.length ? 'b-err' : 'b-ok'],
        [{ pt: 'Linhas rejeitadas', en: 'Rejected rows' }, String(s.rejected.length), s.rejected.length ? 'b-warm' : 'b-ok'],
        [{ pt: 'Detalhe das rejeitadas', en: 'Rejected detail' }, s.rejected.map(function (x) { return x.branch + ' L' + x.line + ': ' + x.reason; }).join('; ') || '-'],
        [{ pt: 'Mais vendidos', en: 'Top products' }, s.top_products.map(function (x) { return x.product + ' ' + money(x.revenue); }).join(' · ')],
        [{ pt: 'Re-logins / tentativas extras', en: 'Re-logins / extra attempts' }, s.log.filter(function (x) { return x.step === 'relogin'; }).length + ' / ' + s.log.filter(function (x) { return x.step === 'download' && !x.ok; }).length]] });
      o.push({ title: { pt: 'Log de passos do robô', en: 'Robot step log' }, json: s.log });
      if (s.missing_branches.length) o.push({ kind: 'error', title: { pt: 'Parcial (código de saída 2)', en: 'Partial (exit code 2)' }, text: { pt: 'A filial ' + s.missing_branches.join(', ') + ' não baixou depois de 3 tentativas. As outras foram consolidadas e a ausência está na aba "Missing"; ninguém recebe um total que parece completo.', en: 'Branch ' + s.missing_branches.join(', ') + ' did not download after 3 attempts. The others were consolidated and the gap is on the "Missing" sheet; nobody gets a total that looks complete.' } });
      if (r.sim === 'perm') o.push({ kind: 'error', title: { pt: 'Falha simulada tratada', en: 'Simulated failure handled' }, text: { pt: 'O download da primeira filial falhou nas 3 tentativas; com continueOnFail o robô seguiu para as demais.', en: 'The first branch download failed all 3 attempts; with continueOnFail the robot moved on to the others.' } });
      return o;
    }
  };
})();
