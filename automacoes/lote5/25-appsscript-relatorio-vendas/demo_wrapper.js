
  // --- a partir daqui: só o encaixe da demo. SpreadsheetApp/MailApp viram arrays na memória da página; buildReport/renderEmail acima são o Code.gs sem mudança.
  function toRows(t) {
    return String(t || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      return l.split(';').map(function (c) { c = c.trim(); return /^-?\d+(\.\d+)?$/.test(c) ? Number(c) : c; });
    });
  }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { log: [], mails: [], res: null }; },
    verify: function (e, ctx) {
      var last = ctx.mails.length ? ctx.mails[ctx.mails.length - 1] : null;
      return JSON.stringify(ctx.res) === JSON.stringify(e.result) && JSON.stringify(ctx.log) === JSON.stringify(e.log) && ctx.mails.length === e.mails_sent && JSON.stringify(last) === JSON.stringify(e.mail);
    },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.rows = toRows(b.rows); ctx.today = String(b.today).trim(); ctx.quota = b.quota === 'quota'; ctx.res = null; return { out: { trigger: 'time-driven · weekly', today: ctx.today, sheet_rows: ctx.rows.length }, ms: 5 }; },
      check: function (i, ctx) {
        var done = ctx.log.some(function (r) { return r[1] === ctx.today && r[3] === 'OK'; });
        if (done) { ctx.res = { status: 'skipped', reason: 'semana ' + ctx.today + ' já enviada' }; return { out: ctx.res, branch: 'dup', ms: 40 }; }
        return { out: { already_sent: false }, branch: 'new', ms: 40 };
      },
      skip: function (i, ctx) { return { out: ctx.res, ms: 1, end: true }; },
      read: function (i, ctx) { return { out: { rows: ctx.rows.length }, ms: 90 }; },
      build: function (i, ctx) {
        ctx.rep = buildReport(ctx.rows, ctx.today, 7); ctx.mail = renderEmail(ctx.rep);
        return { out: { total: ctx.rep.total, previous: ctx.rep.previous, delta_pct: ctx.rep.delta_pct, paid_sales: ctx.rep.count, skipped_rows: ctx.rep.skipped.length }, ms: 12 };
      },
      send: function (i, ctx) {
        if (ctx.quota) return { out: { error: 'Service invoked too many times for one day: email.' }, branch: 'error', ms: 300 };
        ctx.mails.push({ to: CONFIG.to, subject: ctx.mail.subject, body: ctx.mail.body }); return { out: { sent_to: CONFIG.to }, branch: 'sent', ms: 380 };
      },
      logok: function (i, ctx) { ctx.log.push([ctx.today + 'T12:00:00Z', ctx.today, ctx.rep.total, 'OK', ctx.rep.skipped.length]); ctx.res = { status: 'sent', subject: ctx.mail.subject, skipped: ctx.rep.skipped.length }; return { out: ctx.res, ms: 60, end: true }; },
      logerr: function (i, ctx) { var m = 'Service invoked too many times for one day: email.'; ctx.log.push([ctx.today + 'T12:00:00Z', ctx.today, ctx.rep.total, 'ERRO: ' + m, ctx.rep.skipped.length]); ctx.res = { status: 'error', error: m }; return { out: ctx.res, ms: 60, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], res = c.res;
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (res.status === 'sent') { var m = c.mails[c.mails.length - 1]; o.push({ kind: 'email', title: { pt: 'E-mail enviado (MailApp)', en: 'E-mail sent (MailApp)' }, subject: m.subject, to: 'To: ' + m.to, text: m.body }); }
      if (res.status === 'skipped') o.push({ kind: 'card', title: { pt: 'Gatilho repetido: nada reenviado', en: 'Repeated trigger: nothing resent' }, rows: [[{ pt: 'Motivo', en: 'Reason' }, res.reason], [{ pt: 'E-mails novos', en: 'New e-mails' }, '0', 'b-ok']] });
      if (res.status === 'error') o.push({ kind: 'error', title: { pt: 'Cota de e-mail estourada', en: 'E-mail quota exceeded' }, text: { pt: 'O envio falhou, o erro foi gravado na aba Relatórios e a função terminou sem exceção. O próximo gatilho tenta de novo (rode de novo com a cota "normal").', en: 'Sending failed, the error was logged in the Reports tab and the function ended without throwing. The next trigger tries again (run again with quota "normal").' } });
      if (c.log.length) o.push({ kind: 'sheet', title: { pt: 'Aba "Relatórios" (memória desta página)', en: 'Sheet "Relatórios" (this page memory)' }, cols: ['enviado_em', 'semana', 'total', 'status', 'linhas_ignoradas'], rows: c.log.slice(), highlightLast: true });
      o.push({ title: { pt: 'Retorno de sendWeeklyReport()', en: 'sendWeeklyReport() return' }, json: res });
      return o;
    }
  };
})();
