/* Porte 1:1 de agent.py (nós do grafo LangGraph). Estado em ctx.s; o LLM é o redator determinístico (MockLLM). */
(function () {
  var CORPUS = __CORPUS__, BY = {}; CORPUS.forEach(function (d) { BY[d.id] = d; });
  var STOP = 'a an the of and or to for in on is are do does what how which should we our it its with about by be at as from that this'.split(' ');
  var FACETS = {
    size: [['market', 'size', 'grow', 'growth', 'demand'], ['subscriptions', 'billion', 'grew', 'grow', 'panel', 'subscribe'], 'Market size and growth'],
    pricing: [['price', 'pricing', 'cost', 'plan', 'charge'], ['price', 'costs', 'median', 'plan', 'shipping', 'lowered'], 'Pricing'],
    competition: [['competitor', 'competition', 'rival', 'players'], ['competitor', 'roasters', 'subscribers', 'largest', 'lowered'], 'Competition'],
    churn: [['churn', 'retention', 'cancel'], ['churn', 'cancel', 'skip', 'retention'], 'Retention and churn'],
    channels: [['channel', 'acquisition', 'marketing', 'sales'], ['channel', 'website', 'marketplaces', 'acquisition', 'social'], 'Channels'],
    regulation: [['regulation', 'regulations', 'compliance', 'law', 'legal'], ['regulation', 'compliance', 'certification'], 'Regulation'],
    logistics: [['logistics', 'shipping', 'delivery', 'fulfilment'], ['shipping', 'roasting', 'returns', 'stock'], 'Logistics']
  };
  var MAXREV = 1;
  var FAULTS = { none: {}, d03: { d03: 99 }, d08: { d08: 1 }, both: { d03: 99, d08: 1 } };
  function toks(s) { return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return STOP.indexOf(w) < 0; }); }
  function numbers(s) { return s.match(/\d[\d,.]*\d|\d/g) || []; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function search(f, expand) {
    var q = FACETS[f][1], sc = [];
    CORPUS.forEach(function (d) {
      var t = toks(d.text + ' ' + d.title), s = uniq(q).filter(function (w) { return t.indexOf(w) >= 0; }).length + (d.facets.indexOf(f) >= 0 ? 3 : 0);
      if (s >= (expand ? 1 : 2)) sc.push([s, d.id]);
    });
    sc.sort(function (a, b) { return b[0] - a[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0); });
    return sc.map(function (x) { return x[1]; });
  }
  function write(f, docs) {
    if (!docs.length) return 'Not enough evidence in the available sources to cover ' + FACETS[f][2].toLowerCase() + '.';
    return docs.map(function (d) { return d.text.split('. ')[0].replace(/\.+$/, '') + '. [' + d.id + ']'; }).join(' ');
  }
  function critique(text, docs) {
    if (text.indexOf('Not enough evidence') === 0) return [];
    var cited = uniq(text.match(/\[(d\d+)\]/g) || []).map(function (x) { return x.slice(1, -1); }), p = [];
    if (cited.length < 2) p.push('needs 2+ sources');
    var allowed = {}; docs.forEach(function (d) { allowed[d.id] = d.text; });
    cited.slice().sort().forEach(function (c) { if (!(c in allowed)) p.push('cites ' + c + ' which was not retrieved'); });
    var body = cited.map(function (c) { return allowed[c] || ''; }).join(' ');
    numbers(text.replace(/\[d\d+\]/g, '')).forEach(function (n) { if (body.indexOf(n) < 0) p.push('number ' + n + ' not in cited sources'); });
    return p;
  }
  var cp = function (o) { return JSON.parse(JSON.stringify(o)); };

  window.DEMO = {
    start: 'start',
    init: function () { return { s: null }; },
    verify: function (expect, ctx) { var s = ctx.s; return expect.error ? s.error === expect.error : s.report === expect.report; },
    nodes: {
      start: function (i, ctx) {
        var b = i.body; ctx.s = { question: b.question, faults: cp(FAULTS[b.fault] || {}), trace: [], notes: [], sections: [], revisions: 0, problems: [], i: 0 };
        return { out: { question: b.question, faults: ctx.s.faults }, ms: 8 };
      },
      plan: function (i, ctx) {
        var s = ctx.s, q = String(s.question || '').trim();
        if (toks(q).length < 3) { s.error = 'question too short to plan'; return { out: { error: s.error }, branch: 'err', ms: 3 }; }
        var low = toks(q), f = Object.keys(FACETS).filter(function (k) { return FACETS[k][0].some(function (w) { return low.indexOf(w) >= 0; }); });
        s.facets = f.length ? f : ['size', 'pricing', 'competition'];
        return { out: { facets: s.facets }, branch: 'ok', ms: 410 };
      },
      stop: function (i) { return { out: { error: i.error, hint: 'Ask a question with at least 3 meaningful words.' }, ms: 2, end: true }; },
      retrieve: function (i, ctx) {
        var s = ctx.s; if (!s.facets) return { out: i, ms: 1 };
        var f = s.facets[s.i], docs = [], log = [];
        if (i && i.__error) { // a busca inteira caiu: segue sem fontes e deixa isso escrito no relatório
          s.docs = []; s.notes.push('The search service was unreachable; this section has no sources.');
          return { out: { facet: f, docs: [], note: s.notes[s.notes.length - 1] }, ms: 0 };
        }
        search(f, s.revisions > 0).slice(0, 2 + s.revisions).forEach(function (id) {
          for (var a = 1; a <= 3; a++) {
            if (a <= (s.faults[id] || 0)) { log.push({ doc: id, attempt: a, ok: false, err: id + ': timeout (attempt ' + a + ')' }); if (a === 3) s.notes.push('Source ' + id + ' was unreachable after 3 attempts and was left out.'); }
            else { docs.push(BY[id]); log.push({ doc: id, attempt: a, ok: true }); break; }
          }
        });
        s.docs = docs; return { out: { facet: f, revision: s.revisions, fetched: log }, ms: 120 + 60 * log.length };
      },
      write: function (i, ctx) { var s = ctx.s, f = s.facets[s.i]; s.draft = write(f, s.docs); return { out: { facet: f, draft: s.draft }, ms: 880 }; },
      critique: function (i, ctx) { var s = ctx.s; s.problems = critique(s.draft, s.docs); return { out: { problems: s.problems }, ms: 6 }; },
      gate: function (i, ctx) { var s = ctx.s; return { out: { problems: s.problems, revisions: s.revisions }, branch: s.problems.length && s.revisions < MAXREV ? 'revise' : 'pass', ms: 1 }; },
      revise: function (i, ctx) { var s = ctx.s; s.revisions++; return { out: { revision: s.revisions, action: 'widen search' }, ms: 1 }; },
      accept: function (i, ctx) {
        var s = ctx.s, f = s.facets[s.i], t = s.draft;
        if (s.problems.length) t += ' (Limited evidence: ' + s.problems.join('; ') + '.)';
        s.sections.push({ facet: f, title: FACETS[f][2], text: t, sources: uniq(t.match(/\[(d\d+)\]/g) || []).map(function (x) { return x.slice(1, -1); }).sort() });
        s.i++; s.revisions = 0; s.problems = [];
        return { out: { accepted: f, sections: s.sections.length, remaining: s.facets.length - s.i }, ms: 2 };
      },
      more: function (i, ctx) { var s = ctx.s; return { out: i, branch: s.i < s.facets.length ? 'next' : 'done', ms: 1 }; },
      compile: function (i, ctx) {
        var s = ctx.s, L = ['# Research brief\n\n**Question:** ' + s.question + '\n\n_Model: mock-deterministic. Every claim carries a source id; the list is at the end._\n'];
        s.sections.forEach(function (x) { L.push('## ' + x.title + '\n\n' + x.text + '\n'); });
        if (s.notes.length) L.push('## Data-quality notes\n\n' + uniq(s.notes).map(function (n) { return '- ' + n; }).join('\n') + '\n');
        var used = uniq([].concat.apply([], s.sections.map(function (x) { return x.sources; }))).sort();
        L.push('## Sources\n\n' + used.map(function (id) { return '- [' + id + '] ' + BY[id].title + ' (' + BY[id].url + ')'; }).join('\n'));
        s.report = L.join('\n'); return { out: { sections: s.sections.length, sources: used.length, chars: s.report.length }, ms: 14 };
      },
      respond: function (i, ctx) { return { out: { report_md: ctx.s.report.slice(0, 160) + '…', sections: ctx.s.sections.length }, ms: 3, end: true }; }
    },
    outputs: function (r) {
      var s = r.ctx.s, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (s.error) return [{ kind: 'error', title: { pt: 'Pergunta recusada', en: 'Question rejected' }, text: { pt: 'O agente parou sem escrever nada: ' + s.error + '. É melhor parar do que inventar um relatório.', en: 'The agent stopped without writing anything: ' + s.error + '. Stopping beats inventing a report.' } }];
      var tools = s.sections.map(function (x) { return x.sources.length; });
      o.push({ kind: 'card', title: { pt: 'Resumo da execução', en: 'Run summary' }, rows: [
        [{ pt: 'Seções', en: 'Sections' }, s.sections.length + ' (' + s.facets.join(', ') + ')'],
        [{ pt: 'Fontes por seção', en: 'Sources per section' }, tools.join(' / ')],
        [{ pt: 'Seções com evidência limitada', en: 'Sections with limited evidence' }, String(s.sections.filter(function (x) { return /Limited evidence|Not enough evidence/.test(x.text); }).length), s.sections.some(function (x) { return /Limited evidence|Not enough evidence/.test(x.text); }) ? 'b-warm' : 'b-ok'],
        [{ pt: 'Avisos de qualidade de dados', en: 'Data-quality notes' }, String(uniq(s.notes).length), uniq(s.notes).length ? 'b-warm' : 'b-ok']] });
      o.push({ kind: 'email', title: { pt: 'Relatório gerado (report.md)', en: 'Generated report (report.md)' }, subject: 'report.md', to: 'output/', text: s.report });
      if (r.sim === 'perm') o.push({ kind: 'error', title: { pt: 'Falha tratada', en: 'Handled failure' }, text: { pt: 'O serviço de busca não respondeu nas 3 tentativas. Com continueOnFail, o agente seguiu sem fontes e o relatório diz isso, em vez de inventar números.', en: 'The search service did not answer in 3 attempts. With continueOnFail the agent carried on without sources and the report says so, rather than inventing numbers.' } });
      return o;
    }
  };
})();
