/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { log_file: './data/reports_15.csv', mail_url: 'https://mail.example.com/send', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'OWNER_CHAT_ID' };
  var SEED = ["\"2026-11-02T08:00:00.000Z\",\"2026-11-01\",\"Northwind Pottery\",\"6420.5\",\"71\",\"3.2\",\"0\",\"owner@northwind.example\""];

  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { return { rows: SEED.map(parseLine) }; },
    nodes: {
    webhook: function (i, ctx) { Object.keys(ctx).forEach(function (k) { if ((['rows', 'dead', 'ledgerText', 'sim', 'failedNode', 'failedName']).indexOf(k) < 0) delete ctx[k]; }); ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    compute: function (i, ctx) {
var input = ctx.cfg;
var out = (function () {
const b = input.body || {};
const company = String(b.company || '').trim(), lang = b.lang === 'pt' ? 'pt' : 'en', week_end = String(b.week_end || '').trim();
const recipients = String(b.recipients || '').split(',').map(s => s.trim()).filter(Boolean);
if (!company) throw new Error('company is missing');
if (!/^\d{4}-\d{2}-\d{2}$/.test(week_end)) throw new Error('week_end must be YYYY-MM-DD');
if (!recipients.length || recipients.some(r => !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(r))) throw new Error('recipients must be valid e-mail addresses');
const lines = String(b.csv || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const head = (lines.shift() || '').toLowerCase().replace(/\s/g, '');
if (head !== 'date,orders,revenue,new_customers,refunds') throw new Error('CSV header must be date,orders,revenue,new_customers,refunds');
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const byDate = {};
for (const l of lines) { const c = l.split(',').map(s => s.trim()); const n = c.slice(1).map(Number); if (c.length !== 5 || !/^\d{4}-\d{2}-\d{2}$/.test(c[0]) || n.some(x => !Number.isFinite(x) || x < 0)) throw new Error('Bad CSV row: ' + l); byDate[c[0]] = n; }
const days = []; for (let k = 13; k >= 0; k--) days.push(addDays(week_end, -k));
const missing = days.filter(d => !byDate[d]);
if (missing.length) throw new Error('Missing ' + missing.length + ' day(s) of data: ' + missing.slice(0, 3).join(', ') + (missing.length > 3 ? ', ...' : ''));
const sum = ds => ds.reduce((a, d) => { const r = byDate[d]; return { orders: a.orders + r[0], revenue: Math.round((a.revenue + r[1]) * 100) / 100, customers: a.customers + r[2], refunds: a.refunds + r[3] }; }, { orders: 0, revenue: 0, customers: 0, refunds: 0 });
const cur = sum(days.slice(7)), prev = sum(days.slice(0, 7));
const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
const pct = (a, p) => p ? r1((a - p) / p * 100) : null;
const aov = s => s.orders ? r2(s.revenue / s.orders) : 0, rate = s => s.orders ? r1(s.refunds / s.orders * 100) : 0;
const kpis = [
  { key: 'revenue', value: cur.revenue, prev: prev.revenue, delta: pct(cur.revenue, prev.revenue) },
  { key: 'orders', value: cur.orders, prev: prev.orders, delta: pct(cur.orders, prev.orders) },
  { key: 'aov', value: aov(cur), prev: aov(prev), delta: pct(aov(cur), aov(prev)) },
  { key: 'new_customers', value: cur.customers, prev: prev.customers, delta: pct(cur.customers, prev.customers) },
  { key: 'refund_rate', value: rate(cur), prev: rate(prev), delta: r1(rate(cur) - rate(prev)) }];
const daily = days.slice(7).map(d => ({ date: d, revenue: byDate[d][1] })), daily_prev = days.slice(0, 7).map(d => byDate[d][1]);
const flags = [], pt = lang === 'pt';
if (kpis[0].delta !== null && kpis[0].delta <= -20) flags.push(pt ? 'Receita caiu ' + Math.abs(kpis[0].delta) + '% sobre a semana anterior' : 'Revenue fell ' + Math.abs(kpis[0].delta) + '% versus the previous week');
if (kpis[4].value > 5) flags.push(pt ? 'Taxa de reembolso em ' + kpis[4].value + '% (limite 5%)' : 'Refund rate at ' + kpis[4].value + '% (limit 5%)');
if (kpis[3].delta !== null && kpis[3].delta <= -30) flags.push(pt ? 'Novos clientes caíram ' + Math.abs(kpis[3].delta) + '%' : 'New customers fell ' + Math.abs(kpis[3].delta) + '%');
const best = daily.slice().sort((a, c) => c.revenue - a.revenue || a.date.localeCompare(c.date))[0];
return { company, lang, week_start: days[7], week_end, recipients, kpis, daily, daily_prev, best_day: best.date, flags, ignored_rows: lines.length > 14 ? lines.length - 14 : 0, ts: new Date().toISOString() };
})();

return { out: out, ms: 13 };
},
    report: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const pt = input.lang === 'pt';
const money = n => { const p = n.toFixed(2).split('.'); return (pt ? 'R$ ' : '$') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, pt ? '.' : ',') + (pt ? ',' : '.') + p[1]; };
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, pt ? '.' : ',');
const LB = { revenue: pt ? 'Receita' : 'Revenue', orders: pt ? 'Pedidos' : 'Orders', aov: pt ? 'Ticket médio' : 'Avg. order value', new_customers: pt ? 'Novos clientes' : 'New customers', refund_rate: pt ? 'Taxa de reembolso' : 'Refund rate' };
const val = k => k.key === 'revenue' || k.key === 'aov' ? money(k.value) : k.key === 'refund_rate' ? String(k.value).replace('.', pt ? ',' : '.') + '%' : num(k.value);
const dl = k => k.delta === null ? 'n/a' : (k.delta > 0 ? '+' : '') + String(k.delta).replace('.', pt ? ',' : '.') + (k.key === 'refund_rate' ? ' pp' : '%');
const arrow = k => k.delta === null || k.delta === 0 ? '=' : k.delta > 0 ? '▲' : '▼';
const DN = pt ? ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dn = d => DN[new Date(d + 'T00:00:00Z').getUTCDay()];
const vals = input.daily.map(d => d.revenue), mx = Math.max(...vals), mn = Math.min(...vals), blocks = '▁▂▃▄▅▆▇█';
const spark = vals.map(v => blocks[Math.min(7, Math.floor((v - mn) / ((mx - mn) || 1) * 7.999))]).join('');
const svgmax = Math.max(...vals, ...input.daily_prev, 1);
const bars = input.daily.map((d, i) => { const h = Math.round(120 * d.revenue / svgmax), hp = Math.round(120 * input.daily_prev[i] / svgmax), x = 12 + i * 78; return '<rect x="' + x + '" y="' + (150 - hp) + '" width="26" height="' + hp + '" fill="#cfcfc8"/><rect x="' + (x + 28) + '" y="' + (150 - h) + '" width="26" height="' + h + '" fill="#ff7a2f"/><text x="' + (x + 28) + '" y="170" font-size="11" fill="#555">' + dn(d.date) + '</text>'; }).join('');
const chart_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="180" viewBox="0 0 560 180"><rect width="100%" height="100%" fill="#fff"/>' + bars + '</svg>';
const subject = (input.flags.length ? '[!] ' : '') + (pt ? 'Relatório semanal' : 'Weekly report') + ': ' + input.company + ' (' + input.week_start + ' – ' + input.week_end + ')';
const row = k => LB[k.key] + ': ' + val(k) + '  (' + arrow(k) + ' ' + dl(k) + (pt ? ' vs semana anterior)' : ' vs last week)');
const text = (pt ? 'Olá! Os números da semana de ' : 'Hi! Your numbers for the week of ') + input.week_start + ':\n\n' + input.kpis.map(row).join('\n')
  + '\n\n' + (pt ? 'Receita por dia' : 'Revenue per day') + '\n' + spark + '  (' + input.daily.map(d => dn(d.date)).join(' ') + ')\n' + (pt ? 'Melhor dia: ' : 'Best day: ') + dn(input.best_day) + ' ' + input.best_day
  + (input.flags.length ? '\n\n' + (pt ? 'Atenção:' : 'Needs attention:') + '\n' + input.flags.map(f => '- ' + f).join('\n') : '\n\n' + (pt ? 'Nada fora do normal.' : 'Nothing out of the ordinary.'))
  + '\n\n' + (pt ? 'O gráfico em anexo compara com a semana anterior.' : 'The attached chart compares with the previous week.');
const email = { to: input.recipients.join(', '), subject, text, attachments: [{ filename: 'weekly-revenue.svg', content: chart_svg }] };
const alert_text = input.flags.length ? (pt ? 'ATENÇÃO ' : 'ATTENTION ') + input.company + ': ' + input.flags.join(' | ') : '';
const csv_line = [input.ts, input.week_end, input.company, input.kpis[0].value, input.kpis[1].value, input.kpis[0].delta, input.flags.length, input.recipients.join(' ')].map(Q).join(',') + '\n';
return { ...input, subject, email, alert_text, needs_attention: input.flags.length > 0, spark, chart_svg, csv_line };
})();
ctx.rep = out;
return { out: out, ms: 15 };
},
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.rows.push(parseLine(l)); }); return { out: i, ms: 15 }; },
    attn: function (i, ctx) { return { out: i, branch: ctx.rep.needs_attention ? 'true' : 'false', ms: 2 }; },
    alert: function (i, ctx) { ctx.alert = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.rep.alert_text }; return { out: ctx.alert, ms: 196 }; },
    mail: function (i, ctx) {
        if (i && i.__error) { ctx.mail = { error: i.__error }; return { out: ctx.mail, ms: 0 }; }
        ctx.mail = { ok: true, id: 9100 }; return { out: ctx.mail, ms: 233 };
      },
    resp: function (i, ctx) {
var rep = ctx.rep; var mail = ctx.mail;
var out = (function () {
const mail_ok = !!(mail && mail.ok === true && !mail.error);
return { ...rep, mail_ok, response: { company: rep.company, week_end: rep.week_end, revenue: rep.kpis[0].value, revenue_delta_pct: rep.kpis[0].delta, flags: rep.flags.length, email: mail_ok ? 'sent' : 'queued' } };
})();
ctx.final = out;
return { out: out, ms: 7 };
},
    respond: function (i, ctx) { return { out: ctx.final.response, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var k = T('compute', r);
      if (!k) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 e nenhum e-mail sai. É assim de propósito: relatório com dado faltando seria pior do que nenhum relatório.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 and no e-mail goes out. On purpose: a report with missing data is worse than no report.' } }];
      var v = k.out, rp = c.rep, pt = v.lang === 'pt', fin = c.final;
      var dn = pt ? ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var cur = pt ? 'R$ ' : '$', m = function (n) { var p = n.toFixed(2).split('.'); return cur + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, pt ? '.' : ',') + (pt ? ',' : '.') + p[1]; };
      o.push({ kind: 'email', title: { pt: 'E-mail semanal', en: 'Weekly e-mail' }, to: 'To: ' + rp.email.to, subject: rp.subject, text: rp.email.text + '\n\n[ ' + rp.email.attachments[0].filename + ' ]' });
      o.push({ kind: 'chart', title: { pt: 'Gráfico anexo: receita por dia', en: 'Attached chart: revenue per day' }, labels: v.daily.map(function (d) { return dn[new Date(d.date + 'T00:00:00Z').getUTCDay()]; }), values: v.daily.map(function (d) { return d.revenue; }), prev: v.daily_prev,
        fmt: v.daily.map(function (d) { return Math.round(d.revenue); }), curLabel: { pt: 'Esta semana', en: 'This week' }, prevLabel: { pt: 'Semana anterior', en: 'Previous week' }, alt: 'Revenue per day, this week versus last week' });
      if (c.alert) o.push({ kind: 'telegram', title: { pt: 'Alerta ao dono (só quando passa do limite)', en: 'Owner alert (only past a threshold)' }, from: 'KPI Bot', text: c.alert.text, time: hhmm });
      else o.push({ title: { pt: 'Alerta ao dono', en: 'Owner alert' }, skipped: { pt: 'Nenhum indicador passou do limite: sem alerta.', en: 'No KPI crossed a threshold: no alert.' } });
      if (!fin.mail_ok) o.push({ kind: 'error', title: { pt: 'Envio do e-mail', en: 'E-mail delivery' }, text: { pt: 'O servidor de e-mail ficou fora do ar nas 3 tentativas. Nada se perdeu: o relatório já está no registro e a API respondeu "queued" para o sistema reenviar depois (Continue On Fail).', en: 'The mail server stayed down for all 3 attempts. Nothing was lost: the report is already in the log and the API answered "queued" so it can be re-sent (Continue On Fail).' } });
      o.push({ kind: 'sheet', title: { pt: 'Registro de relatórios (reports_15.csv)', en: 'Report log (reports_15.csv)' }, cols: ['week_end', 'company', 'revenue', 'orders', 'revenue_delta_%', 'flags'], rows: c.rows.map(function (x) { return [x[1], x[2], x[3], x[4], x[5], x[6]]; }).slice(-4), highlightLast: true });
      return o;
    }
  };
})();
