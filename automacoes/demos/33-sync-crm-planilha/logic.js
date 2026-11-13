/* Porta fiel de sync.py (normalize, errors, find, merge, upsert) para JavaScript. Os dois "arquivos" (CRM e planilha) são arrays na memória da página; conferido contra as respostas reais do Python. */
(function () {
  var FIELDS = ['name', 'email', 'phone', 'company'], EMAIL = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
  function normalize(r) {
    var n = {};
    FIELDS.forEach(function (k) { n[k] = String(r[k] == null ? '' : r[k]).split(/\s+/).filter(Boolean).join(' '); });
    n.email = n.email.toLowerCase();
    var d = n.phone.replace(/\D/g, ''); if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);
    n.phone = d; n.name = n.name.toLowerCase().replace(/\p{L}+/gu, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
    n.updated = String(r.updated == null ? '' : r.updated).trim(); return n;
  }
  function errors(n) {
    var e = [];
    if (!n.name) e.push('name is required');
    if (n.email && !EMAIL.test(n.email)) e.push('email is invalid');
    if (!n.email && n.phone.length !== 10 && n.phone.length !== 11) e.push('needs a valid e-mail or a phone with 10-11 digits');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(n.updated)) e.push('updated must be YYYY-MM-DD');
    return e;
  }
  function find(rows, n) {
    var i;
    for (i = 0; i < rows.length; i++) if (n.email && rows[i].email === n.email) return i;
    for (i = 0; i < rows.length; i++) if (n.phone && rows[i].phone === n.phone) return i;
    return -1;
  }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(a, b) {
    var m = copy(a), ch = [], cf = [];
    FIELDS.forEach(function (k) {
      if (a[k] === b[k]) return;
      if (!a[k]) { m[k] = b[k]; ch.push(k); } else if (!b[k]) return;
      else if (b.updated > a.updated) { m[k] = b[k]; ch.push(k); } else if (b.updated === a.updated) cf.push(k);
    });
    m.updated = a.updated > b.updated ? a.updated : b.updated;
    if (m.updated !== a.updated && !ch.length) ch.push('updated');
    return { m: m, ch: ch, cf: cf };
  }
  function seed() { return {"crm": [{"name": "Ana S.", "email": "ana.souza@lojaviva.example", "phone": "41999991111", "company": "Loja Viva Ltda", "updated": "2026-11-09"}, {"name": "Bruno Lima", "email": "bruno@norteacos.example", "phone": "41988882222", "company": "Norte Aço", "updated": "2026-11-05"}, {"name": "Carla Dias", "email": "carla@portoeng.example", "phone": "4133334444", "company": "Porto Eng", "updated": "2026-11-03"}, {"name": "Diego Rocha", "email": "diego@vitrine.example", "phone": "41977773333", "company": "", "updated": "2026-11-02"}, {"name": "Eva Prado", "email": "eva@graos.example", "phone": "41966664444", "company": "Grãos da Serra", "updated": "2026-11-04"}], "sheet": [{"name": "Ana S.", "email": "ana.souza@lojaviva.example", "phone": "41999991111", "company": "Loja Viva Ltda", "updated": "2026-11-09"}, {"name": "Bruno Lima", "email": "bruno@norteacos.example", "phone": "41988882222", "company": "Norte Aço", "updated": "2026-11-05"}, {"name": "Carla Dias", "email": "carla@portoeng.example", "phone": "4133334444", "company": "Porto Eng", "updated": "2026-11-03"}, {"name": "Diego Rocha", "email": "diego@vitrine.example", "phone": "41977773333", "company": "", "updated": "2026-11-02"}, {"name": "Eva Prado", "email": "eva@graos.example", "phone": "41966664444", "company": "Grãos da Serra", "updated": "2026-11-04"}]}; }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { var s = seed(); return { stores: s, res: null, acts: [], cf: [] }; },
    verify: function (expect, ctx) { return !!ctx.res && JSON.stringify(ctx.res) === JSON.stringify(expect); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.origin = b.origin; ctx.other = b.origin === 'crm' ? 'sheet' : 'crm'; ctx.raw = b; ctx.res = null; ctx.acts = []; ctx.cf = []; return { out: { event: 'row changed in ' + b.origin, row: { name: b.name, email: b.email, phone: b.phone, company: b.company, updated: b.updated } }, ms: 8 }; },
      normalize: function (i, ctx) { ctx.n = normalize(ctx.raw); return { out: ctx.n, ms: 1 }; },
      validate: function (i, ctx) {
        var e = errors(ctx.n); if (e.length) { ctx.res = { status: 'rejected', errors: e }; return { out: ctx.res, branch: 'bad', ms: 1 }; }
        return { out: { valid: true }, branch: 'ok', ms: 1 };
      },
      reject: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; },
      own: function (i, ctx) {
        var rows = ctx.stores[ctx.origin], k = find(rows, ctx.n), n = ctx.n;
        if (k < 0) { rows.push(copy(n)); ctx.acts.push('created in ' + ctx.origin); ctx.cur = n; return { out: { match: null, action: 'created in ' + ctx.origin }, ms: 3 }; }
        var r = merge(rows[k], n); rows[k] = r.m; ctx.cur = r.m; ctx.cf = ctx.cf.concat(r.cf);
        ctx.acts.push('same-side duplicate merged in ' + ctx.origin + (r.ch.length ? ' (' + r.ch.join(', ') + ')' : ' (no change)'));
        return { out: { match: k, changed: r.ch, conflicts: r.cf }, ms: 3 };
      },
      other: function (i, ctx) {
        var rows = ctx.stores[ctx.other], k = find(rows, ctx.cur), o = ctx.other;
        if (k < 0) { rows.push(copy(ctx.cur)); ctx.acts.push('created in ' + o); }
        else {
          var r = merge(rows[k], ctx.cur); rows[k] = r.m; ctx.cf = ctx.cf.concat(r.cf);
          ctx.acts.push(r.ch.length ? 'updated in ' + o + ' (' + r.ch.join(', ') + ')' : o + ' already up to date');
        }
        var u = {}; ctx.cf.forEach(function (f) { u[f] = 1; });
        ctx.res = { status: ctx.cf.length ? 'conflict' : 'synced', actions: ctx.acts.slice(), conflicts: Object.keys(u).sort() };
        return { out: ctx.res, ms: 4 };
      },
      report: function (i, ctx) { return { out: { crm_rows: ctx.stores.crm.length, sheet_rows: ctx.stores.sheet.length }, ms: 2, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, res = c.res;
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (res.status === 'rejected') return [{ kind: 'error', title: { pt: 'Linha recusada', en: 'Row rejected' }, text: { pt: 'Nada foi gravado. Motivos: ' + res.errors.join('; ') + '.', en: 'Nothing was written. Reasons: ' + res.errors.join('; ') + '.' } }, { title: { pt: 'Resultado', en: 'Result' }, json: res }];
      var o = [{ kind: 'card', title: res.status === 'conflict' ? { pt: 'Conflito: precisa de uma pessoa', en: 'Conflict: needs a person' } : { pt: 'Sincronizado', en: 'Synced' }, rows: [[{ pt: 'Ações', en: 'Actions' }, res.actions.join(' · ')], [{ pt: 'Conflitos', en: 'Conflicts' }, res.conflicts.length ? res.conflicts.join(', ') : { pt: 'nenhum', en: 'none' }, res.conflicts.length ? 'b-warm' : 'b-ok']] }];
      var cols = ['name', 'email', 'phone', 'company', 'updated'], tab = function (s) { return c.stores[s].map(function (x) { return cols.map(function (k) { return x[k]; }); }); };
      o.push({ kind: 'sheet', title: { pt: 'CRM (memória desta página)', en: 'CRM (this page memory)' }, cols: cols, rows: tab('crm') });
      o.push({ kind: 'sheet', title: { pt: 'Planilha (memória desta página)', en: 'Spreadsheet (this page memory)' }, cols: cols, rows: tab('sheet') });
      return o;
    }
  };
})();
