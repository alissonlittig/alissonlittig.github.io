// Simula SpreadsheetApp / MailApp / Utilities em memória para rodar o Code.gs de verdade fora do Google.
// Limite: não é o runtime do Google; só cobre as chamadas que o Code.gs usa.
const fs = require('fs'), vm = require('vm'), path = require('path');
function makeEnv(vendas) {
  const sheets = { 'Vendas': [['Data', 'Vendedor', 'Produto', 'Valor', 'Status']].concat(vendas || []), 'Relatórios': [['Enviado em', 'Semana', 'Total', 'Status', 'Linhas ignoradas']] };
  const outbox = [], state = { quota: false }, sh = n => ({ getDataRange: () => ({ getValues: () => sheets[n].map(r => r.slice()) }), appendRow: r => sheets[n].push(r) });
  const env = {
    console, Date, SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: sh }) },
    MailApp: { sendEmail: (to, subject, body) => { if (state.quota) throw new Error('Service invoked too many times for one day: email.'); outbox.push({ to, subject, body }); } },
    Utilities: { formatDate: (d, tz, f) => d.toISOString().slice(0, 10) },
  };
  vm.createContext(env); vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), env);
  return { env, sheets, outbox, state };
}
const run = (m, today) => { m.env.CONFIG.today = today; return vm.runInContext('sendWeeklyReport()', m.env); };
module.exports = { makeEnv, run };
if (require.main === module) { // node harness.js -> roda os cenários e grava output/scenarios.json
  const L = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'vendas.json'), 'utf8')), R = {}, T = '2026-11-08';
  const rec = (name, m, result) => { R[name] = { today: T, result, mail: m.outbox[m.outbox.length - 1] || null, log: m.sheets['Relatórios'].slice(1), mails_sent: m.outbox.length }; };
  let m = makeEnv(L.normal); rec('normal', m, run(m, T));
  rec('repetido', m, run(m, T)); // mesma semana de novo: não reenvia
  m = makeEnv(L.sujo); rec('dados_sujos', m, run(m, T));
  m = makeEnv(L.normal); m.state.quota = true; rec('cota_estourada', m, run(m, T));
  m.state.quota = false; rec('retentativa_ok', m, run(m, T));
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true }); fs.writeFileSync(path.join(__dirname, 'output', 'scenarios.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
}
