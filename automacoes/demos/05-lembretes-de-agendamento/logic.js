/* Nó Code "Pick tomorrow + write messages" = mesmo código do workflow.json. */
(function () {
  var CFG = { data_dir: './data', appointments_file: 'sample_appointments.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"'; };
  function parseCsv(txt) {
    var lines = String(txt || '').split(/\r?\n/).filter(function (l) { return l.trim(); }); if (!lines.length) return [];
    var h = lines[0].split(',');
    return lines.slice(1).map(function (l) { var c = l.split(','), o = {}; h.forEach(function (k, i) { o[k] = c[i] != null ? c[i] : ''; }); return o; });
  }
  function pick(cfg, all) {
    var base = cfg.today ? new Date(cfg.today + 'T00:00:00Z') : new Date();
    if (isNaN(base)) throw new Error('Invalid date in Config.today: ' + cfg.today);
    base.setUTCDate(base.getUTCDate() + 1);
    var target = base.toISOString().slice(0, 10);
    var rows = all.filter(function (r) { return r.date === target; });
    if (!rows.length) return { json: { count: 0, target: target, text: 'No appointments on ' + target + '.' }, items: [] };
    var items = rows.map(function (r) {
      var msg = 'Olá, ' + r.client.split(' ')[0] + '! Lembrete: ' + r.service + ' amanhã às ' + r.time + ' no ' + cfg.business_name + '. Responda 1 para confirmar ou 2 para remarcar.';
      var link = 'https://wa.me/' + r.phone + '?text=' + encodeURIComponent(msg);
      return { time: r.time, client: r.client, phone: r.phone, service: r.service, msg: msg, link: link, line: [target, r.time, r.client, r.phone, r.service, link, msg].map(q).join(',') };
    });
    return { json: { count: rows.length, target: target, text: rows.length + ' reminder(s) queued for ' + target + ': ' + rows.map(function (r) { return r.time + ' ' + r.client; }).join(', ') }, items: items };
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'trigger', pick: pick,
    init: function () { return { outbox: [] }; },
    nodes: {
      trigger: function (i, ctx) { ctx.form = i.body; ctx.res = null; ctx.rows = []; return { out: { timestamp: new Date().toISOString(), mode: 'schedule 18:00' }, ms: 4 }; },
      config: function (i, ctx) { var o = copy(CFG); o.business_name = ctx.form.business || 'Studio'; o.today = ctx.form.today; return { out: o, ms: 3 }; },
      read: function (i, ctx) { return { out: { fileName: CFG.appointments_file, mimeType: 'text/csv', binary: true, fileSize: String(ctx.form.csv || '').length + ' B' }, ms: 10 }; },
      rows: function (i, ctx) { ctx.rows = parseCsv(ctx.form.csv); return { out: { _itens: ctx.rows.length, _mostrando: 2, primeiros: ctx.rows.slice(0, 2) }, ms: 7 }; },
      pick: function (i, ctx) {
        var cfg = copy(CFG); cfg.business_name = ctx.form.business || 'Studio'; cfg.today = ctx.form.today;
        var r = pick(cfg, ctx.rows); ctx.res = r;
        var out = copy(r.json); if (r.items.length) out.mensagens = r.items.map(function (x) { return { to: x.phone, text: x.msg }; });
        return { out: out, ms: 13 };
      },
      any: function (i, ctx) { return { out: i, branch: i.count > 0 ? 'true' : 'false', ms: 2, end: !(i.count > 0) }; },
      outbox: function (i, ctx) { ctx.res.items.forEach(function (x) { ctx.outbox.push([ctx.res.json.target, x.time, x.client, x.phone, x.service]); }); return { out: { appended_rows: ctx.res.items.length, file: CFG.data_dir + '/reminders_outbox.csv' }, ms: 17 }; },
      notify: function (i, ctx) {
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error } }, ms: 0, end: true };
        return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: ctx.res.json.text } }, ms: 176, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], R = c.res;
      if (r.failed || !R) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.' } }];
      if (!R.json.count) return [{ title: { pt: 'Lembretes e aviso ao dono', en: 'Reminders and owner notice' }, skipped: { pt: 'Ninguém agendado para ' + R.json.target + ': o fluxo termina em "Any reminders?" e não manda aviso vazio.', en: 'Nobody booked for ' + R.json.target + ': the flow ends at "Any reminders?" and sends no empty notice.' } }];
      var nt = T('notify', r);
      R.items.forEach(function (x) { o.push({ kind: 'whatsapp', title: { pt: 'Lembrete para ' + x.client, en: 'Reminder for ' + x.client }, from: x.client, text: x.msg, time: x.time }); });
      o.push(nt && nt.out && nt.out.ok ? { kind: 'telegram', title: { pt: 'Resumo para o dono (Telegram)', en: 'Summary for the owner (Telegram)' }, from: 'Agenda', text: R.json.text, time: '18:00' }
        : { kind: 'error', title: { pt: 'Resumo para o dono (Telegram)', en: 'Summary for the owner (Telegram)' }, text: { pt: 'O Telegram ficou fora do ar. A fila de lembretes já foi gravada em reminders_outbox.csv, então nada se perdeu (Continue On Fail).', en: 'Telegram stayed down. The reminder queue was already saved to reminders_outbox.csv, so nothing was lost (Continue On Fail).' } });
      o.push({ kind: 'sheet', title: { pt: 'Fila gravada (reminders_outbox.csv)', en: 'Saved queue (reminders_outbox.csv)' }, cols: ['date', 'time', 'client', 'phone', 'service'], rows: c.outbox.slice(-6), highlightLast: false });
      return o;
    },
    verify: function (exp, ctx) { var R = ctx.res; return R && R.json.count === exp.count && R.json.text === exp.text && R.items[0].msg === exp.first_msg && R.items[0].link === exp.first_link; }
  };
})();
