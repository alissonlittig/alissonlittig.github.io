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

const UNITS = ['Curitiba','São Paulo','Belo Horizonte','Recife'], US = [.26,.38,.20,.16];
const AREAS = ['Operações','Atendimento','Comercial','Tecnologia','Financeiro','Pessoas e Cultura'], AS = [.36,.24,.16,.12,.07,.05];
const LV = ['Operacional','Analista','Liderança'];
const LW = [[.78,.17,.05],[.80,.14,.06],[.45,.43,.12],[.15,.68,.17],[.25,.62,.13],[.20,.65,.15]];
const TURN = [.26,.38,.27,.21,.12,.10], TURN_L = [1.2,.9,.45], TURN_U = [.95,1,.9,1.15], VOLSH = [.62,.74,.70,.68,.60,.55];
const TURN_S = [1.25,1.2,1,.95,.95,1,1.1,1,.95,.95,.9,.85];            // jan/fev puxam desligamentos (pós-bônus de fim de ano)
const GROW = [.004,.006,.009,.014,.005,.006];
const TTH = [24,18,28,46,38,34], TTH_L = [.8,1.1,1.7], TTH_U = [1,.95,1.05,1.1];
const ACC = [.84,.86,.76,.70,.78,.80], F_ENT = [3.2,2.8,3.8,4.6,4.0,4.2], F_TRI = [2.6,3.2,2.9,3.4,3.0,3.1], F_CAND = [3.5,4.2,3.8,5.0,4.4,4.6];
const ABS = [.044,.052,.026,.021,.018,.019], ABS_L = [1.25,.95,.55];
const ABS_S = [.95,.9,.95,1,1.05,1.2,1.3,1.15,1,.95,.95,1.05];            // inverno (jun a ago) pesa mais
const SAL = [[2900,5200,11000],[2300,4200,8800],[3300,6400,13500],[4500,8800,18000],[3600,7000,15500],[3400,6600,14000]], SAL_U = [.97,1.1,.98,.93], ENC = 1.78;
const TRH = [4.5,3.8,3.0,5.2,2.6,3.4], TRP = [.55,.5,.5,.62,.48,.58];
const TR_S = [.6,.8,1.1,1.1,1.1,1.1,.7,1.1,1.2,1.2,1.1,.5];
const ENPS = [18,4,22,36,31,44], ENPS_L = [-3,0,12], ENPS_U = [4,6,-3,-7];
const FEM = [.28,.68,.46,.31,.55,.76], FEM_L = [1,1,.78], NEG = [.46,.50,.34,.28,.31,.40], NEG_L = [1.05,.9,.45];
const KEYS = ['hc','adm','tv','ti','abs','wd','pay','trh','trp','resp','pro','det','tts','cand','tri','ent','prop','fem','neg'];
const ev = x => Math.floor(x + R());                                      // arredondamento estocástico (mantém a esperança)

const rows = [];
for (let u = 0; u < 4; u++) for (let a = 0; a < 6; a++) for (let l = 0; l < 3; l++) {
  let hc = Math.max(1, Math.round(1160 * US[u] * AS[a] * LW[a][l]));
  for (let m = 0; m < NM; m++) {
    const cm = cal(m), tr = 1 - .006 * m;
    const rate = TURN[a] * TURN_L[l] * TURN_U[u] * tr * TURN_S[cm] / 12 * (.9 + R() * .2);
    const term = Math.min(hc, ev(hc * rate));
    let tv = 0; for (let i = 0; i < term; i++) if (R() < VOLSH[a]) tv++;
    const adm = ev(hc * (rate + GROW[a]) * (.9 + R() * .2));
    hc = hc + adm - term;
    const tth = TTH[a] * TTH_L[l] * TTH_U[u] * (1 - .004 * m) * (.9 + R() * .2);
    const prop = Math.round(adm / (ACC[a] * (.95 + R() * .1)));
    const ent = Math.round(prop * F_ENT[a] * (.9 + R() * .2)), tri = Math.round(ent * F_TRI[a] * (.9 + R() * .2)), cand = Math.round(tri * F_CAND[a] * (.9 + R() * .2));
    const wd = hc * 21, abs = Math.round(wd * ABS[a] * ABS_L[l] * ABS_S[cm] * (1 - .003 * m) * (.9 + R() * .2));
    const raise = m >= 18 ? 1.113 : m >= 6 ? 1.055 : 1;                  // dissídio em maio
    const pay = Math.round(hc * SAL[a][l] * SAL_U[u] * ENC * raise * (cm === 11 ? 1.42 : cm === 10 ? 1.1 : 1) * (.98 + R() * .04));
    const ts = TR_S[cm] * (1 + .008 * m), trh = Math.round(hc * TRH[a] * ts * (.9 + R() * .2)), trp = Math.min(hc, Math.round(hc * Math.min(.95, TRP[a] * ts * (.92 + R() * .16))));
    const e = ENPS[a] + ENPS_L[l] + ENPS_U[u] + .3 * m + (R() - .5) * 6, resp = Math.round(hc * .72 * (.95 + R() * .1));
    const pro = Math.round(resp * (.72 + e / 100) / 2), det = Math.round(resp * (.72 - e / 100) / 2);
    const fem = Math.round(hc * Math.min(.95, FEM[a] * FEM_L[l] + .0012 * m)), neg = Math.round(hc * Math.min(.95, NEG[a] * NEG_L[l] + .0015 * m));
    rows.push({m, u, a, l, hc, adm, tv, ti: term - tv, abs, wd, pay, trh, trp, resp, pro, det, tts: Math.round(adm * tth), cand, tri, ent, prop, fem, neg});
  }
}

/* ========== agregação ========== */
const z0 = () => { const o = {hce: 0}; for (const k of KEYS) o[k] = 0; return o; };
const add = (a, r) => { for (const k of KEYS) a[k] += r[k]; return a; };
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, u:-1, a:-1, l:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='u'||F.u<0||r.u===F.u) && (skip==='a'||F.a<0||r.a===F.a) && (skip==='l'||F.l<0||r.l===F.l);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); a.forEach(x => x.hce = x.hc); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); s.hce = a[t].hc; return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) { const g = a[key(r)]; add(g, r); if (r.m === t) g.hce += r.hc; } return a; }
const safe = (a, b) => b ? a / b : 0;
function stats(x, len){
  const avg = safe(x.hc, len), des = x.tv + x.ti;
  return {hc:x.hce, adm:x.adm, des, turn:safe(des, avg) * 12 / len, vol:safe(x.tv, avg) * 12 / len, inv:safe(x.ti, avg) * 12 / len, abs:safe(x.abs, x.wd), tth:x.adm ? x.tts / x.adm : null,
    pay:x.pay / len, enps:x.resp ? (x.pro - x.det) / x.resp * 100 : null, trh:safe(x.trh, x.hc), trp:safe(x.trp, x.hc), fem:safe(x.fem, x.hc), neg:safe(x.neg, x.hc)};
}

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const sgn = (v, d=0) => (v > 0 ? '+' : '') + nf(d).format(v);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], st:['#c2362b','#e69f00','#12805c','#7a8aa6'], warm:'#d4553f', vol:'#7c3aed', inv:'#c9b5f5'},
             dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], st:['#ff8f84','#ffc15e','#4cd6a0','#8a9ab6'], warm:'#ff8f84', vol:'#b79cff', inv:'#5b4a99'}};
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
const tickM = {callback: v => brlC(v)};
// rótulo no fim da barra horizontal (dataset o.ds); o.fmt(i) devolve o texto
const endLabels = {id:'el', afterDatasetsDraw(ch, a, o){ if (!o.fmt) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
  ch.getDatasetMeta(o.ds || 0).data.forEach((b, i) => c.fillText(o.fmt(i), Math.max(b.x, b.base) + 6, b.y)); c.restore(); }};
// rótulo acima das barras verticais, em todos os datasets
const topLabels = {id:'tl', afterDatasetsDraw(ch, a, o){ if (!o.fmt) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 11.5px ' + Chart.defaults.font.family; c.textAlign = 'center';
  ch.data.datasets.forEach((d, di) => ch.getDatasetMeta(di).data.forEach((b, i) => c.fillText(o.fmt(d.data[i]), b.x, b.y - 5))); c.restore(); }};

/* ========== filtros ========== */
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-uni').innerHTML = opt(-1, 'Todas as unidades') + UNITS.map((r, i) => opt(i, r)).join('');
  $('#f-are').innerHTML = opt(-1, 'Todas as áreas') + AREAS.map((r, i) => opt(i, r)).join('');
  $('#f-niv').innerHTML = opt(-1, 'Todos os níveis') + LV.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-uni').value = F.u; $('#f-are').value = F.a; $('#f-niv').value = F.l;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.u >= 0) chips.push(['u', UNITS[F.u]]);
  if (F.a >= 0) chips.push(['a', AREAS[F.a]]);
  if (F.l >= 0) chips.push(['l', LV[F.l]]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-uni').onchange = e => { F.u = +e.target.value; render(); };
  $('#f-are').onchange = e => { F.a = +e.target.value; render(); };
  $('#f-niv').onchange = e => { F.l = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.u = F.a = F.l = -1; render(); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (k === 'per') setPreset('12'); else F[k] = -1; render(); };
}

/* ========== KPIs ========== */
const spark = vals => { const mx = Math.max(...vals), mn = Math.min(...vals), W = 100, H = 34, d = mx - mn || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 3 - (v - mn) / d * (H - 8)]);
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${H} ${line} ${W},${H}" fill="${T.primary}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${T.primary}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`; };
const ARROW = {up:'<svg viewBox="0 0 10 10"><path d="M5 1l4 6H1z"/></svg>', down:'<svg viewBox="0 0 10 10"><path d="M5 9L1 3h8z"/></svg>'};
// goodUp: true = subir é bom · false = subir é ruim · null = neutro
function delta(cur, prev, kind, goodUp){
  if (prev == null || cur == null || !isFinite(prev) || prev === 0) return '<span class="pill flat">—</span>';
  const d = kind === 'pp' ? (cur - prev) * 100 : kind === 'pt' ? cur - prev : (cur / prev - 1) * 100, flat = Math.abs(d) < .05;
  const cls = flat || goodUp === null ? 'flat' : ((d > 0) === goodUp ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${sgn(d, kind === 'pt' ? 0 : 1)}${kind === 'pp' ? ' p.p.' : kind === 'pt' ? ' pts' : '%'}</span>`;
}
function kpis(M){
  const len = F.to - F.from + 1, pf = F.from - len, cur = stats(sumR(M, F.from, F.to), len), prev = pf >= 0 ? stats(sumR(M, pf, F.from - 1), len) : null;
  const w0 = Math.max(0, F.to - 11), W = M.slice(w0, F.to + 1), S = W.map((x, i) => stats(x, 1));
  let last = 0; const tthS = S.map(s => (s.tth != null && (last = s.tth), last));
  const defs = [
    ['Headcount', 'hc', v => N0.format(v), 'rel', true, S.map(s => s.hc)],
    ['Turnover anualizado', 'turn', v => pct(v, 1), 'pp', false, S.map(s => s.turn)],
    ['Absenteísmo', 'abs', v => pct(v, 1), 'pp', false, S.map(s => s.abs)],
    ['Tempo de contratação', 'tth', v => N0.format(v) + ' dias', 'rel', false, tthS],
    ['Folha mensal', 'pay', brlC, 'rel', null, S.map(s => s.pay)],
    ['eNPS', 'enps', v => sgn(v, 0), 'pt', true, S.map(s => s.enps ?? 0)]
  ];
  const ok = cur.hc > 0;
  $('#kpis').innerHTML = defs.map(([l, k, fm, kind, good, sp]) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${ok && cur[k] != null ? fm(cur[k]) : '—'}</div><div class="d">${ok && prev ? delta(cur[k], prev[k], kind, good) : '<span class="pill flat">—</span>'}<span>${k === 'hc' ? 'fim do período vs. anterior' : 'vs. período anterior'}</span></div>${spark(sp)}</article>`).join('');
  $('#empty').style.display = ok ? 'none' : 'block';
}

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab), len = F.to - F.from + 1;
  const pickMonth = (e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); };

  // headcount e movimentação
  mk('ch-hc', {data:{labels:labs, datasets:[
    {type:'bar', label:'Admissões', data:ms.map(m => M[m].adm), backgroundColor:ms.map(m => fade(T.st[2], inR(m))), borderRadius:3, stack:'s', yAxisID:'y', order:2},
    {type:'bar', label:'Desligamentos', data:ms.map(m => -(M[m].tv + M[m].ti)), backgroundColor:ms.map(m => fade(T.st[0], inR(m))), borderRadius:3, stack:'s', yAxisID:'y', order:2},
    {type:'line', label:'Headcount', data:ms.map(m => M[m].hc), borderColor:T.primary, backgroundColor:T.primary, borderWidth:2.4, pointRadius:3, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:{callback:v => Math.abs(v)}, title:{display:true, text:'Pessoas no mês'}}, y2:{position:'right', grid:{display:false}, border:{display:false}, grace:'15%', title:{display:true, text:'Headcount'}, ticks:{callback:v => N0.format(v)}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.datasetIndex === 1 ? ` Desligamentos: ${N0.format(-c.parsed.y)}` : ` ${c.dataset.label}: ${N0.format(c.parsed.y)}`}}}, onClick:pickMonth}});

  // diversidade por nível
  const lv = group(r => r.l, 'l', F.from, F.to, 3).map(x => stats(x, len));
  mk('ch-div', {type:'bar', data:{labels:LV, datasets:[
    {label:'Mulheres', data:lv.map(s => s.fem * 100), backgroundColor:LV.map((_, i) => fade(T.cat[3], F.l < 0 || F.l === i)), borderRadius:4},
    {label:'Pretas e pardas', data:lv.map(s => s.neg * 100), backgroundColor:LV.map((_, i) => fade(T.cat[2], F.l < 0 || F.l === i)), borderRadius:4}]},
    options:{layout:{padding:{top:18}}, scales:{x:{grid:{display:false}}, y:{...gridY, beginAtZero:true, suggestedMax:70, ticks:{callback:v => v + '%', maxTicksLimit:5}}},
      plugins:{legend:{position:'bottom'}, tl:{fmt:v => N0.format(v) + '%'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${N1.format(c.parsed.y)}%`}}}, onClick:(e, el) => { if (el.length) toggle('l', el[0].index); }}, plugins:[topLabels]});

  // turnover por área
  const ar = group(r => r.a, 'a', F.from, F.to, 6).map((x, i) => ({i, ...stats(x, len)})).sort((a, b) => b.turn - a.turn);
  mk('ch-tur', {type:'bar', data:{labels:ar.map(x => AREAS[x.i]), datasets:[
    {label:'Voluntário', data:ar.map(x => x.vol * 100), backgroundColor:ar.map(x => fade(T.vol, F.a < 0 || F.a === x.i)), stack:'s', borderRadius:3},
    {label:'Involuntário', data:ar.map(x => x.inv * 100), backgroundColor:ar.map(x => fade(T.inv, F.a < 0 || F.a === x.i)), stack:'s', borderRadius:3}]},
    options:{indexAxis:'y', layout:{padding:{right:52}}, interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, ...gridY, beginAtZero:true, ticks:{callback:v => v + '%', maxTicksLimit:6}}, y:{stacked:true, grid:{display:false}}},
      plugins:{legend:{position:'bottom'}, el:{ds:1, fmt:i => pct(ar[i].turn, 1)}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${N1.format(c.parsed.x)}% a.a.`}}}, onClick:(e, el) => { if (el.length) toggle('a', ar[el[0].index].i); }}, plugins:[endLabels]});

  // absenteísmo mensal
  const absAt = m => { const s = M[m]; return safe(s.abs, s.wd) * 100; };
  mk('ch-abs', {type:'line', data:{labels:labs, datasets:[
    {label:'Absenteísmo', data:ms.map(absAt), borderColor:T.primary, backgroundColor:T.primary + '22', fill:true, borderWidth:2.4, tension:.3, pointRadius:ms.map(m => inR(m) ? 4 : 2), pointBackgroundColor:ms.map(m => fade(T.primary, inR(m)))},
    {label:'Ano anterior', data:ms.map(m => m >= 12 ? absAt(m - 12) : null), borderColor:T.cat[1], borderDash:[5,4], borderWidth:2, pointRadius:2.5, pointBackgroundColor:T.cat[1], tension:.3},
    {label:'Meta', data:ms.map(() => 3.5), borderColor:T.muted, borderDash:[2,3], borderWidth:1.5, pointRadius:0}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, suggestedMin:0, ticks:{callback:v => N1.format(v) + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${N2.format(c.parsed.y)}%`}}}, onClick:pickMonth}});

  // funil de recrutamento
  const tot = sumR(M, F.from, F.to), st = [tot.cand, tot.tri, tot.ent, tot.prop, tot.adm], SN = ['Candidaturas','Triagem aprovada','Entrevistas','Propostas','Contratações'];
  const ss = stats(tot, len);
  $('#fmeta').innerHTML = `<span>Tempo médio de contratação: <b class="num">${ss.tth != null ? N0.format(ss.tth) + ' dias' : '—'}</b></span><span>Candidaturas por contratação: <b class="num">${tot.adm ? N0.format(tot.cand / tot.adm) : '—'}</b></span><span>Aceite das propostas: <b class="num">${tot.prop ? pct(tot.adm / tot.prop, 0) : '—'}</b></span>`;
  mk('ch-fun', {type:'bar', data:{labels:SN, datasets:[{data:st, backgroundColor:[T.primary + 'ff', T.primary + 'd0', T.primary + 'a0', T.primary + '78', T.st[2]], borderRadius:5, barThickness:30}]},
    options:{indexAxis:'y', layout:{padding:{right:92}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}}},
      plugins:{legend:{display:false}, el:{fmt:i => N0.format(st[i]) + (i ? ' · ' + pct(safe(st[i], st[i - 1]), 0) : '')}, tooltip:{callbacks:{label:c => ` ${N0.format(c.parsed.x)}` + (c.dataIndex ? ` (${pct(safe(c.parsed.x, st[c.dataIndex - 1]), 1)} da etapa anterior)` : '')}}}}, plugins:[endLabels]});

  // eNPS por área
  const en = group(r => r.a, 'a', F.from, F.to, 6).map((x, i) => ({i, v:stats(x, len).enps ?? 0})).sort((a, b) => b.v - a.v);
  const zone = v => v >= 30 ? T.st[2] : v >= 0 ? T.st[1] : T.st[0];
  mk('ch-enps', {type:'bar', data:{labels:en.map(x => AREAS[x.i]), datasets:[{data:en.map(x => x.v), backgroundColor:en.map(x => fade(zone(x.v), F.a < 0 || F.a === x.i)), borderRadius:5, barThickness:24}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{...gridY, ticks:{maxTicksLimit:7}, suggestedMin:-10}, y:{grid:{display:false}}},
      plugins:{legend:{display:false}, el:{fmt:i => sgn(en[i].v, 0)}, tooltip:{callbacks:{label:c => ` eNPS: ${sgn(c.parsed.x, 1)}`}}}, onClick:(e, el) => { if (el.length) toggle('a', en[el[0].index].i); }}, plugins:[endLabels]});

  // folha por área (todas as áreas visíveis; a selecionada fica em destaque)
  const fol = AREAS.map(() => ms.map(() => 0)), pp = pred('a');
  for (const r of rows) if (r.m >= w0 && r.m <= F.to && pp(r)) fol[r.a][r.m - w0] += r.pay;
  mk('ch-fol', {type:'bar', data:{labels:labs, datasets:AREAS.map((n, i) => ({label:n, data:fol[i], backgroundColor:fade(T.cat[i], F.a < 0 || F.a === i), borderRadius:2, stack:'s'}))},
    options:{interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:tickM}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('a', it.datasetIndex)}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}}, onClick:(e, el) => { if (el.length) toggle('a', el[0].datasetIndex); }}});

  // treinamentos
  mk('ch-tre', {data:{labels:labs, datasets:[
    {type:'bar', label:'Horas por colaborador', data:ms.map(m => safe(M[m].trh, M[m].hc)), backgroundColor:ms.map(m => fade(T.primary, inR(m))), borderRadius:4, yAxisID:'y', order:2},
    {type:'line', label:'% treinados no mês', data:ms.map(m => safe(M[m].trp, M[m].hc) * 100), borderColor:T.cat[1], backgroundColor:T.cat[1], borderWidth:2, pointRadius:2.5, tension:.3, yAxisID:'y2', order:1}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, beginAtZero:true, ticks:{callback:v => v + ' h'}}, y2:{position:'right', min:0, max:100, grid:{display:false}, border:{display:false}, ticks:{callback:v => v + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.datasetIndex ? ` ${c.dataset.label}: ${N0.format(c.parsed.y)}%` : ` ${c.dataset.label}: ${N1.format(c.parsed.y)} h`}}}, onClick:pickMonth}});
}

/* ========== tabela ========== */
const TAB = {t:'e', q:'', sort:{e:['hc', -1], a:['hc', -1], u:['hc', -1]}, page:0}, PS = 8;
const dash = f => v => v == null ? '—' : f(v);
const MET = [['hc','Headcount',v=>N0.format(v),'r'],['adm','Admissões',v=>N0.format(v),'r'],['des','Desligamentos',v=>N0.format(v),'r'],['turn','Turnover a.a.',v=>pct(v),'r'],['abs','Absenteísmo',v=>pct(v),'r'],
  ['tth','Contratação (dias)',dash(v=>N0.format(v)),'r'],['pay','Folha mensal',v=>'R$ '+N0.format(v),'r'],['enps','eNPS',dash(v=>sgn(v)),'r']];
const COLS = {e:[['name','Equipe',v=>v],['unit','Unidade',v=>v],...MET], a:[['name','Área',v=>v],...MET], u:[['name','Unidade',v=>v],...MET]};
let ROWS = {e:[], a:[], u:[]};
function tableCalc(){
  const len = F.to - F.from + 1, mk2 = (key, n, skip, nm, extra) => group(key, skip, F.from, F.to, n).map((x, i) => ({i, name:nm(i), ...(extra ? extra(i) : {}), ...stats(x, len), _hc:x.hc})).filter(r => r._hc);
  ROWS.a = mk2(r => r.a, 6, 'a', i => AREAS[i]);
  ROWS.u = mk2(r => r.u, 4, 'u', i => UNITS[i]);
  ROWS.e = mk2(r => r.a * 4 + r.u, 24, null, i => AREAS[i >> 2], i => ({a:i >> 2, u:i & 3, unit:UNITS[i & 3]}));
}
function tableRows(){
  const cols = COLS[TAB.t], q = TAB.q.trim().toLowerCase(), txt = r => cols.map(c => r[c[0]]).join(' ').toLowerCase();
  const out = q ? ROWS[TAB.t].filter(r => txt(r).includes(q)) : ROWS[TAB.t].slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  return out;
}
const isSel = r => TAB.t === 'a' ? r.i === F.a : TAB.t === 'u' ? r.i === F.u : (r.a === F.a && r.u === F.u);
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${c[3] === 'r' ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS);
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="click ${isSel(r) ? 'sel' : ''}" data-i="${r.i}" title="Filtrar por esta linha">` + cols.map(c => `<td class="${c[3] === 'r' ? 'r num' : ''}">${c[2](r[c[0]])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:24px">Nenhum resultado.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; for (const x of 'eau') $('#tab-' + x).setAttribute('aria-selected', x === t); table(); };
  $('#tab-e').onclick = () => tab('e'); $('#tab-a').onclick = () => tab('a'); $('#tab-u').onclick = () => tab('u');
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof ROWS[TAB.t][0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-i]'); if (!tr) return; const r = ROWS[TAB.t].find(x => x.i === +tr.dataset.i);
    if (TAB.t === 'a') toggle('a', r.i); else if (TAB.t === 'u') toggle('u', r.i); else if (isSel(r)) { F.a = F.u = -1; render(); } else { F.a = r.a; F.u = r.u; render(); } };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], fmt = v => v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `orla-rh_${{e:'equipes', a:'areas', u:'unidades'}[TAB.t]}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); charts(M); tableCalc(); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('orla-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('orla-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
