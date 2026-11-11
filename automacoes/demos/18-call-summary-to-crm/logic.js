/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { calls_file: './data/calls_18.csv', dead_file: './data/dead_letters_18.csv', crm_url: 'https://crm.example.com/api/leads', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'OPS_CHAT_ID' };
  var SEED = ["\"2026-11-10T14:02:00.000Z\",\"CALL-3101\",\"+15550141988\",\"Marta Oliveira\",\"Casa Verde\",\"buy\",\"warm\",\"55\",\"saved\"", "\"2026-11-10T16:40:00.000Z\",\"CALL-3144\",\"+15550141731\",\"Paulo Reis\",\"\",\"info\",\"cold\",\"10\",\"saved\""];

  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { return { rows: SEED.map(parseLine), dead: [] }; },
    nodes: {
    webhook: function (i, ctx) { Object.keys(ctx).forEach(function (k) { if ((['rows', 'dead', 'ledgerText', 'sim', 'failedNode', 'failedName']).indexOf(k) < 0) delete ctx[k]; }); ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    extract: function (i, ctx) {
var input = ctx.cfg;
var out = (function () {
const b = input.body || {};
const transcript = String(b.transcript || ''), phone = String(b.phone || '').replace(/[^\d+]/g, ''), duration = Number(b.duration_sec);
if (!/^\+?\d{8,15}$/.test(phone)) throw new Error('phone must have 8 to 15 digits');
if (!Number.isFinite(duration) || duration < 20) throw new Error('Call too short (' + (Number.isFinite(duration) ? duration : 'n/a') + ' s): nothing worth logging');
const turns = transcript.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const m = l.match(/^(Agent|Caller):\s*(.+)$/i); return m ? { who: m[1].toLowerCase(), text: m[2].trim() } : null; }).filter(Boolean);
const caller = turns.filter(t => t.who === 'caller').map(t => t.text).join(' '), agent = turns.filter(t => t.who === 'agent').map(t => t.text);
if (!caller) throw new Error('Transcript has no "Caller:" lines');
const lang = /\b(meu|minha|queria|preço|preco|orçamento|proposta|empresa|obrigad[oa]|vocês|voces|temos|nosso)\b/i.test(caller) ? 'pt' : 'en';
const grab = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ''; };
const CAP = '((?:[A-ZÀ-Ý][\\w&\'-]*\\s?){1,3})';
const name = grab(new RegExp('(?:my name is|this is|meu nome é|aqui é|me chamo)\\s+' + CAP), caller) || String(b.caller_name || '').trim() || 'Unknown';
const company = grab(new RegExp('(?:I\'m with|I am with|I work (?:at|for)|calling from|from|trabalho na|trabalho no|sou da|sou do|da empresa)\\s+' + CAP), caller);
const bm = caller.match(/(\$|usd\s?|r\$\s?)\s?(\d[\d.,]*)\s?(k|mil)?/i);
let budget = null, currency = null;
if (bm) { currency = bm[1].toLowerCase().startsWith('r') ? 'BRL' : 'USD'; let n = parseFloat(currency === 'BRL' ? bm[2].replace(/\./g, '').replace(',', '.') : bm[2].replace(/,/g, '')); if (bm[3]) n *= 1000; budget = Math.round(n); }
const MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';
const timeline = grab(new RegExp('(asap|this week|next week|this month|next month|next quarter|in \\d+ (?:weeks?|months?)|by (?:' + MONTHS + ')|semana que vem|esta semana|este mês|mês que vem|em \\d+ (?:semanas?|meses|mês)|até (?:' + MONTHS + '))', 'i'), caller).toLowerCase();
const urgent = /(asap|this week|next week|this month|esta semana|semana que vem|este mês)/.test(timeline);
const buy = /(quote|price|pricing|proposal|buy|purchase|install|orçamento|preço|proposta|comprar|contratar|instalar|valor)/i.test(caller);
const supportWords = /(not working|broken|error|bug|stopped|cancel|refund|não funciona|parou|erro|defeito|cancelar|reembolso)/i.test(caller);
const intent = buy ? 'buy' : supportWords ? 'support' : 'info';
const authority = /(I decide|I'm the owner|I am the owner|owner|founder|ceo|director|decision maker|dono|dona|sócio|sócia|diretor|diretora|eu decido)/i.test(caller);
const objections = []; if (/(too expensive|expensive|too much|caro|salgado)/i.test(caller)) objections.push('price'); if (/(already (?:have|use|got)|another (?:company|vendor)|competitor|já temos|outra empresa|concorrente)/i.test(caller)) objections.push('competitor'); if (/(not now|maybe later|talvez|mais pra frente|depois)/i.test(caller)) objections.push('timing');
const next = agent.map(t => t.split(/(?<=[.!?])\s+/).find(s => /(I'll send|I will send|follow up|schedule|book a|vou enviar|vou mandar|te mando|agendar)/i.test(s))).find(Boolean) || '';
const parts = { budget: budget ? 25 : 0, timeline: !timeline ? 0 : urgent ? 25 : 10, authority: authority ? 20 : 0, intent: intent === 'buy' ? 20 : 0, company: company ? 10 : 0, objections: -10 * objections.filter(o => o !== 'timing').length };
const score = intent === 'support' ? 0 : Math.max(0, Math.min(100, Object.values(parts).reduce((a, c) => a + c, 0)));
const priority = intent === 'support' ? 'support' : score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
let h = 0; for (const ch of phone + duration + transcript.length) h = (h * 31 + ch.charCodeAt(0)) % 9000;
const money = budget === null ? 'no budget stated' : (currency === 'BRL' ? 'R$ ' : '$') + String(budget).replace(/\B(?=(\d{3})+(?!\d))/g, currency === 'BRL' ? '.' : ',');
const summary = name + (company ? ' (' + company + ')' : '') + ' · ' + (intent === 'buy' ? 'wants a quote' : intent === 'support' ? 'support request' : 'general question') + ' · ' + money + ' · ' + (timeline || 'no timeline') + (objections.length ? ' · objections: ' + objections.join(', ') : '') + (next ? ' · next: ' + next.replace(/[.!?]+$/, '') : '');
return { call_id: 'CALL-' + (1000 + h), phone, duration_sec: duration, name, company, lang, intent, budget, currency, timeline, authority, objections, next_step: next, parts, score, priority, summary, is_sales: intent !== 'support', ts: new Date().toISOString() };
})();
ctx.ex = out;
return { out: out, ms: 18 };
},
    sales: function (i, ctx) { return { out: i, branch: ctx.ex.is_sales ? 'true' : 'false', ms: 2 }; },
    crm: function (i, ctx) {
        if (i && i.__error) { ctx.crm = { error: i.__error }; return { out: ctx.crm, ms: 0 }; }
        ctx.crm = { ok: true, id: 8800 }; return { out: ctx.crm, ms: 192 };
      },
    finish: function (i, ctx) {
var input = ctx.ex; var crm = ctx.crm;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const crm_ok = !input.is_sales ? null : !!(crm && crm.ok === true && !crm.error);
const status = !input.is_sales ? 'routed_to_support' : crm_ok ? 'saved' : 'dead_letter';
const lead = { name: input.name, company: input.company, phone: input.phone, source: 'phone', priority: input.priority, score: input.score, budget: input.budget, timeline: input.timeline, next_step: input.next_step, summary: input.summary, call_id: input.call_id };
const csv_line = [input.ts, input.call_id, input.phone, input.name, input.company, input.intent, input.priority, input.score, status].map(Q).join(',') + '\n';
const dead_line = status === 'dead_letter' ? [input.ts, input.call_id, 'CRM unavailable after 3 tries', JSON.stringify(lead)].map(Q).join(',') + '\n' : '';
const ops_text = status === 'dead_letter' ? 'CRM DOWN: lead ' + input.call_id + ' (' + input.name + ', ' + input.priority + ') parked in dead letters. Replay when the CRM is back.' : '';
return { ...input, lead, status, crm_ok, csv_line, dead_line, ops_text };
})();
ctx.fin = out;
return { out: out, ms: 8 };
},
    calls: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.rows.push(parseLine(l)); }); return { out: i, ms: 15 }; },
    deadq: function (i, ctx) { return { out: i, branch: ctx.fin.status === 'dead_letter' ? 'true' : 'false', ms: 2 }; },
    prep: function (i, ctx) { return { out: ctx.fin, ms: 5 }; },
    wdead: function (i, ctx) { ctx.dead.push(parseLine(ctx.fin.dead_line.replace(/\n$/, ''))); return { out: i, ms: 14 }; },
    ops: function (i, ctx) {
        if (i && i.__error) { ctx.opsmsg = { error: i.__error }; return { out: ctx.opsmsg, ms: 0 }; }
        ctx.opsmsg = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.fin.ops_text }; return { out: ctx.opsmsg, ms: 203 };
      },
    resp: function (i, ctx) {
var rep = ctx.fin; var inp = i;
var out = (function () {
const ops = rep.status !== 'dead_letter' ? 'not_needed' : (inp && inp.ok === true && !inp.error) ? 'sent' : 'queued';
return { ...rep, ops_alert: ops, response: { call_id: rep.call_id, intent: rep.intent, priority: rep.priority, score: rep.score, crm: rep.status === 'saved' ? 'saved' : rep.status === 'dead_letter' ? 'dead_letter' : 'skipped', ops_alert: ops } };
})();
ctx.final = out;
return { out: out, ms: 6 };
},
    respond: function (i, ctx) { return { out: ctx.final.response, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var ex = T('extract', r);
      if (!ex) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 e nada vai para o CRM. É assim de propósito: ligação sem conteúdo não vira lead falso.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 and nothing reaches the CRM. On purpose: a call with no content must not become a fake lead.' } }];
      var v = ex.out, f = c.fin, pt = v.parts;
      var badge = { hot: 'b-hot', warm: 'b-warn', cold: 'b-ok', support: 'b-ok' }[v.priority];
      var money = v.budget === null ? { pt: 'não citado', en: 'not stated' } : (v.currency === 'BRL' ? 'R$ ' : '$') + String(v.budget).replace(/\B(?=(\d{3})+(?!\d))/g, v.currency === 'BRL' ? '.' : ',');
      o.push({ kind: 'card', title: { pt: 'O que a ligação revelou', en: 'What the call revealed' }, rows: [[{ pt: 'Prioridade', en: 'Priority' }, v.priority + ' · ' + v.score + '/100', badge], [{ pt: 'Quem', en: 'Who' }, v.name + (v.company ? ' · ' + v.company : '')], [{ pt: 'Intenção', en: 'Intent' }, v.intent],
        [{ pt: 'Orçamento', en: 'Budget' }, money], [{ pt: 'Prazo', en: 'Timeline' }, v.timeline || { pt: 'não citado', en: 'not stated' }], [{ pt: 'Objeções', en: 'Objections' }, v.objections.length ? v.objections.join(', ') : { pt: 'nenhuma', en: 'none' }],
        [{ pt: 'Próximo passo prometido', en: 'Next step promised' }, v.next_step || { pt: 'nenhum', en: 'none' }]] });
      if (f.status === 'saved') o.push({ title: { pt: 'Lead criado no CRM', en: 'Lead created in the CRM' }, json: f.lead });
      else if (f.status === 'routed_to_support') o.push({ title: { pt: 'CRM', en: 'CRM' }, skipped: { pt: 'Pedido de suporte: não é lead, o CRM não é tocado. Fica só no registro de ligações.', en: 'Support request: not a lead, the CRM is not touched. It stays in the call log only.' } });
      else o.push({ kind: 'error', title: { pt: 'Lead criado no CRM', en: 'Lead created in the CRM' }, text: { pt: 'O CRM ficou fora do ar nas 3 tentativas. O lead NÃO se perdeu: foi guardado na fila de cartas mortas (' + f.call_id + ') para ser reenviado quando o CRM voltar, e a ligação consta no registro (Continue On Fail).', en: 'The CRM stayed down for all 3 attempts. The lead was NOT lost: it was parked in the dead-letter queue (' + f.call_id + ') to be replayed when the CRM is back, and the call is in the log (Continue On Fail).' } });
      if (f.status === 'dead_letter') {
        if (c.opsmsg && c.opsmsg.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta à operação', en: 'Ops alert' }, from: 'Ops Bot', text: c.opsmsg.text, time: hhmm });
        else o.push({ kind: 'error', title: { pt: 'Alerta à operação', en: 'Ops alert' }, text: { pt: 'O Telegram também caiu (3 tentativas). A carta morta já está no arquivo; quem olhar a fila vê o lead (Continue On Fail).', en: 'Telegram was down too (3 attempts). The dead letter is already on disk; whoever checks the queue sees the lead (Continue On Fail).' } });
        o.push({ kind: 'sheet', title: { pt: 'Cartas mortas (dead_letters_18.csv)', en: 'Dead letters (dead_letters_18.csv)' }, cols: ['call_id', 'reason', 'payload'], rows: c.dead.map(function (x) { return [x[1], x[2], x[3].slice(0, 60) + '…']; }).slice(-3), highlightLast: true });
      }
      o.push({ kind: 'sheet', title: { pt: 'Registro de ligações (calls_18.csv)', en: 'Call log (calls_18.csv)' }, cols: ['call_id', 'name', 'priority', 'score', 'status'], rows: c.rows.map(function (x) { return [x[1], x[3], x[6], x[7], x[8]]; }).slice(-4), highlightLast: true });
      return o;
    }
  };
})();
