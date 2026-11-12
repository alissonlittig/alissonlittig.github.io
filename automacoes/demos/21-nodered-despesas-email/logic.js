/* Os nós "function" abaixo são o código EXATO de functions/*.js do flows.json (Node-RED). O csv, o switch, o SMTP e o http são simulados por pequenas funções. */
(function () {
  var cp = function (o) { return JSON.parse(JSON.stringify(o)); };
  var F = {
    hdr: function (msg) { const H = 'employee,date,category,amount,receipt';
const body = typeof msg.payload === 'string' ? msg.payload.trim() : '';
const first = body.split(/\r?\n/)[0] || '';
if (first.trim() !== H) {
    msg.statusCode = 422;
    msg.payload = { error: 'bad header', expected: H, got: first.slice(0, 80) };
    return [null, msg];
}
msg.payload = body;
return [msg, null];
 },
    policy: function (msg) { const CATS = ['travel', 'meals', 'software', 'office'];
const rows = msg.payload, invalid = [], flagged = [], seen = {}, ok = [];
rows.forEach((r, i) => {
    const line = i + 2, amt = Number(r.amount); let why = null;
    if (!String(r.employee || '').trim()) why = 'missing employee';
    else if (!/^2026-10-\d\d$/.test(String(r.date))) why = 'date outside 2026-10';
    else if (!CATS.includes(String(r.category))) why = 'unknown category ' + r.category;
    else if (!(amt > 0)) why = 'amount must be > 0';
    if (why) { invalid.push({ line, why }); return; }
    const key = [r.employee, r.date, r.category, amt].join('|'), flags = [];
    if (amt > 500) flags.push('over 500: manager approval');
    if (String(r.receipt) !== 'yes' && amt > 50) flags.push('receipt required above 50');
    if (seen[key]) flags.push('possible duplicate of line ' + seen[key]); else seen[key] = line;
    ok.push({ line, amount: amt });
    if (flags.length) flagged.push({ line, employee: r.employee, category: r.category, amount: amt, flags });
});
const total = Math.round(ok.reduce((a, r) => a + r.amount * 100, 0)) / 100;
msg.report = { rows: rows.length, valid: ok.length, invalid, flagged, total, needs_action: invalid.length + flagged.length > 0 };
return msg;
 },
    alert: function (msg) { const r = msg.report, L = [];
L.push(`Expense sheet 2026-10: ${r.rows} rows, ${r.valid} valid, total ${r.total.toFixed(2)}.`, '');
if (r.flagged.length) { L.push('Needs review:'); r.flagged.forEach(f => L.push(`- line ${f.line}, ${f.employee}, ${f.category} ${f.amount.toFixed(2)}: ${f.flags.join('; ')}`)); L.push(''); }
if (r.invalid.length) { L.push('Rejected rows (not counted):'); r.invalid.forEach(x => L.push(`- line ${x.line}: ${x.why}`)); }
msg.to = 'finance@example.invalid';
msg.topic = `[ACTION] Expenses 2026-10: ${r.flagged.length} to review, ${r.invalid.length} rejected`;
msg.payload = L.join('\n');
return msg;
 },
    okm: function (msg) { const r = msg.report;
msg.to = 'finance@example.invalid';
msg.topic = `[OK] Expenses 2026-10: ${r.valid} rows, total ${r.total.toFixed(2)}`;
msg.payload = `Expense sheet 2026-10: ${r.rows} rows, all valid, no policy flags. Total ${r.total.toFixed(2)}.`;
return msg;
 },
    rok: function (msg) { msg.statusCode = 200;
msg.payload = { status: 'emailed', subject: msg.topic, rows: msg.report.rows, valid: msg.report.valid, flagged: msg.report.flagged.length, rejected: msg.report.invalid.length, total: msg.report.total };
return msg;
 },
    queue: function (msg) { msg.queued = { subject: msg.topic, to: msg.to, reason: msg.error && msg.error.message };
msg.payload = JSON.stringify({ subject: msg.topic, to: msg.to, body: msg.payload, reason: msg.queued.reason });
return msg;
 },
    rq: function (msg) { msg.statusCode = 202;
msg.payload = { status: 'queued', note: 'e-mail not sent; saved in outbox_retry.jsonl for retry', subject: msg.queued.subject, reason: msg.queued.reason, rows: msg.report.rows, flagged: msg.report.flagged.length, rejected: msg.report.invalid.length };
return msg;
 }
  };
  function csvParse(t) { // nó csv: 1ª linha = nomes das colunas, uma mensagem com o array de linhas
    var L = t.split(/\r?\n/).filter(function (l) { return l.length; }), h = L[0].split(',');
    return L.slice(1).map(function (l) { var c = l.split(','), r = {}; h.forEach(function (k, i) { r[k] = c[i] === undefined ? '' : c[i]; }); return r; });
  }
  window.DEMO = {
    start: 'start',
    init: function () { return { m: null, mail: null, queue: [], inbox: [], res: null }; },
    verify: function (expect, ctx) {
      var r = ctx.res; if (!r || r.statusCode !== expect.status || JSON.stringify(r.payload) !== JSON.stringify(expect.body)) return false;
      if (expect.email) { var m = ctx.inbox[ctx.inbox.length - 1]; return !!m && m.subject === expect.email.subject && m.body.replace(/\r/g, '') === expect.email.body.replace(/\r/g, ''); }
      return true;
    },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.m = { payload: b.sheet }; ctx.smtp = b.smtp; ctx.res = null; return { out: { method: 'POST', url: '/expenses', 'content-type': 'text/csv', payload: String(b.sheet).slice(0, 120) + '…' }, ms: 9 }; },
      hdr: function (i, ctx) { var r = F.hdr(ctx.m); if (r[1]) { ctx.m = r[1]; return { out: r[1].payload, branch: 'bad', ms: 2 }; } ctx.m = r[0]; return { out: { header: 'ok' }, branch: 'ok', ms: 2 }; },
      bad: function (i, ctx) { ctx.res = { statusCode: ctx.m.statusCode, payload: ctx.m.payload }; return { out: ctx.res, ms: 3, end: true }; },
      csv: function (i, ctx) { ctx.m.payload = csvParse(ctx.m.payload); return { out: { rows: ctx.m.payload.length, first: ctx.m.payload[0] }, ms: 6 }; },
      policy: function (i, ctx) { ctx.m = F.policy(ctx.m); var r = ctx.m.report; return { out: { rows: r.rows, valid: r.valid, flagged: r.flagged.length, invalid: r.invalid.length, total: r.total }, ms: 5 }; },
      sw: function (i, ctx) { return { out: { needs_action: ctx.m.report.needs_action }, branch: ctx.m.report.needs_action ? 'action' : 'ok', ms: 1 }; },
      alert: function (i, ctx) { ctx.m = F.alert(ctx.m); return { out: { to: ctx.m.to, topic: ctx.m.topic }, ms: 3 }; },
      okm: function (i, ctx) { ctx.m = F.okm(ctx.m); return { out: { to: ctx.m.to, topic: ctx.m.topic }, ms: 3 }; },
      mail: function (i, ctx) {
        if (ctx.smtp === 'down') { ctx.m.error = { message: 'Error: connect ECONNREFUSED 127.0.0.1:2525' }; return { out: { error: ctx.m.error.message }, branch: 'error', ms: 40 }; }
        ctx.inbox.push({ to: ctx.m.to, subject: ctx.m.topic, body: ctx.m.payload }); return { out: { accepted: [ctx.m.to], response: '250 OK queued' }, branch: 'sent', ms: 210 };
      },
      rok: function (i, ctx) { ctx.m = F.rok(ctx.m); ctx.res = { statusCode: ctx.m.statusCode, payload: ctx.m.payload }; return { out: ctx.res, ms: 3, end: true }; },
      queue: function (i, ctx) { ctx.m = F.queue(ctx.m); return { out: { appended_to: 'output/outbox_retry.jsonl', line: ctx.m.payload.slice(0, 140) + '…' }, ms: 8 }; },
      rq: function (i, ctx) { ctx.queue.push(ctx.m.queued); ctx.m = F.rq(ctx.m); ctx.res = { statusCode: ctx.m.statusCode, payload: ctx.m.payload }; return { out: ctx.res, ms: 3, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var res = c.res, p = res.payload;
      if (res.statusCode === 422) return [{ kind: 'error', title: { pt: 'HTTP 422 · planilha recusada', en: 'HTTP 422 · sheet rejected' }, text: { pt: 'O cabeçalho não é o esperado (' + p.expected + '), então nada foi lido nem enviado. Recebido: "' + p.got + '".', en: 'The header is not the expected one (' + p.expected + '), so nothing was read or sent. Got: "' + p.got + '".' } }, { title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res }];
      var rep = c.m.report;
      if (res.statusCode === 200) { var m = c.inbox[c.inbox.length - 1]; o.push({ kind: 'email', title: { pt: 'E-mail entregue no servidor SMTP local', en: 'E-mail delivered to the local SMTP server' }, subject: m.subject, to: 'To: ' + m.to, text: m.body }); }
      else o.push({ kind: 'error', title: { pt: 'HTTP 202 · e-mail na fila', en: 'HTTP 202 · e-mail queued' }, text: { pt: 'O SMTP recusou a conexão (' + p.reason + '). O fluxo não perdeu o aviso: gravou em outbox_retry.jsonl e respondeu 202 em vez de dizer que enviou.', en: 'SMTP refused the connection (' + p.reason + '). The flow did not lose the alert: it wrote it to outbox_retry.jsonl and answered 202 instead of claiming it was sent.' } });
      o.push({ kind: 'card', title: { pt: 'Resumo da planilha', en: 'Sheet summary' }, rows: [
        [{ pt: 'Linhas lidas / válidas', en: 'Rows read / valid' }, rep.rows + ' / ' + rep.valid],
        [{ pt: 'Para revisar', en: 'To review' }, String(rep.flagged.length), rep.flagged.length ? 'b-warm' : 'b-ok'],
        [{ pt: 'Rejeitadas', en: 'Rejected' }, String(rep.invalid.length), rep.invalid.length ? 'b-warm' : 'b-ok'],
        [{ pt: 'Total (válidas)', en: 'Total (valid)' }, 'US$ ' + rep.total.toFixed(2)]] });
      o.push({ title: { pt: 'Resposta HTTP', en: 'HTTP response' }, json: res });
      return o;
    }
  };
})();
