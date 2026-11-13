/* Porta fiel de agent.py (ferramentas, validação de argumentos, laço com trava de passos, política de reembolso) para JavaScript.
   O "LLM" é o mesmo planejador simulado do Python (regras fixas), NÃO um modelo de linguagem de verdade. Conferido contra as saídas gravadas. */
(function () {
  var ORDERS = { 'ORD-1001': { status: 'delivered', days: 12, total: 89.9 }, 'ORD-1002': { status: 'delivered', days: 5, total: 249.0 }, 'ORD-1003': { status: 'shipped', days: 0, total: 59.0, eta: '2026-11-14' }, 'ORD-1004': { status: 'delivered', days: 45, total: 120.0 } };
  var FAQ = [[['shipping', 'delivery', 'prazo', 'entrega'], 'Standard delivery takes 3-7 business days.'], [['refund', 'return', 'policy', 'devolução'], 'Refunds are accepted within 30 days of delivery. Refunds above 100.00 need human approval.'], [['invoice', 'nota', 'receipt'], 'Invoices are e-mailed when the order ships.']];
  var AUTO = 100, WINDOW = 30, MAX = 6;
  var SCHEMA = { get_order: [{ order_id: 'string' }, ['order_id']], search_faq: [{ query: 'string' }, ['query']], create_refund: [{ order_id: 'string', amount: 'number' }, ['order_id', 'amount']] };
  function getOrder(a) { var o = ORDERS[a.order_id]; if (!o) return { error: 'order not found' }; var r = { order_id: a.order_id }; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
  function searchFaq(a) { var q = a.query.toLowerCase(), hit = null; FAQ.forEach(function (f) { if (!hit && f[0].some(function (k) { return q.indexOf(k) >= 0; })) hit = f[1]; }); return hit ? { answer: hit } : { error: 'no faq match' }; }
  function createRefund(a, ledger) {
    var o = ORDERS[a.order_id]; if (!o) return { error: 'order not found' };
    if (o.status !== 'delivered' || o.days > WINDOW) return { error: 'not refundable (status ' + o.status + ', ' + o.days + ' days)' };
    if (ledger.some(function (r) { return r.order_id === a.order_id; })) return { error: 'already refunded or pending' };
    if (!(a.amount > 0 && a.amount <= o.total)) return { error: 'amount must be between 0 and ' + o.total };
    var st = a.amount <= AUTO ? 'refunded' : 'pending_approval'; ledger.push({ order_id: a.order_id, amount: a.amount, status: st }); return { order_id: a.order_id, amount: a.amount, status: st };
  }
  function check(name, args) { // devolve mensagem de erro ou null
    if (!SCHEMA[name]) return 'unknown tool ' + name;
    if (args === null || typeof args !== 'object' || Array.isArray(args)) return 'invalid arguments: must be an object';
    var miss = SCHEMA[name][1].filter(function (k) { return !(k in args); }); if (miss.length) return 'invalid arguments: missing ' + miss.join(', ');
    var bad = Object.keys(args).filter(function (k) { return SCHEMA[name][0][k] && typeof args[k] !== SCHEMA[name][0][k]; }); if (bad.length) return 'invalid arguments: wrong type for ' + bad.join(', ');
    return null;
  }
  function simLlm(mode, msgs) {
    var user = msgs[0].content, tools = msgs.filter(function (m) { return m.role === 'tool'; }), last = tools.length ? tools[tools.length - 1] : null;
    var mt = /ORD-\d+/.exec(user.toUpperCase()), oid = mt ? mt[0] : null, refund = /refund|reembols|devol/.test(user.toLowerCase()), status = /where|status|track|rastre|cad[eê]/.test(user.toLowerCase());
    var call = function (n, a) { return { tool_calls: [{ name: n, arguments: a }] }; };
    if (mode === 'loop' && oid) return call('get_order', { order_id: oid });
    if (!last) {
      if ((refund || status) && oid) return call('get_order', mode === 'sloppy' ? {} : { order_id: oid });
      if (refund || status) return { content: 'Which order is this about? Please send the order id (ORD-xxxx).' };
      return call('search_faq', { query: user });
    }
    var r = last.content;
    if (last.name === 'search_faq') return { content: r.answer || 'I could not find that in the FAQ, so I am handing this to a human agent.' };
    if (last.name === 'get_order') {
      if (r.error) return r.error.indexOf('invalid arguments') === 0 ? call('get_order', { order_id: oid }) : { content: 'I could not find order ' + oid + '. Please check the id.' };
      if (!refund) return { content: 'Order ' + oid + ' is ' + r.status + (r.eta ? ', expected on ' + r.eta + '.' : ' (' + r.days + ' days ago).') };
      return call('create_refund', { order_id: oid, amount: r.total });
    }
    if (r.error) return { content: 'I cannot refund this order: ' + r.error + '.' };
    return { content: r.status === 'refunded' ? 'Refund of ' + r.amount.toFixed(2) + ' for ' + r.order_id + ' issued.' : 'Refund of ' + r.amount.toFixed(2) + ' for ' + r.order_id + ' is above the automatic limit and was sent for human approval.' };
  }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { ledger: [], msgs: [], steps: [], round: 0, final: null, stopped: false }; },
    verify: function (e, ctx) { return ctx.final === e.answer && ctx.stopped === e.stopped && JSON.stringify(ctx.steps) === JSON.stringify(e.steps) && JSON.stringify(ctx.ledger) === JSON.stringify(e.ledger); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.mode = b.model; ctx.msgs = [{ role: 'user', content: String(b.question) }]; ctx.steps = []; ctx.round = 0; ctx.final = null; ctx.stopped = false; return { out: { user: ctx.msgs[0].content, model: 'simulated planner (' + ctx.mode + ')', max_steps: MAX }, ms: 4 }; },
      llm: function (i, ctx) {
        if (ctx.round >= MAX) { ctx.stopped = true; ctx.final = 'I could not finish within ' + MAX + ' steps, so a human agent will take over.'; return { out: { guard: 'max_steps reached' }, branch: 'stop', ms: 1 }; }
        var m = simLlm(ctx.mode, ctx.msgs);
        if (!m.tool_calls) { ctx.final = m.content; return { out: m, branch: 'answer', ms: 420 }; }
        ctx.round += 1; ctx.call = m.tool_calls[0]; ctx.msgs.push({ role: 'assistant', tool_calls: m.tool_calls }); return { out: m, branch: 'call', ms: 380 };
      },
      validate: function (i, ctx) {
        var c = ctx.call, err = check(c.name, c.arguments);
        if (err) { var res = { error: err }; ctx.steps.push({ n: ctx.round, tool: c.name, args: c.arguments, result: res }); ctx.msgs.push({ role: 'tool', name: c.name, content: res }); return { out: res, branch: 'bad', ms: 1 }; }
        return { out: { valid: true, tool: c.name }, branch: 'ok', ms: 1 };
      },
      tool: function (i, ctx) {
        var c = ctx.call, res = c.name === 'get_order' ? getOrder(c.arguments) : c.name === 'search_faq' ? searchFaq(c.arguments) : createRefund(c.arguments, ctx.ledger);
        ctx.steps.push({ n: ctx.round, tool: c.name, args: c.arguments, result: res }); ctx.msgs.push({ role: 'tool', name: c.name, content: res }); return { out: res, ms: 25 };
      },
      answer: function (i, ctx) { return { out: { answer: ctx.final, tools_used: ctx.steps.length }, ms: 2, end: true }; },
      handoff: function (i, ctx) { return { out: { answer: ctx.final, stopped: true }, ms: 2, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (c.stopped) o.push({ kind: 'error', title: { pt: 'Trava de passos acionada', en: 'Step guard triggered' }, text: { pt: 'O modelo simulado não parava de chamar a mesma ferramenta. O agente cortou em 6 passos e passou para uma pessoa em vez de gastar chamadas para sempre.', en: 'The simulated model kept calling the same tool. The agent cut it at 6 steps and handed over to a person instead of burning calls forever.' } });
      o.push({ kind: 'chat', title: { pt: 'Conversa', en: 'Conversation' }, turns: [{ q: c.msgs[0].content, a: c.final, tools: c.steps.length ? 'tools: [' + c.steps.map(function (s) { return s.tool + (s.result.error && s.result.error.indexOf('invalid') === 0 ? ' (rejected)' : ''); }).join(', ') + ']  steps: ' + c.steps.length : 'tools: []  steps: 0' }] });
      if (c.steps.length) o.push({ kind: 'sheet', title: { pt: 'Chamadas de ferramenta', en: 'Tool calls' }, cols: ['step', 'tool', 'arguments', 'result'], rows: c.steps.map(function (s) { return [s.n, s.tool, JSON.stringify(s.args), JSON.stringify(s.result)]; }) });
      if (c.ledger.length) o.push({ kind: 'sheet', title: { pt: 'Livro de reembolsos (memória desta página)', en: 'Refund ledger (this page memory)' }, cols: ['order', 'amount', 'status'], rows: c.ledger.map(function (l) { return [l.order_id, l.amount, l.status]; }) });
      return o;
    }
  };
})();
