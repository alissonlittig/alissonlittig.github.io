/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { queue_file: './data/replies_16.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'OWNER_CHAT_ID', contact_en: "If you are open to it, please write to us through the contact on our page so we can make it right.", contact_pt: "Se puder, escreva para n\u00f3s pelo contato da nossa p\u00e1gina para resolvermos isso." };
  var SEED = ["\"2026-11-10T09:00:00.000Z\",\"RV-2210\",\"Helena Prado\",\"5\",\"service\",\"ready_to_post\",\"Thank you so much for the review! We will pass your kind words on to the team.\""];

  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };

  window.DEMO = {
    start: 'webhook',
    init: function () { return { rows: SEED.map(parseLine) }; },
    nodes: {
    webhook: function (i, ctx) { Object.keys(ctx).forEach(function (k) { if ((['rows', 'dead', 'ledgerText', 'sim', 'failedNode', 'failedName']).indexOf(k) < 0) delete ctx[k]; }); ctx.form = i.body; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    analyze: function (i, ctx) {
var input = ctx.cfg;
var out = (function () {
const b = input.body || {};
const business = String(b.business || '').trim(), reviewer = String(b.reviewer || '').trim(), owner = String(b.owner_name || '').trim() || business;
const text = String(b.text || '').replace(/\s+/g, ' ').trim(), tone = b.tone === 'formal' ? 'formal' : 'warm', rating = Number(b.rating);
if (!business) throw new Error('business is missing');
if (!reviewer) throw new Error('reviewer is missing');
if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('rating must be an integer from 1 to 5');
if (text.length > 4000) throw new Error('Review text is over 4000 characters');
const lang = text ? (/\b(muito|não|nao|foi|atendimento|ótimo|otimo|ótima|demorou|comida|preço|preco|obrigad[oa]|péssimo|pessimo|recomendo|vocês|voces|lugar|pedido)\b/i.test(text) ? 'pt' : 'en') : (b.lang === 'pt' ? 'pt' : 'en');
const TOPICS = { service: /(staff|service|waiter|waitress|rude|friendly|atendimento|atendente|garçom|educad|grosseir|simpátic)/i, wait: /(wait|slow|late|hour|demor|espera|atras)/i, price: /(price|expensive|overpriced|cheap|preço|preco|caro|barato|cobr)/i, quality: /(quality|taste|cold|fresh|broken|qualidade|sabor|frio|fresco|quebrad|gostos|delicios)/i, clean: /(dirty|clean|hygiene|sujo|limp|higiene)/i, delivery: /(delivery|package|courier|entrega|motoboy)/i };
const topics = Object.keys(TOPICS).filter(k => TOPICS[k].test(text));
const escalate = /(lawyer|sue you|lawsuit|food poisoning|got sick|health department|procon|advogado|processo|intoxica|passei mal|vigilância sanitária)/i.test(text);
let h = 0; for (const ch of business + reviewer + text) h = (h * 31 + ch.charCodeAt(0)) % 9000;
return { review_id: 'RV-' + (1000 + h), business, reviewer, first: reviewer.split(' ')[0], owner, rating, text, tone, lang, contact_en: input.contact_en, contact_pt: input.contact_pt, sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'mixed' : 'negative', topics, escalate, ts: new Date().toISOString() };
})();

return { out: out, ms: 11 };
},
    draft: function (i, ctx) {
var input = i;
var out = (function () {
const pt = input.lang === 'pt', formal = input.tone === 'formal', t = input.topics[0];
const hello = (pt ? (formal ? 'Prezado(a) ' : 'Olá, ') : (formal ? 'Dear ' : 'Hi ')) + input.first + ',';
const bye = pt ? (formal ? 'Atenciosamente,' : 'Um abraço,') : (formal ? 'Kind regards,' : 'Warm regards,');
const POS = pt ? { service: 'Vamos repassar o elogio à equipe, ele faz diferença.', wait: 'Ficamos felizes que o tempo tenha sido bom.', price: 'Fico contente que o valor tenha feito sentido para você.', quality: 'Que bom que você gostou da qualidade, é o que mais cuidamos.', clean: 'Obrigado por notar o cuidado com a limpeza.', delivery: 'Que bom que a entrega correu bem.', none: 'Foi um prazer receber você.' }
  : { service: 'We will pass your kind words on to the team, they mean a lot.', wait: 'We are glad the timing worked out.', price: 'We are glad it felt like good value.', quality: 'We are glad you enjoyed the quality, it is what we care about most.', clean: 'Thank you for noticing how much we care about cleanliness.', delivery: 'We are glad the delivery went smoothly.', none: 'It was a pleasure having you.' };
const NEG = pt ? { service: 'O atendimento que você descreveu não é o que esperamos da equipe.', wait: 'A demora que você descreveu não é o que queremos para ninguém.', price: 'Entendemos a sua percepção sobre o preço.', quality: 'A qualidade que você descreveu não é o padrão que queremos entregar.', clean: 'Limpeza é prioridade para nós e vamos verificar o que aconteceu.', delivery: 'Vamos entender o que houve com a entrega.', none: 'Queremos entender o que aconteceu.' }
  : { service: 'The service you describe is not what we expect from our team.', wait: 'The wait you describe is not what we want for anyone.', price: 'We understand how the pricing felt.', quality: 'The quality you describe is not the standard we want to deliver.', clean: 'Cleanliness is a priority for us and we will look into what happened.', delivery: 'We will find out what went wrong with the delivery.', none: 'We want to understand what happened.' };
const contact = pt ? input.contact_pt : input.contact_en;
let body;
if (input.escalate) body = pt ? 'Lamentamos muito o que você relatou e levamos isso a sério. ' + contact : 'We are very sorry about what you describe and we take it seriously. ' + contact;
else if (!input.text) body = input.rating >= 4 ? (pt ? 'Obrigado pela avaliação! ' : 'Thank you for the rating! ') + POS.none : (pt ? 'Obrigado por avaliar. Sentimos que a experiência não tenha sido boa e gostaríamos de saber o que aconteceu. ' : 'Thank you for rating us. We are sorry the experience was not a good one and would like to hear what happened. ') + contact;
else if (input.rating >= 4) body = (pt ? 'Muito obrigado pela avaliação! ' : 'Thank you so much for the review! ') + POS[t || 'none'] + (pt ? ' Esperamos ver você de novo em breve.' : ' We hope to see you again soon.');
else if (input.rating === 3) body = (pt ? 'Obrigado pelo retorno honesto. ' : 'Thank you for the honest feedback. ') + (t ? NEG[t] + ' ' : '') + (pt ? 'Vamos usar isso para melhorar. ' : 'We will use it to improve. ') + contact;
else body = (pt ? 'Obrigado por nos contar e sentimos muito que a visita não tenha sido boa. ' : 'Thank you for telling us, and we are sorry the visit fell short. ') + NEG[t || 'none'] + ' ' + contact;
const reply = hello + '\n\n' + body + '\n\n' + bye + '\n' + input.owner;
return { ...input, reply, reply_chars: reply.length };
})();

return { out: out, ms: 13 };
},
    route: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const status = input.escalate ? 'escalated' : input.rating <= 2 ? 'needs_owner' : input.rating === 3 ? 'needs_review' : 'ready_to_post';
const needs_owner = status === 'escalated' || status === 'needs_owner';
const snip = input.text ? (input.text.length > 140 ? input.text.slice(0, 139).replace(/\s+\S*$/, '') + '…' : input.text) : '(no text)';
const alert_text = needs_owner ? (input.escalate ? 'ESCALATE ' : 'LOW RATING ') + input.rating + '/5 · ' + input.business + ' · ' + input.reviewer + '\n"' + snip + '"\nTopics: ' + (input.topics.join(', ') || 'none') + '\nReply drafted, NOT posted. Status: ' + status : '';
const csv_line = [input.ts, input.review_id, input.reviewer, input.rating, input.topics.join('/') || '-', status, input.reply.split('\n')[2].slice(0, 80)].map(Q).join(',') + '\n';
return { ...input, status, needs_owner, alert_text, csv_line };
})();
ctx.route = out;
return { out: out, ms: 7 };
},
    append: function (i, ctx) { i.csv_line.split('\n').filter(Boolean).forEach(function (l) { ctx.rows.push(parseLine(l)); }); return { out: i, ms: 15 }; },
    owner: function (i, ctx) { return { out: i, branch: ctx.route.needs_owner ? 'true' : 'false', ms: 2 }; },
    alert: function (i, ctx) {
        if (i && i.__error) { ctx.alert = { error: i.__error }; return { out: ctx.alert, ms: 0 }; }
        ctx.alert = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.route.alert_text }; return { out: ctx.alert, ms: 204 };
      },
    resp: function (i, ctx) {
var rep = ctx.route; var inp = i;
var out = (function () {
const alert_ok = !rep.needs_owner || !!(inp && inp.ok === true && !inp.error);
return { ...rep, alert_ok, response: { review_id: rep.review_id, status: rep.status, rating: rep.rating, topics: rep.topics, owner_alert: !rep.needs_owner ? 'not_needed' : alert_ok ? 'sent' : 'queued' } };
})();
ctx.final = out;
return { out: out, ms: 6 };
},
    respond: function (i, ctx) { return { out: ctx.final.response, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], hhmm = new Date().toTimeString().slice(0, 5);
      var an = T('analyze', r);
      if (!an) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 e nada é rascunhado. É assim de propósito: dado inválido não vira resposta pública.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 and nothing is drafted. On purpose: invalid data never becomes a public reply.' } }];
      var v = an.out, rt = c.route, fin = c.final, stars = '★★★★★'.slice(0, v.rating) + '☆☆☆☆☆'.slice(0, 5 - v.rating);
      var badge = { ready_to_post: 'b-ok', needs_review: 'b-warn', needs_owner: 'b-hot', escalated: 'b-hot' }[rt.status];
      o.push({ kind: 'chat', title: { pt: 'Avaliação e rascunho de resposta', en: 'Review and drafted reply' }, turns: [{ q: stars + '  ' + v.reviewer + (v.text ? '\n' + v.text : '\n(stars only, no text)'), a: rt.reply, tools: 'reply draft · ' + rt.reply_chars + ' chars · NOT posted' }] });
      o.push({ kind: 'card', title: { pt: 'Análise', en: 'Analysis' }, rows: [[{ pt: 'Status', en: 'Status' }, rt.status, badge], [{ pt: 'Sentimento', en: 'Sentiment' }, v.sentiment], [{ pt: 'Idioma', en: 'Language' }, v.lang.toUpperCase() + ' · ' + v.tone],
        [{ pt: 'Temas', en: 'Topics' }, v.topics.length ? v.topics.join(', ') : { pt: 'nenhum', en: 'none' }], [{ pt: 'Escalar', en: 'Escalate' }, v.escalate ? { pt: 'sim (termo de risco)', en: 'yes (risk term)' } : { pt: 'não', en: 'no' }]] });
      if (rt.needs_owner && c.alert && c.alert.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta ao dono', en: 'Owner alert' }, from: 'Review Bot', text: c.alert.text, time: hhmm });
      else if (rt.needs_owner) o.push({ kind: 'error', title: { pt: 'Alerta ao dono', en: 'Owner alert' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. Nada se perdeu: o rascunho já está na fila (' + rt.review_id + ') com status ' + rt.status + ' e a API respondeu "queued" (Continue On Fail).', en: 'Telegram stayed down for all 3 attempts. Nothing was lost: the draft is already in the queue (' + rt.review_id + ') as ' + rt.status + ' and the API answered "queued" (Continue On Fail).' } });
      else o.push({ title: { pt: 'Alerta ao dono', en: 'Owner alert' }, skipped: { pt: 'Nota boa ou neutra sem termo de risco: sem alerta.', en: 'Good or neutral rating, no risk term: no alert.' } });
      o.push({ kind: 'sheet', title: { pt: 'Fila de respostas (replies_16.csv)', en: 'Reply queue (replies_16.csv)' }, cols: ['review_id', 'reviewer', 'rating', 'topics', 'status'], rows: c.rows.map(function (x) { return [x[1], x[2], x[3], x[4], x[5]]; }).slice(-4), highlightLast: true });
      return o;
    }
  };
})();
