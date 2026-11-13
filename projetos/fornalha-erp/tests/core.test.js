// node tests/core.test.js
const assert = require('node:assert/strict');
const C = require('../app/assets/core.js');
const st = () => C.seed('2026-11-13');
let n = 0; const t = (nome, fn) => { fn(); n++; console.log('ok -', nome); };

t('custo do prato vem da ficha técnica', () => {
  const s = st(); const d = C.dishOf('d3');
  assert.equal(C.cost(s, d), C.r2(2.4 + .2 * 38 + .08 * 9.5 + .01 * 41));
});
t('iniciar preparo dá baixa no estoque', () => {
  const s = st(); const antes = C.ingOf(s, 'i2').q;
  assert.ok(C.advance(s, 1046).ok);                       // bife + parmegiana + 2 pudins
  assert.equal(C.ingOf(s, 'i2').q, C.r2(antes - .25));
  assert.equal(s.orders.find(o => o.id === 1046).st, 'preparo');
});
t('sem estoque o pedido não entra em preparo e nada é baixado', () => {
  const s = st(); C.adjust(s, 'i8', -4.2);              // zera a muçarela
  const r = C.advance(s, 1047);                          // 2 pizzas
  assert.equal(r.ok, false); assert.match(r.erro, /Muçarela/);
  assert.equal(C.ingOf(s, 'i9').q, 40);
});
t('entregar salão entra no caixa; delivery vira conta a receber com taxa', () => {
  const s = st(); const cx = s.caixa;
  C.advance(s, 1044); C.advance(s, 1044); C.advance(s, 1044);   // salão
  assert.equal(s.caixa, C.r2(cx + 136));
  const nb = s.bills.length; C.advance(s, 1043);                  // delivery pronto -> entregue
  assert.equal(s.bills.length, nb + 1);
  assert.equal(s.bills.at(-1).v, C.r2(73 * (1 - C.FEE_APP)));
});
t('cancelar depois do preparo gera perda no CMV e não devolve estoque', () => {
  const s = st(); const cmv = s.mes.cmv; const q = C.ingOf(s, 'i1').q;
  const r = C.cancel(s, 1044);
  assert.ok(r.perda > 0); assert.equal(s.mes.cmv, C.r2(cmv + r.perda)); assert.equal(C.ingOf(s, 'i1').q, q);
  assert.equal(C.cancel(s, 1046).perda, 0);
});
t('sugestão de compra agrupa por fornecedor e respeita o passo', () => {
  const s = st(); const sug = C.suggestions(s);
  assert.deepEqual(sug.find(x => x.s === 's4').linhas, [['i8', 10]]);      // 4,2 kg -> alvo 12,5 kg, passo de 2
  assert.deepEqual(sug.find(x => x.s === 's5').linhas, [['i14', 96]]);     // 40 -> alvo 120, passo de 24
});
t('não sugere de novo o que já está em pedido de compra aberto', () => {
  const s = st(); assert.ok(!C.suggestions(s).some(x => x.linhas.some(l => l[0] === 'i6')));
}); // tomate (i6) já está no pedido de compra 211, aberto no seed
t('receber compra: estoque sobe, custo médio pondera e nasce conta a pagar no prazo', () => {
  const s = st(); const q0 = C.ingOf(s, 'i8').q;
  const po = C.createPO(s, 's4', [['i8', 10]]).po; const bills = s.bills.length;
  assert.ok(C.receivePO(s, po.id).ok);
  assert.equal(C.ingOf(s, 'i8').q, C.r2(q0 + 10));
  assert.equal(s.bills.length, bills + 1);
  assert.equal(s.bills.at(-1).venc, C.addDays('2026-11-13', 14)); assert.equal(s.bills.at(-1).v, 414.2);                       // 10 kg a R$ 41,42 (preço de mercado)
  assert.equal(C.ingOf(s, 'i8').c, C.r2((4.2 * 38 + 10 * 41.42) / 14.2));  // custo médio ponderado
  assert.equal(C.receivePO(s, po.id).ok, false);
});
t('baixar conta a pagar reduz o caixa uma vez só', () => {
  const s = st(); const cx = s.caixa;
  assert.ok(C.settle(s, 'b2').ok); assert.equal(s.caixa, cx - 2900); assert.equal(C.settle(s, 'b2').ok, false);
});
t('projeção: atrasados caem no dia 0 e o saldo fecha com o caixa + lançamentos', () => {
  const s = st(); const p = C.projection(s, 14);
  assert.equal(p[0].sai, 3120);                           // b4 vencida
  const total = s.bills.filter(b => b.venc <= p.at(-1).dia).reduce((a, b) => a + (b.tipo === 'receber' ? b.v : -b.v), 0);
  assert.equal(p.at(-1).saldo, C.r2(s.caixa + total));
});
console.log(n + ' testes passaram');
