/* Lógica de cada nó = o MESMO código dos nós Code do workflow.json (adaptado de $input para argumentos). */
(function () {
  function classify(b) {
    var name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase();
    var msg = String(b.message || ''), company = String(b.company || '').trim();
    var budget = Number(String(b.budget || '0').replace(/[^0-9.]/g, '')) || 0;
    var txt = (msg + ' ' + (b.service || '')).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Invalid or missing email');
    var spam = /(backlinks|seo ranking|crypto|casino|guaranteed traffic|viagra)/.test(txt);
    var score = 0, why = [];
    if (budget >= 2000) { score += 2; why.push('budget>=2000'); } else if (budget >= 500) { score += 1; why.push('budget>=500'); }
    if (/(urgent|asap|urgente|this week|esta semana|hoje)/.test(txt)) { score += 1; why.push('urgent'); }
    if (/(quote|pricing|price|orçamento|orcamento|proposal|proposta|contratar|hire)/.test(txt)) { score += 1; why.push('buying intent'); }
    if (company) { score += 1; why.push('company given'); }
    var priority = spam ? 'spam' : score >= 3 ? 'hot' : score >= 1 ? 'warm' : 'cold';
    var pt = /(olá|ola|preciso|gostaria|orçamento|orcamento|quero|bom dia|boa tarde|proposta)/.test(txt) || b.lang === 'pt';
    var first = name.split(' ')[0] || (pt ? 'tudo bem' : 'there');
    var sla = priority === 'hot' ? (pt ? 'em até 2 horas' : 'within 2 hours') : (pt ? 'em até 1 dia útil' : 'within 1 business day');
    var reply = priority === 'spam' ? '' : pt ? 'Olá, ' + first + '! Recebemos sua mensagem e respondemos ' + sla + '.' : 'Hi ' + first + ', thanks for reaching out. We will reply ' + sla + '.';
    return { received_at: new Date().toISOString(), name: name, email: email, company: company, budget: budget, service: b.service || '', message: msg, score: score, priority: priority, why: why.join('; '), lang: pt ? 'pt' : 'en', reply: reply };
  }
  var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"'; };
  var COLS = ['received_at', 'name', 'email', 'company', 'budget', 'service', 'priority', 'score', 'why', 'message'];
  var CFG = { data_dir: './data', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var SEED = [['2026-11-10T14:02:11.120Z', 'Marta Ruiz', 'marta@oficinaverde.example', 'Oficina Verde', '800', 'Website', 'warm', '3', 'budget>=500; buying intent; company given', 'Looking for pricing on a small site.'],
    ['2026-11-10T16:40:52.002Z', 'Seo Bot', 'bot@spam.example', '', '0', '', 'spam', '0', '', 'Guaranteed traffic and backlinks for you']];
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'webhook',
    classify: classify, COLS: COLS,
    init: function () { return { sheet: SEED.slice() }; },
    nodes: {
      webhook: function (i) { return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 12 }; },
      config: function (i) { var o = copy(i); for (var c in CFG) o[c] = CFG[c]; return { out: o, ms: 3 }; },
      classify: function (i) { return { out: classify(i.body || {}), ms: 9 }; },
      csv: function (i) { var o = copy(i); o.csv_line = COLS.map(function (k) { return q(i[k]); }).join(','); return { out: o, ms: 6 }; },
      append: function (i, ctx) { ctx.sheet.push(COLS.map(function (k) { return String(i[k] == null ? '' : i[k]); })); return { out: i, ms: 18 }; },
      hot: function (i) { return { out: i, branch: i.priority === 'hot' ? 'true' : 'false', ms: 2 }; },
      notify: function (i) {
        if (i && i.__error) { var o = copy(i.input); o.notify = { ok: false, error: i.__error }; return { out: o, ms: 0 }; }
        var text = 'HOT LEAD: ' + i.name + ' <' + i.email + '> budget ' + i.budget + ' | ' + i.why;
        var o2 = copy(i); o2.notify = { ok: true, chat_id: CFG.notify_chat_id, text: text }; return { out: o2, ms: 214 };
      },
      respond: function (i) { return { out: { ok: true, priority: i.priority, reply: i.reply }, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var o = [], c = r.ctx;
      if (!T('classify', r)) {
        return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. Nada foi gravado na planilha e o visitante recebe erro 400. É assim de propósito: dado ruim não entra no CRM em silêncio.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. Nothing was written to the sheet and the visitor gets a 400. That is on purpose: bad data does not enter the CRM silently.' } }];
      }
      var cl = T('classify', r).out, nt = T('notify', r);
      o.push({ kind: 'card', title: { pt: 'Lead classificado', en: 'Classified lead' }, rows: [[{ pt: 'Prioridade', en: 'Priority' }, cl.priority, 'b-' + cl.priority], [{ pt: 'Pontuação', en: 'Score' }, cl.score + ' / 5'], [{ pt: 'Por quê', en: 'Why' }, cl.why || '-'], [{ pt: 'Idioma da resposta', en: 'Reply language' }, cl.lang.toUpperCase()]] });
      o.push(cl.reply ? { kind: 'email', title: { pt: 'Resposta ao visitante', en: 'Reply to the visitor' }, to: 'To: ' + cl.name + ' <' + cl.email + '>', subject: cl.lang === 'pt' ? 'Recebemos sua mensagem' : 'We got your message', text: cl.reply + '\n\n' + (cl.lang === 'pt' ? 'Equipe Atende' : 'Atende team') } : { title: { pt: 'Resposta ao visitante', en: 'Reply to the visitor' }, skipped: { pt: 'Spam: nenhuma resposta é enviada.', en: 'Spam: no reply is sent.' } });
      if (cl.priority !== 'hot') o.push({ title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, skipped: { pt: 'Só lead quente dispara alerta. Este foi "' + cl.priority + '".', en: 'Only hot leads fire an alert. This one is "' + cl.priority + '".' } });
      else if (nt && nt.out.notify && nt.out.notify.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, from: 'Lead Bot', text: nt.out.notify.text, time: new Date().toTimeString().slice(0, 5) });
      else o.push({ kind: 'error', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. O lead NÃO se perdeu: já estava na planilha e o visitante recebeu a resposta (Continue On Fail). Um e-mail de erro seria disparado para a equipe: "Notify falhou para ' + cl.name + '".', en: 'Telegram stayed down for all 3 attempts. The lead was NOT lost: it was already in the sheet and the visitor got the reply (Continue On Fail). An error e-mail would go to the team: "Notify failed for ' + cl.name + '".' } });
      o.push({ kind: 'sheet', title: { pt: 'Linha na planilha (leads.csv)', en: 'Row in the sheet (leads.csv)' }, cols: COLS.filter(function (x) { return x !== 'message'; }), rows: c.sheet.map(function (x) { return x.slice(0, 9); }).slice(-4), highlightLast: true });
      return o;
    }
  };
})();
