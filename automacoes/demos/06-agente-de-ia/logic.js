/* Nós Code = mesmo código do workflow.json. O LLM é o planejador determinístico da execução gravada (mock_server2.py), portado para JS. */
(function () {
  var PRODUCTS = ['kettle', 'blender', 'air fryer', 'toaster', 'grill'];
  var SEARCH = { kettle: 'Review roundup 2026: electric kettles under US$ 60 average US$ 41; 1.7 L models lead.', competitor: 'Competitor HomeNest cut blender prices 10% this week (public price page).', 'default': 'No strong public results for this query.' };
  var INV = [['KT-170', 'Aurora electric kettle 1.7 L (kettle)', 42, '39.90'], ['BL-900', 'Vortex blender 900 W (blender)', 7, '89.00'], ['AF-550', 'CrispAir air fryer 5.5 L (air fryer)', 0, '119.50'], ['TS-200', 'Sunrise 2-slot toaster (toaster)', 31, '24.90'], ['GR-300', 'Ember tabletop grill (grill)', 12, '64.00']].map(function (r) { return { sku: r[0], name: r[1], stock: r[2], price_usd: r[3] }; });
  var CAL = [['2026-11-11', '09:00', '10:00', 'Team stand-up'], ['2026-11-11', '11:00', '12:30', 'Supplier call - Orbit Logix'], ['2026-11-11', '14:00', '15:00', 'Product review'], ['2026-11-12', '10:00', '11:00', 'Client demo']].map(function (r) { return { date: r[0], start: r[1], end: r[2], title: r[3] }; });
  var MAX_STEPS = 4;
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };

  function llm(msgs) { // planejador do mock_server2.py
    var sysm = msgs[0].content, user = msgs.filter(function (m) { return m.role === 'user'; }).pop().content, low = user.toLowerCase();
    var done = msgs.filter(function (m) { return m.role === 'assistant'; }).map(function (m) { return m.content; });
    var obs = msgs.filter(function (m) { return m.role === 'tool'; }).map(function (m) { return m.content; });
    var prod = PRODUCTS.filter(function (p) { return low.indexOf(p) >= 0; })[0] || null;
    if (!prod) { var mm = /last_product=([a-z ]+)/.exec(sysm); prod = mm ? mm[1].trim() : null; }
    var need = [];
    if (/stock|price|cost|how many|how much|available units/.test(low) && prod) need.push(['sheet_lookup', { query: prod }]);
    if (/meet|free|slot|calendar|schedule|tomorrow|call/.test(low)) need.push(['calendar_free', { date: '2026-11-11' }]);
    if (/news|latest|search|competitor|market|reviews/.test(low)) need.push(['web_search', { query: prod || 'competitor' }]);
    var used = done.map(function (d) { return JSON.parse(d).tool; }).filter(Boolean);
    for (var i = 0; i < need.length; i++) if (used.indexOf(need[i][0]) < 0) return JSON.stringify({ tool: need[i][0], args: need[i][1] });
    var parts = obs.map(function (o) { return JSON.parse(o).summary || ''; }).filter(Boolean);
    return JSON.stringify({ final: parts.join(' ') || 'I could not find that. Could you rephrase?', product: prod });
  }
  var tm = function (n) { return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };
  var tmin = function (t) { var p = t.split(':').map(Number); return p[0] * 60 + p[1]; };

  window.DEMO = {
    start: 'webhook', resetMemory: true, llm: llm, MAX_STEPS: MAX_STEPS,
    init: function () { return { mems: {}, turns: [], st: null, lastSession: 'demo' }; },
    nodes: {
      webhook: function (i, ctx) { ctx.body = i.body; return { out: { headers: { 'content-type': 'application/json' }, body: i.body }, ms: 11 }; },
      config: function (i) { var o = copy(i); o.llm_model = 'llama3.2:3b'; o.max_steps = MAX_STEPS; return { out: o, ms: 3 }; },
      mem: function (i, ctx) { var s = String(ctx.body.session_id || 'default').replace(/[^a-zA-Z0-9_-]/g, ''); var m = ctx.mems[s]; return { out: m ? { file: s + '.json', memory: m } : { file: s + '.json', note: 'no file yet (first turn)' }, ms: 15 }; },
      init: function (i, ctx) {
        var b = ctx.body || {}, question = String(b.question || '').trim();
        if (!question) throw new Error('Missing question');
        var session = String(b.session_id || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
        var mem = JSON.parse(JSON.stringify(ctx.mems[session] || { history: [], last_product: '' }));
        var recent = mem.history.slice(-3).map(function (h) { return 'Q: ' + h.q + ' A: ' + h.a; }).join(' | ');
        var system = 'You are a store assistant. Tools: web_search(query), sheet_lookup(query) for stock and price, calendar_free(date). Reply ONLY with JSON: {"tool":"name","args":{...}} to call a tool, or {"final":"answer"} when done. Memory: last_product=' + mem.last_product + '. Recent: ' + recent;
        var st = { session: session, question: question, mem: mem, steps: 0, tools_used: [], messages: [{ role: 'system', content: system }, { role: 'user', content: question }] };
        ctx.st = st; ctx.lastSession = session; return { out: st, ms: 7 };
      },
      llmreq: function (i, ctx) { var o = copy(i); o.request = { model: 'llama3.2:3b', temperature: 0, messages: i.messages }; ctx.st = i; return { out: o, ms: 3 }; },
      llm: function (i) {
        if (i && i.__error) return { out: { error: i.__error }, ms: 0 };
        var content = llm(i.request.messages);
        return { out: { choices: [{ message: { role: 'assistant', content: content }, finish_reason: 'stop' }], model: i.request.model }, ms: 640 + (content.length % 7) * 90 };
      },
      parse: function (i, ctx) {
        var st = ctx.st, d;
        if (i.error) d = { final: 'Sorry, I could not reach the assistant right now. A teammate will answer you shortly.' };
        else d = JSON.parse(i.choices[0].message.content);
        var steps = st.steps + 1;
        var decision = (d.tool && steps > MAX_STEPS) ? { final: 'Stopped: too many tool calls without an answer.' } : d;
        var o = copy(st); o.steps = steps; o.decision = decision; ctx.st = o; return { out: o, ms: 4 };
      },
      final: function (i) { return { out: i, branch: i.decision.final !== undefined ? 'true' : 'false', ms: 2 }; },
      which: function (i) { return { out: i, branch: i.decision.tool, ms: 2 }; },
      search: function (i) { var q = String(i.decision.args.query).toLowerCase(), k = q.indexOf('kettle') >= 0 ? 'kettle' : q.indexOf('competitor') >= 0 ? 'competitor' : 'default'; return { out: { query: q, results: [{ title: 'Result', snippet: SEARCH[k] }] }, ms: 310 }; },
      lookup: function (i) {
        var q = String(i.decision.args.query || '').toLowerCase(), row = INV.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; })[0];
        var summary = row ? row.name + ': ' + (row.stock > 0 ? row.stock + ' in stock' : 'out of stock') + ', US$ ' + row.price_usd + '.' : 'No product matching "' + q + '" in the inventory sheet.';
        return { out: { tool: 'sheet_lookup', summary: summary }, ms: 38 };
      },
      calendar: function (i) {
        var date = i.decision.args.date, busy = CAL.filter(function (r) { return r.date === date; }).map(function (r) { return [tmin(r.start), tmin(r.end)]; }).sort(function (a, b) { return a[0] - b[0]; });
        var cur = 540, free = [];
        busy.forEach(function (b) { if (b[0] - cur >= 60) free.push(tm(cur) + '-' + tm(b[0])); cur = Math.max(cur, b[1]); });
        if (1020 - cur >= 60) free.push(tm(cur) + '-17:00');
        return { out: { tool: 'calendar_free', summary: 'Free slots (60 min or more) on ' + date + ': ' + (free.join(', ') || 'none') + '.' }, ms: 41 };
      },
      obs: function (i, ctx) {
        var st = ctx.st, o = i, ob = { tool: st.decision.tool, summary: o.summary || (o.results && o.results[0] && o.results[0].snippet) || 'no result' };
        var messages = st.messages.concat([{ role: 'assistant', content: JSON.stringify(st.decision) }, { role: 'tool', content: JSON.stringify(ob) }]);
        var r = copy(st); delete r.decision; r.messages = messages; r.tools_used = st.tools_used.concat([st.decision.tool]); ctx.st = r;
        return { out: r, ms: 5 };
      },
      save: function (i, ctx) {
        var st = i, d = st.decision, mem = st.mem;
        mem.history.push({ q: st.question, a: d.final }); mem.history = mem.history.slice(-6);
        if (d.product) mem.last_product = d.product;
        ctx.mems[st.session] = mem; ctx.turns.push({ q: st.question, a: d.final, tools: 'tools_used: [' + st.tools_used.join(', ') + ']  steps: ' + st.steps });
        return { out: { file: st.session + '.json', memory: mem }, ms: 19 };
      },
      respond: function (i, ctx) { var t = ctx.turns[ctx.turns.length - 1]; return { out: { answer: t.a, tools_used: ctx.st.tools_used, steps: ctx.st.steps }, ms: 4, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou em "' + c.failedName + '": ' + r.failed.message, en: 'The flow stopped at "' + c.failedName + '": ' + r.failed.message } }];
      o.push({ kind: 'chat', title: { pt: 'Conversa (a memória vale entre as perguntas)', en: 'Conversation (memory carries across questions)' }, turns: c.turns });
      var m = c.mems[c.lastSession];
      o.push({ title: { pt: 'Arquivo de memória da sessão', en: 'Session memory file' }, json: m });
      if (r.sim === 'perm') o.push({ kind: 'error', title: { pt: 'Falha tratada', en: 'Handled failure' }, text: { pt: 'O LLM não respondeu nas 3 tentativas. Com Continue On Fail, o fluxo seguiu e devolveu uma resposta de contingência em vez de erro 500; um alerta iria para a equipe.', en: 'The LLM did not answer in 3 attempts. With Continue On Fail the flow carried on and returned a fallback reply instead of a 500; an alert would go to the team.' } });
      return o;
    }
  };
})();
