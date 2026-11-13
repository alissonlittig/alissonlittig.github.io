/* Porta fiel de nfe_extract.py (parse_text, cnpj_ok) para JavaScript; o texto do PDF já vem extraído (na demo não há leitura de PDF). */
(function () {
  var MONEY = '([\\d.]+,\\d{2})';
  var FIELDS = { numero: /Numero:\s*(\d+)/, prestador: /Prestador:[ \t]*(.+)/, cnpj: /CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/, total: new RegExp('Valor total:\\s*R\\$\\s*' + MONEY), iss: new RegExp('ISS:\\s*R\\$\\s*' + MONEY) };
  var LABEL = { numero: 'número', prestador: 'prestador', cnpj: 'CNPJ', total: 'valor total' };
  function cents(s) { return parseInt(s.replace(/\./g, '').replace(',', ''), 10); }
  function brl(c) { return String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + ('0' + (c % 100)).slice(-2); }
  function cnpjOk(c) {
    var d = c.replace(/\D/g, ''); if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    for (var n = 12; n <= 13; n++) { var w = (n === 13 ? [6] : []).concat([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]), s = 0; for (var i = 0; i < n; i++) s += +d[i] * w[i]; var r = s % 11; if (+d[n] !== (r < 2 ? 0 : 11 - r)) return false; }
    return true;
  }
  function extract(text) {
    var got = {}; Object.keys(FIELDS).forEach(function (k) { var m = FIELDS[k].exec(text); got[k] = m ? m[1].trim() : null; });
    var m = /Data de emissao:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(text), iso = null, issues = [];
    if (m) { var d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])); if (d.getUTCFullYear() === +m[3] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[1]) iso = m[3] + '-' + m[2] + '-' + m[1]; else issues.push('data inválida'); }
    var items = [], re = new RegExp('^(.+?)\\s+(\\d+)\\s+x\\s+' + MONEY + '$', 'gm'), x; while ((x = re.exec(text))) items.push([x[1].trim(), parseInt(x[2], 10), cents(x[3])]);
    return { got: got, hasDate: !!m, iso: iso, issues: issues, items: items };
  }
  function check(e) {
    var got = e.got, issues = e.issues.slice();
    ['numero', 'prestador', 'cnpj', 'total'].forEach(function (k) { if (got[k] === null) issues.push('falta ' + LABEL[k]); });
    if (!e.hasDate) issues.push('falta data');
    if (got.cnpj && !cnpjOk(got.cnpj)) issues.push('CNPJ inválido');
    var total = got.total ? cents(got.total) : null, soma = e.items.reduce(function (s, it) { return s + it[1] * it[2]; }, 0);
    if (total !== null && e.items.length && soma !== total) issues.push('soma dos itens (' + brl(soma) + ') diferente do total (' + brl(total) + ')');
    if (total !== null && !e.items.length) issues.push('nenhum item lido');
    return { numero: got.numero, data: e.iso, prestador: got.prestador, cnpj: got.cnpj, itens: e.items.length, total: total, iss: got.iss ? cents(got.iss) : null, status: issues.length ? 'revisar' : 'ok', problemas: issues };
  }
  function S(o) { return JSON.stringify(o); }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { r: null }; },
    verify: function (expect, ctx) { return S(ctx.r) === S(expect); },
    nodes: {
      start: function (i, ctx) { ctx.text = i.body.text || ''; ctx.r = null; return { out: { chars: ctx.text.length, lines: ctx.text.split('\n').length }, ms: 12 }; },
      fields: function (i, ctx) { ctx.e = extract(ctx.text); return { out: { found: ctx.e.got, items_read: ctx.e.items.length }, ms: 3 }; },
      validate: function (i, ctx) { ctx.r = check(ctx.e); return { out: { problemas: ctx.r.problemas }, branch: ctx.r.status === 'ok' ? 'ok' : 'review', ms: 2 }; },
      row: function (i, ctx) { return { out: { sheet_row: ctx.r }, ms: 2, end: true }; },
      flag: function (i, ctx) { return { out: { sheet_row: ctx.r, marked: 'revisar' }, ms: 2, end: true }; }
    },
    outputs: function (r) {
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var x = r.ctx.r, m = function (c) { return c === null ? '' : brl(c); };
      return [{ kind: 'sheet', title: { pt: 'Linha da planilha (notas.csv)', en: 'Spreadsheet row (notas.csv)' }, cols: ['numero', 'data', 'prestador', 'cnpj', 'itens', 'total', 'iss', 'status', 'problemas'], rows: [[x.numero || '', x.data || '', x.prestador || '', x.cnpj || '', x.itens, m(x.total), m(x.iss), x.status, x.problemas.join('; ')]] },
        { kind: 'card', title: { pt: 'Conferência', en: 'Checks' }, rows: [[{ pt: 'Status', en: 'Status' }, x.status, x.status === 'ok' ? 'b-ok' : 'b-warm'], [{ pt: 'Problemas', en: 'Problems' }, x.problemas.length ? x.problemas.join(' · ') : { pt: 'nenhum', en: 'none' }]] }];
    }
  };
})();
