/* Porta fiel de bot.py (make_update, normalize, handle, render) para JavaScript. Dados fictícios. A demo NÃO fala com Telegram nem Discord: o "envio" é só o payload que seria enviado.
   A conversa persiste entre as execuções (estado em ctx), como no bot. Conferido contra as saídas gravadas do Python. */
(function () {
  var ORDERS = { '1042': { owner: '111', status: 'enviado', eta: '2026-11-14', itens: 3 }, '1043': { owner: '111', status: 'em separação', eta: '2026-11-17', itens: 1 }, '2001': { owner: '222', status: 'entregue', eta: '2026-11-09', itens: 2 } };
  var STOCK = { 'CAD-96': ['Caderno 96f', 41], 'CAN-GEL': ['Caneta gel', 0], 'MOC-01': ['Mochila', 7] };
  var ADMINS = ['222'], WINDOW = 10, LIMIT = 5, NAMES = { '111': 'Ana', '222': 'Bruno' };
  var HELP = 'Comandos: /pedido <numero> · /estoque <sku> · /novo · /cancelar · /ajuda';
  function makeUpdate(platform, uid, name, text, ts) {
    if (platform === 'telegram') return { update_id: Math.trunc(ts * 1000), message: { message_id: 1, date: Math.trunc(ts), from: { id: +uid, first_name: name }, chat: { id: +uid }, text: text } };
    return { t: 'MESSAGE_CREATE', d: { id: String(Math.trunc(ts * 1000)), channel_id: 'c-' + uid, author: { id: uid, username: name }, content: text, timestamp: ts } };
  }
  function normalize(ev) {
    if (ev.message && ev.message.text !== undefined) { var m = ev.message; return { platform: 'telegram', uid: String(m.from.id), name: m.from.first_name || '', chat: String(m.chat.id), text: m.text.trim(), ts: m.date }; }
    if (ev.t === 'MESSAGE_CREATE') { var d = ev.d; return { platform: 'discord', uid: d.author.id, name: d.author.username, chat: d.channel_id, text: d.content.trim(), ts: d.timestamp }; }
    throw new Error('evento não suportado (só mensagem de texto)');
  }
  function render(msg, text) { return msg.platform === 'telegram' ? { method: 'sendMessage', chat_id: +msg.chat, text: text } : { channel_id: msg.chat, content: text }; }
  function stepText(f) { return f.step === 'item' ? 'Qual item você quer pedir?' : f.step === 'qtd' ? 'Quantas unidades (1 a 99)?' : 'Confirma ' + f.qtd + ' x ' + f.item + '? Responda sim ou não.'; }
  function R(route, text) { return { route: route, text: text }; }
  function handle(S, msg) {
    var u = S.users[msg.uid] || (S.users[msg.uid] = { flow: null, times: [] });
    u.times = u.times.filter(function (t) { return t > msg.ts - WINDOW; }).concat([msg.ts]);
    if (u.times.length > LIMIT) return R('limited', 'Calma, são muitas mensagens seguidas. Tente de novo em alguns segundos.');
    var t = msg.text, sp = t.indexOf(' '), cmd = (sp < 0 ? t : t.slice(0, sp)).toLowerCase().split('@')[0], arg = sp < 0 ? '' : t.slice(sp + 1).trim();
    if (cmd === '/cancelar') { u.flow = null; return R('command', 'Pedido cancelado. Nada foi registrado.'); }
    if (u.flow) {
      var f = u.flow;
      if (f.step === 'item') { if (!t || t.charAt(0) === '/') return R('flow', 'Escreva o nome do item. ' + stepText(f)); f.item = t.slice(0, 40); f.step = 'qtd'; }
      else if (f.step === 'qtd') { if (!/^\d{1,2}$/.test(t) || +t < 1) return R('flow', 'Número inválido. ' + stepText(f)); f.qtd = +t; f.step = 'ok'; }
      else {
        var l = t.toLowerCase();
        if (l === 'sim' || l === 's') { var n = S.seq++; u.flow = null; return R('flow', 'Pedido P-' + n + ' registrado: ' + f.qtd + ' x ' + f.item + '. (demo: nada foi gravado em sistema real)'); }
        if (l === 'não' || l === 'nao' || l === 'n') { u.flow = null; return R('flow', 'Ok, descartei. Use /novo para recomeçar.'); }
        return R('flow', 'Responda sim ou não.');
      }
      return R('flow', stepText(f));
    }
    if (cmd === '/start' || cmd === '/ajuda') return R('command', 'Oi, ' + msg.name + '! Sou o bot de atendimento (demo). ' + HELP);
    if (cmd === '/pedido') { var o = ORDERS[arg]; if (!o || o.owner !== msg.uid) return R('command', 'Não encontrei esse pedido na sua conta.'); return R('command', 'Pedido ' + arg + ': ' + o.status + ', ' + o.itens + ' item(ns), previsão ' + o.eta + '.'); }
    if (cmd === '/estoque') { var s = STOCK[arg.toUpperCase()]; if (!s) return R('command', 'SKU não encontrado. Exemplos: CAD-96, CAN-GEL, MOC-01.'); return R('command', s[0] + ': ' + (s[1] ? s[1] + ' em estoque.' : 'sem estoque no momento.')); }
    if (cmd === '/novo') { u.flow = { step: 'item' }; return R('flow', stepText(u.flow)); }
    if (cmd === '/admin_resumo') {
      if (ADMINS.indexOf(msg.uid) < 0) return R('admin_denied', 'Esse comando é só para administradores.');
      return R('command', 'Resumo: ' + Object.keys(ORDERS).length + ' pedidos na base, ' + Object.keys(STOCK).filter(function (k) { return !STOCK[k][1]; }).length + ' SKU sem estoque, ' + Object.keys(S.users).length + ' usuário(s) ativos.');
    }
    return R('unknown', 'Não entendi. ' + HELP);
  }
  function pass(route) { return function (i, ctx) { return { out: { route: route, text: ctx.r.text }, ms: 1 }; }; }
  window.DEMO = {
    start: 'start',
    init: function () { return { S: { users: {}, seq: 5001 }, ts: 1000 }; },
    verify: function (e, ctx) { var r = ctx.last; return !!r && r.route === e.route && JSON.stringify(r.payload) === JSON.stringify(e.payload); },
    nodes: {
      start: function (i, ctx) {
        var b = i.body; ctx.ts += parseFloat(b.gap) || 0; ctx.last = null; var ev = makeUpdate(b.platform, b.user, NAMES[b.user] || 'Ana', b.text, ctx.ts); ctx.ev = ev;
        return { out: ev, ms: 3 };
      },
      normalize: function (i, ctx) { ctx.msg = normalize(ctx.ev); return { out: ctx.msg, ms: 1 }; },
      bot: function (i, ctx) { ctx.r = handle(ctx.S, ctx.msg); return { out: { route: ctx.r.route, flow_ativo: !!ctx.S.users[ctx.msg.uid].flow, msgs_na_janela: ctx.S.users[ctx.msg.uid].times.length }, branch: (ctx.r.route === 'limited' || ctx.r.route === 'admin_denied') ? 'guard' : ctx.r.route, ms: 2 }; },
      guard: pass('guard'), command: pass('command'), flow: pass('flow'), unknown: pass('unknown'),
      send: function (i, ctx) { ctx.last = { route: ctx.r.route, payload: render(ctx.msg, ctx.r.text) }; return { out: ctx.last.payload, ms: 1, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx;
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var p = c.last.payload, tg = c.msg.platform === 'telegram', txt = p.text || p.content;
      var o = [{ kind: 'chat', title: { pt: 'Resposta do bot (' + (tg ? 'Telegram' : 'Discord') + ')', en: 'Bot reply (' + (tg ? 'Telegram' : 'Discord') + ')' }, turns: [{ q: c.msg.name + ': ' + c.msg.text, a: txt, tools: 'route: ' + c.last.route }] }];
      if (c.last.route === 'limited') o.unshift({ kind: 'error', title: { pt: 'Limite de mensagens atingido', en: 'Message limit reached' }, text: { pt: 'Mais de 5 mensagens em 10 s do mesmo usuário: o bot responde uma vez pedindo calma. Evita flood e custo.', en: 'More than 5 messages in 10 s from the same user: the bot answers once asking to slow down. Prevents flooding and cost.' } });
      o.push({ title: { pt: 'Payload que seria enviado (nada foi enviado)', en: 'Payload that would be sent (nothing was sent)' }, json: p });
      return o;
    }
  };
})();
