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
const LEMBRETE = 16;                             // mar/26: lembrete automático por WhatsApp reduz faltas

const REGIONS = ['Sul','Sudeste','Centro-Oeste','Nordeste'];
// nome, região, fator de demanda, fator de faltas, ajuste de NPS, rampa (unidade nova)
const UNITS = [
  ['Curitiba · Batel',0,1.00,.95,.02,0],['Joinville · Centro',0,.93,1.00,.01,0],['Porto Alegre · Moinhos',0,1.02,.97,.03,0],
  ['São Paulo · Pinheiros',1,1.08,1.05,-.01,0],['São Paulo · Tatuapé',1,1.00,1.10,-.02,0],['Belo Horizonte · Funcionários',1,1.00,1.00,.01,0],
  ['Brasília · Asa Norte',2,.96,1.04,0,0],['Salvador · Pituba',3,1.00,1.08,-.01,1]
].map(([n,r,d,nf,np,ramp],i)=>({i,n,r,d,nf,np,ramp}));
const SPECS = ['Clínica geral','Pediatria','Ginecologia','Cardiologia','Dermatologia','Ortopedia','Oftalmologia','Psicologia'];
const CAP  = [380,340,320,260,300,280,300,220];           // horários por profissional/mês
const OCC0 = [.84,.82,.80,.78,.86,.79,.70,.87];
const NS0  = [.10,.08,.11,.09,.13,.10,.12,.15];
const W0   = [3,3,7,9,12,8,6,5];                         // espera base em dias
const TICK = [190,230,260,340,310,320,270,200];
const UP   = [1.22,1.20,1.30,1.50,1.55,1.35,1.50,1.0];     // exames e procedimentos
const NEWP = [.26,.20,.22,.24,.30,.34,.28,.15];
const RET0 = [.52,.60,.55,.58,.44,.40,.48,.74];
const PAYERS = ['Particular','Vitalis Saúde','Aurea Planos','Mediplan','Orbe Saúde'];
const PSH = [.22,.30,.20,.16,.12], PF = [1,.62,.58,.55,.66], PNS = [.8,1.12,1.10,1.15,1.08], PW = [.75,1.10,1.15,1.20,1.05], POCC = [1,1,.98,1.04,.96];
const GSEAS = [.93,.94,1.0,1.0,1.03,1.02,.97,1.03,1.04,1.04,1.0,.90];
const DAYF = [.95,.90,1,.95,1,.95,1,1.05,.97,1.02,.95,.90];
const SSEAS = [{}, {4:1.1,5:1.12,6:1.08}, {}, {}, {9:1.04,10:1.06,11:1.08,0:1.06}, {}, {0:1.15,1:1.12}, {}];

const FN = ['Helena','Marina','Camila','Beatriz','Renata','Larissa','Patrícia','Fernanda','Juliana','Aline','Luciana','Carolina','Daniela','Sabrina','Vanessa','Isabela','Rafael','Eduardo','Gustavo','Henrique','Marcelo','André','Felipe','Rodrigo','Tiago','Leandro','Bruno','Ricardo','Fábio','Otávio','Caio','Paulo'];
const FEM = new Set(FN.slice(0,16));
const LN = ['Marques','Albuquerque','Nogueira','Tavares','Siqueira','Prado','Carvalho','Vasconcelos','Moreira','Duarte','Teixeira','Camargo','Fontes','Barreto','Pacheco','Lacerda','Moura','Brandão','Salles','Queiroz','Azevedo','Bastos','Cardoso','Peixoto','Rangel','Sampaio','Viana','Xavier','Zanella','Medeiros'];
const usedN = new Set();
const PROS = [];
UNITS.forEach(u => {
  const list = [0,0,1,2,3,4,5,6,7];
  if ([0,3,4].includes(u.i)) list.push(0, 7);
  list.forEach(k => {
    let n; do { const f = FN[Math.floor(R() * FN.length)]; n = (k === 7 ? 'Psic. ' : FEM.has(f) ? 'Dra. ' : 'Dr. ') + f + ' ' + LN[Math.floor(R() * LN.length)]; } while (usedN.has(n)); usedN.add(n);
    PROS.push({i:PROS.length, n, u:u.i, rg:u.r, k, cap:Math.round(CAP[k] * (.88 + R() * .24) * (u.ramp ? .85 : 1)), f:.94 + R() * .12});
  });
});

const rows = [];
for (let m = 0; m < NM; m++) for (const pr of PROS) for (let p = 0; p < 5; p++) {
  const u = UNITS[pr.u], k = pr.k, cm = cal(m);
  const slots = Math.round(pr.cap * DAYF[cm] * PSH[p] * (.96 + R() * .08));
  const ramp = u.ramp ? .66 + .34 * Math.min(1, m / 20) : 1;
  const occ = Math.min(.985, OCC0[k] * GSEAS[cm] * (SSEAS[k][cm] || 1) * Math.pow(1.003, m) * u.d * ramp * pr.f * POCC[p] * (.97 + R() * .06));
  const us = Math.round(slots * occ);
  const wait = Math.min(40, W0[k] * Math.pow(occ / .8, 3.2) * PW[p] * (.94 + R() * .12));
  const lem = m >= LEMBRETE ? [.95,.90,.85][Math.min(2, m - LEMBRETE)] * (m - LEMBRETE >= 3 ? .97 : 1) : 1;
  const nsr = NS0[k] * PNS[p] * u.nf * lem * (1 + (wait - 7) * .008) * (.92 + R() * .16);
  const ns = Math.round(us * nsr), att = us - ns, cx = Math.round(us * .065 * (.85 + R() * .3));
  const pp = Math.max(.35, Math.min(.88, .80 - .009 * (Math.min(20, wait) - 6) + u.np + (m >= LEMBRETE ? .015 : 0) + (R() - .5) * .04));
  const dd = Math.max(.03, .07 + .006 * Math.max(0, Math.min(20, wait) - 6) - u.np * .5 + (R() - .5) * .02);
  const nr = Math.round(att * .21), nw = Math.round(att * NEWP[k] * (u.ramp ? 1 + .4 * (1 - Math.min(1, m / 20)) : 1) * (.94 + R() * .12));
  rows.push({m, pro:pr.i, u:pr.u, rg:pr.rg, k, p, slots, us, ns, att, cx, bk:us + cx,
    rev:Math.round(att * TICK[k] * PF[p] * UP[k] * Math.pow(1.0035, m) * (.95 + R() * .1)),
    ws:wait * us, np:nr, pr:Math.round(nr * pp), de:Math.round(nr * dd), nw,
    rt:Math.round(att * RET0[k] * (.97 + (pp - .7) * .6) * (m >= LEMBRETE ? 1.03 : 1) * (.96 + R() * .08))});
}
const LW = [.10,.24,.28,.22,.16], LM = [.45,.70,1.0,1.35,1.75], LNORM = LW.reduce((a, w, i) => a + w * LM[i], 0);
const LAB = ['Mesmo dia','1 a 3 dias','4 a 7 dias','8 a 14 dias','15 dias ou mais'];

/* ========== agregação ========== */
const FLD = ['slots','us','ns','att','cx','bk','rev','ws','np','pr','de','nw','rt'];
const z0 = () => ({slots:0,us:0,ns:0,att:0,cx:0,bk:0,rev:0,ws:0,np:0,pr:0,de:0,nw:0,rt:0});
const add = (a, r) => { for (const f of FLD) a[f] += r[f]; return a; };
const safe = (a, b) => b ? a / b : 0;
const occ = x => safe(x.us, x.slots), nsr = x => safe(x.ns, x.us), wait = x => safe(x.ws, x.us), nps = x => safe(x.pr - x.de, x.np) * 100, ret = x => safe(x.rt, x.att);
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, rg:-1, u:-1, k:-1, p:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='rg'||F.rg<0||r.rg===F.rg) && (skip==='u'||F.u<0||r.u===F.u) && (skip==='k'||F.k<0||r.k===F.k) && (skip==='p'||F.p<0||r.p===F.p);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) add(a[key(r)], r); return a; }

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], pay:['#d98200','#0b7a75','#2b5fd0','#7aa7e8','#6b4fa0'], bad:'#c2362b', soft:'#b9c9c7'},
             dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], pay:['#f0b429','#2fd0a0','#6d8dff','#9fb8ff','#c39bf0'], bad:'#ff8f84', soft:'#46605e'}};
function readTheme(){
  const dark = document.documentElement.dataset.theme === 'dark', cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  T = {dark, ...PAL[dark ? 'dark' : 'light'], text:g('--text'), muted:g('--muted'), grid:g('--border'), surface:g('--surface'), primary:g('--primary')};
  Chart.defaults.color = T.muted; Chart.defaults.borderColor = T.grid;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
  Object.assign(Chart.defaults.plugins.tooltip, {backgroundColor: dark ? '#050e0d' : '#0d2321', titleColor:'#fff', bodyColor:'#e3efed', padding:10, cornerRadius:8, boxPadding:4, borderColor:T.grid, borderWidth:dark?1:0});
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
  $('#f-esp').innerHTML = opt(-1, 'Todas especialidades') + SPECS.map((r, i) => opt(i, r)).join('');
  $('#f-pag').innerHTML = opt(-1, 'Todos os pagadores') + PAYERS.map((r, i) => opt(i, i ? 'Convênio · ' + r : r)).join('');
}
const payName = p => p ? 'Convênio · ' + PAYERS[p] : PAYERS[0];
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-reg').value = F.rg; $('#f-esp').value = F.k; $('#f-pag').value = F.p;
  $('#f-uni').innerHTML = '<option value="-1">Todas as unidades</option>' + UNITS.filter(u => F.rg < 0 || u.r === F.rg).map(u => `<option value="${u.i}">${esc(u.n)}</option>`).join('');
  $('#f-uni').value = F.u;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.rg >= 0) chips.push(['rg', REGIONS[F.rg]]);
  if (F.u >= 0) chips.push(['u', UNITS[F.u].n]);
  if (F.k >= 0) chips.push(['k', SPECS[F.k]]);
  if (F.p >= 0) chips.push(['p', payName(F.p)]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; if (key === 'u' && F.u >= 0) F.rg = UNITS[F.u].r; if (key === 'rg' && F.u >= 0 && UNITS[F.u].r !== F.rg) F.u = -1; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-reg').onchange = e => { F.rg = +e.target.value; if (F.u >= 0 && UNITS[F.u].r !== F.rg && F.rg >= 0) F.u = -1; render(); };
  $('#f-uni').onchange = e => { F.u = +e.target.value; if (F.u >= 0) F.rg = UNITS[F.u].r; render(); };
  $('#f-esp').onchange = e => { F.k = +e.target.value; render(); };
  $('#f-pag').onchange = e => { F.p = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.rg = F.u = F.k = F.p = -1; render(); };
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
  const d = kind === 'pp' ? (cur - prev) * 100 : kind === 'pt' ? cur - prev : (cur / prev - 1) * 100, flat = Math.abs(d) < .05;
  const cls = flat ? 'flat' : ((d > 0) === goodUp ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${(d > 0 ? '+' : '') + N1.format(d)}${kind === 'pp' ? ' p.p.' : kind === 'pt' ? ' pts' : '%'}</span>`;
}
function kpis(M){
  const cur = sumR(M, F.from, F.to), len = F.to - F.from + 1, pf = F.from - len, prev = pf >= 0 ? sumR(M, pf, F.from - 1) : null;
  const W = M.slice(Math.max(0, F.to - 11), F.to + 1);
  const defs = [
    ['Faturamento', x => x.rev, brlC, 'rel', true],
    ['Atendimentos', x => x.att, v => N0.format(v), 'rel', true],
    ['Ocupação da agenda', occ, v => pct(v, 1), 'pp', true],
    ['Taxa de faltas', nsr, v => pct(v, 1), 'pp', false],
    ['Espera média', wait, v => N1.format(v) + ' dias', 'rel', false],
    ['NPS', nps, v => N0.format(v), 'pt', true],
    ['Retorno em 90 dias', ret, v => pct(v, 1), 'pp', true]
  ];
  $('#kpis').innerHTML = defs.map(([l, f, fm, kind, good]) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${cur.slots ? fm(f(cur)) : '—'}</div><div class="d">${cur.slots && prev ? delta(f(cur), f(prev), kind, good) : '<span class="pill flat">—</span>'}<span>vs. período anterior</span></div>${spark(W.map(f))}</article>`).join('');
  $('#empty').style.display = cur.slots ? 'none' : 'block';
}

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab);
  const tickC = {callback: v => brlC(v)};
  const monthClick = (e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); };

  mk('ch-mes', {data:{labels:labs, datasets:[
    {type:'bar', label:'Atendidos', data:ms.map(m => M[m].att), backgroundColor:ms.map(m => fade(T.primary, inR(m))), stack:'s', yAxisID:'y', order:2},
    {type:'bar', label:'Faltas', data:ms.map(m => M[m].ns), backgroundColor:ms.map(m => fade(T.bad, inR(m))), stack:'s', yAxisID:'y', order:2},
    {type:'bar', label:'Cancelados', data:ms.map(m => M[m].cx), backgroundColor:ms.map(m => fade(T.soft, inR(m))), borderRadius:{topLeft:4, topRight:4}, stack:'s', yAxisID:'y', order:2},
    {type:'line', label:'Taxa de faltas', data:ms.map(m => nsr(M[m]) * 100), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2.2, pointRadius:3, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:{callback:v => N0.format(v)}}, y2:{position:'right', min:0, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.dataset.yAxisID === 'y2' ? ` Taxa de faltas: ${N1.format(c.parsed.y)}%` : ` ${c.dataset.label}: ${N0.format(c.parsed.y)}`}}}, onClick:monthClick}});

  const sp = group(r => r.k, 'k', F.from, F.to, 8).map((x, i) => ({i, v:occ(x)})).filter(x => isFinite(x.v)).sort((a, b) => b.v - a.v);
  mk('ch-esp', {type:'bar', data:{labels:sp.map(x => SPECS[x.i]), datasets:[{data:sp.map(x => x.v * 100), backgroundColor:sp.map(x => fade(T.primary, F.k < 0 || F.k === x.i)), borderRadius:5, barThickness:20}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{display:false, min:0, max:100}, y:{grid:{display:false}}}, plugins:{legend:{display:false}, vl:{fmt:v => N0.format(v) + '%'}, tooltip:{callbacks:{label:c => ` Ocupação: ${N1.format(c.parsed.x)}%`}}}, onClick:(e, el) => { if (el.length) toggle('k', sp[el[0].index].i); }}, plugins:[valueLabels]});

  const byP = PAYERS.map(() => ms.map(() => 0)), pp = pred('p');
  for (const r of rows) if (r.m >= w0 && r.m <= F.to && pp(r)) byP[r.p][r.m - w0] += r.rev;
  mk('ch-pag', {type:'bar', data:{labels:labs, datasets:PAYERS.map((n, i) => ({label:n, data:byP[i], backgroundColor:fade(T.pay[i], F.p < 0 || F.p === i), borderRadius:2, stack:'s'}))},
    options:{interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:tickC}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('p', it.datasetIndex)}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (el.length) toggle('p', el[0].datasetIndex); }}});
  const gp = group(r => r.p, 'p', F.from, F.to, 5), tp = gp.reduce((a, x) => a + x.rev, 0);
  $('#mix').innerHTML = `Particular <b>${pct(safe(gp[0].rev, tp), 0)}</b> · Convênios <b>${pct(safe(tp - gp[0].rev, tp), 0)}</b>`;

  // antecedência do agendamento
  const ab = LAB.map(() => ({us:0, ns:0})), pa = pred();
  for (const r of rows) if (r.m >= F.from && r.m <= F.to && pa(r)) LW.forEach((w, b) => { ab[b].us += r.us * w; ab[b].ns += r.ns * w * LM[b] / LNORM; });
  mk('ch-ant', {data:{labels:LAB, datasets:[
    {type:'bar', label:'Consultas', data:ab.map(x => x.us), backgroundColor:T.primary + 'b3', borderRadius:5, yAxisID:'y', order:2},
    {type:'line', label:'% de faltas', data:ab.map(x => safe(x.ns, x.us) * 100), borderColor:T.bad, backgroundColor:T.bad, borderWidth:2.4, pointRadius:4, tension:.25, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}, ticks:{maxRotation:0, callback(v){ const l = this.getLabelForValue(v); return l.length > 11 ? l.split(' ').reduce((a, w) => (a.length && (a[a.length - 1] + ' ' + w).length < 11) ? (a[a.length - 1] += ' ' + w, a) : (a.push(w), a), []) : l; }}}, y:{...gridY, beginAtZero:true, ticks:{callback:v => v >= 1000 ? N0.format(v / 1000) + ' mil' : v}}, y2:{position:'right', min:0, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.datasetIndex ? ` Faltas: ${N1.format(c.parsed.y)}%` : ` Consultas: ${N0.format(c.parsed.y)}`}}}}});

  // bolhas por unidade
  const un = group(r => r.u, 'u', F.from, F.to, UNITS.length), mxA = Math.max(1, ...un.map(x => x.att));
  mk('ch-bol', {type:'bubble', data:{datasets:REGIONS.map((n, ri) => ({label:n, backgroundColor:T.cat[ri] + 'cc', borderColor:T.cat[ri], borderWidth:1.5,
      data:UNITS.filter(u => u.r === ri && un[u.i].slots).map(u => ({x:occ(un[u.i]) * 100, y:wait(un[u.i]), r:6 + Math.sqrt(un[u.i].att / mxA) * 18, u:u.i, att:un[u.i].att}))}))},
    options:{scales:{x:{title:{display:true, text:'Ocupação da agenda (%)'}, grid:{color:() => T.grid}, border:{display:false}, ticks:{callback:v => v + '%'}, grace:'6%'}, y:{title:{display:true, text:'Espera média (dias)'}, ...gridY, grace:'12%', beginAtZero:true}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{title:c => UNITS[c[0].raw.u].n, label:c => [` Atendimentos: ${N0.format(c.raw.att)}`, ` Ocupação: ${N1.format(c.raw.x)}%`, ` Espera: ${N1.format(c.raw.y)} dias`]}}},
      onClick:(e, el) => { if (el.length) toggle('u', CHARTS['ch-bol'].data.datasets[el[0].datasetIndex].data[el[0].index].u); }}});

  // NPS
  const cu = sumR(M, F.from, F.to);
  $('#npsmix').innerHTML = `Promotores <b>${pct(safe(cu.pr, cu.np), 0)}</b> · Neutros <b>${pct(safe(cu.np - cu.pr - cu.de, cu.np), 0)}</b> · Detratores <b>${pct(safe(cu.de, cu.np), 0)}</b>`;
  mk('ch-nps', {type:'line', data:{labels:labs, datasets:[
    {label:'NPS', data:ms.map(m => nps(M[m])), borderColor:T.primary, backgroundColor:T.primary + '26', fill:true, borderWidth:2.4, tension:.3, pointRadius:ms.map(m => inR(m) ? 4 : 2), pointBackgroundColor:ms.map(m => fade(T.primary, inR(m)))},
    {label:'Meta (70)', data:ms.map(() => 70), borderColor:T.cat[1], borderDash:[6,4], borderWidth:1.8, pointRadius:0}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, suggestedMin:50, suggestedMax:80}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.datasetIndex ? ` Meta: 70` : ` NPS: ${N1.format(c.parsed.y)}`}}}, onClick:monthClick}});

  // novos x recorrentes
  mk('ch-ret', {data:{labels:labs, datasets:[
    {type:'bar', label:'Recorrentes', data:ms.map(m => M[m].att - M[m].nw), backgroundColor:ms.map(m => fade(T.primary, inR(m))), stack:'s', yAxisID:'y', order:2},
    {type:'bar', label:'Novos', data:ms.map(m => M[m].nw), backgroundColor:ms.map(m => fade(T.cat[3], inR(m))), borderRadius:{topLeft:4, topRight:4}, stack:'s', yAxisID:'y', order:2},
    {type:'line', label:'Retorno em 90 dias', data:ms.map(m => ret(M[m]) * 100), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2.2, pointRadius:3, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}, ticks:{maxRotation:0, autoSkip:true}}, y:{stacked:true, ...gridY, ticks:{callback:v => N0.format(v)}}, y2:{position:'right', suggestedMin:30, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.dataset.yAxisID === 'y2' ? ` Retorno em 90 dias: ${N1.format(c.parsed.y)}%` : ` ${c.dataset.label}: ${N0.format(c.parsed.y)}`}}}, onClick:monthClick}});
}

/* ========== mapa de calor: dia da semana × horário ========== */
const HRS = [8,9,10,11,12,13,14,15,16,17,18], DOW = ['Seg','Ter','Qua','Qui','Sex','Sáb'];
const HF = [.90,1.05,1.08,1.03,.80,.84,1.0,1.06,1.05,.98,.88], DF = [1.02,1.03,1.02,1.0,.95,.85];
const valid = (d, h) => d < 5 || h <= 12;
const HNORM = (() => { let s = 0, n = 0; DOW.forEach((_, d) => HRS.forEach((h, j) => { if (valid(d, h)) { s += DF[d] * HF[j]; n++; } })); return s / n; })();
function heat(M){
  const o = occ(sumR(M, F.from, F.to)); let h = '<div></div>' + HRS.map(x => `<div class="h">${x}h</div>`).join('');
  DOW.forEach((dn, d) => { h += `<div class="d">${dn}</div>`; HRS.forEach((hr, j) => {
    if (!valid(d, hr)) { h += '<div class="c na" title="Sem atendimento"></div>'; return; }
    const v = Math.min(.99, o * DF[d] * HF[j] / HNORM), t = Math.max(0, Math.min(1, (v - .45) / .55));
    h += `<div class="c" style="background:color-mix(in srgb,var(--primary) ${Math.round(10 + t * 90)}%,var(--surface));color:${t > .55 ? (T.dark ? '#04201d' : '#fff') : 'var(--text)'}" title="${dn}, ${hr}h: ${N0.format(v * 100)}% de ocupação">${N0.format(v * 100)}</div>`; }); });
  $('#hm').innerHTML = o ? h : '';
}

/* ========== tabelas ========== */
const TAB = {t:'p', q:'', sort:{p:['rev', -1], u:['rev', -1]}, page:0}, PS = 8;
const bar = v => `<span class="obar"><i><b style="width:${Math.min(100, v * 100).toFixed(0)}%"></b></i>${pct(v, 0)}</span>`;
const COLS = {
  p:[['name','Profissional',v=>v],['esp','Especialidade',v=>v],['uni','Unidade',v=>v],['att','Atendimentos',v=>N0.format(v),'r'],['oc','Ocupação',bar,'r'],['ns','Faltas',v=>pct(v),'r'],['wt','Espera (dias)',v=>N1.format(v),'r'],['nps','NPS',v=>`<span class="tag ${v >= 70 ? 't-ok' : v >= 55 ? 't-warn' : 't-bad'}">${N0.format(v)}</span>`,'h'],['rev','Faturamento',v=>'R$ ' + N0.format(v),'r']],
  u:[['name','Unidade',v=>v],['reg','Região',v=>v],['rev','Faturamento',v=>'R$ ' + N0.format(v),'r'],['dl','Var. vs anterior',v=>v == null ? '—' : (v > 0 ? '+' : '') + N1.format(v * 100) + '%','r'],['att','Atendimentos',v=>N0.format(v),'r'],['oc','Ocupação',bar,'r'],['ns','Faltas',v=>pct(v),'r'],['wt','Espera (dias)',v=>N1.format(v),'r'],['nps','NPS',v=>N0.format(v),'r'],['rt','Retorno 90d',v=>pct(v),'r']]
};
let PRO_ROWS = [], UNIT_ROWS = [];
function calcTables(){
  const a = group(r => r.pro, null, F.from, F.to, PROS.length);
  PRO_ROWS = PROS.filter(p => a[p.i].slots && (F.u < 0 || p.u === F.u) && (F.k < 0 || p.k === F.k) && (F.rg < 0 || p.rg === F.rg)).map(p => { const x = a[p.i]; return {i:p.i, name:p.n, esp:SPECS[p.k], uni:UNITS[p.u].n, att:x.att, oc:occ(x), ns:nsr(x), wt:wait(x), nps:nps(x), rev:x.rev}; });
  const len = F.to - F.from + 1, pf = F.from - len, g = group(r => r.u, 'u', F.from, F.to, UNITS.length), b = pf >= 0 ? group(r => r.u, 'u', pf, F.from - 1, UNITS.length) : null;
  UNIT_ROWS = UNITS.filter(u => g[u.i].slots).map(u => { const x = g[u.i]; return {i:u.i, name:u.n, reg:REGIONS[u.r], rev:x.rev, dl:b && b[u.i].rev ? x.rev / b[u.i].rev - 1 : null, att:x.att, oc:occ(x), ns:nsr(x), wt:wait(x), nps:nps(x), rt:ret(x)}; });
}
function tableRows(){
  const cols = COLS[TAB.t], src = TAB.t === 'p' ? PRO_ROWS : UNIT_ROWS, q = TAB.q.trim().toLowerCase();
  let out = q ? src.filter(r => cols.map(c => r[c[0]]).join(' ').toLowerCase().includes(q)) : src.slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  return out;
}
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${c[3] === 'r' ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS);
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="${TAB.t === 'u' ? 'click' : ''} ${TAB.t === 'u' && r.i === F.u ? 'sel' : ''}" ${TAB.t === 'u' ? `data-u="${r.i}" title="Filtrar por esta unidade"` : ''}>` + cols.map(c => `<td class="${c[3] === 'r' ? 'r num' : ''}">${c[2](r[c[0]])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted)">Nada encontrado para a busca.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; $('#tab-p').setAttribute('aria-selected', t === 'p'); $('#tab-u').setAttribute('aria-selected', t === 'u'); table(); };
  $('#tab-p').onclick = () => tab('p'); $('#tab-u').onclick = () => tab('u');
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof (TAB.t === 'p' ? PRO_ROWS : UNIT_ROWS)[0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-u]'); if (tr) toggle('u', +tr.dataset.u); };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], fmt = v => v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `meridiana_${TAB.t === 'p' ? 'profissionais' : 'unidades'}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); charts(M); heat(M); calcTables(); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('mer-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('mer-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
