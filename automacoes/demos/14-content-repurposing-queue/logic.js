/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { queue_file: './data/queue_14.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'EDITOR_CHAT_ID', today: '2026-11-11' };
  var SEED = ["\"2026-11-09T08:00:00.000Z\",\"CT-spring-offer-announcement\",\"linkedin\",\"2026-11-10 09:00\",\"published\",\"412\",\"Spring offer is live\""];
  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { return { queue: SEED.map(parseLine) }; },
    nodes: {
    webhook: function (i, ctx) { ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    analyze: function (i, ctx) {
var input = ctx.cfg;
var out = (function () {
const b = input.body || {};
const title = String(b.title || '').trim(), url = String(b.url || '').trim(), article = String(b.article || '').replace(/\s+/g, ' ').trim();
const date = String(b.publish_date || input.today).trim(), tone = b.tone === 'friendly' ? 'friendly' : 'professional';
if (!title) throw new Error('title is missing');
if (!/^https?:\/\/\S+$/.test(url)) throw new Error('url must start with http:// or https://');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('publish_date must be YYYY-MM-DD');
if (article.length < 400) throw new Error('Article too short: ' + article.length + ' characters, need at least 400');
const lang = /\b(para|você|são|uma|não|com|mais|isso|nossa|nosso|pequenas)\b/i.test(article) ? 'pt' : 'en';
const STOP = /^(that|this|with|from|have|about|which|their|there|would|these|those|where|while|para|como|mais|isso|esta|esse|são|uma|nosso|nossa|pelos|pelas|quando|porque)$/;
const tw = (title.toLowerCase().match(/[a-zà-ÿ]{5,}/g) || []).filter(w => !STOP.test(w));
const sents = article.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length >= 30);
const scored = sents.map((s, i) => ({ s, i, score: (s.length >= 40 && s.length <= 200 ? 1 : 0) + (/\d/.test(s) ? 2 : 0) + (tw.some(w => s.toLowerCase().includes(w)) ? 2 : 0) + (i === 0 || i === sents.length - 1 ? 1 : 0) }));
const cut = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
const points = scored.slice().sort((a, b) => b.score - a.score || a.i - b.i).slice(0, 3).sort((a, b) => a.i - b.i).map(x => cut(x.s.replace(/[.!?]+$/, ''), 200));
const freq = {}; (article.toLowerCase().match(/[a-zà-ÿ]{6,}/g) || []).filter(w => !STOP.test(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
const keywords = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b)).slice(0, 3);
return { title, url, tone, publish_date: date, lang, points, keywords, words: article.split(/\s+/).length };
})();

return { out: out, ms: 12 };
},
    draft: function (i, ctx) {
var input = i;
var out = (function () {
const pt = input.lang === 'pt', fr = input.tone === 'friendly';
const open = pt ? (fr ? 'Saiu do forno: ' : 'Novo artigo: ') : (fr ? 'Fresh off the blog: ' : 'New article: ');
const cta = pt ? 'Texto completo:' : 'Read the full piece:';
const tags = input.keywords.map(k => '#' + k.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^./, c => c.toUpperCase())).join(' ');
const linkedin = open + input.title + '\n\n' + (pt ? 'O que vale guardar:' : 'What is worth keeping:') + '\n' + input.points.map(p => '– ' + p).join('\n') + '\n\n' + cta + ' ' + input.url + '\n\n' + tags;
const n = input.points.length + 2;
const cut = (s, m) => s.length <= m ? s : s.slice(0, m - 1).replace(/\s+\S*$/, '') + '…';
let trimmed = 0;
const raw = [input.title + (pt ? ' Um fio:' : ' A thread:') + ' (1/' + n + ')'].concat(input.points.map((p, i) => (i + 2) + '/' + n + ' ' + p)).concat([cta + ' ' + input.url + ' (' + n + '/' + n + ')']);
const thread = raw.map(t => { if (t.length > 280) { trimmed++; return cut(t, 280); } return t; });
const newsletter = { subject: cut(input.title, 60), body: (pt ? 'Olá! Esta semana no blog:\n\n' : 'Hi! This week on the blog:\n\n') + input.points.map(p => '• ' + p).join('\n') + '\n\n' + cta + ' ' + input.url };
return { ...input, linkedin, thread, newsletter, limits: { linkedin_chars: linkedin.length, max_tweet: Math.max(...thread.map(t => t.length)), trimmed } };
})();

return { out: out, ms: 14 };
},
    brand: function (i, ctx) {
var input = i;
var out = (function () {
const all = input.linkedin + ' ' + input.thread.join(' ') + ' ' + input.newsletter.body;
const found = all.match(/(guarantee[d]?|100%|best in the world|risk[- ]free|garantid[oa]|melhor do mundo|sem riscos?|milagr\w+)/gi) || [];
const flags = [...new Set(found.map(x => x.toLowerCase()))];
if (input.limits.linkedin_chars > 3000) flags.push('LinkedIn post over 3000 characters');
return { ...input, flags, flagged: flags.length > 0 };
})();

return { out: out, ms: 6 };
},
    flag: function (i, ctx) { ctx.draft = i; return { out: i, branch: i.flagged ? 'true' : 'false', ms: 2 }; },
    hold: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const addDays = (d, k) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + k); return x.toISOString().slice(0, 10); };
const dowOf = d => new Date(d + 'T00:00:00Z').getUTCDay();
let li = addDays(input.publish_date, 1); while (![2, 3, 4].includes(dowOf(li))) li = addDays(li, 1);
const x = addDays(li, 1);
let nl = li; while (dowOf(nl) !== 5) nl = addDays(nl, 1);
const sched = { linkedin: li + ' 09:00', x_thread: x + ' 12:00', newsletter: nl + ' 08:00' };
const slug = input.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
const content_id = 'CT-' + slug;
const ts = new Date().toISOString();

const status = 'needs_edit';
const prev = { linkedin: input.linkedin, x_thread: input.thread.join(' || '), newsletter: input.newsletter.subject };
const chars = { linkedin: input.linkedin.length, x_thread: input.thread.length + ' posts', newsletter: input.newsletter.body.length };
const csv_line = ['linkedin', 'x_thread', 'newsletter'].map(ch => [ts, content_id, ch, sched[ch], status, chars[ch], prev[ch]].map(Q).join(',') + '\n').join('');
const message = 'HELD FOR EDIT: ' + input.title + '\nLinkedIn ' + sched.linkedin + ' (' + chars.linkedin + ' chars) | X thread ' + chars.x_thread + ' ' + sched.x_thread + ' | Newsletter ' + sched.newsletter + (input.flags.length ? '\nFlagged: ' + input.flags.join(', ') : '');
return { ...input, content_id, status, sched, csv_line, message, http_status: 200, response: { content_id, status, scheduled: sched } };
})();

return { out: out, ms: 7 };
},
    queue: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const addDays = (d, k) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + k); return x.toISOString().slice(0, 10); };
const dowOf = d => new Date(d + 'T00:00:00Z').getUTCDay();
let li = addDays(input.publish_date, 1); while (![2, 3, 4].includes(dowOf(li))) li = addDays(li, 1);
const x = addDays(li, 1);
let nl = li; while (dowOf(nl) !== 5) nl = addDays(nl, 1);
const sched = { linkedin: li + ' 09:00', x_thread: x + ' 12:00', newsletter: nl + ' 08:00' };
const slug = input.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
const content_id = 'CT-' + slug;
const ts = new Date().toISOString();

const status = 'pending_approval';
const prev = { linkedin: input.linkedin, x_thread: input.thread.join(' || '), newsletter: input.newsletter.subject };
const chars = { linkedin: input.linkedin.length, x_thread: input.thread.length + ' posts', newsletter: input.newsletter.body.length };
const csv_line = ['linkedin', 'x_thread', 'newsletter'].map(ch => [ts, content_id, ch, sched[ch], status, chars[ch], prev[ch]].map(Q).join(',') + '\n').join('');
const message = 'READY FOR APPROVAL: ' + input.title + '\nLinkedIn ' + sched.linkedin + ' (' + chars.linkedin + ' chars) | X thread ' + chars.x_thread + ' ' + sched.x_thread + ' | Newsletter ' + sched.newsletter + (input.flags.length ? '\nFlagged: ' + input.flags.join(', ') : '');
return { ...input, content_id, status, sched, csv_line, message, http_status: 202, response: { content_id, status, scheduled: sched } };
})();

return { out: out, ms: 7 };
},
    respond: function (i, ctx) { ctx.resp = { status: i.http_status, body: i.response }; ctx.msg = i; return { out: i, ms: 5 }; },
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.queue.push(parseLine(l)); }); return { out: i, ms: 16 }; },
    notify: function (i, ctx) {
        if (i && i.__error) { ctx.notified = { error: i.__error }; return { out: ctx.notified, ms: 0, end: true }; }
        ctx.notified = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.msg.message }; return { out: ctx.notified, ms: 207, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var an = T('analyze', r);
      if (!an) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. Nada é rascunhado, agendado ou enviado. É assim de propósito: texto fraco não vira post.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. Nothing is drafted, scheduled or sent. On purpose: weak input never becomes a post.' } }];
      var d = T('draft', r).out, b = T('brand', r).out, q = c.msg;
      o.push({ kind: 'card', title: { pt: 'Verificação de marca', en: 'Brand check' }, rows: [[{ pt: 'Status', en: 'Status' }, q.status, b.flagged ? 'b-hot' : 'b-ok'], [{ pt: 'Termos sinalizados', en: 'Flagged terms' }, b.flags.length ? b.flags.join(', ') : { pt: 'nenhum', en: 'none' }],
        [{ pt: 'LinkedIn', en: 'LinkedIn' }, d.limits.linkedin_chars + ' / 3000'], [{ pt: 'Maior post do fio', en: 'Longest thread post' }, d.limits.max_tweet + ' / 280' + (d.limits.trimmed ? ' (' + d.limits.trimmed + ' cortado)' : '')], [{ pt: 'Idioma', en: 'Language' }, d.lang.toUpperCase() + ' · ' + d.tone]] });
      o.push({ kind: 'telegram', title: { pt: 'Rascunho: LinkedIn', en: 'Draft: LinkedIn' }, from: 'LinkedIn · ' + q.sched.linkedin, text: d.linkedin, time: q.sched.linkedin.slice(11) });
      o.push({ kind: 'telegram', title: { pt: 'Rascunho: fio no X', en: 'Draft: X thread' }, from: 'X · ' + q.sched.x_thread, text: d.thread.join('\n\n'), time: q.sched.x_thread.slice(11) });
      o.push({ kind: 'email', title: { pt: 'Rascunho: newsletter', en: 'Draft: newsletter' }, to: 'Scheduled: ' + q.sched.newsletter, subject: d.newsletter.subject, text: d.newsletter.body });
      var nt = c.notified;
      if (nt && nt.ok) o.push({ kind: 'telegram', title: { pt: 'Aviso ao editor', en: 'Editor notification' }, from: 'Content Bot', text: nt.text, time: hhmm });
      else o.push({ kind: 'error', title: { pt: 'Aviso ao editor', en: 'Editor notification' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. Nada se perdeu: os três rascunhos já estão na fila (' + q.content_id + ') e o editor os vê na próxima consulta (Continue On Fail).', en: 'Telegram stayed down for all 3 attempts. Nothing was lost: the three drafts are already in the queue (' + q.content_id + ') and the editor sees them on the next check (Continue On Fail).' } });
      o.push({ kind: 'sheet', title: { pt: 'Fila de conteúdo (queue_14.csv)', en: 'Content queue (queue_14.csv)' }, cols: ['content_id', 'channel', 'scheduled_at', 'status', 'chars'], rows: c.queue.map(function (x) { return [x[1], x[2], x[3], x[4], x[5]]; }).slice(-5), highlightLast: true });
      return o;
    }
  };
})();
