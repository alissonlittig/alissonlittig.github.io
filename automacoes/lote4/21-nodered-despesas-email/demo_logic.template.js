/* Os nós "function" abaixo são o código EXATO de functions/*.js do flows.json (Node-RED). O csv, o switch, o SMTP e o http são simulados por pequenas funções. */
(function () {
  var cp = function (o) { return JSON.parse(JSON.stringify(o)); };
  var F = {
    hdr: function (msg) { __hdr__ },
    policy: function (msg) { __policy__ },
    alert: function (msg) { __mail_alert__ },
    okm: function (msg) { __mail_ok__ },
    rok: function (msg) { __respond_ok__ },
    queue: function (msg) { __queue_retry__ },
    rq: function (msg) { __respond_queued__ }
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
