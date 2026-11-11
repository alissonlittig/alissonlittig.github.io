/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { ranking_file: './data/candidates_17.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'RECRUITER_CHAT_ID' };
  var SEED = ["\"2026-11-09T10:00:00.000Z\",\"CV-4120\",\"Backend Developer\",\"Helena Duarte\",\"helena.duarte@example.com\",\"88\",\"shortlist\",\"7\",\"\"", "\"2026-11-09T11:30:00.000Z\",\"CV-4388\",\"Backend Developer\",\"Rafael Torres\",\"rafael.torres@example.com\",\"71\",\"maybe\",\"4\",\"rest\"", "\"2026-11-10T09:15:00.000Z\",\"CV-5012\",\"Backend Developer\",\"Diego Martins\",\"diego.martins@example.com\",\"34\",\"decline\",\"1\",\"python/sql\""];
  var HEADER = 'queued_at,candidate_id,job,name,email,score,decision,years,missing';

  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { var ctx = { rows: SEED.map(parseLine) };
      ctx.ledgerText = function () { return HEADER + '\n' + ctx.rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); };
      return ctx; },
    nodes: {
    webhook: function (i, ctx) { Object.keys(ctx).forEach(function (k) { if ((['rows', 'dead', 'ledgerText', 'sim', 'failedNode', 'failedName']).indexOf(k) < 0) delete ctx[k]; }); ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    read: function (i, ctx) { return { out: { fileName: 'candidates_17.csv', mimeType: 'text/csv', fileSize: (ctx.rows.length * 0.16 + 0.1).toFixed(1) + ' kB' }, ms: 6 }; },
    score: function (i, ctx) {
var input = ctx.cfg; var ledgerText = ctx.ledgerText();
var out = (function () {
const b = input.body || {};
const job_title = String(b.job_title || '').trim(), name = String(b.candidate_name || '').trim(), email = String(b.email || '').trim().toLowerCase();
const cv = String(b.cv_text || '').replace(/\s+/g, ' ').trim();
const list = v => String(v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const must = list(b.must_have), nice = list(b.nice_have), min_years = b.min_years === undefined || b.min_years === '' ? 0 : Number(b.min_years);
if (!job_title) throw new Error('job_title is missing');
if (!must.length) throw new Error('must_have needs at least one skill');
if (!Number.isFinite(min_years) || min_years < 0 || min_years > 40) throw new Error('min_years must be a number from 0 to 40');
if (!name) throw new Error('candidate_name is missing');
if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new Error('email is not valid: ' + (email || 'empty'));
if (cv.length < 200) throw new Error('CV text too short (' + cv.length + ' characters, need 200). Scanned PDF? Send extracted text.');
const parse = line => { const c = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
const rows = ledgerText.split(/\r?\n/).slice(1).filter(Boolean).map(parse).filter(r => r[2] === job_title);
const dup = rows.find(r => r[4] === email);
let h = 0; for (const ch of job_title + email) h = (h * 31 + ch.charCodeAt(0)) % 9000;
if (dup) return { duplicate: true, candidate_id: dup[1], job_title, name, email, http_status: 409, response: { status: 'duplicate', candidate_id: dup[1], reason: 'already screened for this job', earlier_score: Number(dup[5]), earlier_decision: dup[6] } };
const low = cv.toLowerCase(), esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = kw => new RegExp('(^|[^a-z0-9+#])' + esc(kw) + '($|[^a-z0-9+#])').test(low);
const matched_must = must.filter(has), missing_must = must.filter(k => !has(k)), matched_nice = nice.filter(has);
const ys = (low.match(/(\d{1,2})\+?\s*(?:years|yrs|anos)/g) || []).map(s => parseInt(s, 10)), years = ys.length ? Math.max(...ys) : null;
const degree = /(bachelor|b\.?sc|degree|graduação|bacharel|certified|certificat)/.test(low);
const parts = { must: Math.round(60 * matched_must.length / must.length), nice: nice.length ? Math.round(15 * matched_nice.length / nice.length) : 15, years: min_years === 0 ? 20 : years === null ? 0 : Math.round(20 * Math.min(1, years / min_years)), education: degree ? 5 : 0 };
const score = parts.must + parts.nice + parts.years + parts.education;
const decision = missing_must.length === 0 && score >= 75 ? 'shortlist' : score >= 50 ? 'maybe' : 'decline';
const same = rows.map(r => Number(r[5]));
const rank = 1 + same.filter(s => s > score).length, of = same.length + 1;
return { duplicate: false, candidate_id: 'CV-' + (1000 + h), job_title, name, email, must, nice, min_years, matched_must, missing_must, matched_nice, years, parts, score, decision, rank, of, ts: new Date().toISOString() };
})();
ctx.sc = out;
return { out: out, ms: 12, branch: out.duplicate ? 'true' : 'false' };
},
    dup: function (i, ctx) { return { out: i, branch: i.duplicate ? 'true' : 'false', ms: 2 }; },
    build: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const first = input.name.split(' ')[0];
const yrs = input.years === null ? 'years not stated' : input.years + ' years';
const recruiter_alert = input.decision === 'shortlist' ? 'SHORTLIST ' + input.name + ' for ' + input.job_title + ': ' + input.score + '/100, rank ' + input.rank + ' of ' + input.of + '\nMatched: ' + input.matched_must.concat(input.matched_nice).join(', ') + ' · ' + yrs + '\nInvite DRAFTED, not sent.' : '';
const draft = input.decision === 'shortlist' ? { kind: 'invite', to: input.email, subject: 'Next step: ' + input.job_title, text: 'Hi ' + first + ',\n\nThank you for applying for ' + input.job_title + '. Your background looks like a good match and we would like to talk. Could you share two or three time slots next week for a 30-minute call?\n\nBest regards,\nThe hiring team' }
  : input.decision === 'decline' ? { kind: 'decline_held', to: input.email, subject: 'Your application: ' + input.job_title, text: 'Hi ' + first + ',\n\nThank you for your interest in ' + input.job_title + ' and for the time you put into applying. After reviewing the role requirements, we are not moving forward with your application at this stage. We will keep your details on file and reach out if a closer match opens up.\n\nBest regards,\nThe hiring team' }
  : { kind: 'review', note: 'Borderline: a person should read this CV. Missing: ' + (input.missing_must.join(', ') || 'nothing critical') + '.' };
const csv_line = [input.ts, input.candidate_id, input.job_title, input.name, input.email, input.score, input.decision, input.years === null ? '' : input.years, input.missing_must.join('/')].map(Q).join(',') + '\n';
return { ...input, recruiter_alert, draft, csv_line, http_status: 200, response: { candidate_id: input.candidate_id, decision: input.decision, score: input.score, rank: input.rank + ' of ' + input.of, matched: input.matched_must.length + '/' + input.must.length + ' must-haves', missing: input.missing_must } };
})();
ctx.bo = out;
return { out: out, ms: 9 };
},
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.rows.push(parseLine(l)); }); return { out: i, ms: 15 }; },
    short: function (i, ctx) { return { out: i, branch: ctx.bo.decision === 'shortlist' ? 'true' : 'false', ms: 2 }; },
    notify: function (i, ctx) {
        if (i && i.__error) { ctx.notified = { error: i.__error }; return { out: ctx.notified, ms: 0 }; }
        ctx.notified = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.bo.recruiter_alert }; return { out: ctx.notified, ms: 201 };
      },
    resp: function (i, ctx) {
var rep = ctx.bo; var inp = i;
var out = (function () {
const notified = !rep.recruiter_alert ? 'not_needed' : (inp && inp.ok === true && !inp.error) ? 'sent' : 'queued';
return { ...rep, notified, response: { ...rep.response, recruiter_alert: notified } };
})();
ctx.final = out;
return { out: out, ms: 6 };
},
    respond: function (i, ctx) { var f = ctx.final || ctx.sc; return { out: f.response, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var s = T('score', r);
      if (!s) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 e ninguém entra no ranking. É assim de propósito: currículo ilegível não pode virar nota 0 e recusa automática.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 and nobody enters the ranking. On purpose: an unreadable CV must not become a score of 0 and an automatic rejection.' } }];
      var v = s.out;
      if (v.duplicate) return [{ kind: 'card', title: { pt: 'Resposta da API (HTTP 409)', en: 'API response (HTTP 409)' }, rows: [[{ pt: 'Status', en: 'Status' }, 'duplicate', 'b-warn'], [{ pt: 'Candidatura anterior', en: 'Earlier application' }, v.candidate_id + ' · ' + v.response.earlier_score + '/100 · ' + v.response.earlier_decision], [{ pt: 'Motivo', en: 'Reason' }, { pt: 'Esse e-mail já foi avaliado para esta vaga. Nada foi gravado, nada foi enviado.', en: 'This e-mail was already screened for this job. Nothing was written, nothing was sent.' }]] },
        { title: { pt: 'Ranking', en: 'Ranking' }, skipped: { pt: 'Candidato duplicado: ranking inalterado.', en: 'Duplicate candidate: ranking unchanged.' } }];
      var b = c.bo, fin = c.final, badge = { shortlist: 'b-ok', maybe: 'b-warn', decline: 'b-hot' }[b.decision], p = b.parts;
      o.push({ kind: 'card', title: { pt: 'Pontuação', en: 'Score' }, rows: [[{ pt: 'Decisão', en: 'Decision' }, b.decision, badge], [{ pt: 'Nota', en: 'Score' }, b.score + ' / 100 · rank ' + b.rank + ' of ' + b.of],
        [{ pt: 'Obrigatórias (60)', en: 'Must-haves (60)' }, p.must + ' · ' + b.matched_must.length + '/' + b.must.length + (b.missing_must.length ? ' (falta: ' + b.missing_must.join(', ') + ')' : '')],
        [{ pt: 'Desejáveis (15)', en: 'Nice-to-haves (15)' }, p.nice + ' · ' + (b.matched_nice.join(', ') || '-')], [{ pt: 'Experiência (20)', en: 'Experience (20)' }, p.years + ' · ' + (b.years === null ? 'not stated' : b.years + ' years (min ' + b.min_years + ')')], [{ pt: 'Formação (5)', en: 'Education (5)' }, String(p.education)]] });
      if (b.draft.kind === 'invite') o.push({ kind: 'email', title: { pt: 'Convite (rascunho, não enviado)', en: 'Invitation (draft, not sent)' }, to: 'To: ' + b.draft.to, subject: b.draft.subject, text: b.draft.text });
      else if (b.draft.kind === 'decline_held') o.push({ kind: 'email', title: { pt: 'Recusa (RETIDA para uma pessoa enviar)', en: 'Decline (HELD for a person to send)' }, to: 'To: ' + b.draft.to, subject: b.draft.subject, text: b.draft.text });
      else o.push({ kind: 'card', title: { pt: 'Revisão humana', en: 'Human review' }, rows: [[{ pt: 'Nota', en: 'Note' }, b.draft.note]] });
      if (b.decision !== 'shortlist') o.push({ title: { pt: 'Alerta ao recrutador', en: 'Recruiter alert' }, skipped: { pt: 'Só candidatos pré-selecionados geram alerta.', en: 'Only shortlisted candidates trigger an alert.' } });
      else if (c.notified && c.notified.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta ao recrutador', en: 'Recruiter alert' }, from: 'Hiring Bot', text: c.notified.text, time: hhmm });
      else o.push({ kind: 'error', title: { pt: 'Alerta ao recrutador', en: 'Recruiter alert' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. Nada se perdeu: o candidato já está no ranking (' + b.candidate_id + ') e a API respondeu "queued" (Continue On Fail).', en: 'Telegram stayed down for all 3 attempts. Nothing was lost: the candidate is already in the ranking (' + b.candidate_id + ') and the API answered "queued" (Continue On Fail).' } });
      var rk = c.rows.filter(function (x) { return x[2] === b.job_title; }).sort(function (a, z) { return Number(z[5]) - Number(a[5]); });
      o.push({ kind: 'sheet', title: { pt: 'Ranking da vaga (candidates_17.csv)', en: 'Job ranking (candidates_17.csv)' }, cols: ['#', 'name', 'score', 'decision', 'missing'], rows: rk.slice(0, 6).map(function (x, k) { return [String(k + 1) + (x[1] === b.candidate_id ? ' ◀ new' : ''), x[3], x[5], x[6], x[8] || '-']; }) });
      return o;
    }
  };
})();
