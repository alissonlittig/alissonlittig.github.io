(() => {
'use strict';
const $ = s => document.querySelector(s);

/* ========== dados sintéticos (semente fixa) ========== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261104);
const NM = 24;                                   // nov/24 .. out/26
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);

// unidades: nome, tamanho, ticket, CMV, tempo de entrega, viés de nota, peso por canal [salão, Pedeaí, app próprio]
const UNITS = [
  ['Batel',1.35,1.08,1.00,1.00,.05,[1,1,1.1]],
  ['Água Verde',1.1,1,1.02,.95,.05,[1,1.1,1]],
  ['Centro Cívico',.9,.96,1.0,1.05,0,[1.05,.9,.9]],
  ['Santa Felicidade',1.0,1.16,.98,1.1,.1,[1.35,.4,.5]],
  ['Portão',.85,.9,1.06,1.38,-.12,[.9,1.2,.8]],
  ['Ecoville',1.2,1.1,.97,.92,.08,[.9,1.1,1.5]]
].map(([n,s,tf,cm,dt,rq,uc],i)=>({i,n,s,tf,cm,dt,rq,uc,b:Array.from({length:6},()=>.9+R()*.2)}));
const CH = ['Salão','Pedeaí (marketplace)','App próprio'];
const CHS = ['Salão','Pedeaí','App próprio'];
const CATS = ['Pratos principais','Massas','Grelhados','Entradas','Sobremesas','Bebidas'];
const SHARE = [[.34,.14,.2,.08,.06,.18],[.38,.18,.22,.06,.05,.11],[.37,.18,.2,.07,.07,.11]];  // receita por categoria e canal
const PEN = [[.72,.3,.38,.42,.34,.92],[.78,.34,.42,.24,.2,.52],[.78,.34,.42,.26,.24,.58]];     // pedidos que levam a categoria
const CMVK = [.34,.29,.41,.27,.23,.21];
const TK = [112,68,79];                      // ticket médio por canal
const FEE = [.028,.23,.045];                 // taxa do canal (cartão, comissão do marketplace, gateway)
const PACK = [0,.035,.035];                  // embalagem no CMV do delivery
const DT = [0,47,38];                        // minutos de entrega
const RATE = [4.62,4.36,4.58];
const SEAS = [[.9,.82,.9,.95,1.06,.98,1.02,1.0,.97,1.0,1.04,1.3],[.95,.9,.95,1.0,1.05,1.12,1.1,1.05,1.0,1.0,1.03,1.12]];
const BASE = [4300,2250,560];                // pedidos/mês por unidade de porte 1
const GROW = [1.0015,1.011,1.04];

const dayW = [[.8,.85,.95,1.05,1.35,1.55,1.25],[.85,.85,.95,1.05,1.3,1.45,1.35],[.9,.9,1,1.05,1.3,1.35,1.3]];
const hourS = [.25,.85,1,.6,.2,.12,.15,.35,.7,.95,.8,.4,.1];                      // 11h..23h
const hourD = [.2,.6,.65,.35,.12,.1,.2,.5,.95,1,.85,.45,.15];
const HEAT = CH.map((_, c) => { const g = []; let s = 0;
  for (let d = 0; d < 7; d++) { g.push([]); for (let h = 0; h < 13; h++) { let v = dayW[c][d] * (c ? hourD[h] : hourS[h]); if (d >= 5 && h >= 1 && h <= 3) v *= c ? 1.05 : 1.3; if (d >= 4 && h >= 8 && h <= 10) v *= 1.1; g[d].push(v); s += v; } }
  return g.map(r => r.map(v => v / s)); });

function ratingCounts(mu, n){
  let lo = 0.01, hi = 6;
  const mean = l => { let a = 0, b = 0; for (let i = 1; i <= 5; i++) { const w = Math.exp(-l * (5 - i)); a += i * w; b += w; } return a / b; };
  for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (mean(mid) < mu) lo = mid; else hi = mid; }
  const w = [1,2,3,4,5].map(i => Math.exp(-lo * (5 - i))), s = w.reduce((a, b) => a + b, 0);
  return w.map(x => n * x / s);
}
const sigm = x => 1 / (1 + Math.exp(-x));

const rows = [];
for (let m = 0; m < NM; m++) for (const u of UNITS) for (let c = 0; c < 3; c++) {
  const cm = cal(m), seas = SEAS[c ? 1 : 0][cm];
  const ordT = BASE[c] * u.s * u.uc[c] * Math.pow(GROW[c], m) * seas * (.94 + R() * .12);
  const tk = TK[c] * u.tf * Math.pow(1.0035, m) * (.97 + R() * .06);
  const revT = ordT * tk;
  const t = c ? DT[c] * u.dt * (1 + (c === 1 ? .002 : -.0035) * m) * ([0,1,11].includes(cm) ? 1.06 : 1) * (.96 + R() * .08) : 0;
  const lateR = c ? sigm((t - 60) / 6) : 0;
  const mu = Math.min(4.9, Math.max(3.4, RATE[c] + u.rq - (c ? .011 * Math.max(0, t - 40) : 0) + (R() - .5) * .08));
  const rev = SHARE[c].map((s, k) => revT * s * u.b[k] * (.95 + R() * .1)), sum = rev.reduce((a, b) => a + b, 0);
  for (let k = 0; k < 6; k++) {
    const f = rev[k] / sum, rt = ratingCounts(mu, ordT * .16).map(x => x * f);
    const cmv = (CMVK[k] * u.cm * (k === 2 ? 1 + .0045 * m : 1 + .0008 * m) + PACK[c]) * (.97 + R() * .06) - (cm === 10 ? .01 : 0);
    rows.push({m, u: u.i, c, k, rev: Math.round(rev[k]), cost: Math.round(rev[k] * cmv), fee: Math.round(rev[k] * FEE[c]),
      ordT: ordT * f, ordK: ordT * PEN[c][k] * (.97 + R() * .06), dord: c ? ordT * f : 0, dsum: c ? ordT * f * t : 0, late: c ? ordT * f * lateR : 0, rt});
  }
}

/* pratos: 8 por categoria, pesos tipo Zipf, ficha técnica (CMV do prato) */
const SKU_N = [
  ['PRI',['Filé à parmegiana',54.9,'Frango grelhado com legumes',42.9,'Strogonoff de carne',46.9,'Moqueca de peixe',69.9,'Feijoada da casa',59.9,'Risoto de cogumelos',58.9,'Escalope ao molho madeira',57.9,'Bobó de camarão',74.9]],
  ['MAS',['Espaguete à carbonara',49.9,'Lasanha bolonhesa',47.9,'Nhoque ao sugo',39.9,'Fettuccine ao funghi',52.9,'Ravióli de queijo',51.9,'Penne ao pesto',44.9,'Canelone de ricota',46.9,'Talharim aos frutos do mar',68.9]],
  ['GRE',['Picanha na brasa',89.9,'Costela assada 12h',79.9,'Salmão grelhado',82.9,'Contrafilé na chapa',64.9,'Linguiça artesanal',38.9,'Frango na brasa',44.9,'Fraldinha com alho',69.9,'Espeto de coração',24.9]],
  ['ENT',['Bruschetta de tomate',26.9,'Bolinho de bacalhau',34.9,'Carpaccio',39.9,'Mandioca frita',24.9,'Provolone à milanesa',36.9,'Salada caprese',29.9,'Pastel de camarão',32.9,'Caldo verde',22.9]],
  ['SOB',['Petit gâteau',28.9,'Pudim de leite',16.9,'Tiramisù',24.9,'Brownie com sorvete',26.9,'Cheesecake de frutas',25.9,'Mousse de maracujá',17.9,'Torta de limão',19.9,'Sorvete artesanal',18.9]],
  ['BEB',['Refrigerante lata',7.5,'Suco natural 400 ml',11.9,'Água com gás',6.9,'Cerveja long neck',14.9,'Chope 300 ml',12.9,'Caipirinha',22.9,'Taça de vinho tinto',26.9,'Limonada suíça',14.9]]
];
const SKUS = [];
SKU_N.forEach(([p, arr], k) => {
  const w = Array.from({length: 8}, (_, j) => (1 / Math.pow(j + 1, .85)) * (.8 + R() * .4)); const sw = w.reduce((a, b) => a + b, 0);
  w.sort(() => R() - .5);
  for (let j = 0; j < 8; j++) SKUS.push({code: p + '-' + String(j + 1).padStart(2, '0'), name: arr[2 * j], price: arr[2 * j + 1], k, w: w[j] / sw, cmv: CMVK[k] * (.8 + R() * .4)});
});

/* ========== agregação ========== */
const z0 = () => ({rev:0,cost:0,fee:0,ordT:0,ordK:0,dord:0,dsum:0,late:0,rt:[0,0,0,0,0]});
const add = (a, r) => { a.rev += r.rev; a.cost += r.cost; a.fee += r.fee; a.ordT += r.ordT; a.ordK += r.ordK; a.dord += r.dord; a.dsum += r.dsum; a.late += r.late; for (let i = 0; i < 5; i++) a.rt[i] += r.rt[i]; return a; };
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, u:-1, c:-1, k:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='u'||F.u<0||r.u===F.u) && (skip==='c'||F.c<0||r.c===F.c) && (skip==='k'||F.k<0||r.k===F.k);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) add(a[key(r)], r); return a; }
const safe = (a, b) => b ? a / b : 0;
const ords = x => F.k < 0 ? x.ordT : x.ordK;
const tmin = x => safe(x.dsum, x.dord);
const nota = x => { const n = x.rt.reduce((a, b) => a + b, 0); return safe(x.rt.reduce((a, v, i) => a + v * (i + 1), 0), n); };

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], ch:['#1f5f8b','#d9531e','#2a9d6f'], fin:['#E69F00','#CC79A7','#009E73'], seq:['#b8431f','#e0906f','#f0c9b8']},
              dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], ch:['#6cb4e4','#ff8a57','#4fd8a0'], fin:['#F0B429','#E58FC2','#2FD0A0'], seq:['#ff9a73','#b0644a','#6b3b2a']}};
function readTheme(){
  const dark = document.documentElement.dataset.theme === 'dark', cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  T = {dark, ...PAL[dark ? 'dark' : 'light'], text:g('--text'), muted:g('--muted'), grid:g('--border'), surface:g('--surface'), primary:g('--primary')};
  Chart.defaults.color = T.muted; Chart.defaults.borderColor = T.grid;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
  Object.assign(Chart.defaults.plugins.tooltip, {backgroundColor: dark ? '#0d0806' : '#24150e', titleColor:'#fff', bodyColor:'#f1e6de', padding:10, cornerRadius:8, boxPadding:4, borderColor:T.grid, borderWidth:dark?1:0});
  Chart.defaults.plugins.legend.labels.usePointStyle = true; Chart.defaults.plugins.legend.labels.boxWidth = 8;
}
const fade = (c, on) => on ? c : c + '4d';
const CHARTS = {};
function mk(id, cfg){ if (CHARTS[id]) CHARTS[id].destroy(); cfg.options = Object.assign({responsive:true, maintainAspectRatio:false, animation:{duration:350}}, cfg.options); return CHARTS[id] = new Chart($('#' + id), cfg); }
const gridY = {grid:{color:()=>T.grid}, border:{display:false}};
const valueLabels = {id:'vl', afterDatasetsDraw(ch, a, o){ if(!o.fmt) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
  ch.getDatasetMeta(o.ds || 0).data.forEach((b, i) => { c.fillText(o.fmt(ch.data.datasets[o.ds || 0].data[i], i), Math.max(b.x, b.base || 0) + 6, b.y); }); c.restore(); }};
const tickC = {callback: v => brlC(v)};

/* ========== filtros ========== */
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-uni').innerHTML = opt(-1, 'Todas as unidades') + UNITS.map(u => opt(u.i, u.n)).join('');
  $('#f-can').innerHTML = opt(-1, 'Todos os canais') + CH.map((r, i) => opt(i, r)).join('');
  $('#f-cat').innerHTML = opt(-1, 'Todas as categorias') + CATS.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-uni').value = F.u; $('#f-can').value = F.c; $('#f-cat').value = F.k;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.u >= 0) chips.push(['u', UNITS[F.u].n]);
  if (F.c >= 0) chips.push(['c', CH[F.c]]);
  if (F.k >= 0) chips.push(['k', CATS[F.k]]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-uni').onchange = e => { F.u = +e.target.value; render(); };
  $('#f-can').onchange = e => { F.c = +e.target.value; render(); };
  $('#f-cat').onchange = e => { F.k = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.u = F.c = F.k = -1; render(); };
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
  const d = kind === 'pp' ? (cur - prev) * 100 : kind === 'abs' ? cur - prev : (cur / prev - 1) * 100, flat = Math.abs(d) < (kind === 'abs' ? .005 : .05);
  const cls = flat ? 'flat' : ((d > 0) === goodUp ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${(d > 0 ? '+' : '') + (kind === 'abs' ? N2.format(d) : N1.format(d))}${kind === 'pp' ? ' p.p.' : kind === 'abs' ? ' pt' : '%'}</span>`;
}
function kpis(M){
  const cur = sumR(M, F.from, F.to), len = F.to - F.from + 1, pf = F.from - len, prev = pf >= 0 ? sumR(M, pf, F.from - 1) : null;
  const w0 = Math.max(0, F.to - 11), W = M.slice(w0, F.to + 1);
  const defs = [
    ['Faturamento', x => x.rev, brlC, 'rel', true],
    ['Pedidos', x => ords(x), v => N0.format(v), 'rel', true],
    ['Ticket médio', x => safe(x.rev, ords(x)), brl, 'rel', true],
    ['CMV', x => safe(x.cost, x.rev), v => pct(v, 1), 'pp', false],
    ['Tempo de entrega', x => tmin(x), v => N0.format(v) + ' min', 'rel', false],
    ['Nota média', x => nota(x), v => N2.format(v) + ' / 5', 'abs', true]
  ];
  const h = defs.map(([l, f, fm, kind, good]) => {
    const has = l === 'Tempo de entrega' ? cur.dord > 0 : cur.rev > 0, hasP = prev && (l === 'Tempo de entrega' ? prev.dord > 0 : prev.rev > 0);
    return `<article class="card kpi"><div class="l">${l}</div><div class="v num">${has ? fm(f(cur)) : '—'}</div><div class="d">${has && hasP ? delta(f(cur), f(prev), kind, good) : '<span class="pill flat">—</span>'}<span>${has ? 'vs. período anterior' : 'sem entrega no canal'}</span></div>${spark(W.map(x => f(x) || 0))}</article>`; }).join('');
  $('#kpis').innerHTML = h;
  $('#empty').style.display = cur.rev ? 'none' : 'block';
  return cur;
}

/* ========== mapa de calor ========== */
const DAYS = ['seg','ter','qua','qui','sex','sáb','dom'];
function heat(){
  const g = group(r => r.c, null, F.from, F.to, 3), months = F.to - F.from + 1, occ = months * 4.345;
  const v = DAYS.map((_, d) => Array.from({length: 13}, (_, h) => g.reduce((a, x, c) => a + x.ordT * HEAT[c][d][h], 0) / occ));
  const mx = Math.max(...v.flat(), 1e-9); let pk = [0, 0]; v.forEach((r, d) => r.forEach((x, h) => { if (x > v[pk[0]][pk[1]]) pk = [d, h]; }));
  let h = '<span></span>' + Array.from({length: 13}, (_, i) => `<span class="hl ${i % 2 ? 'h2' : ''}">${11 + i}h</span>`).join('');
  v.forEach((r, d) => { h += `<span class="hl d">${DAYS[d]}</span>` + r.map((x, i) => { const t = Math.pow(x / mx, .85); return `<span class="hc ${t > .55 ? 'hi' : ''}" style="--t:${t.toFixed(3)}" title="${DAYS[d]} ${11 + i}h: ${N1.format(x)} pedidos por hora em média">${N0.format(x)}</span>`; }).join(''); });
  $('#heat').innerHTML = h;
  $('#heat-sub').textContent = `Média de pedidos por hora, por dia da semana · pico: ${DAYS[pk[0]]} às ${11 + pk[1]}h, ${N0.format(v[pk[0]][pk[1]])} pedidos por hora`;
}

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab);

  mk('ch-mes', {data:{labels:labs, datasets:[
    {type:'bar', label:'Faturamento', data:ms.map(m => M[m].rev), backgroundColor:ms.map(m => fade(T.primary, inR(m))), borderRadius:5, order:2},
    {type:'line', label:'Ano anterior', data:ms.map(m => m >= 12 ? M[m - 12].rev : null), borderColor:T.cat[1], borderDash:[5,4], borderWidth:2, pointRadius:2.5, pointBackgroundColor:T.cat[1], tension:.3, order:1}]},
    options:{interaction:{mode:'index',intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:tickC, beginAtZero:true}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); }}});

  const cc = group(r => r.c, 'c', F.from, F.to, 3), tc = cc.reduce((a, x) => a + x.rev, 0);
  mk('ch-can', {type:'doughnut', data:{labels:CH, datasets:[{data:cc.map(x => x.rev), backgroundColor:CH.map((_, i) => fade(T.ch[i], F.c < 0 || F.c === i)), borderColor:T.surface, borderWidth:2, hoverOffset:6}]},
    options:{cutout:'62%', plugins:{legend:{position:'bottom', labels:{padding:12}}, tooltip:{callbacks:{label:c => ` ${brl(c.parsed)} · ${pct(safe(c.parsed, tc))}`}}}, onClick:(e, el) => { if (el.length) toggle('c', el[0].index); }}});

  // CMV por categoria: atual × anterior
  const len = F.to - F.from + 1, pf = F.from - len, kk = group(r => r.k, 'k', F.from, F.to, 6), kp = pf >= 0 ? group(r => r.k, 'k', pf, F.from - 1, 6) : null;
  const cmvOf = x => safe(x.cost, x.rev) * 100;
  mk('ch-cmv', {type:'bar', data:{labels:CATS, datasets:[
    {label:'Período atual', data:kk.map(cmvOf), backgroundColor:CATS.map((_, k) => fade(T.primary, F.k < 0 || F.k === k)), borderRadius:4, barThickness:14},
    ...(kp ? [{label:'Período anterior', data:kp.map(cmvOf), backgroundColor:T.dark ? '#6b5a50' : '#cdbfb4', borderRadius:4, barThickness:8}] : [])]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{...gridY, ticks:{callback:v => v + '%', maxTicksLimit:5}, beginAtZero:true}, y:{grid:{display:false}, ticks:{callback(v){ const l = this.getLabelForValue(v); return l === 'Pratos principais' ? ['Pratos', 'principais'] : l; }}}},
      plugins:{legend:{position:'bottom'}, vl:{fmt:v => N1.format(v) + '%'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${N1.format(c.parsed.x)}%`}}}, onClick:(e, el) => { if (el.length) toggle('k', el[0].index); }}, plugins:[valueLabels]});

  // notas
  const tot = sumR(M, F.from, F.to), nn = tot.rt.reduce((a, b) => a + b, 0), ord5 = [4,3,2,1,0];
  $('#av-sub').textContent = `Média ${N2.format(nota(tot))} de 5 · ${N0.format(nn)} avaliações no período`;
  mk('ch-av', {type:'bar', data:{labels:ord5.map(i => (i + 1) + (i ? ' estrelas' : ' estrela')), datasets:[{data:ord5.map(i => tot.rt[i]), backgroundColor:ord5.map(i => i >= 3 ? T.cat[2] : i === 2 ? T.cat[1] : T.cat[5]), borderRadius:5, barThickness:24}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}}}, plugins:{legend:{display:false}, vl:{fmt:v => pct(safe(v, nn), 0)}, tooltip:{callbacks:{label:c => ` ${N0.format(c.parsed.x)} avaliações · ${pct(safe(c.parsed.x, nn))}`}}}}, plugins:[valueLabels]});

  // tempo de entrega mensal por canal de delivery
  const ent = [1, 2].map(() => ms.map(() => ({s: 0, n: 0}))), p = pred('c');
  for (const r of rows) if (r.m >= w0 && r.m <= F.to && r.c > 0 && p(r)) { const o = ent[r.c - 1][r.m - w0]; o.s += r.dsum; o.n += r.dord; }
  mk('ch-ent', {type:'line', data:{labels:labs, datasets:[1, 2].map(c => ({label:CHS[c], data:ent[c - 1].map(o => o.n ? o.s / o.n : null), borderColor:T.ch[c], backgroundColor:T.ch[c], borderWidth:2.2, pointRadius:2.5, tension:.3})).concat([{label:'Meta (45 min)', data:ms.map(() => 45), borderColor:T.muted, borderDash:[4,4], borderWidth:1.5, pointRadius:0}])},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}, ticks:{maxRotation:0, autoSkip:true, maxTicksLimit:6}}, y:{...gridY, ticks:{callback:v => v + ' min'}, suggestedMin:30, suggestedMax:55}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${N0.format(c.parsed.y)} min`}}}}});

  // bolhas por unidade: tempo × nota
  const un = group(r => r.u, 'u', F.from, F.to, UNITS.length), mxR = Math.max(1, ...un.map(x => x.rev));
  mk('ch-bol', {type:'bubble', data:{datasets:UNITS.filter(u => un[u.i].dord > 0).map(u => ({label:u.n, backgroundColor:T.cat[u.i] + 'cc', borderColor:T.cat[u.i], borderWidth:1.5,
      data:[{x:tmin(un[u.i]), y:nota(un[u.i]), r:6 + Math.sqrt(un[u.i].rev / mxR) * 16, u:u.i, rev:un[u.i].rev, late:safe(un[u.i].late, un[u.i].dord)}]}))},
    options:{scales:{x:{title:{display:true, text:'Tempo médio de entrega (min)'}, grid:{color:() => T.grid}, border:{display:false}, grace:'12%'}, y:{title:{display:true, text:'Nota média'}, ...gridY, grace:'10%', ticks:{callback:v => N2.format(v)}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{title:c => UNITS[c[0].raw.u].n, label:c => [` Faturamento: ${brlC(c.raw.rev)}`, ` Entrega: ${N0.format(c.raw.x)} min`, ` Nota: ${N2.format(c.raw.y)}`, ` Atrasos (>60 min): ${pct(c.raw.late)}`]}}},
      onClick:(e, el) => { if (el.length) { const d = CHARTS['ch-bol'].data.datasets[el[0].datasetIndex].data[el[0].index]; toggle('u', d.u); } }}});

  // quanto sobra de cada R$ 100
  const sc = group(r => r.c, 'c', F.from, F.to, 3), sl = ['CMV', 'Taxa do canal', 'Sobra'];
  const sv = sc.map(x => { const cm = safe(x.cost, x.rev) * 100, fe = safe(x.fee, x.rev) * 100; return [cm, fe, 100 - cm - fe]; });
  mk('ch-sob', {type:'bar', data:{labels:CHS, datasets:sl.map((n, i) => ({label:n, data:sv.map(v => v[i]), backgroundColor:CHS.map((_, c) => fade(T.fin[i], F.c < 0 || F.c === c)), borderRadius:3, stack:'s'}))},
    options:{indexAxis:'y', interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, ...gridY, max:100, ticks:{callback:v => 'R$ ' + v, stepSize:25}}, y:{stacked:true, grid:{display:false}}},
      plugins:{legend:{position:'bottom'}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: R$ ${N1.format(c.parsed.x)}`}}},
      onClick:(e, el) => { if (el.length) toggle('c', el[0].index); }}});
}

/* ========== pratos, ABC e engenharia de cardápio ========== */
const ENG = ['Estrela','Cavalo de batalha','Quebra-cabeça','Revisar'], ENGC = ['t-ok','t-info','t-warn','t-bad'];
let SKU_ROWS = [];
function skuCalc(){
  const kk = group(r => r.k, null, F.from, F.to, 6);
  const list = SKUS.filter(s => F.k < 0 || s.k === F.k).map(s => { const rev = kk[s.k].rev * s.w, units = rev / s.price; return {code:s.code, name:s.name, cat:CATS[s.k], k:s.k, price:s.price, rev, units:Math.round(units), cmv:s.cmv, mg:s.price * (1 - s.cmv), nt:s.nt}; }).sort((a, b) => b.rev - a.rev);
  const tot = list.reduce((a, s) => a + s.rev, 0), tu = list.reduce((a, s) => a + s.units, 0); let acc = 0;
  const avgMg = safe(list.reduce((a, s) => a + s.mg * s.units, 0), tu), minPop = .7 / (list.length || 1);
  list.forEach(s => { s.acc = safe(acc + s.rev, tot); s.cls = acc / tot < .8 ? 'A' : acc / tot < .95 ? 'B' : 'C'; acc += s.rev;
    const pop = safe(s.units, tu) >= minPop, hi = s.mg >= avgMg; s.eng = pop && hi ? 0 : pop ? 1 : hi ? 2 : 3; });
  SKU_ROWS = list;
  const cnt = {A:0, B:0, C:0}, shr = {A:0, B:0, C:0}; list.forEach(s => { cnt[s.cls]++; shr[s.cls] += s.rev; });
  const cc = [T.seq[0], T.seq[1], T.seq[2]];
  $('#abc').innerHTML = ['A','B','C'].map((c, i) => `<span style="--c:${cc[i]}"><b>Classe ${c}</b> ${cnt[c]} pratos · ${pct(safe(shr[c], tot), 0)}</span>`).join('');
  mk('ch-abc', {data:{labels:list.map(s => s.code), datasets:[
    {type:'bar', label:'Faturamento', data:list.map(s => s.rev), backgroundColor:list.map(s => cc['ABC'.indexOf(s.cls)]), borderRadius:3, yAxisID:'y', order:2},
    {type:'line', label:'% acumulado', data:list.map(s => s.acc * 100), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2, pointRadius:0, pointHoverRadius:4, tension:.25, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}, ticks:{maxRotation:90, minRotation:90, autoSkip:true, font:{size:10}}}, y:{...gridY, ticks:tickC}, y2:{position:'right', min:0, max:100, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{title:c => { const s = list[c[0].dataIndex]; return s.code + ' · ' + s.name; }, label:c => c.datasetIndex ? ` Acumulado: ${N1.format(c.parsed.y)}%` : ` Faturamento: ${brl(c.parsed.y)} (classe ${list[c.dataIndex].cls})`}}},
      onClick:(e, el) => { if (el.length) toggle('k', list[el[0].index].k); }}});
}

const TAB = {t:'p', q:'', sort:{p:['rev', -1], u:['rev', -1]}, page:0}, PS = 8;
const COLS = {
  p:[['code','Código',v=>v],['name','Prato',v=>v],['cat','Categoria',v=>v],['cls','Classe',v=>`<span class="tag ${{A:'t-info',B:'t-ok',C:'t-warn'}[v]}">${v}</span>`,'h'],['rev','Faturamento',v=>'R$ '+N0.format(v),'r'],['units','Vendidos',v=>N0.format(v),'r'],['price','Preço',brl,'r'],['cmv','CMV do prato',v=>pct(v),'r'],['mg','Margem (R$/un)',brl,'r'],['eng','Cardápio',v=>`<span class="tag ${ENGC[v]}">${ENG[v]}</span>`,'h']],
  u:[['name','Unidade',v=>v],['rev','Faturamento',v=>'R$ '+N0.format(v),'r'],['dl','Var. vs anterior',v=>v == null ? '—' : (v > 0 ? '+' : '') + N1.format(v * 100) + '%','r'],['ord','Pedidos',v=>N0.format(v),'r'],['tk','Ticket médio',brl,'r'],['cmv','CMV',v=>pct(v),'r'],['tm','Entrega (min)',v=>v ? N0.format(v) : '—','r'],['lt','Atrasos >60 min',v=>v == null ? '—' : pct(v),'r'],['nt','Nota',v=>N2.format(v),'r']]
};
let UNIT_ROWS = [];
function unitCalc(){
  const len = F.to - F.from + 1, pf = F.from - len, a = group(r => r.u, 'u', F.from, F.to, UNITS.length), b = pf >= 0 ? group(r => r.u, 'u', pf, F.from - 1, UNITS.length) : null;
  UNIT_ROWS = UNITS.filter(u => a[u.i].rev).map(u => { const x = a[u.i]; return {i:u.i, name:u.n, rev:x.rev, dl:b && b[u.i].rev ? x.rev / b[u.i].rev - 1 : null, ord:ords(x), tk:safe(x.rev, ords(x)), cmv:safe(x.cost, x.rev), tm:tmin(x), lt:x.dord ? x.late / x.dord : null, nt:nota(x)}; });
}
function tableRows(){
  const cols = COLS[TAB.t], src = TAB.t === 'p' ? SKU_ROWS : UNIT_ROWS, q = TAB.q.trim().toLowerCase();
  const txt = r => cols.map(c => c[0] === 'eng' ? ENG[r.eng] : r[c[0]]).join(' ').toLowerCase();
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
    const cols = COLS[TAB.t], fmt = (c, v) => c[0] === 'eng' ? ENG[v] : v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(c, r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `casa-tempero_${TAB.t === 'p' ? 'pratos' : 'unidades'}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); heat(); charts(M); skuCalc(); unitCalc(); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('ct-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('ct-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
