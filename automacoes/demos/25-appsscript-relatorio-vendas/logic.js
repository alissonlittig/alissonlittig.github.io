/* Code.gs real (buildReport, renderEmail, CONFIG) + encaixe da demo. Conferido contra as saídas gravadas do harness. */
(function () {
/** Relatório semanal de vendas: planilha "Vendas" -> e-mail + linha de log em "Relatórios".
 *  Colunas de Vendas: Data | Vendedor | Produto | Valor | Status
 *  Roda como gatilho semanal (Triggers > Time-driven) chamando sendWeeklyReport(). */
var CONFIG = { to: 'financeiro@empresa.example', today: null, weekDays: 7 };

function parseRow_(r, i) {
  var errs = [];
  var d = r[0] instanceof Date ? r[0] : new Date(String(r[0]) + 'T00:00:00Z');
  if (isNaN(d.getTime())) errs.push('data inválida');
  if (!String(r[1] || '').trim()) errs.push('vendedor vazio');
  var v = typeof r[3] === 'number' ? r[3] : Number(String(r[3]).replace(',', '.'));
  if (!isFinite(v) || v < 0) errs.push('valor inválido');
  return errs.length ? { line: i + 2, errors: errs } : { date: d, seller: String(r[1]).trim(), product: String(r[2]).trim(), value: v, status: String(r[4]).trim().toLowerCase() };
}

/** Função pura (testável fora do Google): rows -> resumo da semana que termina em `end` (YYYY-MM-DD). */
function buildReport(rows, end, days) {
  days = days || 7;
  var endD = new Date(end + 'T00:00:00Z'), startD = new Date(endD.getTime() - (days - 1) * 864e5), prevStart = new Date(startD.getTime() - days * 864e5);
  var cur = [], prev = [], bad = [];
  rows.forEach(function (r, i) {
    var p = parseRow_(r, i); if (p.errors) { bad.push(p); return; }
    if (p.status !== 'pago') return; // só vendas pagas contam
    if (p.date >= startD && p.date <= endD) cur.push(p); else if (p.date >= prevStart && p.date < startD) prev.push(p);
  });
  var sum = function (a) { return a.reduce(function (s, x) { return s + x.value; }, 0); };
  var by = function (a, k) { var m = {}; a.forEach(function (x) { m[x[k]] = (m[x[k]] || 0) + x.value; }); return Object.keys(m).map(function (n) { return [n, Math.round(m[n] * 100) / 100]; }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }); };
  var tot = Math.round(sum(cur) * 100) / 100, ptot = Math.round(sum(prev) * 100) / 100;
  return { week: end, from: startD.toISOString().slice(0, 10), total: tot, previous: ptot, delta_pct: ptot > 0 ? Math.round((tot - ptot) / ptot * 1000) / 10 : null, count: cur.length, sellers: by(cur, 'seller'), products: by(cur, 'product'), skipped: bad };
}

function fmt_(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+,)/g, '.'); }

function renderEmail(rep) {
  var d = rep.delta_pct === null ? 'sem semana anterior para comparar' : (rep.delta_pct >= 0 ? '+' : '') + String(rep.delta_pct).replace('.', ',') + '% vs semana anterior (' + fmt_(rep.previous) + ')';
  var lines = ['Vendas pagas de ' + rep.from + ' a ' + rep.week + ': ' + fmt_(rep.total) + ' em ' + rep.count + ' vendas.', d, '', 'Por vendedor:'];
  rep.sellers.forEach(function (s) { lines.push('  ' + s[0] + ': ' + fmt_(s[1])); });
  lines.push('', 'Por produto:'); rep.products.forEach(function (s) { lines.push('  ' + s[0] + ': ' + fmt_(s[1])); });
  if (rep.skipped.length) { lines.push('', 'ATENÇÃO: ' + rep.skipped.length + ' linha(s) ignorada(s) por erro de dado:'); rep.skipped.forEach(function (b) { lines.push('  linha ' + b.line + ': ' + b.errors.join(', ')); }); }
  return { subject: 'Vendas da semana ' + rep.week + ': ' + fmt_(rep.total), body: lines.join('\n') };
}

/** Ponto de entrada do gatilho. Idempotente: se a semana já está em "Relatórios" com status OK, não reenvia. */
function sendWeeklyReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), log = ss.getSheetByName('Relatórios');
  var end = CONFIG.today || Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  var done = log.getDataRange().getValues().some(function (r) { return r[1] === end && r[3] === 'OK'; });
  if (done) return { status: 'skipped', reason: 'semana ' + end + ' já enviada' };
  var rows = ss.getSheetByName('Vendas').getDataRange().getValues().slice(1);
  var rep = buildReport(rows, end, CONFIG.weekDays), mail = renderEmail(rep);
  try {
    MailApp.sendEmail(CONFIG.to, mail.subject, mail.body);
    log.appendRow([end + 'T12:00:00Z', end, rep.total, 'OK', rep.skipped.length]);
    return { status: 'sent', subject: mail.subject, skipped: rep.skipped.length };
  } catch (e) { // cota de e-mail do Apps Script estourada etc.: registra e deixa o próximo gatilho tentar de novo
    log.appendRow([end + 'T12:00:00Z', end, rep.total, 'ERRO: ' + e.message, rep.skipped.length]);
    return { status: 'error', error: e.message };
  }
}

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
