/* Nós Code = mesmo código do workflow.json. O crm.csv vira ctx.crm (persiste entre execuções); as páginas são texto fictício editável. */
(function () {
  var CFG = { data_dir: './data', leads_file: 'leads_input.csv', crm_file: 'crm.csv', pages_base: 'https://sites.example/', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'TELEGRAM_CHAT_ID' };
  var COLS = ['domain', 'company', 'status', 'score', 'industry', 'size', 'tech', 'contact_email', 'phone', 'signals', 'why', 'source', 'first_seen', 'last_enriched', 'note'];
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var merge = function (a, b) { var o = copy(a); for (var k in b) o[k] = b[k]; return o; };
  function parseCsv(txt) {
    var lines = String(txt || '').split(/\r?\n/).filter(function (l) { return l.trim(); }); if (!lines.length) return [];
    var h = lines[0].split(',');
    return lines.slice(1).map(function (l) { var c = l.split(','), o = {}; h.forEach(function (k, i) { o[k] = c[i] != null ? c[i].trim() : ''; }); return o; });
  }
  function sites(txt) { var m = {}; String(txt || '').split(/\r?\n/).forEach(function (l) { var p = l.split('|').map(function (x) { return x.trim(); }); if (p[0] && p.length >= 3) m[p[0]] = p; }); return m; }
  function respond(lead, S, down) { // o que o HTTP Request devolve (fullResponse, neverError)
    if (down) return { statusCode: 0, error: 'ETIMEDOUT' };
    var s = S[lead.domain_slug]; if (!s) return { statusCode: 404, data: '<h1>Not found</h1>' };
    var mail = s[3] ? '<a href="mailto:' + s[3] + '">' + s[3] + '</a>' : '';
    return { statusCode: 200, data: '<html><head><title>' + s[1] + ' - Home</title><meta name="description" content="' + s[2] + '"></head><body><h1>' + s[1] + '</h1><p>' + s[2] + '</p>' + mail + ' <span class="tel">' + (s[4] || '') + '</span><footer>Industry: ' + (s[5] || '') + '</footer></body></html>' };
  }
  function enrich(lead, r) { // Code "Extract signals and score"
    var status = Number(r.statusCode || 0);
    var base = { company: lead.company, domain: lead.domain_slug, source: lead.source };
    if (status !== 200) return merge(base, { status: 'unreachable', score: 0, note: 'HTTP ' + (status || 'error') });
    var html = String(r.data || '');
    var pick = function (re) { var m = html.match(re); return m ? m[1].trim() : ''; };
    var desc = pick(/<meta name="description" content="([^"]*)"/i);
    var email = pick(/mailto:([^"]+)"/i), phone = pick(/<span class="tel">([^<]*)</i), industry = pick(/Industry:\s*([^<]+)</i);
    var emp = desc.match(/(\d+)\s*(?:employees|people|accountants|dentists|team members)/i);
    var size = emp ? Number(emp[1]) : null;
    var tech = (desc.match(/WordPress|Shopify|Wix|Squarespace/i) || [''])[0];
    var signals = [];
    if (/hiring/i.test(desc)) signals.push('hiring');
    if (/Series [A-D]|funded|raised/i.test(desc)) signals.push('funded');
    var score = 20, why = [];
    if (size >= 10 && size <= 200) { score += 25; why.push('size 10-200'); } else if (size >= 3) { score += 10; why.push('small team'); }
    if (email) { score += 20; why.push('public e-mail'); }
    if (phone) { score += 10; why.push('phone'); }
    if (signals.length) { score += 15; why.push(signals.join('+')); }
    if (/Logistics|Healthcare|Finance/i.test(industry)) { score += 10; why.push('target industry'); }
    return merge(base, { status: 'enriched', industry: industry, size: size == null ? '' : size, tech: tech, contact_email: email, phone: phone, signals: signals.join('+'), score: score, why: why.join('; '), note: '' });
  }
  function upsert(crm, leads, hotScore) { // Code "Upsert into CRM (dedupe by domain)"
    var today = new Date().toISOString().slice(0, 10), added = 0, updated = 0;
    leads.forEach(function (l) {
      var old = crm[l.domain];
      if (old) { updated++; var n = merge(merge(old, l), { first_seen: old.first_seen, last_enriched: today }); crm[l.domain] = n; }
      else { added++; crm[l.domain] = merge(l, { first_seen: today, last_enriched: today }); }
    });
    var all = Object.keys(crm).map(function (k) { return crm[k]; }).sort(function (a, b) { return Number(b.score) - Number(a.score); });
    var hot = all.filter(function (o) { return Number(o.score) >= Number(hotScore); });
    return { added: added, updated: updated, total: all.length, hot: hot.map(function (o) { return o.company + ' (' + o.score + ')'; }), unreachable: all.filter(function (o) { return o.status === 'unreachable'; }).length, all: all };
  }
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  window.DEMO = {
    start: 'trigger', resetMemory: true, enrich: enrich, upsert: upsert,
    init: function () { return { crm: {} }; },
    nodes: {
      trigger: function (i, ctx) { ctx.form = i.body; ctx.leads = []; ctx.resp = []; ctx.enr = []; ctx.up = null; ctx.down = false; return { out: { timestamp: new Date().toISOString(), mode: 'schedule Monday 07:00' }, ms: 4 }; },
      config: function (i, ctx) { var o = copy(CFG); o.hot_score = String(ctx.form.hot_score || '70'); return { out: o, ms: 3 }; },
      read: function (i, ctx) { return { out: { fileName: CFG.leads_file, mimeType: 'text/csv', binary: true }, ms: 9 }; },
      parse: function (i, ctx) { ctx.leads = parseCsv(ctx.form.leads); return { out: { _itens: ctx.leads.length, leads: ctx.leads }, ms: 7 }; },
      fetch: function (i, ctx) {
        var down = !!(i && i.__error), S = sites(ctx.form.pages);
        ctx.resp = ctx.leads.map(function (l) { return respond(l, S, down); });
        return { out: { _itens: ctx.resp.length, respostas: ctx.leads.map(function (l, k) { return { url: CFG.pages_base + l.domain_slug, statusCode: ctx.resp[k].statusCode }; }) }, ms: down ? 0 : 640 };
      },
      extract: function (i, ctx) { ctx.enr = ctx.leads.map(function (l, k) { return enrich(l, ctx.resp[k]); }); return { out: { _itens: ctx.enr.length, leads: ctx.enr }, ms: 10 }; },
      collect: function (i, ctx) { return { out: { leads: ctx.enr.length + ' itens' }, ms: 3 }; },
      readcrm: function (i, ctx) { return { out: ctx.crmExists !== false && Object.keys(ctx.crm).length ? { fileName: CFG.crm_file, binary: true, rows: Object.keys(ctx.crm).length } : { note: 'crm.csv ainda não existe: começa vazio' }, ms: 8 }; },
      upsert: function (i, ctx) { ctx.up = upsert(ctx.crm, ctx.enr, ctx.form.hot_score || '70'); return { out: { added: ctx.up.added, updated: ctx.up.updated, total: ctx.up.total, hot: ctx.up.hot, unreachable: ctx.up.unreachable }, ms: 14 }; },
      save: function (i, ctx) { return { out: { json: i, saved_to: CFG.data_dir + '/' + CFG.crm_file }, ms: 15 }; },
      hot: function (i) { return { out: i.json, branch: i.json.hot.length > 0 ? 'true' : 'false', ms: 2, end: !(i.json.hot.length > 0) }; },
      notify: function (i, ctx) {
        if (i && i.__error) return { out: { notify: { ok: false, error: i.__error } }, ms: 0, end: true };
        var u = ctx.up; return { out: { ok: true, result: { chat_id: CFG.notify_chat_id, text: 'CRM refreshed: +' + u.added + ' new, ' + u.updated + ' updated, ' + u.unreachable + ' unreachable. Hot: ' + u.hot.join(', ') } }, ms: 188, end: true };
      }
    },
    outputs: function (r) {
      var c = r.ctx, o = [], U = c.up;
      if (r.failed || !U) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.', en: 'The flow stopped at node "' + c.failedName + '": ' + (r.failed && r.failed.message) + '.' } }];
      var nt = T('hot', r) && T('notify', r);
      if (!U.hot.length) o.push({ title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, skipped: { pt: 'Nenhum lead com nota igual ou acima de ' + (c.form.hot_score || '70') + ': sem alerta.', en: 'No lead scored ' + (c.form.hot_score || '70') + ' or more: no alert.' } });
      else if (nt && nt.out && nt.out.ok) o.push({ kind: 'telegram', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, from: 'CRM', text: nt.out.result.text, time: '07:00' });
      else o.push({ kind: 'error', title: { pt: 'Alerta no Telegram', en: 'Telegram alert' }, text: { pt: 'O Telegram ficou fora do ar. O CRM já estava salvo; só o aviso não saiu (Continue On Fail).', en: 'Telegram stayed down. The CRM was already saved; only the alert did not go out (Continue On Fail).' } });
      o.push({ kind: 'card', title: { pt: 'Rodada', en: 'Run' }, rows: [[{ pt: 'Novas', en: 'New' }, String(U.added)], [{ pt: 'Atualizadas', en: 'Updated' }, String(U.updated)], [{ pt: 'Inalcançáveis', en: 'Unreachable' }, String(U.unreachable)], [{ pt: 'Total no CRM', en: 'Total in CRM' }, String(U.total)]] });
      o.push({ kind: 'sheet', title: { pt: 'crm.csv (ordenado por nota)', en: 'crm.csv (sorted by score)' }, cols: ['company', 'status', 'score', 'industry', 'size', 'contact_email', 'why', 'note'], rows: U.all.map(function (x) { return [x.company, x.status, x.score, x.industry || '', x.size === undefined ? '' : x.size, x.contact_email || '', x.why || '', x.note || '']; }) });
      return o;
    },
    verify: function (exp, ctx) {
      var rows = ctx.up.all.map(function (x) { return [x.domain, x.status, x.score, x.industry || '', x.size === undefined ? '' : x.size].join('|'); });
      var t = 'CRM refreshed: +' + ctx.up.added + ' new, ' + ctx.up.updated + ' updated, ' + ctx.up.unreachable + ' unreachable. Hot: ' + ctx.up.hot.join(', ');
      return JSON.stringify(rows) === JSON.stringify(exp.rows) && t === exp.text;
    }
  };
})();
