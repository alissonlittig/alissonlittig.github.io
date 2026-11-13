/* Porta fiel de parse() do ocr_recibo.py para JavaScript. O OCR em si NÃO roda no navegador: o texto de entrada é o que o RapidOCR devolveu de verdade nas imagens de amostra
   (gravado em output/scenarios.json) e pode ser editado à vontade. Daí em diante (extrair, conferir a conta, decidir ok/revisar) o código é o mesmo do Python. Conferido contra as saídas gravadas. */
(function () {
  var MONEY = '\\d{1,6}[.,]\\d{2}', CONF_MIN = 0.7;
  function money(s) { return Math.round(parseFloat(s.replace(',', '.')) * 100) / 100; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function f2(x) { return x.toFixed(2); }
  function parse(text, conf) {
    var L = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l; }), av = [], notas = [], loja = L.length ? L[0] : '';
    var m = /CNPJ\s*([\d./-]+)/.exec(text), cnpj = m ? m[1] : null, d = /(\d{2})\/(\d{2})\/(\d{4})/.exec(text), data = null;
    if (d) { var dd = new Date(Date.UTC(+d[3], +d[2] - 1, +d[1])); if (dd.getUTCFullYear() === +d[3] && dd.getUTCMonth() === +d[2] - 1 && dd.getUTCDate() === +d[1]) data = d[3] + '-' + d[2] + '-' + d[1]; }
    if (!data) av.push('data não lida');
    var itens = [], total = null, re1 = new RegExp('^(\\d{1,2})\\s*[xX]\\s*(.*?)\\s*(' + MONEY + ')(?:\\s+(' + MONEY + '))?$'), re2 = new RegExp('^(.*[A-Za-z].*?)\\s+(' + MONEY + ')\\s+(' + MONEY + ')$');
    L.slice(1).forEach(function (l) {
      if (/TOTAL/i.test(l)) { var nums = l.match(new RegExp(MONEY, 'g')); if (nums) total = money(nums[nums.length - 1]); return; }
      var q, desc, unit, tot, x = re1.exec(l);
      if (x) { q = +x[1]; desc = x[2].trim(); if (x[4]) { unit = money(x[3]); tot = money(x[4]); } else { unit = null; tot = money(x[3]); } }
      else {
        x = re2.exec(l); if (!x) return;
        desc = x[1].trim(); unit = money(x[2]); tot = money(x[3]); q = unit ? Math.round(tot / unit) : 0;
        if (q < 1 || Math.abs(q * unit - tot) > 0.01) { av.push(desc + ': quantidade não lida e não dá para inferir (' + f2(unit) + ' -> ' + f2(tot) + ')'); return; }
        notas.push(desc + ': quantidade ' + q + ' inferida de ' + f2(tot) + ' / ' + f2(unit));
      }
      if (unit !== null && Math.abs(q * unit - tot) > 0.01) av.push((desc || '?') + ': ' + q + ' x ' + f2(unit) + ' = ' + f2(q * unit) + ', mas a linha diz ' + f2(tot));
      itens.push({ desc: desc, qtd: q, unit: unit, total: tot });
    });
    var soma = r2(itens.reduce(function (s, i) { return s + i.total; }, 0));
    if (!itens.length) av.push('nenhum item lido');
    if (total === null) av.push('total não lido'); else if (itens.length && Math.abs(soma - total) > 0.01) av.push('soma dos itens ' + f2(soma) + ' difere do total impresso ' + f2(total));
    if (conf < CONF_MIN) av.push('confiança média do OCR baixa (' + f2(conf) + ' < ' + CONF_MIN + ')');
    return { loja: loja, cnpj: cnpj, data: data, itens: itens, soma: soma, total: total, avisos: av, notas: notas, status: av.length ? 'revisar' : 'ok' };
  }
  window.DEMO = {
    start: 'start',
    init: function () { return {}; },
    verify: function (e, ctx) { var r = ctx.r, k = ['loja', 'cnpj', 'data', 'itens', 'soma', 'total', 'avisos', 'notas', 'status']; return !!r && k.every(function (x) { return JSON.stringify(r[x]) === JSON.stringify(e[x]); }); },
    nodes: {
      start: function (i, ctx) { var b = i.body; ctx.text = String(b.texto || ''); ctx.conf = parseFloat(b.conf); if (isNaN(ctx.conf)) ctx.conf = 0; ctx.r = null; return { out: { imagem: 'recibo.png (amostra fictícia)', confianca_media_ocr: ctx.conf }, ms: 4 }; },
      ocr: function (i, ctx) { var n = ctx.text.split(/\r?\n/).filter(function (l) { return l.trim(); }).length; return { out: { linhas_lidas: n, texto: ctx.text.split(/\r?\n/).slice(0, 6), nota: 'texto gravado do RapidOCR; no navegador não roda OCR' }, ms: 900 }; },
      parse: function (i, ctx) { ctx.r = parse(ctx.text, ctx.conf); var r = ctx.r; return { out: { loja: r.loja, cnpj: r.cnpj, data: r.data, itens: r.itens.length, soma: r.soma, total_impresso: r.total, notas: r.notas }, ms: 6 }; },
      check: function (i, ctx) { return { out: { status: ctx.r.status, avisos: ctx.r.avisos }, branch: ctx.r.status, ms: 2 }; },
      sheet: function (i, ctx) { return { out: { abas: ['Itens', 'Recibos'], linhas_itens: ctx.r.itens.length }, ms: 12, end: true }; },
      review: function (i, ctx) { return { out: { fila_de_revisao: ctx.r.avisos }, ms: 3, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, x = c.r;
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var o = [];
      if (x.status === 'revisar') o.push({ kind: 'error', title: { pt: 'Vai para revisão humana (não entra como certo)', en: 'Goes to human review (not stored as correct)' }, text: x.avisos.join('\n') });
      if (x.itens.length) o.push({ kind: 'sheet', title: { pt: 'Aba Itens', en: 'Itens sheet' }, cols: ['Loja', 'Data', 'Descrição', 'Qtd', 'Unitário', 'Total', 'Status'], rows: x.itens.map(function (i) { return [x.loja, x.data, i.desc, i.qtd, i.unit, i.total, x.status]; }) });
      o.push({ kind: 'sheet', title: { pt: 'Aba Recibos', en: 'Recibos sheet' }, cols: ['Loja', 'CNPJ', 'Data', 'Itens', 'Soma', 'Total impresso', 'Confiança', 'Status'], rows: [[x.loja, x.cnpj, x.data, x.itens.length, x.soma, x.total, c.conf, x.status]] });
      if (x.notas.length) o.push({ title: { pt: 'Notas (inferências anotadas)', en: 'Notes (inferences recorded)' }, json: x.notas });
      return o;
    }
  };
})();
