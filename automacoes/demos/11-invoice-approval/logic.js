/* Nós Code = mesmo código do workflow.json (a fonte é uma só). */
(function () {

  var CFG = { ledger_file: './data/ledger_11.csv', notify_url: 'https://api.telegram.org/bot<TOKEN>/sendMessage', notify_chat_id: 'FINANCE_CHAT_ID',
    approved_vendors: 'Northwind Supplies,Brightline Print,Cloudnine Hosting,Orbit Logistics', auto_limit: '500', manager_limit: '5000',
    manager: 'Mariana Costa', director: 'Henrique Lopes', approve_url: 'http://localhost:5691/webhook/invoice-decision', today: '2026-11-11' };
  var SEED = ["\"2026-11-03T09:12:00.000Z\",\"INV-0001\",\"Northwind Supplies\",\"NW-2208\",\"318.40\",\"USD\",\"approved\",\"auto\",\"\",\"Auto-approved: within the auto-approval limit, approved vendor, PO present\"", "\"2026-11-05T14:30:00.000Z\",\"INV-0002\",\"Brightline Print\",\"BP-771\",\"1240.00\",\"USD\",\"pending\",\"approval\",\"Mariana Costa\",\"Waiting for Mariana Costa (manager): above the auto-approval limit (500)\""];
  var parseLine = function (line) { var c = [], cur = '', q = false; for (var k = 0; k < line.length; k++) { var ch = line[k]; if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
  var HEADER = 'ts,invoice_id,vendor,invoice_no,amount,currency,status,route,approver,note';
  var copy = function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; };
  var T = function (id, r) { return r.trace.filter(function (t) { return t.id === id && !t.error; })[0]; };
  var meta = function (ctx) { return { fileName: 'ledger_11.csv', mimeType: 'text/csv', fileSize: (ctx.ledger.length * 0.19 + 0.1).toFixed(1) + ' kB' }; };
  var webhookOut = function (b) { return { headers: { 'content-type': 'application/json' }, params: {}, query: {}, body: b }; };

  window.DEMO = {
    start: 'webhook',
    init: function () { var ctx = { ledger: SEED.map(parseLine) };
      ctx.ledgerText = function () { return HEADER + '\n' + ctx.ledger.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); };
      return ctx; },
    nodes: {
    webhook: function (i, ctx) { ctx.form = i.body; return { out: webhookOut(i.body), ms: 11 }; },
    config: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.cfg = o; return { out: o, ms: 4 }; },
    read: function (i, ctx) { return { out: meta(ctx), ms: 6 }; },
    check: function (i, ctx) {
var input = ctx.cfg; var ledgerText = ctx.ledgerText();
var out = (function () {
const parse = line => { const c = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
const rows = ledgerText.split(/\r?\n/).slice(1).filter(Boolean).map(parse);
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const b = input.body || {};
const vendor = String(b.vendor || '').trim(), invNo = String(b.invoice_no || '').trim();
const amount = Number(String(b.amount ?? '').replace(/[^0-9.]/g, ''));
const currency = String(b.currency || 'USD').trim().toUpperCase();
const po = String(b.po_number || '').trim(), due = String(b.due_date || '').trim();
const problems = [];
if (!vendor) problems.push('vendor is missing');
if (!invNo) problems.push('invoice number is missing');
if (!(amount > 0)) problems.push('amount must be a positive number');
if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) problems.push('due_date must be YYYY-MM-DD');
if (problems.length) throw new Error('Invalid invoice: ' + problems.join('; '));
const lastId = rows.reduce((m, r) => Math.max(m, Number(String(r[1]).replace(/\D/g, '')) || 0), 0);
const invoice_id = 'INV-' + String(lastId + 1).padStart(4, '0');
const dup = rows.find(r => r[2].toLowerCase() === vendor.toLowerCase() && r[3].toLowerCase() === invNo.toLowerCase() && r[6] !== 'rejected');
const known = String(input.approved_vendors).split(',').map(x => x.trim().toLowerCase()).includes(vendor.toLowerCase());
const autoLimit = Number(input.auto_limit), mgrLimit = Number(input.manager_limit);
const flags = [];
if (!known) flags.push('vendor not on the approved list');
if (!po) flags.push('no purchase order');
if (currency !== 'USD') flags.push('foreign currency (' + currency + ')');
const days = due ? Math.round((Date.parse(due) - Date.parse(input.today)) / 86400000) : null;
const rush = days !== null && days < 3;
let route, level = '', approver = '', reason;
if (dup) { route = 'blocked'; reason = 'duplicate of ' + dup[1] + ' (' + dup[6] + ')'; }
else if (amount <= autoLimit && flags.length === 0) { route = 'auto'; reason = 'within the auto-approval limit, approved vendor, PO present'; }
else {
  route = 'approval'; level = amount > mgrLimit ? 'director' : 'manager'; approver = level === 'director' ? input.director : input.manager;
  reason = (amount > mgrLimit ? 'above the manager limit (' + mgrLimit + ')' : amount > autoLimit ? 'above the auto-approval limit (' + autoLimit + ')' : 'needs a human look') + (flags.length ? '; ' + flags.join('; ') : '');
}
return { invoice_id, vendor, invoice_no: invNo, amount, currency, due_date: due, po_number: po, description: String(b.description || ''), route, level, approver, flags, reason, rush, approve_url: input.approve_url, ts: new Date().toISOString() };
})();
ctx.cur = out;
return { out: out, ms: 9, branch: out.route };
},
    route: function (i) { return { out: i, branch: i.route, ms: 2 }; },
    auto: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const note = 'Auto-approved: ' + input.reason;
const csv_line = [input.ts, input.invoice_id, input.vendor, input.invoice_no, input.amount.toFixed(2), input.currency, 'approved', 'auto', '', note].map(Q).join(',') + '\n';
const message = 'PAYMENT SCHEDULED: ' + input.invoice_id + ' | ' + input.vendor + ' | ' + input.currency + ' ' + input.amount.toFixed(2) + ' (invoice ' + input.invoice_no + ')\n' + note;
return { ...input, status: 'approved', csv_line, message, buttons: null, http_status: 200, response: { invoice_id: input.invoice_id, status: 'approved', route: 'auto' } };
})();

return { out: out, ms: 6 };
},
    req: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const note = 'Waiting for ' + input.approver + ' (' + input.level + '): ' + input.reason;
const csv_line = [input.ts, input.invoice_id, input.vendor, input.invoice_no, input.amount.toFixed(2), input.currency, 'pending', 'approval', input.approver, note].map(Q).join(',') + '\n';
const link = d => input.approve_url + '?invoice_id=' + input.invoice_id + '&decision=' + d + '&by=' + encodeURIComponent(input.approver);
const message = 'APPROVAL NEEDED (' + input.level + '): ' + input.invoice_id + (input.rush ? '  [RUSH]' : '') + '\n' + input.vendor + ' | invoice ' + input.invoice_no + ' | ' + input.currency + ' ' + input.amount.toFixed(2) + '\n' + (input.description || 'no description') + '\nWhy it came to you: ' + input.reason + '\nApprover: ' + input.approver;
const buttons = [{ text: 'Approve', url: link('approve') }, { text: 'Reject', url: link('reject') }];
return { ...input, status: 'pending', csv_line, message, buttons, http_status: 202, response: { invoice_id: input.invoice_id, status: 'pending', route: 'approval', approver: input.approver } };
})();

return { out: out, ms: 6 };
},
    block: function (i, ctx) {
var input = i;
var out = (function () {
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const note = 'Blocked: ' + input.reason;
const csv_line = [input.ts, input.invoice_id, input.vendor, input.invoice_no, input.amount.toFixed(2), input.currency, 'blocked', 'blocked', '', note].map(Q).join(',') + '\n';
const message = 'INVOICE BLOCKED: ' + input.vendor + ' | invoice ' + input.invoice_no + ' | ' + input.currency + ' ' + input.amount.toFixed(2) + '\nReason: ' + input.reason + '. Nothing was scheduled for payment.';
return { ...input, status: 'blocked', csv_line, message, buttons: null, http_status: 409, response: { status: 'blocked', reason: input.reason } };
})();

return { out: out, ms: 6 };
},
    respond: function (i, ctx) { ctx.resp = { status: i.http_status, body: i.response }; return { out: i, ms: 5 }; },
    append: function (i, ctx) { ctx.ledger.push(parseLine(i.csv_line.replace(/\n$/, ''))); return { out: i, ms: 17 }; },
    notify: function (i, ctx) {
        var src = i && i.__error ? i.input : i, route = ctx.cur.route;
        var o = copy(src); o.notify = i && i.__error ? { ok: false, error: i.__error } : { ok: true, chat_id: CFG.notify_chat_id, text: src.message, buttons: src.buttons };
        return { out: o, ms: i && i.__error ? 0 : 212, branch: route === 'approval' && ctx.form.decision !== 'wait' ? 'decide' : 'end' };
      },
    dweb: function (i, ctx) { var by = ctx.form.decided_by === 'assigned' ? ctx.cur.approver : ctx.form.decided_by; ctx.dbody = { invoice_id: ctx.cur.invoice_id, decision: ctx.form.decision, by: by }; return { out: webhookOut(ctx.dbody), ms: 9 }; },
    dcfg: function (i, ctx) { var o = copy(i); for (var k in CFG) o[k] = CFG[k]; ctx.dcfg = o; return { out: o, ms: 4 }; },
    dread: function (i, ctx) { return { out: meta(ctx), ms: 6 }; },
    apply: function (i, ctx) {
var input = ctx.dcfg; var ledgerText = ctx.ledgerText();
var out = (function () {
const parse = line => { const c = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
const rows = ledgerText.split(/\r?\n/).slice(1).filter(Boolean).map(parse);
const Q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';

const b = input.body || {};
const id = String(b.invoice_id || '').trim(), decision = String(b.decision || '').trim().toLowerCase(), by = String(b.by || '').trim();
if (!['approve', 'reject'].includes(decision)) throw new Error('decision must be "approve" or "reject"');
const mine = rows.filter(r => r[1] === id);
if (!mine.length) throw new Error('Unknown invoice ' + id);
const last = mine[mine.length - 1];
if (last[6] !== 'pending') throw new Error(id + ' is already ' + last[6] + ': decision ignored');
if (last[8].toLowerCase() !== by.toLowerCase()) throw new Error(by + ' is not the approver of ' + id + ' (assigned: ' + last[8] + ')');
const status = decision === 'approve' ? 'approved' : 'rejected';
const note = (status === 'approved' ? 'Approved' : 'Rejected') + ' by ' + by;
const ts = new Date().toISOString();
const csv_line = [ts, id, last[2], last[3], last[4], last[5], status, 'approval', by, note].map(Q).join(',') + '\n';
const message = (status === 'approved' ? 'APPROVED: ' : 'REJECTED: ') + id + ' | ' + last[2] + ' | ' + last[5] + ' ' + last[4] + ' (invoice ' + last[3] + ')\n' + note + (status === 'approved' ? '. Payment scheduled.' : '. Vendor to be notified.');
return { invoice_id: id, vendor: last[2], invoice_no: last[3], amount: Number(last[4]), currency: last[5], status, decided_by: by, ts, csv_line, message, http_status: 200, response: { invoice_id: id, status } };
})();
ctx.dec = out;
return { out: out, ms: 9 };
},
    drespond: function (i, ctx) { ctx.dresp = { status: i.http_status, body: i.response }; return { out: i, ms: 5 }; },
    dappend: function (i, ctx) { ctx.ledger.push(parseLine(i.csv_line.replace(/\n$/, ''))); return { out: i, ms: 16 }; },
    dnotify: function (i, ctx) { var o = copy(i); o.notify = { ok: true, chat_id: CFG.notify_chat_id, text: i.message }; return { out: o, ms: 198, end: true }; }
    },
    outputs: function (r) {
      var o = [], c = r.ctx, hhmm = new Date().toTimeString().slice(0, 5);
      var ck = T('check', r);
      if (!ck) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: { pt: 'O fluxo parou no nó "' + c.failedName + '": ' + r.failed.message + '. A API responde 500 ao remetente e nada entra no livro. É assim de propósito: dado ruim não vira pagamento.', en: 'The flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The API answers 500 to the sender and nothing enters the ledger. On purpose: bad data never becomes a payment.' } }];
      var v = ck.out, ROUTE = { auto: { pt: 'Aprovada sozinha', en: 'Auto-approved' }, approval: { pt: 'Precisa de aprovação', en: 'Needs approval' }, blocked: { pt: 'Bloqueada', en: 'Blocked' } };
      var cls = { auto: 'b-ok', approval: 'b-warm', blocked: 'b-hot' };
      var rows = [[{ pt: 'Decisão das regras', en: 'Rule decision' }, ROUTE[v.route].pt + ' / ' + ROUTE[v.route].en, cls[v.route]], [{ pt: 'Fatura', en: 'Invoice' }, v.invoice_id + ' · ' + v.vendor + ' · ' + v.currency + ' ' + v.amount.toFixed(2)]];
      if (v.approver) rows.push([{ pt: 'Aprovador', en: 'Approver' }, v.approver + ' (' + v.level + ')' + (v.rush ? ' · RUSH' : '')]);
      rows.push([{ pt: 'Motivo', en: 'Why' }, v.reason]); if (v.flags.length) rows.push([{ pt: 'Alertas', en: 'Flags' }, v.flags.join('; ')]);
      o.push({ kind: 'card', title: { pt: 'Análise da fatura', en: 'Invoice check' }, rows: rows });
      if (c.resp) o.push({ kind: 'card', title: { pt: 'Resposta HTTP ao remetente', en: 'HTTP response to the sender' }, rows: [['HTTP', String(c.resp.status)], ['JSON', JSON.stringify(c.resp.body)]] });
      var nt = T('notify', r);
      if (nt && nt.out.notify) {
        if (nt.out.notify.ok) { var tx = nt.out.notify.text + (nt.out.notify.buttons ? '\n\n[ Approve ]   [ Reject ]' : ''); o.push({ kind: 'telegram', title: { pt: 'Telegram do financeiro / aprovador', en: 'Telegram to finance / approver' }, from: 'Finance Bot', text: tx, time: hhmm }); }
        else o.push({ kind: 'error', title: { pt: 'Aviso no Telegram', en: 'Telegram message' }, text: { pt: 'O Telegram ficou fora do ar nas 3 tentativas. A fatura NÃO se perdeu: já está no livro-razão e o remetente recebeu a resposta (Continue On Fail). Um e-mail de erro iria para o financeiro: "Aviso falhou para ' + v.invoice_id + '".', en: 'Telegram stayed down for all 3 attempts. The invoice was NOT lost: it is already in the ledger and the sender got the reply (Continue On Fail). An error e-mail would go to finance: "Notification failed for ' + v.invoice_id + '".' } });
      }
      if (v.route === 'approval' && c.form.decision === 'wait') o.push({ title: { pt: 'Decisão do aprovador', en: 'Approver decision' }, skipped: { pt: 'Sem resposta ainda: a fatura fica como "pending" no livro-razão. (Um lembrete após 24 h seria o próximo passo natural.)', en: 'No answer yet: the invoice stays "pending" in the ledger. (A reminder after 24 h is the natural next step.)' } });
      var ap = T('apply', r), dn = T('dnotify', r);
      if (c.failedNode === 'apply') o.push({ kind: 'error', title: { pt: 'Clique de aprovação recusado', en: 'Approval click refused' }, text: { pt: 'O fluxo da decisão parou no nó "' + c.failedName + '": ' + r.failed.message + '. O livro-razão não mudou. Só o aprovador designado decide, e só uma vez.', en: 'The decision flow stopped at node "' + c.failedName + '": ' + r.failed.message + '. The ledger did not change. Only the assigned approver decides, and only once.' } });
      if (dn && dn.out.notify) o.push({ kind: 'telegram', title: { pt: 'Telegram: decisão registrada', en: 'Telegram: decision recorded' }, from: 'Finance Bot', text: dn.out.notify.text, time: hhmm });
      o.push({ kind: 'sheet', title: { pt: 'Livro-razão (ledger_11.csv)', en: 'Ledger (ledger_11.csv)' }, cols: ['invoice_id', 'vendor', 'invoice_no', 'amount', 'status', 'approver', 'note'],
        rows: c.ledger.map(function (x) { return [x[1], x[2], x[3], x[5] + ' ' + x[4], x[6], x[8], x[9]]; }).slice(-5), highlightLast: true });
      return o;
    }
  };
})();
