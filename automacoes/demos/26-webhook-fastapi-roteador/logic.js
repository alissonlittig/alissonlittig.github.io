/* Porta fiel de app.py (validate, route, retentativa, dedupe) para JavaScript. A assinatura HMAC-SHA256 é verificada de verdade no Python (tests/); aqui o campo "assinatura" simula o resultado. Conferido contra as respostas gravadas do FastAPI. */
(function () {
  var ATTEMPTS = 3, BACKOFF = [0.5, 1.0], TYPES = ['payment.approved', 'payment.refunded', 'form.submitted'];
  function validate(ev) {
    var e = [];
    if (ev === null || typeof ev !== 'object' || Array.isArray(ev)) return ['body must be a JSON object'];
    if (!String(ev.id === undefined || ev.id === null ? '' : ev.id).trim()) e.push('id is required');
    if (TYPES.indexOf(ev.type) < 0) e.push('type must be payment.approved|payment.refunded|form.submitted');
    var d = ev.data;
    if (d === null || typeof d !== 'object' || Array.isArray(d)) e.push('data must be an object');
    else if (String(ev.type || '').indexOf('payment.') === 0 && !(typeof d.amount === 'number' && d.amount > 0)) e.push('data.amount must be a number > 0');
    return e;
  }
  function route(ev) {
    var t = ev.type, d = ev.data, c = d.customer === undefined ? '' : d.customer, em = d.email === undefined ? '' : d.email;
    if (t === 'payment.approved') {
      var a = [['sheet', [ev.id, t, c, d.amount]], ['mail', { to: em, subject: 'Receipt ' + ev.id }]];
      if (d.amount >= 1000) a.push(['chat', 'Big sale: ' + (d.customer || '?') + ' paid ' + d.amount.toFixed(2)]);
      return a;
    }
    if (t === 'payment.refunded') return [['sheet', [ev.id, t, c, -d.amount]], ['chat', 'Refund: ' + (d.customer || '?') + ' ' + d.amount.toFixed(2) + ' (check the reason)']];
    return [['sheet', [ev.id, t, d.name === undefined ? '' : d.name, em]], ['mail', { to: em, subject: 'We got your message' }]];
  }
  function reply(code, payload) { return { statusCode: code, payload: payload }; }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { seen: {}, sheet: [], chat: [], mail: [], dead: [], res: null }; },
    verify: function (e, ctx) {
      var r = ctx.res; return !!r && r.statusCode === e.status && JSON.stringify(r.payload) === JSON.stringify(e.body) && JSON.stringify(ctx.sleeps) === JSON.stringify(e.sleeps) &&
        ctx.sheet.length === e.counts.sheet && ctx.chat.length === e.counts.chat && ctx.mail.length === e.counts.mail && ctx.dead.length === e.counts.dead;
    },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.raw = String(b.event); ctx.sig = b.sig; ctx.chatMode = b.chat; ctx.res = null; ctx.sleeps = []; return { out: { method: 'POST', path: '/hooks/shop', 'x-signature': ctx.sig === 'valid' ? 'sha256=<hmac ok>' : 'sha256=000…0', bytes: ctx.raw.length }, ms: 6 }; },
      sig: function (i, ctx) {
        if (ctx.sig !== 'valid') { ctx.res = reply(401, { status: 'rejected', error: 'invalid signature' }); return { out: ctx.res.payload, branch: 'bad', ms: 1 }; }
        return { out: { signature: 'valid' }, branch: 'ok', ms: 1 };
      },
      rej401: function (i, ctx) { return { out: ctx.res, ms: 1, end: true }; },
      validate: function (i, ctx) {
        var ev; try { ev = JSON.parse(ctx.raw); } catch (x) { ctx.res = reply(400, { status: 'rejected', errors: ['malformed JSON'] }); return { out: ctx.res.payload, branch: 'bad', ms: 1 }; }
        var e = validate(ev); if (e.length) { ctx.res = reply(422, { status: 'rejected', errors: e }); return { out: ctx.res.payload, branch: 'bad', ms: 1 }; }
        ctx.ev = ev; return { out: { id: ev.id, type: ev.type }, branch: 'ok', ms: 1 };
      },
      rejbad: function (i, ctx) { return { out: ctx.res, ms: 1, end: true }; },
      dedupe: function (i, ctx) {
        if (ctx.seen[ctx.ev.id] !== undefined) { ctx.res = reply(200, { status: 'duplicate', id: ctx.ev.id, first_result: ctx.seen[ctx.ev.id] }); return { out: ctx.res.payload, branch: 'dup', ms: 2 }; }
        return { out: { seen_before: false }, branch: 'new', ms: 2 };
      },
      dup: function (i, ctx) { return { out: ctx.res, ms: 1, end: true }; },
      route: function (i, ctx) { ctx.acts = route(ctx.ev); return { out: { actions: ctx.acts.map(function (a) { return a[0]; }) }, ms: 3 }; },
      deliver: function (i, ctx) {
        var done = [], dead = [], failChat = ctx.chatMode === 'flaky' ? 2 : ctx.chatMode === 'down' ? -1 : 0, ms = 0;
        ctx.acts.forEach(function (a) {
          for (var k = 0; k < ATTEMPTS; k++) {
            var fails = a[0] === 'chat' && failChat !== 0; if (fails && failChat > 0) failChat -= 1; ms += 80;
            if (!fails) { ctx[a[0]].push(a[1]); done.push({ action: a[0], attempts: k + 1 }); break; }
            if (k < ATTEMPTS - 1) { ctx.sleeps.push(BACKOFF[k]); ms += BACKOFF[k] * 1000; } else { dead.push({ action: a[0], error: a[0] + ': 503 service unavailable', attempts: ATTEMPTS }); ctx.dead.push({ event: ctx.ev, action: a[0], arg: a[1] }); }
          }
        });
        ctx.res = reply(dead.length ? 202 : 200, { status: dead.length ? 'partial' : 'ok', id: ctx.ev.id, source: 'shop', delivered: done, dead_letter: dead }); ctx.seen[ctx.ev.id] = ctx.res.payload.status;
        return { out: { delivered: done, dead_letter: dead, backoff_s: ctx.sleeps }, branch: dead.length ? 'partial' : 'ok', ms: ms };
      },
      ok: function (i, ctx) { return { out: ctx.res, ms: 1, end: true }; },
      dead: function (i, ctx) { return { out: ctx.res, ms: 2, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var res = c.res, p = res.payload, why = { 401: ['HTTP 401 · assinatura recusada', 'HTTP 401 · signature rejected', 'Nada foi entregue: sem assinatura válida o evento nem é lido.', 'Nothing was delivered: without a valid signature the event is not even read.'], 400: ['HTTP 400 · JSON quebrado', 'HTTP 400 · malformed JSON', 'O corpo não é JSON.', 'The body is not JSON.'] };
      if (res.statusCode === 401 || res.statusCode === 400) return [{ kind: 'error', title: { pt: why[res.statusCode][0], en: why[res.statusCode][1] }, text: { pt: why[res.statusCode][2], en: why[res.statusCode][3] } }, { title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res }];
      if (res.statusCode === 422) return [{ kind: 'error', title: { pt: 'HTTP 422 · evento recusado', en: 'HTTP 422 · event rejected' }, text: { pt: 'Motivos: ' + p.errors.join('; ') + '.', en: 'Reasons: ' + p.errors.join('; ') + '.' } }, { title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res }];
      if (p.status === 'duplicate') o.push({ kind: 'card', title: { pt: 'Evento repetido: sem novo efeito', en: 'Repeated event: no new effect' }, rows: [[{ pt: 'Id', en: 'Id' }, p.id], [{ pt: 'Resultado da 1ª vez', en: 'First result' }, p.first_result], [{ pt: 'Linhas novas / mensagens novas', en: 'New rows / new messages' }, '0 / 0', 'b-ok']] });
      else {
        if (res.statusCode === 202) o.push({ kind: 'error', title: { pt: 'HTTP 202 · entrega parcial', en: 'HTTP 202 · partial delivery' }, text: { pt: 'O chat ficou fora do ar nas 3 tentativas. Planilha e e-mail foram entregues; o evento do chat ficou na dead letter para reprocessar.', en: 'The chat was down for all 3 attempts. Sheet and e-mail were delivered; the chat event stayed in the dead letter for reprocessing.' } });
        p.delivered.forEach(function (d) { if (d.action === 'chat') o.push({ kind: 'card', title: { pt: 'Mensagem no chat', en: 'Chat message' }, rows: [[{ pt: 'Texto', en: 'Text' }, c.chat[c.chat.length - 1]], [{ pt: 'Tentativas', en: 'Attempts' }, String(d.attempts), d.attempts > 1 ? 'b-warm' : 'b-ok']] }); });
        if (p.delivered.some(function (d) { return d.action === 'mail'; })) { var m = c.mail[c.mail.length - 1]; o.push({ kind: 'email', title: { pt: 'E-mail ao cliente', en: 'E-mail to customer' }, subject: m.subject, to: 'To: ' + m.to, text: m.subject === 'Receipt ' + p.id ? 'Payment received. Thank you!' : 'Thanks for writing. We will reply soon.' }); }
      }
      if (c.sheet.length) o.push({ kind: 'sheet', title: { pt: 'Planilha (memória desta página)', en: 'Sheet (this page memory)' }, cols: ['id', 'type', 'who', 'value'], rows: c.sheet.slice(), highlightLast: true });
      if (c.dead.length) o.push({ kind: 'sheet', title: { pt: 'Dead letter', en: 'Dead letter' }, cols: ['event', 'action'], rows: c.dead.map(function (d) { return [d.event.id, d.action]; }) });
      o.push({ title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res });
      return o;
    }
  };
})();
