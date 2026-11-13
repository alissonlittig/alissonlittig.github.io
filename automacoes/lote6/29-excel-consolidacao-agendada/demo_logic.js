/* Porta fiel de fluxo.py (fnv, parse_file, consolidate, next_run) para JavaScript. Os CSV abaixo são os mesmos de fixtures/ (dados fictícios). A demo NÃO gera o .xlsx: o arquivo real vem do Python (output/consolidado_ok.xlsx).
   O leitor de CSV é simples (sem aspas), igual ao que as fixtures usam. Conferido contra as saídas gravadas do Python. */
(function () {
  var FILES = /*FILES*/;
  var COLS = ['data', 'produto', 'qtd', 'preco_unit'];
  function fnv(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0; } return ('00000000' + h.toString(16)).slice(-8); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function parseFile(name, text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.length; }), head = lines[0].split(','), miss = COLS.filter(function (c) { return head.indexOf(c) < 0; });
    if (miss.length) return { rows: [], errs: [], rej: 'faltam colunas: ' + miss.join(', ') };
    var rows = [], errs = [];
    lines.slice(1).forEach(function (l, i) {
      var v = l.split(','), r = {}; head.forEach(function (h, k) { r[h] = (v[k] || '').trim(); });
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(r.data), why = null, d;
      if (!m) why = 'data inválida'; else { d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) why = 'data inválida'; }
      if (!why && !r.produto) why = 'produto vazio';
      if (!why && !/^\d+$/.test(r.qtd)) why = 'qtd inválida';
      if (!why && !/^\d+(\.\d+)?$/.test(r.preco_unit)) why = 'preco_unit inválido';
      if (!why && (+r.qtd <= 0 || +r.preco_unit <= 0)) why = 'qtd e preco_unit devem ser > 0';
      if (why) { errs.push({ arquivo: name, linha: i + 2, motivo: why }); return; }
      rows.push({ filial: name.replace(/\.[^.]*$/, ''), data: r.data, produto: r.produto, qtd: +r.qtd, preco: +r.preco_unit, total: r2(+r.qtd * +r.preco_unit) });
    });
    return { rows: rows, errs: errs, rej: null };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function nextRun(now, spec) {
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(now); if (!m) throw new Error('data/hora inválida: use AAAA-MM-DD HH:MM');
    var n = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])), s;
    if ((s = /^daily@(\d{1,2}):(\d{2})$/.exec(spec))) { var t = new Date(n); t.setUTCHours(+s[1], +s[2]); return fmt(t > n ? t : new Date(t.getTime() + 864e5)); }
    if ((s = /^every:(\d+)m$/.exec(spec)) && +s[1] > 0) return fmt(new Date(n.getTime() + s[1] * 6e4));
    throw new Error('agenda inválida: use daily@HH:MM ou every:Nm');
  }
  function sortObj(o) { var s = {}; Object.keys(o).sort().forEach(function (k) { s[k] = o[k]; }); return s; }
  function finish(ctx) {
    var resumo = {}; ctx.rows.forEach(function (x) { resumo[x.filial] = r2((resumo[x.filial] || 0) + x.total); });
    var tot = 0; Object.keys(resumo).forEach(function (k) { tot += resumo[k]; });
    ctx.res = { arquivos: sortObj(ctx.st), linhas: ctx.rows.length, erros: ctx.errs, resumo: sortObj(resumo), total: r2(tot), proxima: ctx.proxima };
  }
  window.DEMO = {
    start: 'start',
    init: function () { return {}; },
    verify: function (e, ctx) { var r = ctx.res; return !!r && JSON.stringify([r.arquivos, r.linhas, r.erros, r.resumo, r.total, r.proxima]) === JSON.stringify([e.arquivos, e.linhas, e.erros, e.resumo, e.total, e.proxima]); },
    nodes: {
      start: function (i, ctx) {
        var b = i.body; ctx.files = FILES[b.inbox] || FILES.ok; ctx.proxima = nextRun(b.agora, b.agenda); ctx.ledger = b.inbox === 'repeat' ? [fnv(FILES.ok['curitiba.csv'])] : [];
        ctx.st = {}; ctx.rows = []; ctx.errs = []; ctx.res = null;
        return { out: { agenda: b.agenda, agora: b.agora, proxima_execucao: ctx.proxima, arquivos_na_pasta: Object.keys(ctx.files).sort() }, ms: 5 };
      },
      ledger: function (i, ctx) {
        var fresh = [];
        Object.keys(ctx.files).sort().forEach(function (n) { var h = fnv(ctx.files[n]); if (ctx.ledger.indexOf(h) >= 0) ctx.st[n] = 'duplicado'; else fresh.push(n); });
        ctx.fresh = fresh; return { out: { novos: fresh, duplicados: Object.keys(ctx.st) }, branch: fresh.length ? 'new' : 'none', ms: 3 };
      },
      nothing: function (i, ctx) { finish(ctx); return { out: { mensagem: 'nada novo na pasta; nenhum arquivo gerado' }, ms: 1, end: true }; },
      validate: function (i, ctx) {
        ctx.fresh.forEach(function (n) {
          var r = parseFile(n, ctx.files[n]);
          if (r.rej) { ctx.st[n] = 'rejeitado: ' + r.rej; return; }
          ctx.ledger.push(fnv(ctx.files[n])); ctx.rows = ctx.rows.concat(r.rows); ctx.errs = ctx.errs.concat(r.errs); ctx.st[n] = 'processado' + (r.errs.length ? ' (' + r.errs.length + ' linha(s) com erro)' : '');
        });
        return { out: { linhas_ok: ctx.rows.length, linhas_com_erro: ctx.errs.length, arquivos: ctx.st }, branch: ctx.errs.length ? 'errors' : 'clean', ms: 9 };
      },
      errsheet: function (i, ctx) { return { out: { aba: 'Erros', linhas: ctx.errs }, ms: 4 }; },
      excel: function (i, ctx) { finish(ctx); return { out: { abas: ['Consolidado', 'Resumo', 'Erros'], linhas: ctx.res.linhas, total: ctx.res.total, proxima_execucao: ctx.proxima }, ms: 30, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var res = c.res, bad = Object.keys(res.arquivos).filter(function (k) { return /^rejeitado/.test(res.arquivos[k]); });
      if (bad.length) o.push({ kind: 'error', title: { pt: 'Arquivo rejeitado (não entra no consolidado)', en: 'File rejected (not in the report)' }, text: bad.map(function (k) { return k + ' → ' + res.arquivos[k]; }).join('\n') });
      if (!c.rows.length && !bad.length) o.push({ title: { pt: 'Nada a fazer nesta rodada', en: 'Nothing to do this run' }, skipped: { pt: 'Todos os arquivos já tinham sido processados (mesmo conteúdo). Não gera planilha duplicada.', en: 'Every file had already been processed (same content). No duplicate spreadsheet.' } });
      if (c.rows.length) {
        o.push({ kind: 'sheet', title: { pt: 'Aba Consolidado (primeiras 8 linhas)', en: 'Consolidado sheet (first 8 rows)' }, cols: ['Filial', 'Data', 'Produto', 'Qtd', 'Preço unit.', 'Total (=D*E)'], rows: c.rows.slice(0, 8).map(function (x) { return [x.filial, x.data, x.produto, x.qtd, x.preco, x.total]; }) });
        o.push({ kind: 'sheet', title: { pt: 'Aba Resumo (SUMIF por filial)', en: 'Resumo sheet (SUMIF per branch)' }, cols: ['Filial', 'Total vendido'], rows: Object.keys(res.resumo).sort().map(function (k) { return [k, res.resumo[k]]; }).concat([['Total geral', res.total]]) });
      }
      if (res.erros.length) o.push({ kind: 'sheet', title: { pt: 'Aba Erros', en: 'Erros sheet' }, cols: ['Arquivo', 'Linha', 'Motivo'], rows: res.erros.map(function (e) { return [e.arquivo, e.linha, e.motivo]; }) });
      o.push({ title: { pt: 'Agendador', en: 'Scheduler' }, json: { proxima_execucao: res.proxima, arquivos: res.arquivos } });
      return o;
    }
  };
})();
