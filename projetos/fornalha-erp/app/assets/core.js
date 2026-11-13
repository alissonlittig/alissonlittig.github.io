/* Regras de negócio do Fornalha ERP (sem DOM, testável em Node). Dados fictícios. */
(function (root) {
'use strict';
const r2 = x => Math.round(x * 100) / 100;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

const SUPPLIERS = [
  { id: 's1', n: 'Frigorífico Serra', prazo: 14 }, { id: 's2', n: 'Atacado Central', prazo: 21 },
  { id: 's3', n: 'Hortifruti Verde', prazo: 7 }, { id: 's4', n: 'Laticínios do Vale', prazo: 14 },
  { id: 's5', n: 'Bebidas Sul', prazo: 28 }, { id: 's6', n: 'Padaria Massas da Vó', prazo: 7 }
];
// id, nome, unidade, estoque, mínimo, custo unitário, fornecedor, passo de compra
const ING = [
  ['i1', 'Filé de frango', 'kg', 18, 10, 19.5, 's1', 5], ['i2', 'Alcatra', 'kg', 14, 8, 52, 's1', 5],
  ['i3', 'Arroz', 'kg', 40, 15, 6.2, 's2', 10], ['i4', 'Feijão', 'kg', 25, 10, 8.4, 's2', 10],
  ['i5', 'Batata', 'kg', 30, 12, 5.8, 's3', 10], ['i6', 'Tomate', 'kg', 5, 6, 7.9, 's3', 5],
  ['i7', 'Alface', 'un', 12, 10, 3.2, 's3', 10], ['i8', 'Muçarela', 'kg', 4.2, 5, 38, 's4', 2],
  ['i9', 'Disco de pizza', 'un', 40, 20, 2.4, 's6', 20], ['i10', 'Molho de tomate', 'L', 10, 6, 9.5, 's2', 5],
  ['i11', 'Azeite', 'L', 5, 2, 41, 's2', 2], ['i12', 'Cebola', 'kg', 12, 5, 4.9, 's3', 5],
  ['i13', 'Refrigerante lata', 'un', 120, 48, 2.7, 's5', 24], ['i14', 'Cerveja long neck', 'un', 40, 48, 4.6, 's5', 24],
  ['i15', 'Polpa de fruta', 'kg', 10, 4, 14, 's3', 5], ['i16', 'Leite condensado', 'un', 20, 8, 6.5, 's2', 12],
  ['i17', 'Ovos', 'un', 60, 30, .9, 's4', 30], ['i18', 'Pão de hambúrguer', 'un', 50, 24, 1.8, 's6', 24]
].map(([id, n, u, q, min, c, s, step]) => ({ id, n, u, q, min, c, s, step }));
// id, nome, categoria, preço, ficha [[insumo, quantidade]]
const DISHES = [
  ['d1', 'Parmegiana de frango', 'Pratos', 46, [['i1', .22], ['i8', .08], ['i10', .06], ['i3', .12], ['i5', .2]]],
  ['d2', 'Bife acebolado', 'Pratos', 58, [['i2', .25], ['i12', .08], ['i3', .12], ['i4', .08], ['i5', .2]]],
  ['d3', 'Pizza de muçarela', 'Pizzas', 49, [['i9', 1], ['i8', .2], ['i10', .08], ['i11', .01]]],
  ['d4', 'Hambúrguer da casa', 'Lanches', 38, [['i18', 1], ['i2', .18], ['i8', .04], ['i6', .03], ['i7', .1], ['i5', .2]]],
  ['d5', 'Salada da casa', 'Entradas', 26, [['i7', .5], ['i6', .1], ['i12', .03], ['i11', .01]]],
  ['d6', 'Pudim', 'Sobremesas', 16, [['i16', .5], ['i17', 3]]],
  ['d7', 'Refrigerante', 'Bebidas', 7, [['i13', 1]]], ['d8', 'Cerveja', 'Bebidas', 12, [['i14', 1]]],
  ['d9', 'Suco natural', 'Bebidas', 9, [['i15', .1]]]
].map(([id, n, cat, p, f]) => ({ id, n, cat, p, f }));
const CANAIS = ['Salão', 'Balcão', 'Delivery (app)'];
const FEE_APP = .23;

function seed(today) {
  const t = today || new Date().toISOString().slice(0, 10), d = n => addDays(t, n);
  const hh = (h, m) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  return {
    v: 1, today: t, caixa: 24800, seq: { o: 1048, po: 212, b: 30 },
    // pm = preço de mercado hoje (difere do custo médio em estoque)
    ing: JSON.parse(JSON.stringify(ING)).map((x, k) => ({ ...x, pm: r2(x.c * (1 + ((k * 7) % 5 - 1) * .03)) })),
    orders: [
      { id: 1042, canal: 'Salão', mesa: '4', hora: hh(11, 52), st: 'entregue', itens: [['d2', 2], ['d7', 2]], cost: 0, tot: 130, baixa: true },
      { id: 1043, canal: 'Delivery (app)', mesa: 'App #8821', hora: hh(12, 10), st: 'pronto', itens: [['d3', 1], ['d8', 2]], tot: 73, baixa: true },
      { id: 1044, canal: 'Salão', mesa: '9', hora: hh(12, 21), st: 'preparo', itens: [['d1', 2], ['d5', 1], ['d9', 2]], tot: 136, baixa: true },
      { id: 1045, canal: 'Balcão', mesa: 'Balcão', hora: hh(12, 34), st: 'preparo', itens: [['d4', 2], ['d7', 2]], tot: 90, baixa: true },
      { id: 1046, canal: 'Salão', mesa: '2', hora: hh(12, 41), st: 'novo', itens: [['d2', 1], ['d1', 1], ['d6', 2]], tot: 136, baixa: false },
      { id: 1047, canal: 'Delivery (app)', mesa: 'App #8824', hora: hh(12, 46), st: 'novo', itens: [['d3', 2], ['d7', 1]], tot: 105, baixa: false }
    ],
    pos: [{ id: 211, s: 's3', st: 'aberto', data: d(-1), linhas: [['i6', 10, 7.9], ['i7', 20, 3.2]], tot: 143 }],
    bills: [
      { id: 'b1', tipo: 'pagar', desc: 'Aluguel do ponto', cat: 'Despesa', v: 6500, venc: d(4), pago: false },
      { id: 'b2', tipo: 'pagar', desc: 'Energia e gás', cat: 'Despesa', v: 2900, venc: d(2), pago: false },
      { id: 'b3', tipo: 'pagar', desc: 'Folha de pagamento', cat: 'Despesa', v: 18500, venc: d(6), pago: false },
      { id: 'b4', tipo: 'pagar', desc: 'Frigorífico Serra · NF 8812', cat: 'Fornecedor', v: 3120, venc: d(-1), pago: false },
      { id: 'b5', tipo: 'pagar', desc: 'Bebidas Sul · NF 5530', cat: 'Fornecedor', v: 1980, venc: d(9), pago: false },
      { id: 'b6', tipo: 'pagar', desc: 'Contador', cat: 'Despesa', v: 900, venc: d(11), pago: false },
      { id: 'b7', tipo: 'receber', desc: 'Repasse do app de delivery', cat: 'Venda', v: 4860, venc: d(3), pago: false },
      { id: 'b8', tipo: 'receber', desc: 'Cartões · crédito', cat: 'Venda', v: 7240, venc: d(5), pago: false },
      { id: 'b9', tipo: 'receber', desc: 'Evento corporativo (sinal)', cat: 'Venda', v: 3500, venc: d(8), pago: false },
      { id: 'b10', tipo: 'receber', desc: 'Repasse do app de delivery', cat: 'Venda', v: 5120, venc: d(10), pago: false }
    ],
    // base do mês até ontem (dado de exemplo) + o que o uso na tela somar
    mes: { receita: 118400, cmv: 38900, despesas: 51200, vendas: [3900, 4300, 4100, 4800, 6900, 7400, 4200, 3800, 4400, 4600, 5100, 7300, 7900, 4500] }
  };
}
const dishOf = id => DISHES.find(x => x.id === id);
const ingOf = (st, id) => st.ing.find(x => x.id === id);
const cost = (st, dish) => r2(dish.f.reduce((a, [i, q]) => a + q * ingOf(st, i).c, 0));
const orderCost = (st, o) => r2(o.itens.reduce((a, [d, q]) => a + q * cost(st, dishOf(d)), 0));
const orderTotal = o => r2(o.itens.reduce((a, [d, q]) => a + q * dishOf(d).p, 0));
const status = i => i.q <= i.min * .5 ? 'critico' : i.q < i.min ? 'baixo' : 'ok';

// consumo total de um pedido por insumo
function need(o) {
  const m = {};
  for (const [d, q] of o.itens) for (const [i, k] of dishOf(d).f) m[i] = (m[i] || 0) + k * q;
  return m;
}
function missing(st, o) {
  const m = need(o), out = [];
  for (const i in m) { const ing = ingOf(st, i); if (ing.q + 1e-9 < m[i]) out.push({ id: i, n: ing.n, falta: r2(m[i] - ing.q), u: ing.u }); }
  return out;
}
function newOrder(st, canal, mesa, itens) {
  const lines = itens.filter(([, q]) => q > 0);
  if (!lines.length) return { ok: false, erro: 'Adicione ao menos um item.' };
  const o = { id: ++st.seq.o, canal, mesa: mesa || '-', hora: new Date().toTimeString().slice(0, 5), st: 'novo', itens: lines, baixa: false };
  o.tot = orderTotal(o); st.orders.push(o);
  return { ok: true, order: o, faltas: missing(st, o) };
}
// novo -> preparo dá baixa no estoque pela ficha técnica; sem estoque, não deixa
function advance(st, id) {
  const o = st.orders.find(x => x.id === id);
  if (!o) return { ok: false, erro: 'Pedido não encontrado.' };
  if (o.st === 'novo') {
    const f = missing(st, o);
    if (f.length) return { ok: false, erro: 'Falta estoque: ' + f.map(x => x.n + ' (' + x.falta + ' ' + x.u + ')').join(', ') + '.', faltas: f };
    const m = need(o); for (const i in m) ingOf(st, i).q = r2(ingOf(st, i).q - m[i]);
    o.baixa = true; o.st = 'preparo'; return { ok: true };
  }
  if (o.st === 'preparo') { o.st = 'pronto'; return { ok: true }; }
  if (o.st === 'pronto') {
    o.st = 'entregue'; o.cost = orderCost(st, o); o.tot = orderTotal(o);
    if (o.canal === 'Delivery (app)') st.bills.push({ id: 'b' + (++st.seq.b), tipo: 'receber', desc: 'Repasse do app · pedido ' + o.id, cat: 'Venda', v: r2(o.tot * (1 - FEE_APP)), venc: addDays(st.today, 14), pago: false });
    else st.caixa = r2(st.caixa + o.tot);
    st.mes.receita = r2(st.mes.receita + o.tot); st.mes.cmv = r2(st.mes.cmv + o.cost);
    return { ok: true };
  }
  return { ok: false, erro: 'Pedido já finalizado.' };
}
// cancelar depois do preparo não devolve o estoque: vira perda
function cancel(st, id) {
  const o = st.orders.find(x => x.id === id);
  if (!o || o.st === 'entregue' || o.st === 'cancelado') return { ok: false, erro: 'Não dá para cancelar.' };
  const perda = o.baixa ? orderCost(st, o) : 0;
  o.st = 'cancelado'; if (perda) st.mes.cmv = r2(st.mes.cmv + perda);
  return { ok: true, perda };
}
function adjust(st, id, delta) { const i = ingOf(st, id); i.q = Math.max(0, r2(i.q + delta)); return i.q; }

// sugestão: repor até 2,5x o mínimo, arredondando para o passo de compra do insumo
function suggestions(st) {
  const by = {};
  const abertos = new Set(st.pos.filter(p => p.st === 'aberto').flatMap(p => p.linhas.map(l => l[0])));
  for (const i of st.ing) {
    if (i.q >= i.min || abertos.has(i.id)) continue;
    const q = Math.ceil((i.min * 2.5 - i.q) / i.step) * i.step;
    (by[i.s] = by[i.s] || []).push([i.id, q]);
  }
  return Object.entries(by).map(([s, linhas]) => ({ s, linhas, tot: poTotal(st, linhas) }));
}
const poTotal = (st, linhas) => r2(linhas.reduce((a, [i, q]) => a + q * ingOf(st, i).pm, 0));
function createPO(st, s, linhas) {
  const l = linhas.filter(([, q]) => q > 0);
  if (!l.length) return { ok: false, erro: 'Pedido de compra vazio.' };
  const po = { id: ++st.seq.po, s, st: 'aberto', data: st.today, linhas: l.map(([i, q]) => [i, q, ingOf(st, i).pm]), tot: poTotal(st, l) };
  st.pos.push(po); return { ok: true, po };
}
// receber: entra no estoque, atualiza custo médio ponderado e gera conta a pagar no prazo do fornecedor
function receivePO(st, id) {
  const po = st.pos.find(x => x.id === id);
  if (!po || po.st !== 'aberto') return { ok: false, erro: 'Pedido de compra não está aberto.' };
  let tot = 0;
  for (const [i, q, preco = ingOf(st, i).pm] of po.linhas) {
    const ing = ingOf(st, i);
    ing.c = r2((ing.q * ing.c + q * preco) / (ing.q + q)); ing.q = r2(ing.q + q); tot += q * preco;
  }
  po.st = 'recebido'; po.tot = r2(tot);
  const f = SUPPLIERS.find(x => x.id === po.s);
  st.bills.push({ id: 'b' + (++st.seq.b), tipo: 'pagar', desc: f.n + ' · compra ' + po.id, cat: 'Fornecedor', v: po.tot, venc: addDays(st.today, f.prazo), pago: false });
  return { ok: true, bill: st.bills[st.bills.length - 1] };
}
function settle(st, id) {
  const b = st.bills.find(x => x.id === id);
  if (!b || b.pago) return { ok: false, erro: 'Lançamento já baixado.' };
  b.pago = true; st.caixa = r2(st.caixa + (b.tipo === 'receber' ? b.v : -b.v));
  if (b.tipo === 'pagar' && b.cat === 'Despesa') st.mes.despesas = r2(st.mes.despesas + b.v);
  return { ok: true };
}
// saldo projetado dia a dia (só lançamentos em aberto, atrasados caem no dia 0)
function projection(st, dias) {
  let s = st.caixa; const out = [];
  for (let k = 0; k < dias; k++) {
    const dia = addDays(st.today, k); let ent = 0, sai = 0;
    for (const b of st.bills) if (!b.pago && (k === 0 ? b.venc <= dia : b.venc === dia)) (b.tipo === 'receber' ? (ent += b.v) : (sai += b.v));
    s = r2(s + ent - sai); out.push({ dia, ent, sai, saldo: s });
  }
  return out;
}
const api = { SUPPLIERS, DISHES, CANAIS, FEE_APP, seed, dishOf, ingOf, cost, orderCost, orderTotal, status, need, missing, newOrder, advance, cancel, adjust, suggestions, poTotal, createPO, receivePO, settle, projection, addDays, r2 };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Core = api;
})(typeof self !== 'undefined' ? self : this);
