/* Nós Code = mesmo código do workflow.json. O modelo (LLM) é o substituto de teste da execução gravada (mock_server.py), portado para JS. */
(function () {
  var CFG = { data_dir: './data', ai_url: 'http://localhost:11434/v1/chat/completions', ai_model: 'llama3.2:1b', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"'; };
  var COLS = ['received_at', 'from', 'subject', 'category', 'urgency', 'sentiment', 'source', 'reply'];
  var R = {
    billing: ['We are reviewing the charge on your account and will confirm within one business day.', 'Estamos revisando a cobrança na sua conta e confirmamos em até um dia útil.'],
    bug: ['Sorry about the trouble. Our team is looking into it; could you share a screenshot or the steps to reproduce?', 'Desculpe o transtorno. Nossa equipe está verificando; pode enviar um print ou os passos para reproduzir?'],
    sales: ['Thanks for your interest! Here is a short overview and a link to book a call.', 'Obrigado pelo interesse! Segue um resumo e o link para agendar uma conversa.'],
    question: ['Good question - here is the short answer, and our help center has the full guide.', 'Boa pergunta! Segue a resposta resumida; a central de ajuda tem o guia completo.'],
    other: ['Thanks for writing. A teammate will read this and get back to you.', 'Obrigado pelo contato. Alguém da equipe vai ler e responder.']
  };
  function rules(b) { // Code "Rules triage"
    b = b || {};
    var subject = String(b.subject || ''), body = String(b.body || ''), from = String(b.from || '');
    var t = (subject + ' ' + body).toLowerCase();
    if (!t.trim()) throw new Error('Empty message');
    var has = function (r) { return r.test(t); };
    var category = has(/(refund|reembols|charge|cobran|invoice|fatura|boleto|payment|pagamento)/) ? 'billing'
      : has(/(error|erro|crash|bug|not working|n[aã]o funciona|travou|broken|down|fora do ar)/) ? 'bug'
      : has(/(price|pricing|quote|or[cç]amento|plan|plano|demo|trial)/) ? 'sales'
      : has(/(how|como|where|onde|can i|posso|\?)/) ? 'question' : 'other';
    var urgency = has(/(urgent|urgente|asap|immediately|agora|down|fora do ar|lost money|perdi|cannot access|n[aã]o consigo acessar)/) ? 'high' : 'normal';
    var neg = has(/(angry|terrible|worst|pessimo|péssimo|horrible|unacceptable|inaceitável|cancel)/);
    var pt = has(/(não|nao |você|voce|preciso|olá|obrigad|fatura|cobran|ajuda|por favor)/);
    return { received_at: new Date().toISOString(), from: from, subject: subject, body: body, category: category, urgency: neg && urgency === 'normal' ? 'high' : urgency, sentiment: neg ? 'negative' : 'neutral', reply: R[category][pt ? 1 : 0], source: 'rules', lang: pt ? 'pt' : 'en' };
  }
  function llmMock(user) { // mock_server.py: /v1/chat/completions
    var txt = user.toLowerCase();
    var cat = /refund|charge|invoice|reembols|cobran/.test(txt) ? 'billing' : /error|crash|erro|not working/.test(txt) ? 'bug' : 'question';
    return JSON.stringify({ category: cat, urgency: txt.indexOf('urgent') >= 0 || txt.indexOf('urgente') >= 0 ? 'high' : 'normal', reply: 'Thanks for reaching out. We are on it and will get back to you shortly.' });
  }
  function merge(base, r) { // Code "Merge AI result"
    try {
      var content = r.choices[0].message.content;
      var a = JSON.parse(content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1));
      if (['billing', 'bug', 'sales', 'question', 'other'].indexOf(a.category) < 0) throw new Error('bad category');
      var o = copy(base); o.category = a.category; o.urgency = a.urgency === 'high' ? 'high' : base.urgency; o.reply = a.reply || base.reply; o.source = 'ai'; return o;
    } catch (e) {
      var f = copy(base); f.source = 'rules-fallback'; f.ai_error = String(r.error || e.message).slice(0, 120); return f;
    }
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'webhook', rules: rules, merge: merge,
    init: function () { return { sheet: [] }; },
    nodes: {
      webhook: function (i, ctx) { ctx.ticket = null; ctx.alert = null; ctx.use_ai = String(i.body.use_ai) === 'true'; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 12 }; },
      config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; o.use_ai = String(ctx.use_ai); return { out: o, ms: 3 }; },
      rules: function (i, ctx) { ctx.base = rules(i.body); return { out: ctx.base, ms: 9 }; },
      useai: function (i, ctx) { return { out: i, branch: ctx.use_ai ? 'true' : 'false', ms: 2 }; },
      llm: function (i, ctx) {
        if (i && i.__error) return { out: { error: i.__error }, ms: 0 };
        return { out: { choices: [{ message: { role: 'assistant', content: llmMock(ctx.base.subject + '\n' + ctx.base.body) } }] }, ms: 380 };
      },
      merge: function (i, ctx) { return { out: merge(ctx.base, i), ms: 5 }; },
      csv: function (i, ctx) { var j = (i && i.source) ? i : ctx.base; ctx.ticket = j; var o = copy(j); o.csv_line = COLS.map(function (k) { return q(j[k]); }).join(','); return { out: o, ms: 6 }; },
      append: function (i, ctx) { ctx.sheet.push(COLS.map(function (k) { return String(i[k] == null ? '' : i[k]); })); return { out: i, ms: 16 }; },
      urgent: function (i) { return { out: i, branch: i.urgency === 'high' ? 'true' : 'false', ms: 2 }; },
      notify: function (i, ctx) {
        if (i && i.__error) { var e = copy(i.input); e.notify = { ok: false, error: i.__error }; return { out: e, ms: 0 }; }
        var o = copy(i); ctx.alert = 'URGENT ' + i.category + ' ticket from ' + i.from + ': ' + i.subject; o.notify = { ok: true, chat_id: CFG.notify_chat_id, text: ctx.alert }; return { out: o, ms: 205 };
      },
      respond: function (i) { return { out: { category: i.category, urgency: i.urgency, source: i.source, draft_reply: i.reply }, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], t = c.ticket;
      if (r.failed || !t) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. Nada foi gravado: mensagem vazia não vira ticket.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. Nothing was saved: an empty message does not become a ticket.' } }];
      var nt = T('notify', r);
      o.push({ kind: 'card', title: { pt: 'Ticket classificado', en: 'Classified ticket' }, rows: [[{ pt: 'Assunto', en: 'Topic' }, t.category], [{ pt: 'Urgência', en: 'Urgency' }, t.urgency, t.urgency === 'high' ? 'b-hot' : 'b-cold'], [{ pt: 'Tom', en: 'Tone' }, t.sentiment], [{ pt: 'Quem classificou', en: 'Classified by' }, t.source, t.source === 'rules-fallback' ? 'b-warm' : ''], [{ pt: 'Idioma do rascunho', en: 'Draft language' }, t.lang.toUpperCase()]] });
      o.push({ kind: 'email', title: { pt: 'Rascunho de resposta (para a equipe revisar)', en: 'Draft reply (for the team to review)' }, to: 'To: ' + t.from, subject: 'Re: ' + t.subject, text: t.reply });
      if (t.urgency !== 'high') o.push({ title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, skipped: { pt: 'Só ticket urgente avisa a equipe. Este é "normal".', en: 'Only urgent tickets ping the team. This one is "normal".' } });
      else if (nt && nt.out.notify && nt.out.notify.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, from: 'Suporte', text: nt.out.notify.text, time: new Date().toTimeString().slice(0, 5) });
      else o.push({ kind: 'error', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. O ticket já estava na planilha e o rascunho foi devolvido (Continue On Fail).', en: 'Telegram stayed down for all 3 attempts. The ticket was already in the sheet and the draft was returned (Continue On Fail).' } });
      o.push({ kind: 'sheet', title: { pt: 'Linha na planilha (tickets.csv)', en: 'Row in the sheet (tickets.csv)' }, cols: COLS.filter(function (x) { return x !== 'reply'; }), rows: c.sheet.map(function (x) { return x.slice(0, 7); }).slice(-4), highlightLast: true });
      if (t.ai_error) o.push({ title: { pt: 'Por que "rules-fallback"', en: 'Why "rules-fallback"' }, json: { ai_error: t.ai_error, resultado: 'a classificação por regras foi mantida e marcada no ticket' } });
      return o;
    },
    verify: function (exp, ctx) {
      var t = ctx.ticket; if (!t) return false;
      if (exp.source === 'rules-fallback') t = merge(ctx.base, { error: 'ECONNREFUSED' }); // sim permanente no nó do modelo
      return ['category', 'urgency', 'sentiment', 'source', 'reply'].every(function (k) { return t[k] === exp[k]; });
    }
  };
})();
