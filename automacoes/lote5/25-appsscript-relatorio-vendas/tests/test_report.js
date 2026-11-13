// node tests/test_report.js  -- roda o Code.gs de verdade no harness e confere números feitos à mão.
const assert = require('assert'), path = require('path'), fs = require('fs'), vm = require('vm');
const { makeEnv, run } = require(path.join(__dirname, '..', 'harness.js'));
const L = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'vendas.json'), 'utf8')), T = '2026-11-08';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log('ok', m); };

let m = makeEnv(L.normal), r = run(m, T);
ok(r.status === 'sent' && m.outbox.length === 1, 'envia 1 e-mail');
ok(m.outbox[0].subject.includes('R$ 6.251,50'), 'total = 1200+350,5+1200+2800+350,5+350,5 (pendente fora)');
ok(m.outbox[0].body.includes('+86,6%'), 'variação vs semana anterior (3.350,50)');
ok(m.sheets['Relatórios'].length === 2 && m.sheets['Relatórios'][1][3] === 'OK', 'grava log OK');
ok(run(m, T).status === 'skipped' && m.outbox.length === 1, 'segunda execução da mesma semana não reenvia');

m = makeEnv(L.sujo); r = run(m, T);
ok(r.skipped === 3 && m.outbox[0].body.includes('linha 12: data inválida') && m.outbox[0].body.includes('linha 13: vendedor vazio') && m.outbox[0].body.includes('linha 14: valor inválido'), 'linhas sujas ignoradas e listadas no e-mail');
ok(m.outbox[0].subject.includes('R$ 6.251,50'), 'linhas sujas não entram no total');

m = makeEnv(L.normal); m.state.quota = true; r = run(m, T);
ok(r.status === 'error' && m.sheets['Relatórios'][1][3].startsWith('ERRO'), 'cota estourada: erro registrado, sem exceção');
m.state.quota = false; ok(run(m, T).status === 'sent' && m.outbox.length === 1, 'próximo gatilho tenta de novo e envia');

m = makeEnv([]); run(m, T); ok(m.outbox[0].subject.includes('R$ 0,00') && m.outbox[0].body.includes('sem semana anterior'), 'planilha vazia: relatório zerado sem quebrar');
console.log(n, 'ok');
