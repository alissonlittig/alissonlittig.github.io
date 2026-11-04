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
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

const REGIONS = ['Sul','Sudeste','Centro-Oeste','Nordeste','Norte'];
// [nome, região, escala, OTIF base, fator de ocorrências, fator de consumo]
const HUBS = [
  ['Curitiba · CD Pinhais',0,1.3,.936,.9,1.0],['Porto Alegre · CD Canoas',0,1.0,.929,1.0,1.0],['Joinville · CD Norte',0,.7,.941,.85,1.01],
  ['Campinas · CD Viracopos',1,1.8,.944,.9,1.02],['Guarulhos · CD Cumbica',1,2.0,.913,1.25,.98],['Rio de Janeiro · CD Caxias',1,1.3,.905,1.4,.97],['Belo Horizonte · CD Contagem',1,1.1,.931,.95,1.0],
  ['Goiânia · CD Aparecida',2,.9,.935,.9,1.02],['Brasília · CD SIA',2,.8,.927,1.0,1.01],
  ['Salvador · CD Simões Filho',3,1.0,.918,1.15,.99],['Recife · CD Jaboatão',3,.9,.912,1.2,.99],['Fortaleza · CD Maracanaú',3,.7,.921,1.05,1.0],
  ['Manaus · CD Distrito',4,.5,.885,1.1,.94]
].map(([n,r,s,ob,of,kf],i)=>({i,n,r,s,ob,of,kf,pb:(R()-.5)*.08,cf:.9+R()*.2}));

const MODS = ['Fracionada','Lotação','Última milha','Refrigerada'];
// sh: participação nas entregas · kme: km por entrega · kml: km/l · kmd: km por veículo-dia · drv/pv/cr/tl: R$/km · oc: ocorrências por mil · ot: ajuste de OTIF
const MD = [
  {sh:.30,kme:32,kml:3.4,kmd:210,drv:1.35,pv:.22,cr:.38,tl:.42,oc:34,ot:-.004},
  {sh:.03,kme:380,kml:2.4,kmd:520,drv:1.05,pv:.28,cr:.40,tl:.85,oc:60,ot:.006},
  {sh:.62,kme:8,kml:9.0,kmd:110,drv:.85,pv:.12,cr:.20,tl:.15,oc:26,ot:.012},
  {sh:.05,kme:90,kml:2.9,kmd:280,drv:1.5,pv:.30,cr:.45,tl:.50,oc:52,ot:-.02}
];
const GS = [.86,.84,.93,.95,.98,.97,1,1,1.02,1.06,1.28,1.45];       // sazonalidade por mês do calendário
const OCT = ['Avaria na carga','Atraso por trânsito','Cliente ausente','Endereço incorreto','Recusa na entrega','Roubo ou sinistro','Temperatura fora da faixa'];
const OW = [[.22,.2,.22,.14,.17,.05,0],[.2,.42,.02,.02,.12,.22,0],[.07,.14,.36,.27,.14,.02,0],[.14,.28,.08,.05,.12,.03,.3]].map(w => { const s = w.reduce((a, b) => a + b, 0); return w.map(x => x / s); });

const diesel = (m, r) => (5.9 + .018 * m + .12 * Math.sin(m / 3)) * [.99,1,1.01,1.02,1.06][r];
const rows = [];
const VEH = {};   // frota fixa por centro × modalidade
HUBS.forEach(h => MD.forEach((d, c) => { VEH[h.i * 4 + c] = Math.max(2, Math.round(12000 * h.s * d.sh * 1.1 * d.kme / (d.kmd * 30 * [.72,.66,.8,.6][c]))); }));
for (let m = 0; m < NM; m++) for (const h of HUBS) for (let c = 0; c < 4; c++) {
  const d = MD[c], cm = cal(m), veh = VEH[h.i * 4 + c];
  const seas = GS[cm] * (c === 2 && cm >= 10 ? 1.16 : 1) * (c === 1 ? .85 + .15 * GS[cm] : 1);
  const ent = 12000 * h.s * d.sh * Math.pow(1.0085, m) * seas * (.94 + R() * .12);
  const km = ent * d.kme * (.95 + R() * .1);
  const kml = d.kml * h.kf * (1 + .0025 * m) * (.98 + R() * .04), lit = km / kml;
  const pm = diesel(m, h.r) * (.985 + R() * .03);
  const vd = veh * 30, vP = vd * (.05 + .0011 * m) * (.9 + R() * .2), vC = vd * (.095 - .0018 * m) * (.8 + R() * .4) * h.cf;
  const vR = Math.min(km / d.kmd, vd - vP - vC), util = vR / vd;
  let ot = h.ob + d.ot + .0016 * m - (cm === 10 ? .025 : cm === 11 ? .035 : cm === 0 ? .01 : 0) - (h.r === 4 && (cm >= 11 || cm <= 2) ? .02 : 0) - Math.max(0, util - .84) * .35 + (R() - .5) * .01;
  ot = clamp(ot, .75, .995);
  const oc = ent * d.oc * (1 - .008 * m) * h.of * (.9 + R() * .2) / 1000 * (1 + Math.max(0, .93 - ot) * 2);
  rows.push({m, u: h.i, rg: h.r, c, ent: Math.round(ent), ok: Math.round(ent * ot), km: Math.round(km), lit: Math.round(lit),
    cF: lit * pm, cD: km * d.drv * Math.pow(1.0035, m) * (.97 + R() * .06), cP: km * d.pv * (1 + .012 * m) * (.95 + R() * .1) * (1 + h.pb), cC: km * d.cr * (1 - .012 * m) * (.85 + R() * .3) * h.cf, cT: km * d.tl * (.95 + R() * .1),
    vd, vR, vP, vC, oc: Math.round(oc)});
}

/* ========== agregação ========== */
const FL = ['ent','ok','km','lit','cF','cD','cP','cC','cT','vd','vR','vP','vC','oc'];
const z0 = () => { const o = {}; FL.forEach(f => o[f] = 0); return o; };
const add = (a, r) => { FL.forEach(f => a[f] += r[f]); return a; };
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, rg:-1, u:-1, c:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='rg'||F.rg<0||r.rg===F.rg) && (skip==='u'||F.u<0||r.u===F.u) && (skip==='c'||F.c<0||r.c===F.c);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) add(a[key(r)], r); return a; }
const safe = (a, b) => b ? a / b : 0;
const cost = x => x.cF + x.cD + x.cP + x.cC + x.cT;
const otif = x => safe(x.ok, x.ent), cpk = x => safe(cost(x), x.km), ocu = x => safe(x.vR, x.vd), kml = x => safe(x.km, x.lit), ocm = x => safe(x.oc * 1000, x.ent), prevS = x => safe(x.cP, x.cP + x.cC);

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const numC = v => { const a = Math.abs(v); return a >= 1e6 ? nf(2).format(v/1e6) + ' mi' : a >= 1e3 ? N0.format(v/1e3) + ' mil' : N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], run:'#0b7285', idle:'#b3bdce', prev:'#56B4E9', corr:'#D55E00', warm:'#d4553f'},
              dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], run:'#4fd1e0', idle:'#4a5a78', prev:'#8FA8FF', corr:'#FF8A57', warm:'#ff8f84'}};
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
const gridY = {grid:{color:() => T.grid}, border:{display:false}};
const valueLabels = {id:'vl', afterDatasetsDraw(ch, a, o){ if(!o.fmt) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
  ch.getDatasetMeta(0).data.forEach((b, i) => { c.fillText(o.fmt(ch.data.datasets[0].data[i], i), b.x + 6, b.y); }); c.restore(); }};

/* ========== filtros ========== */
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-reg').innerHTML = opt(-1, 'Todas as regiões') + REGIONS.map((r, i) => opt(i, r)).join('');
  $('#f-mod').innerHTML = opt(-1, 'Todas as modalidades') + MODS.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-reg').value = F.rg; $('#f-mod').value = F.c;
  $('#f-uni').innerHTML = '<option value="-1">Todos os centros</option>' + HUBS.filter(u => F.rg < 0 || u.r === F.rg).map(u => `<option value="${u.i}">${esc(u.n)}</option>`).join('');
  $('#f-uni').value = F.u;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.rg >= 0) chips.push(['rg', REGIONS[F.rg]]);
  if (F.u >= 0) chips.push(['u', HUBS[F.u].n]);
  if (F.c >= 0) chips.push(['c', MODS[F.c]]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; if (key === 'u' && F.u >= 0) F.rg = HUBS[F.u].r; if (key === 'rg' && F.u >= 0 && HUBS[F.u].r !== F.rg) F.u = -1; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-reg').onchange = e => { F.rg = +e.target.value; if (F.u >= 0 && HUBS[F.u].r !== F.rg && F.rg >= 0) F.u = -1; render(); };
  $('#f-uni').onchange = e => { F.u = +e.target.value; if (F.u >= 0) F.rg = HUBS[F.u].r; render(); };
  $('#f-mod').onchange = e => { F.c = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.rg = F.u = F.c = -1; render(); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (k === 'per') setPreset('12'); else F[k] = -1; render(); };
}

/* ========== KPIs ========== */
const spark = vals => { const mx = Math.max(...vals), mn = Math.min(...vals), W = 100, H = 34, d = mx - mn || 1;
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
function kpis(M){
  const cur = sumR(M, F.from, F.to), len = F.to - F.from + 1, pf = F.from - len, prev = pf >= 0 ? sumR(M, pf, F.from - 1) : null;
  const W = M.slice(Math.max(0, F.to - 11), F.to + 1);
  const defs = [
    ['OTIF (no prazo e completo)', otif, v => pct(v, 1), 'pp', true],
    ['Entregas', x => x.ent, v => numC(v), 'rel', true],
    ['Custo por km', cpk, brl, 'rel', false],
    ['Ocupação da frota', ocu, v => pct(v, 1), 'pp', true],
    ['Consumo médio', kml, v => N2.format(v) + ' km/l', 'rel', true],
    ['Ocorrências / mil entregas', ocm, v => N1.format(v), 'rel', false]
  ];
  $('#kpis').innerHTML = defs.map(([l, f, fm, kind, good]) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${cur.ent ? fm(f(cur)) : '—'}</div><div class="d">${cur.ent && prev && prev.ent ? delta(f(cur), f(prev), kind, good) : '<span class="pill flat">—</span>'}<span>vs. período anterior</span></div>${spark(W.map(x => f(x)))}</article>`).join('');
  $('#empty').style.display = cur.ent ? 'none' : 'block';
  return cur;
}

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab);
  const pick = m => { if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); };
  const monthClick = (e, el) => { if (el.length) pick(ms[el[0].index]); };
  const mx = {x:{grid:{display:false}}};

  mk('ch-otif', {data:{labels:labs, datasets:[
    {type:'bar', label:'Entregas', data:ms.map(m => M[m].ent), backgroundColor:ms.map(m => T.primary + (inR(m) ? '99' : '33')), borderRadius:4, yAxisID:'y', order:3},
    {type:'line', label:'OTIF', data:ms.map(m => M[m].ent ? otif(M[m]) * 100 : null), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2.5, pointRadius:3, pointHoverRadius:5, tension:.3, yAxisID:'y2', order:1},
    {type:'line', label:'Meta 95%', data:ms.map(() => 95), borderColor:T.muted, borderDash:[6,5], borderWidth:1.5, pointRadius:0, yAxisID:'y2', order:2}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{...mx, y:{...gridY, beginAtZero:true, ticks:{callback:v => numC(v)}}, y2:{position:'right', min:80, max:100, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.dataset.label === 'Entregas' ? ` Entregas: ${N0.format(c.parsed.y)}` : ` ${c.dataset.label}: ${N1.format(c.parsed.y)}%`}}}, onClick:monthClick}});

  const gm = group(r => r.c, 'c', F.from, F.to, 4);
  const sit = [['Em rota','vR',T.run],['Ocioso',null,T.idle],['Manutenção preventiva','vP',T.prev],['Manutenção corretiva','vC',T.corr]];
  const share = (x, k) => k ? safe(x[k], x.vd) * 100 : safe(x.vd - x.vR - x.vP - x.vC, x.vd) * 100;
  mk('ch-ocu', {type:'bar', data:{labels:MODS, datasets:sit.map(([n, k, col]) => ({label:n, data:gm.map(x => share(x, k)), backgroundColor:MODS.map((_, i) => fade(col, F.c < 0 || F.c === i)), borderRadius:2, stack:'s'}))},
    options:{indexAxis:'y', interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, max:100, ...gridY, ticks:{callback:v => v + '%'}}, y:{stacked:true, grid:{display:false}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${N1.format(c.parsed.x)}%`}}}, onClick:(e, el) => { if (el.length) toggle('c', el[0].index); }}});

  const comp = [['Combustível','cF',T.cat[0]],['Motorista','cD',T.cat[1]],['Manutenção',null,T.cat[2]],['Pedágio e outros','cT',T.cat[3]]];
  const cv = (x, k) => k ? safe(x[k], x.km) : safe(x.cP + x.cC, x.km);
  mk('ch-cpk', {type:'bar', data:{labels:labs, datasets:comp.map(([n, k, col]) => ({label:n, data:ms.map(m => cv(M[m], k)), backgroundColor:col, stack:'s', borderRadius:2}))},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:{callback:v => 'R$ ' + N1.format(v)}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`, footer:i => 'Total: ' + brl(i.reduce((a, c) => a + c.parsed.y, 0))}}}, onClick:monthClick}});

  const cur = sumR(M, F.from, F.to);
  $('#mnt-i').innerHTML = `<span><b>${pct(prevS(cur), 0)}</b> do custo é preventiva no período</span>`;
  mk('ch-mnt', {data:{labels:labs, datasets:[
    {type:'bar', label:'Preventiva', data:ms.map(m => M[m].cP), backgroundColor:T.prev, stack:'s', borderRadius:2, yAxisID:'y', order:2},
    {type:'bar', label:'Corretiva', data:ms.map(m => M[m].cC), backgroundColor:T.corr, stack:'s', borderRadius:2, yAxisID:'y', order:2},
    {type:'line', label:'% preventiva', data:ms.map(m => M[m].km ? prevS(M[m]) * 100 : null), borderColor:T.text, backgroundColor:T.text, borderWidth:2, pointRadius:2.5, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:{callback:v => brlC(v)}}, y2:{position:'right', min:0, max:100, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.dataset.label === '% preventiva' ? ` % preventiva: ${N1.format(c.parsed.y)}%` : ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}}, onClick:monthClick}});

  const byC = MODS.map(() => ms.map(() => 0)), p = pred('c'); for (const r of rows) if (r.m >= w0 && r.m <= F.to && p(r)) byC[r.c][r.m - w0] += r.lit;
  mk('ch-comb', {data:{labels:labs, datasets:[...MODS.map((n, i) => ({type:'bar', label:n, data:byC[i], backgroundColor:fade(T.cat[i], F.c < 0 || F.c === i), stack:'s', borderRadius:2, yAxisID:'y', order:2})),
    {type:'line', label:'Preço médio do litro', data:ms.map(m => M[m].lit ? M[m].cF / M[m].lit : null), borderColor:T.text, backgroundColor:T.text, borderWidth:2, pointRadius:2.5, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:{callback:v => numC(v) + ' L'}}, y2:{position:'right', min:5, max:7.5, grid:{display:false}, border:{display:false}, ticks:{callback:v => 'R$ ' + N1.format(v)}}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => { if (it.datasetIndex < 4) toggle('c', it.datasetIndex); }}, tooltip:{callbacks:{label:c => c.dataset.label === 'Preço médio do litro' ? ` ${c.dataset.label}: ${brl(c.parsed.y)}` : ` ${c.dataset.label}: ${N0.format(c.parsed.y)} L`}}},
      onClick:(e, el) => { if (el.length && el[0].datasetIndex < 4) toggle('c', el[0].datasetIndex); }}});

  const rg = group(r => r.rg, 'rg', F.from, F.to, 5).map((x, i) => ({i, v:x.ent ? (1 - otif(x)) * 100 : 0, o:otif(x), n:x.ent})).filter(x => x.n).sort((a, b) => a.v - b.v);
  mk('ch-reg', {type:'bar', data:{labels:rg.map(x => REGIONS[x.i]), datasets:[{data:rg.map(x => x.v), backgroundColor:rg.map(x => fade(T.warm, F.rg < 0 || F.rg === x.i)), borderRadius:5, barThickness:26}]},
    options:{indexAxis:'y', layout:{padding:{right:50}}, scales:{x:{...gridY, beginAtZero:true, ticks:{callback:v => v + '%', maxTicksLimit:5}}, y:{grid:{display:false}}}, plugins:{legend:{display:false}, vl:{fmt:v => N1.format(v) + '%'}, tooltip:{callbacks:{label:c => [` Fora do padrão: ${N1.format(c.parsed.x)}%`, ` OTIF: ${N1.format(rg[c.dataIndex].o * 100)}%`, ` Entregas: ${N0.format(rg[c.dataIndex].n)}`]}}}, onClick:(e, el) => { if (el.length) toggle('rg', rg[el[0].index].i); }}, plugins:[valueLabels]});

  const un = group(r => r.u, 'u', F.from, F.to, HUBS.length), mxE = Math.max(1, ...un.map(x => x.ent));
  mk('ch-bol', {type:'bubble', data:{datasets:REGIONS.map((n, ri) => ({label:n, backgroundColor:T.cat[ri] + 'cc', borderColor:T.cat[ri], borderWidth:1.5,
      data:HUBS.filter(u => u.r === ri && un[u.i].ent).map(u => ({x:cpk(un[u.i]), y:otif(un[u.i]) * 100, r:5 + Math.sqrt(un[u.i].ent / mxE) * 19, u:u.i, ent:un[u.i].ent}))}))},
    options:{scales:{x:{title:{display:true, text:'Custo por km (R$)'}, grid:{color:() => T.grid}, border:{display:false}, ticks:{callback:v => "R$ " + N2.format(v)}, grace:"6%"}, y:{title:{display:true, text:'OTIF (%)'}, ...gridY, grace:'8%', ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{title:c => HUBS[c[0].raw.u].n, label:c => [` Entregas: ${N0.format(c.raw.ent)}`, ` Custo por km: ${brl(c.raw.x)}`, ` OTIF: ${N1.format(c.raw.y)}%`]}}},
      onClick:(e, el) => { if (el.length) toggle('u', CHARTS['ch-bol'].data.datasets[el[0].datasetIndex].data[el[0].index].u); }}});

  const oc = OCT.map(() => 0); for (const r of rows) if (r.m >= F.from && r.m <= F.to && pred()(r)) OW[r.c].forEach((w, j) => oc[j] += r.oc * w);
  const oo = oc.map((v, i) => ({i, v})).filter(x => x.v > 0).sort((a, b) => b.v - a.v), ot = oc.reduce((a, b) => a + b, 0);
  mk('ch-oco', {type:'bar', data:{labels:oo.map(x => OCT[x.i]), datasets:[{data:oo.map(x => x.v), backgroundColor:T.warm, borderRadius:5, barThickness:20}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}, ticks:{callback(v){ const l = this.getLabelForValue(v); return l.length > 19 ? l.split(' ').reduce((a, w) => (a.length && (a[a.length - 1] + ' ' + w).length < 17) ? (a[a.length - 1] += ' ' + w, a) : (a.push(w), a), []) : l; }}}},
      plugins:{legend:{display:false}, vl:{fmt:v => pct(safe(v, ot), 0)}, tooltip:{callbacks:{label:c => ` ${N0.format(c.parsed.x)} ocorrências · ${pct(safe(c.parsed.x, ot))}`}}}}, plugins:[valueLabels]});
}

/* ========== motoristas, centros e rotas ========== */
const FIRST = ['Anderson','Bruno','Carlos','Diego','Edson','Fábio','Gustavo','Henrique','Ivan','Jonas','Kleber','Leandro','Marcelo','Nilton','Osvaldo','Paulo','Rafael','Sérgio','Tiago','Valdir','Wagner','Adriano','Cláudio','Elias','Flávio','Heitor','Jair','Luciano','Mauro','Renan','Silvio','Vinícius','Washington','Douglas','Everton'];
const LAST = ['Almeida','Barbosa','Cardoso','Dias','Esteves','Ferraz','Gomes','Ibrahim','Junqueira','Lacerda','Machado','Nogueira','Oliveira','Pereira','Queiroz','Ribeiro','Siqueira','Teixeira','Vasconcelos','Moraes','Furtado','Camargo','Bastos','Rocha','Maia'];
const DRV = []; { let n = 0;
  HUBS.forEach(h => { const mods = [2, 0]; if (h.s >= 1.3) mods.push(1); if (h.i % 3 === 0) mods.push(3);
    mods.forEach(c => { DRV.push({id:'MT-' + String(1040 + n * 7).padStart(4, '0'), name:FIRST[n % FIRST.length] + ' ' + LAST[(n * 7 + 3) % LAST.length], u:h.i, c, bo:(R() - .5) * .07, bk:(R() - .5) * .16, bc:(R() - .5) * .8, be:.8 + R() * .4}); n++; }); }); }
const ROUTES = [['Curitiba → Florianópolis',300],['Curitiba → São Paulo',410],['Porto Alegre → Caxias do Sul',130],['Porto Alegre → Curitiba',710],['Joinville → Blumenau',95],['Joinville → Curitiba',135],
  ['Campinas → Ribeirão Preto',220],['Campinas → Belo Horizonte',590],['Guarulhos → Rio de Janeiro',440],['Guarulhos → Santos',70],['Rio de Janeiro → Vitória',520],['Rio de Janeiro → Belo Horizonte',440],['Belo Horizonte → Uberlândia',560],['Belo Horizonte → Montes Claros',420],
  ['Goiânia → Brasília',210],['Goiânia → Uberlândia',330],['Brasília → Palmas',970],['Brasília → Cuiabá',1130],['Salvador → Feira de Santana',110],['Salvador → Recife',800],['Recife → Maceió',260],['Recife → Fortaleza',800],
  ['Fortaleza → Teresina',630],['Fortaleza → Natal',540],['Manaus → Itacoatiara',270],['Manaus → Boa Vista',785]].map(([n, d], i) => ({n, d, u:i >> 1, w:i % 2 ? .42 : .58, bo:(R() - .5) * .05, bc:(R() - .5) * .3, bt:(R() - .5) * .2}));

const MKB = MD.map(d => d.kml);
let DRV_ROWS = [], HUB_ROWS = [], ROUTE_ROWS = [];
function calc(){
  const len = F.to - F.from + 1, pf = F.from - len, key = r => r.u * 4 + r.c;
  const a = group(key, null, F.from, F.to, HUBS.length * 4), h = group(r => r.u, 'u', F.from, F.to, HUBS.length), hp = pf >= 0 ? group(r => r.u, 'u', pf, F.from - 1, HUBS.length) : null;
  DRV_ROWS = DRV.filter(d => a[d.u * 4 + d.c].ent).map(d => { const x = a[d.u * 4 + d.c], v = VEH[d.u * 4 + d.c], o = clamp(otif(x) + d.bo, .7, .999), k = kml(x) * (1 + d.bk), q = ocm(x) * (1 + d.bc * .5), e = d.be;
    const sc = 50 * clamp((o - .85) / .14, 0, 1) + 25 * clamp(1 - (q - 8) / 52, 0, 1) + 25 * clamp((k / MKB[d.c] - .88) / .24, 0, 1);
    return {id:d.id, name:d.name, hub:HUBS[d.u].n, mod:MODS[d.c], ent:Math.round(x.ent / v * e), km:Math.round(x.km / v * e), otif:o, kml:k, oc:q, score:Math.round(sc * 10) / 10}; });
  DRV_ROWS.sort((p, q) => q.score - p.score).forEach((d, i) => d.rank = i + 1);
  HUB_ROWS = HUBS.filter(u => h[u.i].ent).map(u => { const x = h[u.i], y = hp && hp[u.i].ent ? hp[u.i] : null; return {i:u.i, name:u.n, reg:REGIONS[u.r], ent:x.ent, otif:otif(x), dotif:y ? otif(x) - otif(y) : null, cpk:cpk(x), ocu:ocu(x), kml:kml(x), prev:prevS(x), oc:ocm(x)}; });
  ROUTE_ROWS = ROUTES.filter(r => h[r.u].ent).map(r => { const x = h[r.u]; return {name:r.n, reg:REGIONS[HUBS[r.u].r], dist:r.d, ent:Math.round(x.ent * r.w), otif:clamp(otif(x) + r.bo - (r.d > 600 ? .012 : 0), .7, .999), cpk:cpk(x) * (1 + r.bt) * (r.d > 600 ? .92 : 1), oc:ocm(x) * (1 + r.bc)}; });
  const top = DRV_ROWS.slice(0, 12), col = s => s >= 85 ? T.cat[2] : s >= 70 ? T.primary : T.cat[1];
  mk('ch-mot', {type:'bar', data:{labels:top.map(d => d.name), datasets:[{data:top.map(d => d.score), backgroundColor:top.map(d => col(d.score)), borderRadius:5}]},
    options:{scales:{x:{grid:{display:false}, ticks:{maxRotation:window.innerWidth < 700 ? 90 : 0, minRotation:window.innerWidth < 700 ? 90 : 0, autoSkip:false, font:{size:11}, callback(v){ const l = this.getLabelForValue(v).split(' '); return window.innerWidth < 700 ? l[0] : l; }}}, y:{...gridY, min:0, max:100}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{title:c => top[c[0].dataIndex].name + ' · ' + top[c[0].dataIndex].id, label:c => { const d = top[c.dataIndex]; return [` Nota: ${N1.format(d.score)}`, ` ${d.hub} · ${d.mod}`, ` OTIF: ${pct(d.otif)} · ${N1.format(d.oc)} ocorr./mil`, ` Consumo: ${N2.format(d.kml)} km/l`]; }}}}}});
}
const okc = v => v >= .95 ? 't-ok' : v >= .9 ? 't-warn' : 't-bad';
const dpp = v => v == null ? '—' : (v > 0 ? '+' : '') + N1.format(v * 100) + ' p.p.';
const tagO = v => `<span class="tag ${okc(v)}">${pct(v)}</span>`;
const COLS = {
  m:[['rank','#',v => `<span class="rk ${v <= 3 ? 'top' : ''}">${v}</span>`],['name','Motorista',v=>v],['id','Matrícula',v=>v],['hub','Centro',v=>v],['mod','Modalidade',v=>v],['ent','Entregas',v=>N0.format(v),'r'],['km','Km rodados',v=>N0.format(v),'r'],['otif','OTIF',tagO,'r'],['kml','Consumo (km/l)',v=>N2.format(v),'r'],['oc','Ocorr./mil',v=>N1.format(v),'r'],['score','Nota',v=>`<b>${N1.format(v)}</b>`,'r']],
  h:[['name','Centro de distribuição',v=>v],['reg','Região',v=>v],['ent','Entregas',v=>N0.format(v),'r'],['otif','OTIF',tagO,'r'],['dotif','Var. OTIF',dpp,'r'],['cpk','Custo/km',brl,'r'],['ocu','Ocupação',v=>pct(v),'r'],['kml','Consumo (km/l)',v=>N2.format(v),'r'],['prev','% preventiva',v=>pct(v,0),'r'],['oc','Ocorr./mil',v=>N1.format(v),'r']],
  r:[['name','Rota',v=>v],['reg','Região',v=>v],['dist','Distância (km)',v=>N0.format(v),'r'],['ent','Entregas',v=>N0.format(v),'r'],['otif','OTIF',tagO,'r'],['cpk','Custo/km',brl,'r'],['oc','Ocorr./mil',v=>N1.format(v),'r']]
};
const TAB = {t:'m', q:'', sort:{m:['rank', 1], h:['ent', -1], r:['ent', -1]}, page:0}, PS = 8;
const SRC = () => ({m:DRV_ROWS, h:HUB_ROWS, r:ROUTE_ROWS}[TAB.t]);
function tableRows(){
  const cols = COLS[TAB.t], q = TAB.q.trim().toLowerCase();
  const out = q ? SRC().filter(r => cols.map(c => r[c[0]]).join(' ').toLowerCase().includes(q)) : SRC().slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  return out;
}
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${c[3] === 'r' ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS), hubTab = TAB.t === 'h';
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="${hubTab ? 'click' : ''} ${hubTab && r.i === F.u ? 'sel' : ''}" ${hubTab ? `data-u="${r.i}" title="Filtrar por este centro"` : ''}>` + cols.map(c => `<td class="${c[3] === 'r' ? 'r num' : ''}">${c[2](r[c[0]])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:24px">Nenhum resultado.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; ['m','h','r'].forEach(x => $('#tab-' + x).setAttribute('aria-selected', x === t)); table(); };
  ['m','h','r'].forEach(x => { $('#tab-' + x).onclick = () => tab(x); });
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof SRC()[0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-u]'); if (tr) toggle('u', +tr.dataset.u); };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], fmt = v => v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `trilha-azul_${{m:'motoristas',h:'centros',r:'rotas'}[TAB.t]}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); charts(M); calc(); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('ta-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('ta-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
