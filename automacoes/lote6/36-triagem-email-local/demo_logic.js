/* Porta fiel de triage.py (tokens, predict, classify) para JavaScript. O modelo (contagens do Naive Bayes treinado em Python) vai embutido; a lógica foi conferida contra as saídas reais do Python. */
(function () {
  var MODEL = __MODEL__, VOCAB = {}, V = MODEL.vocab.length;
  MODEL.vocab.forEach(function (w) { VOCAB[w] = 1; });
  var STOP = {}; 'the a an and or to of in on for is are was were be i we you your my our it this that with at as from by have has can could please hello hi thanks thank dear regards'.split(' ').forEach(function (w) { STOP[w] = 1; });
  var VIP = ['ceo@bigclient.example'], BLOCK = ['promo-deals.example', 'lucky-winner.example'], MIN_CONF = 0.6;
  var URGENT = /\b(urgent|asap|outage|down|cannot access|chargeback|lawyer|legal action)\b/i, INVOICE = /\binv-\d{3,}\b/i, AUTO = /^\s*(automatic reply|out of office)/i;
  var ROUTE = { billing: 'finance@team.example', support: 'support@team.example', sales: 'sales@team.example', spam: 'trash', ignore: 'archive', review: 'inbox-human' };
  var DRAFT = { billing: 'Hello,\n\nWe received your billing message and passed it to our finance team.{urgent}\nA person will confirm the details with you.\n\nBest regards', support: 'Hello,\n\nWe received your support request and passed it to our support team.{urgent}\nIt would help if you could send a screenshot and the steps to reproduce the problem.\n\nBest regards', sales: 'Hello,\n\nThank you for your interest. Your message went to our sales team, who will get back to you with details.{urgent}\n\nBest regards' };
  function tokens(t) { return (t.toLowerCase().match(/[a-z]{3,}/g) || []).filter(function (w) { return !STOP[w]; }); }
  function predict(text) {
    var toks = tokens(text).filter(function (w) { return VOCAB[w]; }), sc = {}, labs = Object.keys(MODEL.labels);
    labs.forEach(function (lab) { var d = MODEL.labels[lab], s = Math.log(d.docs / MODEL.docs); toks.forEach(function (w) { s += Math.log(((d.counts[w] || 0) + 1) / (d.total + V)); }); sc[lab] = s; });
    var m = Math.max.apply(null, labs.map(function (l) { return sc[l]; })), e = {}, z = 0; labs.forEach(function (l) { e[l] = Math.exp(sc[l] - m); z += e[l]; });
    var best = labs.slice().sort()[0]; labs.slice().sort().forEach(function (l) { if (e[l] / z > e[best] / z) best = l; });
    return { label: best, conf: Math.round(e[best] / z * 1000) / 1000, known: toks.length, probs: labs.map(function (l) { return [l, Math.round(e[l] / z * 1000) / 1000]; }) };
  }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { r: null }; },
    verify: function (expect, ctx) { return JSON.stringify(ctx.r) === JSON.stringify(expect); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.m = { from: (b.from || '').trim().toLowerCase(), subject: b.subject || '', body: b.body || '' }; ctx.text = ctx.m.subject + ' ' + ctx.m.body; ctx.why = []; ctx.r = null; ctx.label = null; return { out: { from: ctx.m.from, subject: ctx.m.subject, chars: ctx.text.length }, ms: 6 }; },
      rules: function (i, ctx) {
        var dom = ctx.m.from.split('@').pop();
        if (AUTO.test(ctx.m.subject)) { ctx.label = 'ignore'; ctx.src = 'rule'; ctx.conf = 1.0; ctx.why.push('auto-reply subject'); }
        else if (BLOCK.indexOf(dom) >= 0) { ctx.label = 'spam'; ctx.src = 'rule'; ctx.conf = 1.0; ctx.why.push('sender domain ' + dom + ' is blocked'); }
        else if (INVOICE.test(ctx.text)) { ctx.label = 'billing'; ctx.src = 'rule'; ctx.conf = 1.0; ctx.why.push('invoice number found'); }
        return ctx.label ? { out: { rule_hit: ctx.why[0], label: ctx.label }, branch: 'rule', ms: 1 } : { out: { rule_hit: null }, branch: 'model', ms: 1 };
      },
      model: function (i, ctx) { var p = predict(ctx.text); ctx.p = p; ctx.label = p.label; ctx.conf = p.conf; ctx.src = 'model'; ctx.why.push('model: ' + p.label + ' ' + p.conf + ' (' + p.known + ' known words)'); return { out: { label: p.label, confidence: p.conf, known_words: p.known, probabilities: p.probs }, ms: 3 }; },
      confidence: function (i, ctx) { return { out: { confidence: ctx.conf, minimum: MIN_CONF }, branch: ctx.conf < MIN_CONF ? 'low' : 'ok', ms: 1 }; },
      review: function (i, ctx) { ctx.label = 'review'; ctx.src = 'review'; ctx.why.push('confidence below ' + MIN_CONF + ': a person decides'); return { out: { label: 'review' }, ms: 1 }; },
      priority: function (i, ctx) {
        var urgent = URGENT.test(ctx.text) || VIP.indexOf(ctx.m.from) >= 0; if (urgent) ctx.why.push('urgent word or VIP sender');
        ctx.prio = (ctx.label === 'spam' || ctx.label === 'ignore') ? 'low' : urgent ? 'high' : 'normal'; return { out: { urgent: urgent, priority: ctx.prio }, ms: 1 };
      },
      route: function (i, ctx) {
        var d = DRAFT[ctx.label] ? DRAFT[ctx.label].replace('{urgent}', ctx.prio === 'high' ? '\nWe are treating it as a priority.' : '') : null;
        ctx.r = { label: ctx.label, source: ctx.src, confidence: ctx.conf, priority: ctx.prio, route: ROUTE[ctx.label], why: ctx.why.slice(), draft: d };
        return { out: { route: ROUTE[ctx.label], draft_file: d ? 'drafts/NN_' + ctx.label + '.txt' : null }, ms: 4, end: true };
      }
    },
    outputs: function (r) {
      var x = r.ctx.r, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var src = { rule: { pt: 'regra fixa', en: 'fixed rule' }, model: { pt: 'modelo local', en: 'local model' }, review: { pt: 'confiança baixa: humano decide', en: 'low confidence: a person decides' } };
      o.push({ kind: 'card', title: { pt: 'Triagem do e-mail', en: 'E-mail triage' }, rows: [[{ pt: 'Classe', en: 'Class' }, x.label, x.label === 'review' ? 'b-warm' : 'b-ok'], [{ pt: 'Quem decidiu', en: 'Decided by' }, src[x.source]], [{ pt: 'Confiança', en: 'Confidence' }, String(x.confidence)], [{ pt: 'Prioridade', en: 'Priority' }, x.priority, x.priority === 'high' ? 'b-warm' : 'b-ok'], [{ pt: 'Vai para', en: 'Goes to' }, x.route], [{ pt: 'Por quê', en: 'Why' }, x.why.join(' · ')]] });
      if (x.draft) o.push({ kind: 'email', title: { pt: 'Rascunho de resposta (arquivo local, NÃO enviado)', en: 'Draft reply (local file, NOT sent)' }, to: r.ctx.m.from, subject: 'Re: ' + r.ctx.m.subject, text: x.draft });
      else o.push({ title: { pt: 'Sem rascunho', en: 'No draft' }, skipped: { pt: 'Spam, resposta automática e casos para humano não ganham rascunho.', en: 'Spam, auto-replies and cases for a person get no draft.' } });
      return o;
    }
  };
})();
