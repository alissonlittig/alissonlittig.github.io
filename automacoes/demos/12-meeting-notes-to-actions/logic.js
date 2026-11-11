/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { tasks_file: './data/tasks_12.csv', crm_url: 'https://crm.example.com/api/notes', mail_url: 'https://mail.example.com/send', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'ORGANIZER_CHAT_ID', today: '2026-11-11' };
  var SEED = ["\"2026-11-04T16:00:00.000Z\",\"Weekly ops sync\",\"Renew the domain\",\"Marco Reyes\",\"2026-11-06\",\"open\""];
  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { return { tasks: SEED.map(parseLine) }; },
    nodes: {
    webhook: function (i, ctx) { ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 12 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; return { out: o, ms: 4 }; },
    extract: function (i, ctx) {
var input = i;
var out = (function () {
const b = input.body || {};
const title = String(b.title || '').trim(), date = String(b.date || input.today).trim();
const attendees = String(b.attendees || '').split(',').map(s => s.trim()).filter(Boolean);
const lines = String(b.transcript || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const turns = lines.map(l => { const m = l.match(/^([A-Za-zÀ-ÿ'. -]{2,30}):\s*(.+)$/); return m ? { who: m[1].trim(), text: m[2].trim() } : null; }).filter(Boolean);
if (!title) throw new Error('title is missing');
if (!attendees.length) throw new Error('No attendees listed');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');
if (turns.length < 3) throw new Error('Transcript too short: need at least 3 "Name: text" lines (got ' + turns.length + ')');
const all = turns.map(t => t.text).join(' ');
const lang = /\b(vamos|preciso|pode|prazo|até|amanhã|sexta|decidimos|combinado|reunião|obrigad[oa]|você|vou|fechado)\b/i.test(all) ? 'pt' : 'en';
const att = attendees.map(a => ({ name: a, key: a.split(' ')[0].toLowerCase() }));
const findAtt = s => att.find(a => a.key === String(s).toLowerCase());
const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0, segunda: 1, terça: 2, terca: 2, quarta: 3, quinta: 4, sexta: 5, sábado: 6, sabado: 6, domingo: 0 };
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dow = new Date(date + 'T00:00:00Z').getUTCDay();
const dueOf = t => {
  const s = t.toLowerCase(); let m;
  if ((m = s.match(/\b(20\d{2}-\d{2}-\d{2})\b/))) return m[1];
  if (/\b(tomorrow|amanhã|amanha)\b/.test(s)) return addDays(date, 1);
  if (/\b(today|hoje|end of (the )?day)\b/.test(s)) return date;
  if (/(next week|semana que vem|próxima semana)/.test(s)) return addDays(date, ((8 - dow) % 7 || 7) + 4);
  for (const k in days) if (new RegExp('\\b' + k + '\\b').test(s)) return addDays(date, ((days[k] - dow + 7) % 7) || 7);
  return '';
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const decisions = [], actions = [], context = [];
for (const t of turns) {
  for (const sent of t.text.split(/(?<=[.!?])\s+/).filter(Boolean)) {
    let owner = null, task = null, m;
    if ((m = sent.match(/^([A-Za-zÀ-ÿ]+),?\s+(?:can|could|would|pode|consegue)\s+you\s+(.+)$/i)) || (m = sent.match(/^([A-Za-zÀ-ÿ]+),?\s+(?:você\s+)?(?:pode|consegue)\s+(.+)$/i))) { owner = findAtt(m[1]); task = m[2]; }
    else if ((m = sent.match(/\b(?:I'll|I will|I can take|I'm going to|vou|eu faço|eu mando|fico com)\s+(.+)$/i))) { owner = findAtt(t.who.split(' ')[0]); task = m[1]; }
    if (task) { task = cap(task.replace(/[.!?]+$/, '').replace(/^(also|também)\s+/i, '')); actions.push({ task, owner: owner ? owner.name : '', due: dueOf(sent), by: t.who }); continue; }
    if (/\b(we (decided|agreed)|let's go with|decided to|agreed on|decidimos|ficou combinado|vamos com|fechado)\b/i.test(sent)) { decisions.push(sent.replace(/[.!?]+$/, '')); continue; }
    const score = (sent.length > 40 && sent.length < 170 ? 1 : 0) + (/\d/.test(sent) ? 2 : 0) + (/(launch|budget|deadline|customer|price|churn|release|prazo|orçamento|cliente|lançamento|preço)/i.test(sent) ? 2 : 0);
    if (score >= 2) context.push({ s: sent.replace(/[.!?]+$/, ''), score });
  }
}
const summary = context.sort((a, b) => b.score - a.score).slice(0, 3).map(c => c.s);
const review = actions.filter(a => !a.owner || !a.due).map(a => a.task + ' (' + [!a.owner ? 'no owner' : '', !a.due ? 'no due date' : ''].filter(Boolean).join(', ') + ')');
return { title, date, lang, attendees, turns: turns.length, summary, decisions, actions, needs_review: review.length, review_items: review, crm_account: String(b.crm_account || ''), ts: new Date().toISOString() };
})();

return { out: out, ms: 14 };
},
    tasks: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const csv_line = input.actions.map(a => [input.ts, input.title, a.task, a.owner || 'UNASSIGNED', a.due || 'NO DATE', a.owner && a.due ? 'open' : 'needs review'].map(Q).join(',') + '\n').join('');
return { ...input, csv_line, task_rows: input.actions.length };
})();
ctx.tk = out;
return { out: out, ms: 6 };
},
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.tasks.push(parseLine(l)); }); return { out: i, ms: 15 }; },
    crm: function (i, ctx) {
        if (i && i.__error) { ctx.crm = { error: i.__error }; return { out: ctx.crm, ms: 0 }; }
        ctx.n = (ctx.n || 0) + 1; ctx.crm = { ok: true, id: 7700 + ctx.n }; return { out: ctx.crm, ms: 188 };
      },
    recap: function (i, ctx) {
var input = ctx.tk; var crm = ctx.crm;
var out = (function () {
const crm_ok = !!(crm && crm.ok === true && !crm.error);
const pt = input.lang === 'pt';
const li = a => '- ' + (a.owner || (pt ? 'SEM RESPONSÁVEL' : 'UNASSIGNED')) + ': ' + a.task + ' (' + (a.due || (pt ? 'sem prazo' : 'no due date')) + ')';
const sec = (h, arr, f) => arr.length ? h + '\n' + arr.map(f).join('\n') + '\n\n' : '';
const subject = (pt ? 'Resumo: ' : 'Recap: ') + input.title + ' (' + input.date + ')';
const text = (pt ? 'Olá, segue o resumo da reunião.\n\n' : 'Hi all, here is the recap.\n\n') + sec(pt ? 'Resumo' : 'Summary', input.summary, s => '- ' + s) + sec(pt ? 'Decisões' : 'Decisions', input.decisions, s => '- ' + s) + sec(pt ? 'Ações' : 'Action items', input.actions, li)
  + (crm_ok ? (pt ? 'Nota salva no CRM (#' + crm.id + ').' : 'Note saved to the CRM (#' + crm.id + ').') : (pt ? 'CRM indisponível: a nota ficou na fila para reenvio.' : 'CRM unavailable: the note was queued for retry.'));
const review_text = input.needs_review ? 'REVIEW NEEDED: ' + input.title + '\n' + input.review_items.map(x => '- ' + x).join('\n') : '';
return { ...input, crm_ok, crm_id: crm_ok ? crm.id : null, email: { to: input.attendees.join(', '), subject, text }, review_text, response: { meeting: input.title, decisions: input.decisions.length, actions: input.actions.length, needs_review: input.needs_review, crm: crm_ok ? 'saved' : 'queued' } };
})();

return { out: out, ms: 8 };
},
    review: function (i) { return { out: i, branch: i.needs_review > 0 ? 'true' : 'false', ms: 2 }; },
    ask: function (i) { var o = copy(i); o.sent = { chat_id: CFG.notify_chat_id, text: i.review_text }; return { out: o, ms: 205 }; },
    mail: function (i, ctx) { var o = copy(i); o.sent_mail = { ok: true, to: i.email.to, subject: i.email.subject }; return { out: o, ms: 240 }; },
    respond: function (i) { return { out: i.response, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var ex = T('extract', r);
      if (!ex) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 e nada é gravado nem enviado. É assim de propósito: ata ruim não vira tarefa falsa.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 and nothing is written or sent. On purpose: a bad transcript must not create fake tasks.' } }];
      var v = ex.out, rc = T('recap', r).out;
      o.push({ kind: 'card', title: { pt: 'O que foi extraído', en: 'What was extracted' }, rows: [
        [{ pt: 'Idioma', en: 'Language' }, v.lang.toUpperCase()], [{ pt: 'Falas lidas', en: 'Turns read' }, String(v.turns)],
        [{ pt: 'Decisões', en: 'Decisions' }, v.decisions.length ? v.decisions.join(' | ') : '-'], [{ pt: 'Ações', en: 'Action items' }, String(v.actions.length)],
        [{ pt: 'Precisam de revisão', en: 'Need review' }, String(v.needs_review), v.needs_review ? 'b-warm' : 'b-ok']] });
      o.push({ kind: 'email', title: { pt: 'Resumo enviado aos participantes', en: 'Recap sent to attendees' }, to: 'To: ' + rc.email.to, subject: rc.email.subject, text: rc.email.text });
      if (v.needs_review) { var as = T('ask', r); if (as) o.push({ kind: 'telegram', title: { pt: 'Telegram para o organizador', en: 'Telegram to the organizer' }, from: 'Meeting Bot', text: as.out.sent.text, time: hhmm }); }
      else o.push({ title: { pt: 'Telegram para o organizador', en: 'Telegram to the organizer' }, skipped: { pt: 'Toda ação tem responsável e prazo: ninguém precisa ser cobrado.', en: 'Every action has an owner and a due date: nothing to chase.' } });
      if (rc.crm_ok) o.push({ kind: 'card', title: { pt: 'Nota no CRM', en: 'CRM note' }, rows: [[{ pt: 'Conta', en: 'Account' }, v.crm_account || '-'], [{ pt: 'Nota', en: 'Note' }, '#' + rc.crm_id], [{ pt: 'Resumo', en: 'Summary' }, v.summary.join(' | ') || '-'], [{ pt: 'Tarefas', en: 'Tasks' }, String(v.actions.length)]] });
      else o.push({ kind: 'error', title: { pt: 'Nota no CRM', en: 'CRM note' }, text: { pt: 'O CRM ficou fora do ar nas 3 tentativas. Nada se perdeu: as tarefas já estão na planilha, o resumo saiu por e-mail avisando que a nota está na fila, e um reenvio pode ser rodado depois (Continue On Fail).', en: 'The CRM stayed down for all 3 attempts. Nothing was lost: the tasks are already in the sheet, the recap went out saying the note is queued, and a retry can run later (Continue On Fail).' } });
      o.push({ kind: 'sheet', title: { pt: 'Tarefas (tasks_12.csv)', en: 'Tasks (tasks_12.csv)' }, cols: ['meeting', 'task', 'owner', 'due', 'status'], rows: c.tasks.map(function (x) { return [x[1], x[2], x[3], x[4], x[5]]; }).slice(-6), highlightLast: true });
      return o;
    }
  };
})();
