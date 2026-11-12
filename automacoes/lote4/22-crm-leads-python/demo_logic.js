/* Porta fiel de crm.py (validate, score, tier, process) para JavaScript. O SQLite e o chat são simulados por arrays na memória da página; a lógica foi conferida contra as respostas reais gravadas. */
(function () {
  var EMAIL = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/, FREE = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'], SENIOR = ['ceo', 'founder', 'owner', 'director', 'head', 'cto', 'coo'];
  var SRC = { referral: 20, webinar: 10, ads: 5 }, OWNERS = ['Marina', 'Paulo', 'Rita'], DAYS = { hot: 1, warm: 3 };
  function isNum(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
  function validate(p) {
    var e = [];
    if (!String(p.name || '').trim()) e.push('name is required');
    if (!EMAIL.test(String(p.email || '').trim())) e.push('email is invalid');
    if (['referral', 'webinar', 'ads', 'organic'].indexOf(String(p.source || '').trim()) < 0) e.push('source must be referral|webinar|ads|organic');
    ['employees', 'budget'].forEach(function (k) { var v = p[k] === undefined ? 0 : p[k]; if (!isNum(v)) e.push(k + ' must be a number >= 0'); });
    return e;
  }
  function score(p) {
    var s = 0, why = [];
    function add(n, t) { s += n; why.push((n >= 0 ? '+' : '') + n + ' ' + t); }
    var e = p.employees || 0, b = p.budget || 0;
    if (e >= 50) add(30, '50+ employees'); else if (e >= 10) add(15, '10+ employees');
    if (SENIOR.some(function (w) { return String(p.role || '').toLowerCase().indexOf(w) >= 0; })) add(25, 'senior role');
    if (b >= 5000) add(30, 'budget >= 5000'); else if (b >= 1000) add(15, 'budget >= 1000');
    if (SRC[p.source]) add(SRC[p.source], 'source ' + p.source);
    if (FREE.indexOf(p.email.split('@')[1].toLowerCase()) >= 0) add(-10, 'free e-mail domain');
    if (/\b(urgent|pricing|demo|quote)\b/.test(String(p.message || '').toLowerCase())) add(10, 'buying words in message');
    return { s: s, why: why };
  }
  function tier(s) { return s >= 70 ? 'hot' : s >= 40 ? 'warm' : 'cold'; }
  function due(days) { var d = new Date(Date.UTC(2026, 10, 12 + days)); return d.toISOString().slice(0, 10); }
  function lead(b) { // formulário (texto) -> payload JSON, como um webhook mandaria
    var p = {};
    ['name', 'email', 'company', 'role', 'source', 'message'].forEach(function (k) { p[k] = b[k]; });
    ['employees', 'budget'].forEach(function (k) { var v = b[k]; if (v === '' || v === undefined || v === null) return; p[k] = (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) ? Number(v) : v; });
    return p;
  }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { leads: [], tasks: [], outbox: [], chat: [], res: null, m: null }; },
    verify: function (expect, ctx) { var r = ctx.res; return !!r && r.statusCode === expect.status && JSON.stringify(r.payload) === JSON.stringify(expect.body); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.m = lead(b); ctx.chatUp = b.chat !== 'down'; ctx.res = null; return { out: { method: 'POST', path: '/leads', body: ctx.m }, ms: 6 }; },
      validate: function (i, ctx) {
        var e = validate(ctx.m); if (e.length) { ctx.res = { statusCode: 422, payload: { status: 'rejected', errors: e } }; return { out: ctx.res.payload, branch: 'bad', ms: 1 }; }
        ctx.m.email = ctx.m.email.trim().toLowerCase(); ctx.m.name = ctx.m.name.trim(); return { out: { valid: true }, branch: 'ok', ms: 1 };
      },
      reject: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; },
      dedupe: function (i, ctx) {
        var row = ctx.leads.filter(function (l) { return l.email === ctx.m.email; })[0], sc = score(ctx.m);
        if (!row) return { out: { found: false }, branch: 'new', ms: 3 };
        var best = Math.max(sc.s, row.score); row.score = best; row.tier = tier(best); row.seen += 1; ctx.res = { statusCode: 200, payload: { status: 'merged', lead_id: row.id, score: best, tier: tier(best), seen: row.seen } };
        return { out: { found: true, lead_id: row.id }, branch: 'dup', ms: 3 };
      },
      merge: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; },
      score: function (i, ctx) { var sc = score(ctx.m); ctx.sc = sc; return { out: { score: sc.s, tier: tier(sc.s), why: sc.why }, ms: 2 }; },
      tier: function (i, ctx) {
        var t = tier(ctx.sc.s), id = ctx.leads.length + 1; ctx.t = t; ctx.id = id;
        ctx.leads.push({ id: id, email: ctx.m.email, name: ctx.m.name, score: ctx.sc.s, tier: t, seen: 1 });
        ctx.out = { status: 'created', lead_id: id, score: ctx.sc.s, tier: t, why: ctx.sc.why };
        if (t === 'cold') { ctx.out.action = 'nurture list, no task'; ctx.res = { statusCode: 200, payload: ctx.out }; return { out: { tier: t }, branch: 'cold', ms: 4 }; }
        return { out: { tier: t }, branch: 'act', ms: 4 };
      },
      nurture: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; },
      task: function (i, ctx) {
        var owner = OWNERS[ctx.id % 3], d = due(DAYS[ctx.t]), co = ctx.m.company || 'no company';
        ctx.tasks.push([ctx.id, owner, d, 'Call ' + ctx.m.name + ' (' + co + ')']); ctx.out.owner = owner; ctx.out.due = d;
        ctx.text = 'HOT lead ' + ctx.m.name + ' (' + (ctx.m.company || '-') + ') score ' + ctx.sc.s + ', owner ' + owner + ', due ' + d;
        if (ctx.t === 'warm') { ctx.res = { statusCode: 200, payload: ctx.out }; return { out: { owner: owner, due: d }, branch: 'warm', ms: 5 }; }
        return { out: { owner: owner, due: d }, branch: 'hot', ms: 5 };
      },
      notify: function (i, ctx) {
        if (!ctx.chatUp) return { out: { error: 'URLError: unreachable (connect to chat webhook failed)' }, branch: 'error', ms: 2000 };
        ctx.chat.push(ctx.text); ctx.out.notified = true; ctx.res = { statusCode: 200, payload: ctx.out }; return { out: { delivered: ctx.text }, branch: 'sent', ms: 120 };
      },
      ok: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; },
      queue: function (i, ctx) { ctx.outbox.push(ctx.text); ctx.out.notified = false; ctx.out.queued = true; ctx.res = { statusCode: 202, payload: ctx.out }; return { out: { outbox_rows: ctx.outbox.length }, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var res = c.res, p = res.payload;
      if (res.statusCode === 422) return [{ kind: 'error', title: { pt: 'HTTP 422 · lead recusado', en: 'HTTP 422 · lead rejected' }, text: { pt: 'Nada foi gravado. Motivos: ' + p.errors.join('; ') + '.', en: 'Nothing was stored. Reasons: ' + p.errors.join('; ') + '.' } }, { title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res }];
      if (res.statusCode === 202) o.push({ kind: 'error', title: { pt: 'HTTP 202 · aviso na fila', en: 'HTTP 202 · alert queued' }, text: { pt: 'O chat da equipe estava fora do ar. A tarefa foi criada e o aviso ficou na tabela outbox para reenvio; a resposta é 202, não 200.', en: 'The team chat was down. The task was created and the alert stayed in the outbox table for resending; the answer is 202, not 200.' } });
      if (p.status === 'merged') o.push({ kind: 'card', title: { pt: 'Lead repetido: mesclado', en: 'Repeated lead: merged' }, rows: [[{ pt: 'Lead', en: 'Lead' }, '#' + p.lead_id], [{ pt: 'Nota (maior das duas)', en: 'Score (higher of both)' }, String(p.score)], [{ pt: 'Vezes visto', en: 'Times seen' }, String(p.seen)], [{ pt: 'Tarefa nova', en: 'New task' }, { pt: 'nenhuma', en: 'none' }, 'b-ok']] });
      else {
        o.push({ kind: 'card', title: { pt: 'Lead qualificado', en: 'Qualified lead' }, rows: [[{ pt: 'Lead', en: 'Lead' }, '#' + p.lead_id], [{ pt: 'Nota', en: 'Score' }, String(p.score)], [{ pt: 'Faixa', en: 'Tier' }, p.tier, p.tier === 'hot' ? 'b-warm' : 'b-ok'], [{ pt: 'Por quê', en: 'Why' }, p.why.join(' · ')], [{ pt: 'Ação', en: 'Action' }, p.action || (p.owner + ', ' + p.due)]] });
        if (c.chat.length && p.notified) o.push({ kind: 'card', title: { pt: 'Mensagem no chat da equipe', en: 'Message in the team chat' }, rows: [[{ pt: 'Texto', en: 'Text' }, c.chat[c.chat.length - 1]]] });
      }
      if (c.tasks.length) o.push({ kind: 'sheet', title: { pt: 'Tabela tasks (memória desta página)', en: 'tasks table (this page memory)' }, cols: ['lead', 'owner', 'due', 'title'], rows: c.tasks.slice() });
      o.push({ title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res });
      return o;
    }
  };
})();
