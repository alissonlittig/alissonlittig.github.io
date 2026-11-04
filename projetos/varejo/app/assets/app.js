(() => {
'use strict';
const $ = s => document.querySelector(s);

/* ========== dados sintéticos (semente fixa) ========== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261103);
const NM = 24;                                   // nov/24 .. out/26
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);

const REGIONS = ['Sul','Sudeste','Centro-Oeste','Nordeste','Norte','Online'];
const UNITS = [
  ['Curitiba · Batel',0,1.3],['Porto Alegre · Moinhos',0,1.1],['Florianópolis · Centro',0,.9],
  ['São Paulo · Paulista',1,1.9],['Rio de Janeiro · Barra',1,1.5],['Belo Horizonte · Savassi',1,1.2],['Campinas · Cambuí',1,1.0],
  ['Brasília · Asa Sul',2,1.2],['Goiânia · Setor Bueno',2,.8],
  ['Salvador · Barra',3,1.0],['Recife · Boa Viagem',3,.95],['Fortaleza · Aldeota',3,.85],
  ['Manaus · Centro',4,.7],['Loja online',5,1]
].map(([n,r,s],i)=>({i,n,r,s,on:r===5,b:Array.from({length:6},()=>.86+R()*.28),tf:.93+R()*.14,cv:.86+R()*.28}));
const CH = ['Loja física','Site','App','Marketplace'];
const CATS = ['Moda','Casa','Eletrônicos','Beleza','Esporte','Papelaria'];
const CSHARE = [.28,.18,.22,.14,.10,.08];
const TICK = [168,214,486,96,142,58], IPO = [2.1,2.4,1.5,2.2,1.9,3.1];
const RR = [.11,.05,.04,.03,.06,.02], MG = [.52,.46,.28,.58,.40,.44];
const CHT = [1,1.08,.92,.85], CHR = [.6,1.4,1.2,1.5], CHC = [.24,.026,.043,.018];
const GSEAS = [.88,.82,.9,.95,1.12,.98,.97,1.03,.96,1.05,1.38,1.6];
const CSEAS = [{4:1.15,11:1.1},{9:1.1,10:1.1},{10:1.2,11:1.1},{4:1.25,11:1.2,9:1.1},{0:1.3,8:1.1},{0:1.9,1:1.9,11:.8}];
const REASONS = ['Tamanho ou ajuste','Defeito de fabricação','Arrependimento','Diferente do anunciado','Atraso na entrega'];
const RW = [[.42,.12,.22,.16,.08],[.04,.24,.2,.3,.22],[.02,.5,.18,.2,.1],[.02,.18,.3,.3,.2],[.3,.2,.2,.2,.1],[.02,.16,.2,.4,.22]];

const rows = [];
for (let m = 0; m < NM; m++) for (const u of UNITS) for (const c of (u.on ? [1,2,3] : [0])) for (let k = 0; k < 6; k++) {
  const cm = cal(m);
  const growth = u.on ? Math.pow(1.021, m) * [0,.5,.3,.2][c] * (c === 2 ? Math.pow(1.012, m) : 1) : Math.pow(1.0035, m);
  const seas = GSEAS[cm] * (u.on && cm === 10 ? 1.3 : 1) * (CSEAS[k][cm] || 1);
  const rev = (u.on ? 3.9e6 : .95e6 * u.s) * growth * seas * CSHARE[k] * (u.on && k === 2 ? 1.3 : 1) * u.b[k] * (.93 + R() * .14);
  const tk = TICK[k] * CHT[c] * u.tf * Math.pow(1.004, m) * (.97 + R() * .06);
  const ord = rev / tk;
  const conv = CHC[c] * u.cv * (u.on && cm === 10 ? 1.25 : 1) * (.94 + R() * .12);
  rows.push({m, u: u.i, rg: u.r, c, k,
    rev: Math.round(rev), ord: Math.round(ord), units: Math.round(ord * IPO[k]), vis: Math.round(ord / conv),
    ret: Math.round(rev * RR[k] * CHR[c] * (cm === 0 ? 1.3 : 1) * (.85 + R() * .3)),
    cost: Math.round(rev * (1 - (MG[k] - (cm === 10 ? .06 : 0) + (R() - .5) * .02)))});
}

/* SKUs: 8 por categoria, pesos tipo Zipf dentro da categoria */
const SKU_N = [
  ['MOD',['Camiseta básica algodão',59.9,'Calça jeans reta',189.9,'Vestido midi linho',229.9,'Jaqueta corta-vento',249.9,'Tênis casual urbano',299.9,'Bolsa tote',179.9,'Meia esportiva kit 6',49.9,'Cinto de couro',89.9]],
  ['CAS',['Jogo de cama queen',269.9,'Conjunto de panelas',399.9,'Toalha de banho felpuda',69.9,'Luminária de mesa LED',119.9,'Organizador modular',79.9,'Edredom dupla face',329.9,'Cortina blackout',159.9,'Jarra de vidro 1,5L',44.9]],
  ['ELE',['Fone Bluetooth sem fio',229.9,'Smartwatch fitness',499.9,'Liquidificador 900W',189.9,'Fritadeira elétrica 4L',349.9,'Caixa de som portátil',279.9,'Carregador rápido 30W',99.9,'Ventilador de coluna',259.9,'Mini processador',139.9]],
  ['BEL',['Hidratante corporal 400ml',39.9,'Sérum facial vitamina C',89.9,'Perfume floral 100ml',189.9,'Shampoo reparador 350ml',44.9,'Protetor solar FPS 60',59.9,'Paleta de sombras',79.9,'Kit de barbear',69.9,'Condicionador 350ml',44.9]],
  ['ESP',['Garrafa térmica 750ml',89.9,'Tapete de yoga',99.9,'Halteres emborrachados par',149.9,'Corda de pular',29.9,'Mochila de trilha 30L',219.9,'Bola de futsal',119.9,'Camiseta dry-fit',79.9,'Luvas de treino',54.9]],
  ['PAP',['Caderno universitário',29.9,'Kit canetas gel',24.9,'Agenda 2027',49.9,'Mochila escolar',159.9,'Marca-texto pastel kit',22.9,'Calculadora científica',79.9,'Papel sulfite A4 resma',32.9,'Pasta organizadora',19.9]]
];
const SKUS = [];
SKU_N.forEach(([p, arr], k) => {
  const w = Array.from({length: 8}, (_, j) => (1 / Math.pow(j + 1, .9)) * (.8 + R() * .4)); const sw = w.reduce((a, b) => a + b, 0);
  w.sort(() => R() - .5);
  for (let j = 0; j < 8; j++) SKUS.push({code: p + '-' + String(j + 1).padStart(2, '0'), name: arr[2 * j], price: arr[2 * j + 1], k, w: w[j] / sw});
});

/* ========== agregação ========== */
const z0 = () => ({rev:0,ord:0,units:0,vis:0,ret:0,cost:0});
const add = (a, r) => { a.rev += r.rev; a.ord += r.ord; a.units += r.units; a.vis += r.vis; a.ret += r.ret; a.cost += r.cost; return a; };
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, rg:-1, u:-1, c:-1, k:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='rg'||F.rg<0||r.rg===F.rg) && (skip==='u'||F.u<0||r.u===F.u) && (skip==='c'||F.c<0||r.c===F.c) && (skip==='k'||F.k<0||r.k===F.k);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) add(a[key(r)], r); return a; }

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const safe = (a, b) => b ? a / b : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], ch:['#1d3f8f','#3f6fe0','#2fb3c6','#f2a93b'], st:['#c2362b','#e69f00','#12805c','#7a8aa6'], seq:['#2b4fd6','#7b97f0','#c3d0fb'], warm:'#d4553f'},
              dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], ch:['#6d8dff','#4fc3dd','#8be0a8','#ffc15e'], st:['#ff8f84','#ffc15e','#4cd6a0','#8a9ab6'], seq:['#7b97ff','#4a62b8','#2a3a6e'], warm:'#ff8f84'}};
function readTheme(){
  const dark = document.documentElement.dataset.theme === 'dark', cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  T = {dark, ...PAL[dark ? 'dark' : 'light'], text:g('--text'), muted:g('--muted'), grid:g('--border'), surface:g('--surface'), primary:g('--primary')};
  Chart.defaults.color = T.muted; Chart.defaults.borderColor = T.grid;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
  Object.assign(Chart.defaults.plugins.tooltip, {backgroundColor: dark ? '#0a1120' : '#0e1a2e', titleColor:'#fff', bodyColor:'#e5ebf7', padding:10, cornerRadius:8, boxPadding:4, borderColor:T.grid, borderWidth:dark?1:0});
  Chart.defaults.plugins.legend.labels.usePointStyle = true; Chart.defaults.plugins.legend.labels.boxWidth = 8;
}
const fade = (c, on) => on ? c : c + '4d';
const CHARTS = {};
function mk(id, cfg){ if (CHARTS[id]) CHARTS[id].destroy(); cfg.options = Object.assign({responsive:true, maintainAspectRatio:false, animation:{duration:350}}, cfg.options); return CHARTS[id] = new Chart($('#' + id), cfg); }
const gridY = {grid:{color:()=>T.grid}, border:{display:false}};
const valueLabels = {id:'vl', afterDatasetsDraw(ch, a, o){ if(!o.fmt) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
  ch.getDatasetMeta(0).data.forEach((b, i) => { c.fillText(o.fmt(ch.data.datasets[0].data[i], i), b.x + 6, b.y); }); c.restore(); }};

/* ========== filtros ========== */
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-reg').innerHTML = opt(-1, 'Todas as regiões') + REGIONS.map((r, i) => opt(i, r)).join('');
  $('#f-can').innerHTML = opt(-1, 'Todos os canais') + CH.map((r, i) => opt(i, r)).join('');
  $('#f-cat').innerHTML = opt(-1, 'Todas as categorias') + CATS.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-reg').value = F.rg; $('#f-can').value = F.c; $('#f-cat').value = F.k;
  $('#f-uni').innerHTML = '<option value="-1">Todas as unidades</option>' + UNITS.filter(u => F.rg < 0 || u.r === F.rg).map(u => `<option value="${u.i}">${esc(u.n)}</option>`).join('');
  $('#f-uni').value = F.u;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.rg >= 0) chips.push(['rg', REGIONS[F.rg]]);
  if (F.u >= 0) chips.push(['u', UNITS[F.u].n]);
  if (F.c >= 0) chips.push(['c', CH[F.c]]);
  if (F.k >= 0) chips.push(['k', CATS[F.k]]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; if (key === 'u' && F.u >= 0) F.rg = UNITS[F.u].r; if (key === 'rg' && F.u >= 0 && UNITS[F.u].r !== F.rg) F.u = -1; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-reg').onchange = e => { F.rg = +e.target.value; if (F.u >= 0 && UNITS[F.u].r !== F.rg && F.rg >= 0) F.u = -1; render(); };
  $('#f-uni').onchange = e => { F.u = +e.target.value; if (F.u >= 0) F.rg = UNITS[F.u].r; render(); };
  $('#f-can').onchange = e => { F.c = +e.target.value; render(); };
  $('#f-cat').onchange = e => { F.k = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.rg = F.u = F.c = F.k = -1; render(); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (k === 'per') setPreset('12'); else F[k] = -1; render(); };
}

/* ========== KPIs ========== */
const spark = (vals, up) => { const mx = Math.max(...vals), mn = Math.min(...vals), W = 100, H = 34, d = mx - mn || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 3 - (v - mn) / d * (H - 8)]);
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${H} ${line} ${W},${H}" fill="${T.primary}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${T.primary}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`; };
const ARROW = {up:'<svg viewBox="0 0 10 10"><path d="M5 1l4 6H1z"/></svg>', down:'<svg viewBox="0 0 10 10"><path d="M5 9L1 3h8z"/></svg>'};
function delta(cur, prev, kind, goodUp){
  if (prev == null || !isFinite(prev) || prev === 0) return '<span class="pill flat">—</span>';
  const d = kind === 'pp' ? (cur - prev) * 100 : (cur / prev - 1) * 100, flat = Math.abs(d) < .05;
  const cls = flat ? 'flat' : ((d > 0) === goodUp ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${(d > 0 ? '+' : '') + N1.format(d)}${kind === 'pp' ? ' p.p.' : '%'}</span>`;
}
let STOCK = [];
function kpis(M){
  const cur = sumR(M, F.from, F.to), len = F.to - F.from + 1, pf = F.from - len, prev = pf >= 0 ? sumR(M, pf, F.from - 1) : null;
  const w0 = Math.max(0, F.to - 11), W = M.slice(w0, F.to + 1);
  const defs = [
    ['Faturamento', x => x.rev, brlC, 'rel', true, a => a.rev],
    ['Pedidos', x => x.ord, v => N0.format(v), 'rel', true, a => a.ord],
    ['Ticket médio', x => safe(x.rev, x.ord), brl, 'rel', true, a => safe(a.rev, a.ord)],
    ['Conversão', x => safe(x.ord, x.vis), v => pct(v, 1), 'pp', true, a => safe(a.ord, a.vis)],
    ['Devoluções', x => safe(x.ret, x.rev), v => pct(v, 1), 'pp', false, a => safe(a.ret, a.rev)]
  ];
  let h = defs.map(([l, f, fm, kind, good, sp]) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${cur.rev ? fm(f(cur)) : '—'}</div><div class="d">${cur.rev && prev ? delta(f(cur), f(prev), kind, good) : '<span class="pill flat">—</span>'}<span>vs. período anterior</span></div>${spark(W.map(sp))}</article>`).join('');
  const sk = STOCK.filter(s => F.k < 0 || s.k === F.k), rup = sk.filter(s => s.st === 0).length;
  h += `<article class="card kpi"><div class="l">Ruptura de estoque</div><div class="v num">${pct(rup / sk.length, 1)}</div><div class="d"><span class="pill ${rup ? 'down' : 'up'}">${rup} de ${sk.length} SKUs</span><span>posição em 31/10</span></div><svg class="spark" viewBox="0 0 100 34" aria-hidden="true"><rect x="0" y="14" width="100" height="8" rx="4" fill="${T.grid}"/><rect x="0" y="14" width="${(rup / sk.length * 100).toFixed(1)}" height="8" rx="4" fill="${T.st[0]}"/></svg></article>`;
  $('#kpis').innerHTML = h;
  $('#empty').style.display = cur.rev ? 'none' : 'block';
  return cur;
}

/* ========== estoque (posição fixa, rede toda) ========== */
function buildStock(){
  const saved = {...F}; // últimos 2 meses, rede toda (sem filtros)
  Object.assign(F, {rg:-1,u:-1,c:-1,k:-1}); const g = group(r => r.k, null, 22, 23, 6); Object.assign(F, saved);
  SKUS.forEach(s => {
    const daily = g[s.k].rev * s.w / s.price / 61, x = R();
    const cov = x < .07 ? 0 : x < .12 ? .5 + R() * 2.4 : x < .26 ? 3 + R() * 6.9 : x < .36 ? 62 + R() * 58 : 12 + R() * 43;
    s.daily = daily; s.stock = Math.round(daily * cov); s.cov = s.stock ? s.stock / daily : 0;
    s.st = s.cov < 3 ? 0 : s.cov < 10 ? 1 : s.cov <= 60 ? 2 : 3;
  });
  STOCK = SKUS;
}
const ST = ['Ruptura','Baixo','Saudável','Excesso'], STC = ['t-bad','t-warn','t-ok','t-info'];

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab);
  const tickC = {callback: v => brlC(v)};

  mk('ch-mes', {data:{labels:labs, datasets:[
    {type:'bar', label:'Faturamento', data:ms.map(m => M[m].rev), backgroundColor:ms.map(m => fade(T.primary, inR(m))), borderRadius:5, order:2},
    {type:'line', label:'Ano anterior', data:ms.map(m => m >= 12 ? M[m - 12].rev : null), borderColor:T.cat[1], borderDash:[5,4], borderWidth:2, pointRadius:2.5, pointBackgroundColor:T.cat[1], tension:.3, order:1}]},
    options:{interaction:{mode:'index',intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:tickC, beginAtZero:true}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); }}});

  const kk = group(r => r.k, 'k', F.from, F.to, 6), tk = kk.reduce((a, x) => a + x.rev, 0);
  mk('ch-cat', {type:'doughnut', data:{labels:CATS, datasets:[{data:kk.map(x => x.rev), backgroundColor:CATS.map((_, i) => fade(T.cat[i], F.k < 0 || F.k === i)), borderColor:T.surface, borderWidth:2, hoverOffset:6}]},
    options:{cutout:'62%', plugins:{legend:{position:'bottom', labels:{padding:12}}, tooltip:{callbacks:{label:c => ` ${brl(c.parsed)} · ${pct(safe(c.parsed, tk))}`}}}, onClick:(e, el) => { if (el.length) toggle('k', el[0].index); }}});

  const byC = CH.map(() => ms.map(() => 0)); const p = pred('c');
  for (const r of rows) if (r.m >= w0 && r.m <= F.to && p(r)) byC[r.c][r.m - w0] += r.rev;
  mk('ch-can', {type:'bar', data:{labels:labs, datasets:CH.map((n, i) => ({label:n, data:byC[i], backgroundColor:fade(T.ch[i], F.c < 0 || F.c === i), borderRadius:2, stack:'s'}))},
    options:{interaction:{mode:'nearest',intersect:true}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:tickC}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('c', it.datasetIndex)}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (el.length) toggle('c', el[0].datasetIndex); }}});

  const rg = group(r => r.rg, 'rg', F.from, F.to, 6).map((x, i) => ({i, v:x.rev})).sort((a, b) => b.v - a.v);
  mk('ch-reg', {type:'bar', data:{labels:rg.map(x => REGIONS[x.i]), datasets:[{data:rg.map(x => x.v), backgroundColor:rg.map(x => fade(T.primary, F.rg < 0 || F.rg === x.i)), borderRadius:5, barThickness:26}]},
    options:{indexAxis:'y', layout:{padding:{right:70}}, scales:{x:{...gridY, ticks:{...tickC, maxRotation:0, maxTicksLimit:5}, beginAtZero:true}, y:{grid:{display:false}}}, plugins:{legend:{display:false}, vl:{fmt:v => brlC(v)}, tooltip:{callbacks:{label:c => ` ${brl(c.parsed.x)}`}}}, onClick:(e, el) => { if (el.length) toggle('rg', rg[el[0].index].i); }}, plugins:[valueLabels]});

  // devoluções por motivo
  const dv = REASONS.map(() => 0);
  for (const r of rows) if (r.m >= F.from && r.m <= F.to && pred()(r)) { const w = RW[r.k].slice(); if (r.c === 0) w[4] = 0; const s = w.reduce((a, b) => a + b, 0); w.forEach((x, j) => dv[j] += r.ret * x / s); }
  const dvo = dv.map((v, i) => ({i, v})).sort((a, b) => b.v - a.v), dt = dv.reduce((a, b) => a + b, 0);
  mk('ch-dev', {type:'bar', data:{labels:dvo.map(x => REASONS[x.i]), datasets:[{data:dvo.map(x => x.v), backgroundColor:T.warm, borderRadius:5, barThickness:20}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}, ticks:{callback(v){ const l = this.getLabelForValue(v); return l.length > 18 ? l.split(' ').reduce((a, w) => (a.length && (a[a.length - 1] + ' ' + w).length < 16) ? (a[a.length - 1] += ' ' + w, a) : (a.push(w), a), []) : l; }}}},
      plugins:{legend:{display:false}, vl:{fmt:v => pct(safe(v, dt), 0)}, tooltip:{callbacks:{label:c => ` ${brl(c.parsed.x)} · ${pct(safe(c.parsed.x, dt))}`}}}}, plugins:[valueLabels]});

  // bolhas por unidade
  const un = group(r => r.u, 'u', F.from, F.to, UNITS.length);
  const mxR = Math.max(1, ...un.map(x => x.rev));
  mk('ch-bol', {type:'bubble', data:{datasets:REGIONS.map((n, ri) => ({label:n, backgroundColor:T.cat[ri] + 'cc', borderColor:T.cat[ri], borderWidth:1.5,
      data:UNITS.filter(u => u.r === ri && un[u.i].rev).map(u => ({x:safe(un[u.i].ord, un[u.i].vis) * 100, y:safe(un[u.i].rev, un[u.i].ord), r:5 + Math.sqrt(un[u.i].rev / mxR) * 19, u:u.i, rev:un[u.i].rev}))}))},
    options:{scales:{x:{title:{display:true, text:'Conversão (%)'}, grid:{color:() => T.grid}, border:{display:false}, ticks:{callback:v => v + '%'}, beginAtZero:true, grace:'8%'}, y:{title:{display:true, text:'Ticket médio (R$)'}, ...gridY, grace:'10%', ticks:{callback:v => 'R$ ' + v}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{title:c => UNITS[c[0].raw.u].n, label:c => [` Faturamento: ${brlC(c.raw.rev)}`, ` Ticket médio: ${brl(c.raw.y)}`, ` Conversão: ${N1.format(c.raw.x)}%`]}}},
      onClick:(e, el) => { if (el.length) { const d = CHARTS['ch-bol'].data.datasets[el[0].datasetIndex].data[el[0].index]; toggle('u', d.u); } }}});

  // estoque
  const stc = CATS.map(() => [0,0,0,0]); STOCK.forEach(s => stc[s.k][s.st]++);
  mk('ch-est', {type:'bar', data:{labels:CATS, datasets:ST.map((n, i) => ({label:n, data:stc.map(c => c[i]), backgroundColor:CATS.map((_, k) => fade(T.st[i], F.k < 0 || F.k === k)), borderRadius:3, stack:'s'}))},
    options:{indexAxis:'y', interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, ...gridY, ticks:{stepSize:2}, max:8}, y:{stacked:true, grid:{display:false}}}, plugins:{legend:{position:'bottom'}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${c.parsed.x} SKU${c.parsed.x === 1 ? '' : 's'}`}}},
      onClick:(e, el) => { if (el.length) toggle('k', el[0].index); }}});
}

/* ========== SKUs, ABC e tabelas ========== */
let SKU_ROWS = [];
function skuCalc(M){
  const kk = group(r => r.k, null, F.from, F.to, 6);
  const list = SKUS.filter(s => F.k < 0 || s.k === F.k).map(s => { const rev = kk[s.k].rev * s.w; return {code:s.code, name:s.name, cat:CATS[s.k], k:s.k, rev, units:Math.round(rev / s.price), stock:s.stock, cov:s.cov, st:s.st}; }).sort((a, b) => b.rev - a.rev);
  const tot = list.reduce((a, s) => a + s.rev, 0); let acc = 0;
  list.forEach(s => { s.acc = safe(acc + s.rev, tot); s.cls = acc / tot < .8 ? 'A' : acc / tot < .95 ? 'B' : 'C'; acc += s.rev; });
  SKU_ROWS = list;
  const cnt = {A:0, B:0, C:0}, shr = {A:0, B:0, C:0}; list.forEach(s => { cnt[s.cls]++; shr[s.cls] += s.rev; });
  const cc = [T.seq[0], T.seq[1], T.seq[2]];
  $('#abc').innerHTML = ['A','B','C'].map((c, i) => `<span style="--c:${cc[i]}"><b>Classe ${c}</b> ${cnt[c]} SKUs · ${pct(safe(shr[c], tot), 0)}</span>`).join('');
  mk('ch-abc', {data:{labels:list.map(s => s.code), datasets:[
    {type:'bar', label:'Faturamento', data:list.map(s => s.rev), backgroundColor:list.map(s => cc['ABC'.indexOf(s.cls)]), borderRadius:3, yAxisID:'y', order:2},
    {type:'line', label:'% acumulado', data:list.map(s => s.acc * 100), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2, pointRadius:0, pointHoverRadius:4, tension:.25, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}, ticks:{maxRotation:90, minRotation:90, autoSkip:true, font:{size:10}}}, y:{...gridY, ticks:tickC2}, y2:{position:'right', min:0, max:100, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{title:c => { const s = list[c[0].dataIndex]; return s.code + ' · ' + s.name; }, label:c => c.datasetIndex ? ` Acumulado: ${N1.format(c.parsed.y)}%` : ` Faturamento: ${brl(c.parsed.y)} (classe ${list[c.dataIndex].cls})`}}},
      onClick:(e, el) => { if (el.length) toggle('k', list[el[0].index].k); }}});
}
const tickC2 = {callback: v => brlC(v)};

const TAB = {t:'p', q:'', sort:{p:['rev', -1], u:['rev', -1]}, page:0}, PS = 8;
const COLS = {
  p:[['code','Código',v=>v],['name','Produto',v=>v],['cat','Categoria',v=>v],['cls','Classe',v=>`<span class="tag ${{A:'t-info',B:'t-ok',C:'t-warn'}[v]}">${v}</span>`,'h'],['rev','Faturamento',v=>'R$ '+N0.format(v),'r'],['units','Unidades',v=>N0.format(v),'r'],['stock','Estoque (un)',v=>N0.format(v),'r'],['cov','Cobertura (dias)',v=>N0.format(v),'r'],['st','Situação',v=>`<span class="tag ${STC[v]}">${ST[v]}</span>`,'h']],
  u:[['name','Unidade',v=>v],['reg','Região',v=>v],['rev','Faturamento',v=>'R$ '+N0.format(v),'r'],['dl','Var. vs anterior',v=>v == null ? '—' : (v > 0 ? '+' : '') + N1.format(v * 100) + '%','r'],['ord','Pedidos',v=>N0.format(v),'r'],['tk','Ticket médio',brl,'r'],['cv','Conversão',v=>pct(v),'r'],['dv','Devolução',v=>pct(v),'r'],['mg','Margem bruta',v=>pct(v),'r']]
};
let UNIT_ROWS = [];
function unitCalc(M){
  const len = F.to - F.from + 1, pf = F.from - len, a = group(r => r.u, 'u', F.from, F.to, UNITS.length), b = pf >= 0 ? group(r => r.u, 'u', pf, F.from - 1, UNITS.length) : null;
  UNIT_ROWS = UNITS.filter(u => a[u.i].rev).map(u => { const x = a[u.i]; return {i:u.i, name:u.n, reg:REGIONS[u.r], rev:x.rev, dl:b && b[u.i].rev ? x.rev / b[u.i].rev - 1 : null, ord:x.ord, tk:safe(x.rev, x.ord), cv:safe(x.ord, x.vis), dv:safe(x.ret, x.rev), mg:safe(x.rev - x.cost, x.rev)}; });
}
function tableRows(){
  const cols = COLS[TAB.t], src = TAB.t === 'p' ? SKU_ROWS : UNIT_ROWS, q = TAB.q.trim().toLowerCase();
  const txt = r => cols.map(c => c[0] === 'st' ? ST[r.st] : r[c[0]]).join(' ').toLowerCase();
  let out = q ? src.filter(r => txt(r).includes(q)) : src.slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  return out;
}
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${c[3] === 'r' ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS);
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="${TAB.t === 'u' ? 'click' : ''} ${TAB.t === 'u' && r.i === F.u ? 'sel' : ''}" ${TAB.t === 'u' ? `data-u="${r.i}" title="Filtrar por esta unidade"` : ''}>` + cols.map(c => `<td class="${c[3] === 'r' ? 'r num' : ''}">${c[2](r[c[0]])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:24px">Nenhum resultado.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; $('#tab-p').setAttribute('aria-selected', t === 'p'); $('#tab-u').setAttribute('aria-selected', t === 'u'); table(); };
  $('#tab-p').onclick = () => tab('p'); $('#tab-u').onclick = () => tab('u');
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof (TAB.t === 'p' ? SKU_ROWS : UNIT_ROWS)[0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-u]'); if (tr) toggle('u', +tr.dataset.u); };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], fmt = (c, v) => c[0] === 'st' ? ST[v] : v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(c, r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `praca-nova_${TAB.t === 'p' ? 'produtos' : 'unidades'}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); charts(M); skuCalc(M); unitCalc(M); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('pn-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('pn-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable(); buildStock();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
