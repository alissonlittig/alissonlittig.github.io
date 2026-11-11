/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { agenda_file: './data/agenda_13.csv', wa_url: 'https://graph.facebook.com/v20.0/<PHONE_ID>/messages', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'OWNER_CHAT_ID', today: '2026-11-11' };
  var SEED = ["\"2026-11-09T10:00:00.000Z\",\"BK-001\",\"2026-11-12\",\"10:00\",\"45\",\"Corte\",\"Marcos Pinto\",\"5541988880001\",\"confirmed\"", "\"2026-11-09T11:00:00.000Z\",\"BK-002\",\"2026-11-12\",\"14:00\",\"120\",\"Colora\u00e7\u00e3o\",\"Bia Torres\",\"5541988880002\",\"confirmed\"", "\"2026-11-10T09:30:00.000Z\",\"BK-003\",\"2026-11-13\",\"15:00\",\"30\",\"Barba\",\"Renato Alves\",\"5541988880003\",\"confirmed\"", "\"2026-11-10T15:00:00.000Z\",\"BK-004\",\"2026-11-14\",\"11:00\",\"40\",\"Escova\",\"Camila Rocha\",\"5541999990000\",\"confirmed\""];
  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var HEADER = 'ts,booking_id,date,time,duration,service,customer,phone,status';
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  var meta = function (ctx) { return { fileName: 'agenda_13.csv', mimeType: 'text/csv', fileSize: (ctx.agenda.length * 0.15 + 0.1).toFixed(1) + ' kB' }; };

  window.DEMO = {
    start: 'webhook',
    init: function () { var ctx = { agenda: SEED.map(parseLine) };
      ctx.agendaText = function () { return HEADER + '\n' + ctx.agenda.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); };
      return ctx; },
    nodes: {
    webhook: function (i, ctx) { ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    understand: function (i, ctx) {
var input = ctx.cfg;
var out = (function () {
const b = input.body || {};
const text = String(b.text || '').trim(), phone = String(b.from || '').replace(/\D/g, ''), name = String(b.name || '').trim();
if (phone.length < 10) throw new Error('Invalid sender phone');
if (!text) throw new Error('Empty message (media without text is not handled)');
const low = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let intent = 'other';
if (/(cancel|desmarc|nao vou poder|nao posso ir)/.test(low)) intent = 'cancel';
else if (/(agend|marc(ar|a)|horario|quero|queria|gostaria|book|appointment|disponiv|vaga|amanha|hoje|tomorrow)/.test(low)) intent = 'book';
else if (/(quanto|preco|valor|price|how much|tabela)/.test(low)) intent = 'price';
const service = /(corte|cabelo|haircut)/.test(low) ? 'Corte' : /(barba|beard)/.test(low) ? 'Barba' : /(coloracao|pintar|tintura|color)/.test(low) ? 'Coloração' : /(escova|brushing)/.test(low) ? 'Escova' : '';
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const today = input.today, dow = new Date(today + 'T00:00:00Z').getUTCDay();
const wd = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
let date = '', m;
if ((m = low.match(/\b(20\d{2}-\d{2}-\d{2})\b/))) date = m[1];
else if ((m = low.match(/\b(\d{1,2})\/(\d{1,2})\b/))) date = today.slice(0, 4) + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
else if (/depois de amanha/.test(low)) date = addDays(today, 2);
else if (/(amanha|tomorrow)/.test(low)) date = addDays(today, 1);
else if (/(hoje|today)/.test(low)) date = today;
else for (const k in wd) if (new RegExp('\\b' + k + '\\b').test(low)) { date = addDays(today, ((wd[k] - dow + 7) % 7) || 7); break; }
let time = '';
if ((m = low.match(/\b(\d{1,2})\s*(?:h|hs|:)\s*(\d{2})?\b/)) || (m = low.match(/\b(?:as|at)\s*(\d{1,2})\b()/))) { const h = Number(m[1]); if (h >= 0 && h <= 23) time = String(h).padStart(2, '0') + ':' + (m[2] || '00'); }
const period = /\b(manha|morning)\b/.test(low) ? 'morning' : /\b(tarde|afternoon)\b/.test(low) ? 'afternoon' : /\b(noite|evening)\b/.test(low) ? 'evening' : '';
return { today: input.today, phone, name, text, intent, service, date, time, period };
})();
ctx.u = out;
return { out: out, ms: 8 };
},
    read: function (i, ctx) { return { out: meta(ctx), ms: 6 }; },
    slots: function (i, ctx) {
var input = ctx.u; var agendaText = ctx.agendaText();
var out = (function () {
const parse = line => { const c = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
const rows = agendaText.split(/\r?\n/).slice(1).filter(Boolean).map(parse);
const latest = {}; rows.forEach(r => { latest[r[1]] = r; });
const live = Object.values(latest).filter(r => r[8] === 'confirmed');
const SERVICES = { 'Corte': [45, 60], 'Barba': [30, 40], 'Coloração': [120, 180], 'Escova': [40, 50] };
const toMin = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)), fmt = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const lastId = rows.reduce((mx, r) => Math.max(mx, Number(String(r[1]).replace(/\D/g, '')) || 0), 0);
const booking_id = 'BK-' + String(lastId + 1).padStart(3, '0');
const [dur, price] = SERVICES[input.service] || [0, 0];
const OPEN = 540, CLOSE = 1080;
const freeSlots = d => { if (new Date(d + 'T00:00:00Z').getUTCDay() === 0) return []; const busy = live.filter(r => r[2] === d).map(r => [toMin(r[3]), toMin(r[3]) + Number(r[4])]); const out = [];
  for (let s = OPEN; s + dur <= CLOSE; s += 30) if (!busy.some(([a, z]) => s < z && s + dur > a)) out.push(s); return out; };
let outcome = 'handoff', slot = '', options = [], target = null, missing = '', day = input.date;
if (input.intent === 'price') outcome = 'info';
else if (input.intent === 'cancel') { outcome = 'cancel'; target = live.filter(r => r[7] === input.phone && r[2] >= input.today).sort((a, b) => (a[2] + a[3]).localeCompare(b[2] + b[3]))[0] || null; }
else if (input.intent === 'book') {
  if (!input.service) { outcome = 'offer'; missing = 'service'; }
  else if (!input.date || input.date < input.today) { outcome = 'offer'; missing = 'date'; }
  else {
    const want = input.time ? toMin(input.time) : null, per = input.period === 'morning' ? [OPEN, 720] : input.period === 'afternoon' ? [720, CLOSE] : null;
    let free = freeSlots(day);
    if (want !== null && free.includes(want)) { outcome = 'book'; slot = fmt(want); }
    else {
      outcome = 'offer';
      let pool = per ? free.filter(s => s >= per[0] && s < per[1]) : free;
      if (want !== null) pool = free.slice().sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
      options = pool.slice(0, 3).sort((a, b) => a - b).map(s => ({ date: day, time: fmt(s) }));
      for (let k = 1; options.length === 0 && k <= 4; k++) { const nd = addDays(day, k), f = freeSlots(nd); if (f.length) options.push({ date: nd, time: fmt(f[0]) }); }
    }
  }
}
return { ...input, outcome, duration: dur, price, slot, options, missing, booking_id, target: target ? { booking_id: target[1], date: target[2], time: target[3], duration: target[4], service: target[5], customer: target[6], phone: target[7] } : null };
})();
ctx.s = out;
return { out: out, ms: 12, branch: out.outcome };
},
    route: function (i) { return { out: i, branch: i.outcome, ms: 2 }; },
    book: function (i, ctx) {
var input = i;
var out = (function () {
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const when = (d, t) => WD[new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7) + (t ? ' às ' + t : '');
const first = String(input.name || '').split(' ')[0] || 'tudo bem';
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
const ts = new Date().toISOString();

const csv_line = [ts, input.booking_id, input.date, input.slot, input.duration, input.service, input.name || input.phone, input.phone, 'confirmed'].map(Q).join(',') + '\n';
const reply = 'Pronto, ' + first + '! ' + input.service + ' confirmado para ' + when(input.date, input.slot) + ' (' + input.duration + ' min, R$ ' + input.price + '). Se precisar remarcar, é só responder aqui.';
return { ...input, csv_line, reply, alert_owner: false, owner_alert: '' };
})();

return { out: out, ms: 7 };
},
    offer: function (i, ctx) {
var input = i;
var out = (function () {
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const when = (d, t) => WD[new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7) + (t ? ' às ' + t : '');
const first = String(input.name || '').split(' ')[0] || 'tudo bem';
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
const ts = new Date().toISOString();

let reply;
if (input.missing === 'service') reply = 'Oi, ' + first + '! Qual serviço você quer? Corte (R$ 60), Barba (R$ 40), Coloração (R$ 180) ou Escova (R$ 50)?';
else if (input.missing === 'date') reply = 'Combinado, ' + input.service + '! Para qual dia você prefere? Atendemos de segunda a sábado, das 9h às 18h.';
else if (!input.options.length) reply = 'Não encontrei horário livre para ' + input.service + ' nos próximos dias. Vou pedir para a equipe te ajudar.';
else reply = (input.time ? 'Esse horário já está ocupado. ' : '') + 'Tenho estas opções para ' + input.service + ':\n' + input.options.map((o, i) => (i + 1) + ') ' + when(o.date, o.time)).join('\n') + '\nResponda com o número ou o horário que preferir.';
return { ...input, csv_line: '', reply, alert_owner: !input.options.length && !input.missing, owner_alert: !input.options.length && !input.missing ? 'No free slot found for ' + input.service + ' (' + input.name + ', +' + input.phone + ')' : '' };
})();

return { out: out, ms: 7 };
},
    cancel: function (i, ctx) {
var input = i;
var out = (function () {
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const when = (d, t) => WD[new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7) + (t ? ' às ' + t : '');
const first = String(input.name || '').split(' ')[0] || 'tudo bem';
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
const ts = new Date().toISOString();

if (!input.target) return { ...input, csv_line: '', reply: 'Não encontrei nenhum agendamento futuro neste número. Se quiser marcar um horário novo, é só dizer o serviço e o dia.', alert_owner: false, owner_alert: '' };
const t = input.target;
const csv_line = [ts, t.booking_id, t.date, t.time, t.duration, t.service, t.customer, t.phone, 'cancelled'].map(Q).join(',') + '\n';
return { ...input, csv_line, reply: 'Cancelei seu ' + t.service + ' de ' + when(t.date, t.time) + '. Quer remarcar para outro dia?', alert_owner: false, owner_alert: '' };
})();

return { out: out, ms: 7 };
},
    info: function (i, ctx) {
var input = i;
var out = (function () {
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const when = (d, t) => WD[new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7) + (t ? ' às ' + t : '');
const first = String(input.name || '').split(' ')[0] || 'tudo bem';
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
const ts = new Date().toISOString();

return { ...input, csv_line: '', reply: 'Nossa tabela: Corte R$ 60 (45 min), Barba R$ 40 (30 min), Coloração R$ 180 (2 h), Escova R$ 50 (40 min). Quer agendar algum?', alert_owner: false, owner_alert: '' };
})();

return { out: out, ms: 7 };
},
    handoff: function (i, ctx) {
var input = i;
var out = (function () {
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const when = (d, t) => WD[new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7) + (t ? ' às ' + t : '');
const first = String(input.name || '').split(' ')[0] || 'tudo bem';
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
const ts = new Date().toISOString();

return { ...input, csv_line: '', reply: 'Obrigada pela mensagem, ' + first + '! Já avisei a equipe e alguém responde em instantes.', alert_owner: true, owner_alert: 'HUMAN NEEDED: ' + (input.name || 'customer') + ' (+' + input.phone + ') wrote: "' + input.text + '"' };
})();

return { out: out, ms: 7 };
},
    ack: function (i, ctx) { ctx.msg = i; return { out: i, ms: 5 }; },
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.agenda.push(parseLine(l)); }); return { out: i, ms: 16 }; },
    send: function (i, ctx) {
        if (i && i.__error) { ctx.sent = { error: i.__error }; return { out: ctx.sent, ms: 0 }; }
        ctx.n = (ctx.n || 0) + 1; ctx.sent = { ok: true, id: 'wamid.' + (100 + ctx.n) }; return { out: ctx.sent, ms: 231 };
      },
    alertif: function (i, ctx) { return { out: i, branch: (ctx.msg.alert_owner || (i && i.error)) ? 'true' : 'false', ms: 2 }; },
    alert: function (i, ctx) {
        var m = ctx.msg, text = ctx.sent && ctx.sent.error ? 'WHATSAPP DELIVERY FAILED for +' + m.phone + ' (' + m.outcome + '). Reply by hand.' : m.owner_alert;
        return { out: { ok: true, chat_id: CFG.notify_chat_id, text: text }, ms: 197, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var u = T('understand', r);
      if (!u) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. Nada é gravado e nenhuma resposta sai. É assim de propósito: figurinha ou número inválido não vira agendamento.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. Nothing is written and no reply goes out. On purpose: a sticker or an invalid number never becomes a booking.' } }];
      var s = T('slots', r).out, last = c.msg;
      var OUT = { book: { pt: 'Reservar', en: 'Book' }, offer: { pt: 'Oferecer horários', en: 'Offer slots' }, cancel: { pt: 'Cancelar', en: 'Cancel' }, info: { pt: 'Responder preço', en: 'Answer price' }, handoff: { pt: 'Passar para humano', en: 'Hand off to a human' } };
      var rows = [[{ pt: 'Intenção', en: 'Intent' }, s.intent, s.intent === 'other' ? 'b-warm' : 'b-ok'], [{ pt: 'Serviço', en: 'Service' }, s.service || '-'], [{ pt: 'Data', en: 'Date' }, s.date || '-'], [{ pt: 'Hora / período', en: 'Time / period' }, (s.time || '-') + ' / ' + (s.period || '-')], [{ pt: 'Resultado', en: 'Outcome' }, (OUT[s.outcome].pt + ' / ' + OUT[s.outcome].en)]];
      o.push({ kind: 'card', title: { pt: 'O que o fluxo entendeu', en: 'What the flow understood' }, rows: rows });
      var sent = c.sent && !c.sent.error;
      o.push({ kind: 'whatsapp', title: { pt: 'Mensagem da cliente', en: 'Customer message' }, from: last.name || last.phone, text: last.text, time: hhmm });
      if (sent) o.push({ kind: 'whatsapp', title: { pt: 'Resposta automática (wamid ' + c.sent.id + ')', en: 'Automatic reply (wamid ' + c.sent.id + ')' }, from: 'Salão Aurora', text: last.reply, time: hhmm });
      if (!sent) o.push({ kind: 'error', title: { pt: 'Envio no WhatsApp', en: 'WhatsApp send' }, text: { pt: 'A API do WhatsApp falhou nas 3 tentativas. O agendamento NÃO se perdeu: já está na agenda. O dono recebe um alerta para responder à mão (Continue On Fail).', en: 'The WhatsApp API failed on all 3 attempts. The booking was NOT lost: it is already in the agenda. The owner gets an alert to reply by hand (Continue On Fail).' } });
      var al = T('alert', r);
      if (al) o.push({ kind: 'telegram', title: { pt: 'Alerta ao dono (Telegram)', en: 'Owner alert (Telegram)' }, from: 'Salon Bot', text: al.out.text, time: hhmm });
      else o.push({ title: { pt: 'Alerta ao dono (Telegram)', en: 'Owner alert (Telegram)' }, skipped: { pt: 'A conversa foi resolvida sozinha: ninguém precisa ser incomodado.', en: 'The conversation was resolved on its own: nobody needs to be disturbed.' } });
      o.push({ kind: 'sheet', title: { pt: 'Agenda (agenda_13.csv)', en: 'Agenda (agenda_13.csv)' }, cols: ['booking_id', 'date', 'time', 'service', 'customer', 'status'], rows: c.agenda.map(function (x) { return [x[1], x[2], x[3], x[5], x[6], x[8]]; }).slice(-6), highlightLast: true });
      return o;
    }
  };
})();
