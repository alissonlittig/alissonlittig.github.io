/* Nós Code = mesmo código do workflow.json. O Sistema B é um simulador com as regras do servidor de teste da execução gravada (mock_server2.py). */
(function () {
  var CFG = { data_dir: './data', system_b_url: 'https://system-b.example/orders', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"'; };
  var ERR_B = '503 - "{\\"error\\": \\"System B unavailable\\"}"';
  function webhookBody(f) { // o que o Sistema A envia: campos do formulário viram o JSON do pedido
    var items = f.sku ? [{ sku: f.sku, qty: Number(f.qty), unit_price: Number(f.unit_price) }] : [];
    return { id: f.id, customer_email: f.customer_email, customer_name: f.customer_name, currency: 'USD', items: items };
  }
  function validate(b) { // Code "Validate and map to System B schema"
    b = b || {}; var errors = [];
    if (!b.id) errors.push('id is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.customer_email || ''))) errors.push('customer_email is invalid');
    if (!Array.isArray(b.items) || !b.items.length) errors.push('items must be a non-empty array');
    var total = (b.items || []).reduce(function (a, i) { return a + Number(i.qty || 0) * Number(i.unit_price || 0); }, 0);
    if (b.items && !(total > 0)) errors.push('order total must be positive');
    var payload = { external_id: String(b.id), contact: { email: String(b.customer_email || '').toLowerCase(), name: b.customer_name || '' }, lines: (b.items || []).map(function (i) { return { sku: i.sku, quantity: Number(i.qty), price: Number(i.unit_price) }; }), total: +total.toFixed(2), currency: b.currency || 'USD', source: 'system-a' };
    return { valid: errors.length === 0, errors: errors, payload: payload, key: String(b.id) };
  }
  function callB(B, key) { // mock_server2.py: /systemb/orders
    B.attempts[key] = (B.attempts[key] || 0) + 1; var a = B.attempts[key];
    if (key in B.orders) return { code: 200, body: { ok: true, id: B.orders[key], duplicate: true } };
    if (/-X$/.test(key) || (/-F$/.test(key) && a <= 2)) return { code: 503, body: { error: 'System B unavailable' } };
    B.orders[key] = 'B-' + key; return { code: 201, body: { ok: true, id: 'B-' + key } };
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'webhook', resetMemory: true, validate: validate,
    init: function () { return { B: { orders: {}, attempts: {} }, syncLog: [], dead: [] }; },
    nodes: {
      webhook: function (i, ctx) { ctx.resp = null; ctx.v = null; ctx.alert = null; ctx.tries = 0; ctx.body = webhookBody(i.body); return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: ctx.body }, ms: 11 }; },
      config: function (i) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; return { out: o, ms: 3 }; },
      validate: function (i, ctx) { ctx.v = validate(ctx.body); return { out: ctx.v, ms: 8 }; },
      valid: function (i) { return { out: i, branch: i.valid ? 'true' : 'false', ms: 2 }; },
      r400: function (i, ctx) { ctx.resp = { code: 400, body: { ok: false, errors: i.errors } }; return { out: ctx.resp.body, ms: 3, end: true }; },
      post: function (i, ctx) {
        var attempts = [], res = null;
        if (i && i.__error) { for (var a = 1; a <= 3; a++) attempts.push({ try: a, status: 503, error: 'simulado' }); ctx.tries = 3; return { out: { error: ERR_B, attempts: attempts }, branch: 'error', ms: 0 }; }
        for (var t = 1; t <= 3; t++) { res = callB(ctx.B, ctx.v.key); attempts.push({ try: t, status: res.code }); if (res.code < 400) break; }
        ctx.tries = attempts.length;
        if (res.code >= 400) return { out: { error: ERR_B, attempts: attempts }, branch: 'error', ms: 3000 };
        var o = copy(res.body); o.attempts = attempts; return { out: o, branch: 'success', ms: 90 * attempts.length + (attempts.length - 1) * 1000 };
      },
      log: function (i, ctx) { ctx.logLine = [new Date().toISOString(), ctx.v.key, 'synced', i.id || '', i.duplicate ? 'duplicate (already in B)' : 'created']; ctx.dup = !!i.duplicate; ctx.bid = i.id; return { out: { id: i.id, duplicate: !!i.duplicate }, ms: 6 }; },
      append: function (i, ctx) { ctx.syncLog.push(ctx.logLine); return { out: { appended: ctx.logLine.map(q).join(',') }, ms: 15 }; },
      r200: function (i, ctx) { ctx.resp = { code: 200, body: { ok: true, status: 'synced', system_b_id: ctx.bid, duplicate: ctx.dup } }; return { out: ctx.resp.body, ms: 3, end: true }; },
      dead: function (i, ctx) { var rec = { at: new Date().toISOString(), key: ctx.v.key, payload: ctx.v.payload, error: String(i.error).slice(0, 200), retries: 3 }; ctx.deadRec = rec; return { out: rec, ms: 6 }; },
      deadfile: function (i, ctx) { ctx.dead.push(ctx.deadRec); return { out: { appended_lines: 1, file: CFG.data_dir + '/dead_letter.jsonl' }, ms: 14 }; },
      notify: function (i, ctx) {
        ctx.alert = 'SYNC FAILED after 3 tries: order ' + ctx.deadRec.key + ' queued in dead_letter.jsonl (' + ctx.deadRec.error + ')';
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error } }, ms: 0 };
        return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: ctx.alert } }, ms: 190 };
      },
      r202: function (i, ctx) { ctx.resp = { code: 202, body: { ok: false, status: 'queued', message: 'System B unavailable; order saved for manual replay' } }; return { out: ctx.resp.body, ms: 3, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], R = c.resp;
      if (r.failed || !R) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.' } }];
      var badge = R.code === 200 ? 'b-hot' : R.code === 202 ? 'b-warm' : 'b-spam';
      o.push({ kind: 'card', title: { pt: 'Resposta ao Sistema A', en: 'Response to System A' }, rows: [['HTTP', String(R.code), badge], [{ pt: 'Tentativas no Sistema B', en: 'Attempts on System B' }, c.v && c.v.valid ? String(c.tries) : '—'], [{ pt: 'Chave de idempotência', en: 'Idempotency key' }, c.v && c.v.key ? c.v.key : '—']] });
      o.push({ title: { pt: 'Corpo da resposta', en: 'Response body' }, json: R.body });
      if (c.alert) { var nt = T('notify', r); o.push(nt && nt.out && nt.out.ok ? { kind: 'telegram', title: { pt: 'Alerta à equipe', en: 'Team alert' }, from: 'Sync', text: c.alert, time: new Date().toTimeString().slice(0, 5) } : { kind: 'error', title: { pt: 'Alerta à equipe', en: 'Team alert' }, text: { pt: 'O Telegram ficou fora do ar, mas o pedido já está em dead_letter.jsonl: nada se perdeu (a resposta 202 sai mesmo assim).', en: 'Telegram stayed down, but the order is already in dead_letter.jsonl: nothing was lost (the 202 still goes out).' } }); }
      o.push({ kind: 'sheet', title: { pt: 'sync_log.csv', en: 'sync_log.csv' }, cols: ['at', 'key', 'status', 'system_b_id', 'result'], rows: c.syncLog.length ? c.syncLog.slice(-5) : [['—', '', '', '', '']], highlightLast: R.code === 200 });
      o.push({ title: { pt: 'dead_letter.jsonl (' + c.dead.length + ' na fila)', en: 'dead_letter.jsonl (' + c.dead.length + ' queued)' }, json: c.dead.length ? c.dead.slice(-2) : [] });
      o.push({ kind: 'sheet', title: { pt: 'Estado do Sistema B', en: 'System B state' }, cols: ['order', 'id in B', 'attempts received'], rows: Object.keys(c.B.attempts).map(function (k) { return [k, c.B.orders[k] || '—', c.B.attempts[k]]; }) });
      return o;
    },
    verify: function (exp, ctx) {
      var R = ctx.resp; if (!R || R.code !== exp.code) return false;
      if (exp.errors) return JSON.stringify(R.body.errors) === JSON.stringify(exp.errors);
      if (R.body.status !== exp.status || ctx.tries !== exp.attempts) return false;
      if (exp.status === 'synced') return R.body.system_b_id === exp.id && R.body.duplicate === exp.duplicate;
      return ctx.dead.length === exp.dead && ctx.alert.indexOf(exp.alert) === 0;
    }
  };
})();
