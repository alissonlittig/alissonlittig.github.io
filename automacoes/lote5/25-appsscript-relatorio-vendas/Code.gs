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
