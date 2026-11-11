/* Nó Code "Compare with last" = mesmo código do workflow.json. O arquivo de snapshot vira ctx.snapshot (persiste entre execuções). */
(function () {
  var CFG = { data_dir: './data', watch_url: 'https://loja.example/produto/aero-2', snapshot_file: 'price_snapshot.json', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var num = function (s) { return Number(String(s).replace(/[^0-9,.]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')) || 0; };
  function page(f) { return '<html><body><div class="product"><h1 class="name">' + f.name + '</h1><span class="price">R$ ' + f.price + '</span><span class="stock">' + f.stock + ' em estoque</span></div></body></html>'; }
  function pick(html, cls) { var m = new RegExp('class="' + cls + '">([^<]*)<').exec(html); return m ? m[1] : ''; }
  function compare(cur, old) { // Code "Compare with last"
    var now = { name: cur.name, price: num(cur.price), stock: parseInt(cur.stock) || 0, checked_at: new Date().toISOString() };
    var changes = [], first = true;
    if (old) {
      first = false;
      if (old.price !== now.price) changes.push('price ' + old.price + ' -> ' + now.price + (now.price < old.price ? ' (DROP)' : ' (rise)'));
      if (old.stock !== now.stock) changes.push('stock ' + old.stock + ' -> ' + now.stock + (now.stock === 0 ? ' (SOLD OUT)' : old.stock === 0 ? ' (BACK IN STOCK)' : ''));
    }
    return { now: now, first: first, changed: changes.length > 0, changes: changes.join('; '), text: now.name + ': ' + changes.join('; ') };
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'trigger', compare: compare, resetMemory: true,
    init: function () { return { snapshot: null }; },
    nodes: {
      trigger: function (i, ctx) { ctx.form = i.body; ctx.prevSnap = ctx.snapshot; return { out: { timestamp: new Date().toISOString(), mode: 'schedule 30 min' }, ms: 4 }; },
      config: function (i) { return { out: copy(CFG), ms: 3 }; },
      fetch: function (i, ctx) { return { out: { statusCode: 200, data: page(ctx.form) }, ms: 142 }; },
      extract: function (i, ctx) { ctx.cur = { name: pick(i.data, 'name'), price: pick(i.data, 'price'), stock: pick(i.data, 'stock') }; return { out: ctx.cur, ms: 7 }; },
      read: function (i, ctx) { return { out: ctx.snapshot ? { fileName: CFG.snapshot_file, binary: true, content: ctx.snapshot } : { note: 'arquivo ainda não existe (alwaysOutputData): primeira execução' }, ms: 9 }; },
      cmp: function (i, ctx) { var r = compare(ctx.cur, ctx.snapshot); ctx.res = r; return { out: r, ms: 11 }; },
      save: function (i, ctx) { ctx.snapshot = i.now; return { out: { json: i, saved_to: CFG.data_dir + '/' + CFG.snapshot_file }, ms: 15 }; },
      chg: function (i) { return { out: i.json, branch: i.json.changed ? 'true' : 'false', ms: 2, end: !i.json.changed }; },
      notify: function (i) {
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error } }, ms: 0, end: true };
        return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: 'PRICE/STOCK ALERT - ' + i.text } }, ms: 201, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], R = c.res;
      if (r.failed || !R) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. Nada foi salvo e nenhum alerta saiu: o retrato anterior segue valendo e a próxima execução (em 30 min) tenta de novo.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '. Nothing was saved and no alert went out: the previous snapshot still stands and the next run (in 30 min) tries again.' } }];
      var nt = T('notify', r);
      if (R.first) o.push({ title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, skipped: { pt: 'Primeira execução: só grava a linha de base (preço ' + R.now.price + ', estoque ' + R.now.stock + '). Mude o estado da página e rode de novo.', en: 'First run: it only stores the baseline (price ' + R.now.price + ', stock ' + R.now.stock + '). Change the page state and run again.' } });
      else if (!R.changed) o.push({ title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, skipped: { pt: 'Nada mudou desde a última leitura: nenhum alerta. É assim que o monitor não vira spam.', en: 'Nothing changed since the last read: no alert. That is how the monitor avoids becoming spam.' } });
      else if (nt && nt.out && nt.out.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, from: 'Monitor de preço', text: nt.out.result.text, time: new Date().toTimeString().slice(0, 5) });
      else o.push({ kind: 'error', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, text: { pt: 'O Telegram ficou fora do ar. A mudança já está no retrato salvo, mas este alerta não saiu (Continue On Fail).', en: 'Telegram stayed down. The change is in the saved snapshot, but this alert did not go out (Continue On Fail).' } });
      o.push({ kind: 'card', title: { pt: 'Retrato salvo agora', en: 'Snapshot saved now' }, rows: [[{ pt: 'Produto', en: 'Product' }, R.now.name], [{ pt: 'Preço', en: 'Price' }, 'R$ ' + R.now.price.toFixed(2)], [{ pt: 'Estoque', en: 'Stock' }, String(R.now.stock)], [{ pt: 'Mudanças', en: 'Changes' }, R.changes || (R.first ? { pt: 'linha de base', en: 'baseline' } : { pt: 'nenhuma', en: 'none' })]] });
      return o;
    },
    verify: function (exp, ctx) { var R = ctx.res; return R && R.changed === exp.changed && R.changes === exp.changes && ('PRICE/STOCK ALERT - ' + R.text) === exp.notify; }
  };
})();
