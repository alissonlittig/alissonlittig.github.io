/* Nós Code = mesmo código do workflow.json (indexação, recuperação, composição). Os 5 documentos são os da execução gravada. */
(function () {
  var KB = {"returns-policy.md": "# Returns policy\nCustomers may return any unused appliance within 30 days of delivery for a full refund.\nOpened small appliances are accepted within 14 days if the original packaging and all accessories are included.\nReturn shipping is free for defective items. For change-of-mind returns the customer pays shipping, about US$ 8.\nRefunds are issued to the original payment method within 5 business days after the warehouse inspects the item.", "security-and-privacy.md": "# Security and privacy\nCustomer data is stored in the EU and encrypted at rest. Payment details are handled by the payment provider and never stored by Brisa.\nEmployees access customer records only through the support console, and every access is logged.\nCustomers can request export or deletion of their data by writing to the privacy desk; requests are answered within 30 days.", "shipping.md": "# Shipping\nOrders placed before 2 PM on business days ship the same day. Standard delivery takes 3 to 5 business days in the US.\nExpress delivery takes 1 to 2 business days and costs US$ 14.90. Orders above US$ 75 ship free with standard delivery.\nInternational shipping is available to Canada and the UK in 7 to 12 business days; customs fees are paid by the buyer.", "support-hours.md": "# Support hours and channels\nSupport is available Monday to Friday, 9 AM to 6 PM Eastern time, by chat and e-mail. There is no phone line.\nPriority customers on the Pro plan receive answers within 4 business hours. Standard customers within 1 business day.\nOutside support hours the assistant can answer from this knowledge base and open a ticket for the next business day.", "warranty.md": "# Warranty\nAll Brisa appliances include a 24-month limited warranty that covers manufacturing defects.\nThe air fryer and the blender motor have an extended 36-month warranty when registered within 30 days of purchase.\nDamage from drops, water immersion of the base, or use of non-original parts is not covered.\nTo claim, open a ticket with the order number and a short video showing the problem. Support replies in one business day."};
  var CFG = { data_dir: './data', index_file: 'rag_index.json', top_k: '3' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var STOP = new Set('a an the of to in on for and or is are be do does can i you we it its my your with at by from as that this what how when which who about if not no any'.split(' '));
  var toks = function (s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w && !STOP.has(w); }).map(function (w) { return w.length > 3 ? w.replace(/(ies|es|s)$/, '') : w; }); };
  function buildIndex() { // Code "Chunk and vectorize"
    var docs = Object.keys(KB).map(function (f) { return { file: f, text: KB[f] }; }), chunks = [];
    docs.forEach(function (d) {
      var lines = d.text.split(/\r?\n/).filter(function (l) { return l.trim(); });
      var title = (lines[0] || '').replace(/^#+\s*/, '');
      var sents = lines.slice(1).join(' ').split(/(?<=[.!?])\s+/).filter(Boolean);
      for (var i = 0; i < sents.length; i++) chunks.push({ file: d.file, section: title, para: i + 1, text: sents.slice(i, i + 2).join(' ') });
    });
    var df = {};
    chunks.forEach(function (c) { c.tf = {}; toks(c.text + ' ' + c.section).forEach(function (w) { c.tf[w] = (c.tf[w] || 0) + 1; }); Object.keys(c.tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); });
    var N = chunks.length, idf = {};
    Object.keys(df).forEach(function (w) { idf[w] = Math.log(1 + N / df[w]); });
    chunks.forEach(function (c) { var n = 0, v = {}; Object.keys(c.tf).forEach(function (w) { v[w] = (1 + Math.log(c.tf[w])) * idf[w]; n += v[w] * v[w]; }); n = Math.sqrt(n); Object.keys(v).forEach(function (w) { v[w] = +(v[w] / n).toFixed(5); }); c.vec = v; delete c.tf; });
    return { docs: docs.length, chunks: N, idf: idf, items: chunks };
  }
  function retrieve(index, question, cfg) { // Code "Retrieve top chunks"
    question = String(question || '').trim(); if (!question) throw new Error('Missing question');
    var tf = {}; toks(question).forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    var q = {}, n = 0;
    Object.keys(tf).forEach(function (w) { if (index.idf[w]) { q[w] = (1 + Math.log(tf[w])) * index.idf[w]; n += q[w] * q[w]; } });
    n = Math.sqrt(n) || 1;
    var scored = index.items.map(function (c) { var s = 0; Object.keys(q).forEach(function (w) { if (c.vec[w]) s += (q[w] / n) * c.vec[w]; }); return { file: c.file, section: c.section, para: c.para, text: c.text, score: +s.toFixed(3) }; })
      .sort(function (a, b) { return b.score - a.score; });
    var top = [], seen = new Set();
    scored.forEach(function (c) { var k = c.file + c.para; if (c.score > 0 && !seen.has(k) && top.length < Number(cfg.top_k)) { seen.add(k); top.push(c); } });
    return { question: question, top: top, best: top.length ? top[0].score : 0, enough: top.length > 0 && top[0].score >= Number(cfg.min_score) };
  }
  function compose(j) { // Code "Compose answer with citations"
    var qt = new Set(toks(j.question)), best = j.top[0];
    var ranked = best.text.split(/(?<=[.!?])\s+/).map(function (s) { return { s: s, o: toks(s).filter(function (w) { return qt.has(w); }).length }; }).sort(function (a, b) { return b.o - a.o; });
    var answer = ranked.filter(function (r) { return r.o > 0; }).slice(0, 2).map(function (r) { return r.s; }).join(' ') || best.text;
    var sources = j.top.map(function (c, i) { return { ref: i + 1, file: c.file, section: c.section, paragraph: c.para, score: c.score }; });
    return { answer: answer + ' [1]', sources: sources, confidence: j.best };
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  var srcTxt = function (s) { return s.map(function (x) { return '[' + x.ref + '] ' + x.file + ' - ' + x.section + ' (para ' + x.paragraph + ', score ' + x.score + ')'; }).join('; '); };
  window.DEMO = {
    start: 'webhook', buildIndex: buildIndex,
    init: function () { return { index: buildIndex() }; },
    nodes: {
      webhook: function (i, ctx) { ctx.form = i.body; ctx.ret = null; ctx.res = null; return { out: { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: i.body }, ms: 11 }; },
      config: function (i, ctx) { var o = copy(CFG); o.min_score = String(ctx.form.min_score || '0.15'); return { out: o, ms: 3 }; },
      readidx: function (i, ctx) { return { out: { fileName: CFG.index_file, binary: true, docs: ctx.index.docs, chunks: ctx.index.chunks, vocabulario: Object.keys(ctx.index.idf).length }, ms: 12 }; },
      retrieve: function (i, ctx) {
        var cfg = copy(CFG); cfg.min_score = String(ctx.form.min_score || '0.15');
        ctx.ret = retrieve(ctx.index, ctx.form.question, cfg);
        return { out: { question: ctx.ret.question, top: ctx.ret.top.map(function (c) { return { file: c.file, para: c.para, score: c.score, text: c.text }; }), best: ctx.ret.best, enough: ctx.ret.enough }, ms: 18 };
      },
      enough: function (i) { return { out: i, branch: i.enough ? 'true' : 'false', ms: 2 }; },
      compose: function (i, ctx) { ctx.res = compose(ctx.ret); return { out: ctx.res, ms: 6 }; },
      respond: function (i) { return { out: i, ms: 4, end: true }; },
      refuse: function (i, ctx) { ctx.res = { answer: 'I could not find this in the company documents. A human will follow up.', sources: [], confidence: ctx.ret.best }; return { out: ctx.res, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], R = c.res, ret = c.ret;
      if (r.failed || !R) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. O visitante receberia um erro 500; nada foi inventado.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. The visitor would get a 500; nothing was made up.' } }];
      o.push({ kind: 'chat', title: { pt: 'Resposta do webhook', en: 'Webhook response' }, turns: [{ q: ret.question, a: R.answer, tools: R.sources.length ? 'sources: ' + srcTxt(R.sources) : 'sources: none (refused, best score ' + ret.best + ' < ' + (c.form.min_score || '0.15') + ')' }] });
      if (R.sources.length) o.push({ kind: 'sheet', title: { pt: 'Trechos recuperados', en: 'Retrieved passages' }, cols: ['ref', 'file', 'section', 'para', 'score'], rows: R.sources.map(function (s) { return [s.ref, s.file, s.section, s.paragraph, s.score]; }) });
      else o.push({ title: { pt: 'Trechos usados', en: 'Passages used' }, skipped: { pt: 'Melhor nota ' + ret.best + ', abaixo do mínimo ' + (c.form.min_score || '0.15') + ': recusa em vez de inventar e passa para uma pessoa.', en: 'Best score ' + ret.best + ', below the minimum ' + (c.form.min_score || '0.15') + ': it refuses instead of making things up and hands over to a person.' } });
      return o;
    },
    verify: function (exp, ctx) { var R = ctx.res; return R && R.answer === exp.answer && (R.sources.length ? srcTxt(R.sources) : 'none') === exp.sources; }
  };
})();
