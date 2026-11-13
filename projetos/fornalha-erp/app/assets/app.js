(() => {
'use strict';
const C = window.Core, $ = s => document.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dec = (v, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const R = v => 'R$ ' + dec(v);
const R0 = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const pct = (v, d = 1) => dec(v * 100, d) + '%';
const dBR = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
const KEY = 'fornalha-erp-v1';

let st, view = 'geral', charts = {}, ing = { q: '', f: 'todos' }, finTab = 'pagar';
const today = () => new Date().toISOString().slice(0, 10);
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { /* sem storage ou JSON ruim: começa do exemplo */ }
  return C.seed(today());
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* modo privado: não persiste */ } }
let tt;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(tt); tt = setTimeout(() => t.className = 'toast', 3800); }
function mk(id, cfg) {
  if (charts[id]) charts[id].destroy();
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.color = css('--muted');
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 300 } }, cfg.options);
  charts[id] = new Chart(document.getElementById(id), cfg);
}
const tip = { backgroundColor: '#24150e', titleColor: '#fff', bodyColor: '#f6ede6', padding: 10, cornerRadius: 8 };
const grid = () => ({ color: css('--border') });
const supName = id => C.SUPPLIERS.find(x => x.id === id).n;
const ST = { novo: 'Novos', preparo: 'Em preparo', pronto: 'Prontos', entregue: 'Entregues hoje' };
const venc = b => b.pago ? 'pago' : b.venc < st.today ? 'atrasada' : b.venc === st.today ? 'hoje' : 'aberta';

/* ===== números gerais ===== */
function stats() {
  const live = st.orders.filter(o => o.st !== 'cancelado');
  const done = live.filter(o => o.st === 'entregue'), open = live.filter(o => o.st !== 'entregue');
  const crit = st.ing.filter(i => C.status(i) !== 'ok');
  const late = st.bills.filter(b => !b.pago && b.venc < st.today);
  const venda = done.reduce((a, o) => a + o.tot, 0);
  return { live, done, open, crit, late, venda, vendaTot: live.reduce((a, o) => a + o.tot, 0), ticket: live.length ? live.reduce((a, o) => a + o.tot, 0) / live.length : 0, cmvPct: st.mes.receita ? st.mes.cmv / st.mes.receita : 0 };
}
const kpi = (l, v, s) => `<div class="card kpi"><div class="l">${l}</div><div class="v num">${v}</div><div class="sub2">${s}</div></div>`;
const tag = (c, t) => `<span class="tag t-${c}">${t}</span>`;
const stTag = i => { const s = C.status(i); return s === 'ok' ? tag('ok', 'Ok') : s === 'baixo' ? tag('warn', 'Baixo') : tag('bad', 'Crítico'); };

/* ===== visões ===== */
function vGeral() {
  const s = stats(), proj = C.projection(st, 14);
  const menu = C.DISHES.filter(d => d.cat !== 'Bebidas').map(d => ({ d, c: C.cost(st, d) })).map(x => ({ ...x, m: x.d.p - x.c })).sort((a, b) => b.m / b.d.p - a.m / a.d.p);
  const att = [];
  s.open.filter(o => o.st === 'novo').forEach(o => att.push(['pedidos', `Pedido ${o.id} aguardando a cozinha`, 'Novo']));
  s.crit.sort((a, b) => a.q / a.min - b.q / b.min).slice(0, 4).forEach(i => att.push(['estoque', `${i.n}: ${dec(i.q, i.u === 'un' ? 0 : 1)} ${i.u} (mínimo ${i.min})`, C.status(i) === 'critico' ? 'Crítico' : 'Baixo']));
  s.late.forEach(b => att.push(['fin', `${b.desc} venceu em ${dBR(b.venc)}`, R0(b.v)]));
  $('#v-geral').innerHTML = `<div class="vh"><div><h2>Visão geral</h2><p>Hoje, ${dBR(st.today)} · almoço em andamento</p></div></div>
  <div class="kpis k4" style="grid-template-columns:repeat(6,minmax(0,1fr))">
    ${kpi('Vendas de hoje', R0(s.vendaTot), `${s.live.length} pedidos · ${R0(s.venda)} entregues`)}
    ${kpi('Pedidos abertos', s.open.length, `${s.open.filter(o => o.st === 'novo').length} novos na fila`)}
    ${kpi('Ticket médio', R(s.ticket), 'por pedido, hoje')}
    ${kpi('CMV do mês', pct(s.cmvPct), s.cmvPct > .34 ? 'acima da meta de 34%' : 'dentro da meta de 34%')}
    ${kpi('Caixa', R0(st.caixa), `${s.late.length} conta(s) vencida(s)`)}
    ${kpi('Estoque em alerta', s.crit.length, `${s.crit.filter(i => C.status(i) === 'critico').length} crítico(s)`)}
  </div>
  <div class="grid">
    <div class="card panel c8"><h2>Vendas dos últimos 14 dias</h2><p class="sub">Dias anteriores são dados de exemplo; hoje soma os pedidos da tela</p><div class="lc"><canvas id="g-vend" role="img" aria-label="Vendas por dia nos últimos 14 dias"></canvas></div></div>
    <div class="card panel c4"><h2>Precisa de atenção</h2><p class="sub">Clique para ir ao módulo</p><div class="rowlist">${att.length ? att.map(([v, t, b]) => `<button class="rl" data-go="${v}" style="cursor:pointer;text-align:left;color:inherit"><span class="a"><b>${esc(t)}</b></span>${tag(b === 'Crítico' ? 'bad' : b === 'Novo' ? 'info' : 'warn', b)}</button>`).join('') : '<p class="sub">Nada pendente.</p>'}</div></div>
    <div class="card panel c7"><h2>Saldo de caixa projetado</h2><p class="sub">Próximos 14 dias, com os lançamentos em aberto</p><div class="lc"><canvas id="g-sal" role="img" aria-label="Saldo projetado de caixa"></canvas></div></div>
    <div class="card panel c5"><h2>Margem dos pratos</h2><p class="sub">Contribuição por prato vendido, do melhor ao pior percentual</p><div class="tw"><table style="min-width:0"><thead><tr><th>Prato</th><th class="r">Custo</th><th class="r">Margem</th></tr></thead><tbody>${menu.map(({ d, c, m }) => `<tr><td>${d.n}</td><td class="r num">${R(c)}</td><td class="r num">${pct(m / d.p, 0)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>`;
  const v = st.mes.vendas.concat([s.vendaTot]).slice(-14);
  mk('g-vend', { type: 'bar', data: { labels: v.map((_, i) => dBR(C.addDays(st.today, i - 13))), datasets: [{ data: v, backgroundColor: v.map((_, i) => i === 13 ? css('--primary') : css('--primary') + '77'), borderRadius: 5 }] },
    options: { plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => R0(x.parsed.y) } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: x => R0(x).replace('R$ ', '') } } } } });
  mk('g-sal', { type: 'line', data: { labels: proj.map(p => dBR(p.dia)), datasets: [{ data: proj.map(p => p.saldo), borderColor: css('--primary'), backgroundColor: css('--primary') + '22', fill: true, tension: .1, pointRadius: 3, borderWidth: 2.5 }] },
    options: { plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => 'Saldo ' + R0(x.parsed.y) } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), ticks: { callback: x => R0(x).replace('R$ ', '') } } } } });
}

function orderCard(o) {
  const next = { novo: 'Iniciar preparo', preparo: 'Marcar pronto', pronto: 'Entregar' }[o.st];
  return `<article class="oc"><div class="t"><span>#${o.id} · ${esc(o.mesa)}</span><span class="num">${R(o.tot)}</span></div>
    <div class="m">${o.canal} · ${o.hora}${o.canal === 'Delivery (app)' ? ' · taxa 23%' : ''}</div>
    <ul>${o.itens.map(([d, q]) => `<li><span>${q}× ${C.dishOf(d).n}</span></li>`).join('')}</ul>
    ${next ? `<div class="acts"><button class="btn-p btn-sm" data-adv="${o.id}">${next}</button><button class="btn-s btn-sm" data-cancel="${o.id}">Cancelar</button></div>` : ''}</article>`;
}
function vPedidos() {
  const live = st.orders.filter(o => o.st !== 'cancelado');
  $('#v-pedidos').innerHTML = `<div class="vh"><div><h2>Pedidos</h2><p>Iniciar o preparo baixa o estoque pela ficha técnica.</p></div><div class="sp"><button class="btn-p" id="novo-ped">Novo pedido</button></div></div>
  <div class="board">${Object.keys(ST).map(k => { const l = live.filter(o => o.st === k).sort((a, b) => k === 'entregue' ? b.id - a.id : a.id - b.id).slice(0, k === 'entregue' ? 6 : 99); return `<div class="col"><h3><span>${ST[k]}</span><span>${live.filter(o => o.st === k).length}</span></h3>${l.length ? l.map(orderCard).join('') : '<p class="empty-col">Nenhum pedido.</p>'}</div>`; }).join('')}</div>`;
}

function vCardapio() {
  $('#v-cardapio').innerHTML = `<div class="vh"><div><h2>Cardápio e ficha técnica</h2><p>O custo vem dos insumos em estoque (custo médio). Clique num prato para ver a ficha.</p></div></div>
  <div class="card panel"><div class="tw"><table id="t-card"><thead><tr><th>Prato</th><th>Categoria</th><th class="r">Preço</th><th class="r">Custo</th><th class="r">CMV</th><th class="r">Margem</th></tr></thead><tbody>${C.DISHES.map(d => { const c = C.cost(st, d), cmv = c / d.p; return `<tr class="click" data-d="${d.id}" tabindex="0"><td>${d.n}</td><td>${d.cat}</td><td class="r num">${R(d.p)}</td><td class="r num">${R(c)}</td><td class="r num">${tag(cmv > .38 ? 'bad' : cmv > .3 ? 'warn' : 'ok', pct(cmv, 0))}</td><td class="r num">${R(d.p - c)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function toggleFicha(id) {
  const tr = document.querySelector(`#t-card tr[data-d="${id}"]`), nx = tr.nextElementSibling;
  if (nx && nx.classList.contains('ficha')) { nx.remove(); return; }
  const d = C.dishOf(id), row = document.createElement('tr'); row.className = 'ficha';
  row.innerHTML = `<td colspan="6"><b>Ficha técnica:</b> ${d.f.map(([i, q]) => { const x = C.ingOf(st, i); return `${dec(q, 2)} ${x.u} de ${x.n} (${R(q * x.c)})`; }).join(' · ')}</td>`;
  tr.after(row);
}

function vEstoque() {
  const q = ing.q.toLowerCase(), list = st.ing.filter(i => (ing.f === 'todos' || (ing.f === 'alerta' ? C.status(i) !== 'ok' : true)) && i.n.toLowerCase().includes(q));
  const val = st.ing.reduce((a, i) => a + i.q * i.c, 0);
  $('#v-estoque').innerHTML = `<div class="vh"><div><h2>Estoque</h2><p>${st.ing.length} insumos · ${R0(val)} em estoque · ${st.ing.filter(i => C.status(i) !== 'ok').length} em alerta</p></div>
    <div class="sp"><input class="search" id="e-q" type="search" placeholder="Buscar insumo…" aria-label="Buscar insumo" value="${esc(ing.q)}" style="margin-left:0"><div class="chips2"><button class="fchip" data-f="todos" aria-pressed="${ing.f === 'todos'}">Todos</button><button class="fchip" data-f="alerta" aria-pressed="${ing.f === 'alerta'}">Só em alerta</button></div></div></div>
  <div class="card panel"><div class="tw"><table><thead><tr><th>Insumo</th><th class="r">Em estoque</th><th class="r">Mínimo</th><th>Situação</th><th class="r">Custo médio</th><th class="r">Valor</th><th>Fornecedor</th><th></th></tr></thead><tbody>${list.length ? list.map(i => `<tr><td>${i.n}</td><td class="r num">${dec(i.q, i.u === 'un' ? 0 : 2)} ${i.u}</td><td class="r num">${i.min} ${i.u}</td><td>${stTag(i)}</td><td class="r num">${R(i.c)}</td><td class="r num">${R(i.q * i.c)}</td><td>${supName(i.s)}</td><td><button class="btn-s btn-sm" data-adj="${i.id}">Ajustar</button></td></tr>`).join('') : '<tr><td colspan="8">Nenhum insumo encontrado.</td></tr>'}</tbody></table></div></div>`;
  const el = $('#e-q'); if (ing.q) { el.focus(); el.setSelectionRange(ing.q.length, ing.q.length); }
}

function vCompras() {
  const sug = C.suggestions(st), pos = st.pos.slice().sort((a, b) => b.id - a.id);
  $('#v-compras').innerHTML = `<div class="vh"><div><h2>Compras</h2><p>Sugestão: repor até 2,5× o mínimo, em múltiplos do passo de compra de cada insumo.</p></div></div>
  <div class="split"><div class="card pad"><h3>Sugestões por fornecedor</h3><div class="rowlist">${sug.length ? sug.map(x => `<div class="rl"><div class="a"><b>${supName(x.s)}</b><span>${x.linhas.map(([i, q]) => `${q} ${C.ingOf(st, i).u} de ${C.ingOf(st, i).n}`).join(' · ')}</span></div><div class="num"><b>${R(x.tot)}</b></div><button class="btn-p btn-sm" data-po="${x.s}">Gerar pedido</button></div>`).join('') : '<p class="sub">Nada abaixo do mínimo (ou já pedido).</p>'}</div></div>
  <div class="card pad"><h3>Pedidos de compra</h3><div class="rowlist">${pos.map(p => `<div class="rl"><div class="a"><b>#${p.id} · ${supName(p.s)}</b><span>${dBR(p.data)} · ${p.linhas.map(([i, q]) => `${q} ${C.ingOf(st, i).u} ${C.ingOf(st, i).n}`).join(', ')}</span></div><div class="num"><b>${R(p.tot)}</b></div>${p.st === 'aberto' ? `<button class="btn-p btn-sm" data-rec="${p.id}">Receber</button>` : tag('ok', 'Recebido')}</div>`).join('')}</div></div></div>`;
}

function vFin() {
  const open = st.bills.filter(b => !b.pago), p14 = C.projection(st, 14), end = p14[13].dia;
  const pag = open.filter(b => b.tipo === 'pagar' && b.venc <= end).reduce((a, b) => a + b.v, 0), rec = open.filter(b => b.tipo === 'receber' && b.venc <= end).reduce((a, b) => a + b.v, 0);
  const m = st.mes, res = m.receita - m.cmv - m.despesas;
  const list = st.bills.filter(b => b.tipo === finTab).sort((a, b) => (a.pago - b.pago) || a.venc.localeCompare(b.venc));
  $('#v-fin').innerHTML = `<div class="vh"><div><h2>Financeiro</h2><p>Caixa, contas e resultado do mês.</p></div></div>
  <div class="kpis k4">${kpi('Caixa hoje', R0(st.caixa), 'dinheiro, Pix e cartão liquidado')}${kpi('A pagar em 14 dias', R0(pag), `${open.filter(b => b.tipo === 'pagar' && b.venc < st.today).length} vencida(s)`)}${kpi('A receber em 14 dias', R0(rec), 'repasses e cartões')}${kpi('Resultado do mês', `<span class="${res < 0 ? 'neg' : 'pos'}">${R0(res)}</span>`, pct(res / (m.receita || 1)) + ' da receita')}</div>
  <div class="grid"><div class="card panel c8"><h2>Fluxo de caixa dos próximos 14 dias</h2><p class="sub">Entradas, saídas e saldo projetado. Contas atrasadas entram no primeiro dia.</p><div class="lc"><canvas id="f-fx" role="img" aria-label="Entradas, saídas e saldo projetado"></canvas></div></div>
  <div class="card panel c4"><h2>DRE simplificado do mês</h2><p class="sub">Soma a base de exemplo com o que você fizer na tela</p><table class="dre"><tbody><tr><td>Receita bruta</td><td>${R0(m.receita)}</td></tr><tr><td>(−) CMV</td><td>${R0(m.cmv)}</td></tr><tr><td>Lucro bruto</td><td>${R0(m.receita - m.cmv)}</td></tr><tr><td>(−) Despesas pagas</td><td>${R0(m.despesas)}</td></tr><tr class="t"><td>Resultado</td><td class="${res < 0 ? 'neg' : 'pos'}">${R0(res)}</td></tr></tbody></table></div>
  <div class="card panel c12"><div class="tbar"><div class="tabs" role="tablist"><button role="tab" data-ft="pagar" aria-selected="${finTab === 'pagar'}">A pagar</button><button role="tab" data-ft="receber" aria-selected="${finTab === 'receber'}">A receber</button></div></div>
  <div class="tw"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th class="r">Valor</th><th>Situação</th><th></th></tr></thead><tbody>${list.map(b => { const v = venc(b); return `<tr><td>${esc(b.desc)}</td><td>${b.cat}</td><td class="num">${dBR(b.venc)}</td><td class="r num">${R(b.v)}</td><td>${v === 'pago' ? tag('ok', finTab === 'pagar' ? 'Pago' : 'Recebido') : v === 'atrasada' ? tag('bad', 'Atrasada') : v === 'hoje' ? tag('warn', 'Vence hoje') : tag('info', 'Em aberto')}</td><td>${b.pago ? '' : `<button class="btn-s btn-sm" data-settle="${b.id}">${finTab === 'pagar' ? 'Pagar' : 'Receber'}</button>`}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  mk('f-fx', { data: { labels: p14.map(p => dBR(p.dia)), datasets: [
    { type: 'bar', label: 'Entradas', data: p14.map(p => p.ent), backgroundColor: '#2e9d6a', borderRadius: 4, yAxisID: 'y', stack: 'a' },
    { type: 'bar', label: 'Saídas', data: p14.map(p => -p.sai), backgroundColor: '#c24a6c', borderRadius: 4, yAxisID: 'y', stack: 'a' },
    { type: 'line', label: 'Saldo', data: p14.map(p => p.saldo), borderColor: css('--primary'), backgroundColor: css('--primary'), pointRadius: 3, borderWidth: 2.5, tension: .3, yAxisID: 'y1' }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + R0(Math.abs(x.parsed.y)) } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), ticks: { callback: x => R0(x).replace('R$ ', '') } }, y1: { position: 'right', grid: { display: false }, ticks: { callback: x => R0(x).replace('R$ ', '') } } } } });
}

function badges() {
  const s = stats(), late = s.late.length;
  $('#n-ped').textContent = s.open.length || ''; $('#n-est').textContent = s.crit.length || '';
  $('#n-com').textContent = st.pos.filter(p => p.st === 'aberto').length || ''; $('#n-fin').textContent = late || '';
}
const VIEWS = { geral: vGeral, pedidos: vPedidos, cardapio: vCardapio, estoque: vEstoque, compras: vCompras, fin: vFin };
function show(v) {
  view = v;
  document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v));
  document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== 'v-' + v);
  VIEWS[v](); badges(); save();
}

/* ===== diálogo ===== */
const dlg = $('#dlg'); let dlgOk = null;
function ask(title, body, okLabel, onOk) {
  $('#dlg-t').textContent = title; $('#dlg-b').innerHTML = body; $('#dlg-ok').textContent = okLabel; dlgOk = onOk;
  if (!dlg.open) dlg.showModal();
}
$('#dlg-x').onclick = () => dlg.close();
$('#dlg-f').onsubmit = e => { e.preventDefault(); if (dlgOk && dlgOk() !== false) dlg.close(); };

function novoPedido() {
  const qty = {};
  const body = `<div class="fl"><label>Canal<select id="np-c">${C.CANAIS.map(c => `<option>${c}</option>`).join('')}</select></label><label>Mesa ou referência<input id="np-m" maxlength="20" placeholder="Ex.: 7"></label></div>
  <div style="margin-top:8px;max-height:260px;overflow:auto">${C.DISHES.map(d => `<div class="dish"><div>${d.n}<span>${R(d.p)}</span></div><div class="step"><button type="button" data-m="${d.id}" aria-label="Menos ${d.n}">−</button><output id="q-${d.id}">0</output><button type="button" data-p="${d.id}" aria-label="Mais ${d.n}">+</button></div></div>`).join('')}</div>
  <div id="np-w"></div><p class="num" style="margin:10px 0 0;font-weight:700" id="np-t">Total R$ 0,00</p>`;
  ask('Novo pedido', body, 'Lançar pedido', () => {
    const r = C.newOrder(st, $('#np-c').value, $('#np-m').value.trim(), Object.entries(qty));
    if (!r.ok) { toast(r.erro, true); return false; }
    toast(`Pedido ${r.order.id} lançado.` + (r.faltas.length ? ' Atenção: falta estoque para preparar.' : ''), !!r.faltas.length); show('pedidos');
  });
  const upd = () => {
    const o = { itens: Object.entries(qty).filter(([, q]) => q > 0) };
    $('#np-t').textContent = 'Total ' + R(C.orderTotal(o));
    const f = o.itens.length ? C.missing(st, o) : [];
    $('#np-w').innerHTML = f.length ? `<div class="warnbox">Estoque insuficiente: ${f.map(x => x.n).join(', ')}. O pedido pode ser lançado, mas o preparo fica travado até repor.</div>` : '';
  };
  $('#dlg-b').onclick = e => { const b = e.target.closest('button[data-m],button[data-p]'); if (!b) return; const id = b.dataset.m || b.dataset.p; qty[id] = Math.max(0, (qty[id] || 0) + (b.dataset.p ? 1 : -1)); $('#q-' + id).textContent = qty[id]; upd(); };
}
function ajustar(id) {
  const i = C.ingOf(st, id);
  ask('Ajustar ' + i.n, `<div class="fl"><label>Movimento<select id="aj-t"><option value="-1">Perda ou consumo interno (sai do estoque)</option><option value="1">Entrada manual (contagem a mais)</option></select></label><label>Quantidade (${i.u})<input id="aj-q" type="number" min="0.01" step="0.01" required value="1"></label></div><p class="sub" style="margin:10px 0 0">Hoje: ${dec(i.q, i.u === 'un' ? 0 : 2)} ${i.u}.</p>`, 'Aplicar', () => {
    const q = parseFloat($('#aj-q').value); if (!(q > 0)) { toast('Informe uma quantidade maior que zero.', true); return false; }
    C.adjust(st, id, q * +$('#aj-t').value); toast(`${i.n}: agora ${dec(i.q, i.u === 'un' ? 0 : 2)} ${i.u}.`); show('estoque');
  });
}

/* ===== eventos ===== */
document.addEventListener('click', e => {
  const t = e.target.closest('button,tr.click,[data-go]'); if (!t) return;
  const d = t.dataset;
  if (d.go) return show(d.go);
  if (d.adv) { const r = C.advance(st, +d.adv); toast(r.ok ? 'Pedido ' + d.adv + ' atualizado.' : r.erro, !r.ok); return show('pedidos'); }
  if (d.cancel) { const r = C.cancel(st, +d.cancel); toast(r.ok ? (r.perda ? `Pedido cancelado. Perda de ${R(r.perda)} lançada no CMV.` : 'Pedido cancelado.') : r.erro, !r.ok); return show('pedidos'); }
  if (t.id === 'novo-ped') return novoPedido();
  if (d.d) return toggleFicha(d.d);
  if (d.f) { ing.f = d.f; return show('estoque'); }
  if (d.adj) return ajustar(d.adj);
  if (d.po) { const x = C.suggestions(st).find(s => s.s === d.po); const r = C.createPO(st, d.po, x.linhas); toast(r.ok ? `Pedido de compra ${r.po.id} criado (${R(r.po.tot)}).` : r.erro, !r.ok); return show('compras'); }
  if (d.rec) { const r = C.receivePO(st, +d.rec); toast(r.ok ? `Recebido. Conta a pagar de ${R(r.bill.v)} vence em ${dBR(r.bill.venc)}.` : r.erro, !r.ok); return show('compras'); }
  if (d.settle) { const r = C.settle(st, d.settle); toast(r.ok ? 'Lançamento baixado e caixa atualizado.' : r.erro, !r.ok); return show('fin'); }
  if (d.ft) { finTab = d.ft; return show('fin'); }
  if (d.v && t.closest('#nav')) return show(d.v);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('tr.click')) toggleFicha(e.target.dataset.d); });
document.addEventListener('input', e => { if (e.target.id === 'e-q') { ing.q = e.target.value; vEstoque(); } });
$('#reset').onclick = () => { st = C.seed(today()); ing = { q: '', f: 'todos' }; toast('Dados de exemplo restaurados.'); show('geral'); };
function theme(t) { document.documentElement.dataset.theme = t; $('#theme-t').textContent = t === 'dark' ? 'Claro' : 'Escuro'; try { localStorage.setItem('fornalha-tema', t); } catch (e) { /* sem storage */ } if (st) show(view); }
$('#theme').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
let t0 = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; try { t0 = localStorage.getItem('fornalha-tema') || t0; } catch (e) { /* sem storage */ }
st = load(); theme(t0);
})();
