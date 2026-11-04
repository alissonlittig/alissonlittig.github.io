(() => {
'use strict';
const $ = s => document.querySelector(s);
const {NM, cal, mlab, REGIONS, PLANS, CHN, REPS, CU, OP, K, Q} = window.SAAS;
const GM = .8, LIFE_MAX = 48, PROB = [.2, .45, .7], STG = ['Oportunidade','Proposta','Negociação'];

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N0.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a >= 1e7 ? 1 : 2).format(v / 1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v / 1e3) + ' mil' : 'R$ ' + N0.format(v); };
const shortC = v => { const a = Math.abs(v); return a >= 1e6 ? N2.format(v / 1e6) + ' mi' : a >= 1e3 ? N0.format(v / 1e3) + ' mil' : N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const safe = (a, b) => b ? a / b : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== filtros e agregação ========== */
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, rg:-1, pl:-1, ch:-1, rep:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => o => (skip==='rg'||F.rg<0||o.rg===F.rg) && (skip==='pl'||F.pl<0||o.p===F.pl) && (skip==='ch'||F.ch<0||o.ch===F.ch) && (skip==='rep'||F.rep<0||o.rep===F.rep);

/* movimentos de MRR por mês: sobre clientes filtrados */
function mov(skip){
  const p = pred(skip), A = Array.from({length: NM}, () => ({mrr:0,n:0,nw:0,nwn:0,ex:0,co:0,ch:0,chn:0}));
  for (const c of CU) { if (!p(c)) continue; const a = c.mrr;
    for (let m = 0; m < NM; m++) { const v = a[m], pv = m ? a[m - 1] : v, o = A[m];
      if (v > 0) { o.mrr += v; o.n++; }
      if (m === c.start) { o.nw += v; o.nwn++; }
      else if (m > 0) { if (pv > 0 && v === 0) { o.ch += pv; o.chn++; } else if (pv > 0 && v > pv) o.ex += v - pv; else if (v > 0 && v < pv) o.co += pv - v; }
    } }
  return A;
}
const sum = (A, k, a, b) => { let s = 0; for (let m = Math.max(0, a); m <= b; m++) s += A[m][k]; return s; };
const startMrr = (A, f) => f > 0 ? A[f - 1].mrr : A[0].mrr - A[0].nw;
function nrr(p, t){ if (t < 12) return null; let a = 0, b = 0; for (const c of CU) if (p(c) && c.mrr[t - 12] > 0) { a += c.mrr[t - 12]; b += c.mrr[t]; } return a ? b / a : null; }
function econ(p, f, t){
  let n = 0, v = 0, cac = 0, ex = 0, cn = 0;
  for (const c of CU) { if (!p(c)) continue; const a = c.mrr;
    if (c.start >= f && c.start <= t) { n++; v += a[c.start]; cac += c.cac; }
    for (let m = Math.max(1, t - 11); m <= t; m++) if (a[m - 1] > 0) { ex++; if (a[m] === 0) cn++; } }
  const churn = Math.max(.004, ex ? cn / ex : .02), life = Math.min(1 / churn, LIFE_MAX), arpa = n ? v / n : 0, c0 = n ? cac / n : 0;
  return {n, cac:c0, arpa, churn, life, ltv:arpa * GM * life, ratio:c0 ? arpa * GM * life / c0 : null, payback:arpa ? c0 / (arpa * GM) : null};
}
const oppIn = (p, f, t) => OP.filter(o => o.st !== 'O' && o.m >= f && o.m <= t && p(o));

/* ========== tema e cores ========== */
let T = {};
const PAL = {
  light:{plan:['#b7bcf6','#6a6fe0','#2a2a9a'], ch:['#0072B2','#E69F00','#009E73','#CC79A7'], st:['#c2362b','#e69f00','#12805c','#7a8aa6'], fun:['#c4c7f7','#a3a8f3','#7f84ea','#5b5fd8','#4a4ac4','#33349e'], heat:['#ecedfd','#cdd0fa','#a3a8f3','#5b5fd8','#3a3cb5'], heatTx:['#0e1a2e','#0e1a2e','#0e1a2e','#fff','#fff'], warm:'#d4553f', acc:'#e69f00'},
  dark:{plan:['#3d4296','#6f75e6','#c3c7ff'], ch:['#56B4E9','#F0B429','#2FD0A0','#E58FC2'], st:['#ff8f84','#ffc15e','#4cd6a0','#8a9ab6'], fun:['#3d4296','#4b50c2','#6168dc','#7f86ef','#a3a9fb','#c9ccff'], heat:['#232650','#34388a','#4b50c2','#8a90f5','#c9ccff'], heatTx:['#e9eef9','#e9eef9','#fff','#0a1120','#0a1120'], warm:'#ff8f84', acc:'#F0B429'}
};
function readTheme(){
  const dark = document.documentElement.dataset.theme === 'dark', cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  T = {dark, ...PAL[dark ? 'dark' : 'light'], text:g('--text'), muted:g('--muted'), grid:g('--border'), surface:g('--surface'), primary:g('--primary')};
  Chart.defaults.color = T.muted; Chart.defaults.borderColor = T.grid;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
  Object.assign(Chart.defaults.plugins.tooltip, {backgroundColor: dark ? '#0a1120' : '#0e1a2e', titleColor:'#fff', bodyColor:'#e5ebf7', footerColor:'#e5ebf7', padding:10, cornerRadius:8, boxPadding:4, borderColor:T.grid, borderWidth:dark ? 1 : 0});
  Chart.defaults.plugins.legend.labels.usePointStyle = true; Chart.defaults.plugins.legend.labels.boxWidth = 8;
}
const fade = (c, on) => on ? c : c + '4d';
const CHARTS = {};
function mk(id, cfg){ if (CHARTS[id]) CHARTS[id].destroy(); cfg.options = Object.assign({responsive:true, maintainAspectRatio:false, animation:{duration:350}}, cfg.options); return CHARTS[id] = new Chart($('#' + id), cfg); }
const gridY = {grid:{color:() => T.grid}, border:{display:false}};
const tickC = {callback: v => brlC(v)};
/* rótulo ao lado da barra: fn(valor, índice) → texto; dataset 0 */
const sideLabels = {id:'sl', afterDatasetsDraw(ch, a, o){ if (!o.fn) return; const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
  ch.getDatasetMeta(o.ds || 0).data.forEach((b, i) => { c.fillText(o.fn(i), (o.horizontalEnd ? Math.max(b.x, b.base) : b.x) + 6, b.y); }); c.restore(); }};

/* ========== filtros: UI ========== */
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-reg').innerHTML = opt(-1, 'Todas as regiões') + REGIONS.map((r, i) => opt(i, r)).join('');
  $('#f-pl').innerHTML = opt(-1, 'Todos os planos') + PLANS.map((r, i) => opt(i, r)).join('');
  $('#f-ch').innerHTML = opt(-1, 'Todos os canais') + CHN.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-reg').value = F.rg; $('#f-pl').value = F.pl; $('#f-ch').value = F.ch;
  $('#f-rep').innerHTML = '<option value="-1">Todos os vendedores</option>' + REPS.filter(r => F.rg < 0 || r.rg === F.rg).map(r => `<option value="${r.i}">${esc(r.n)}</option>`).join('');
  $('#f-rep').value = F.rep;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.rg >= 0) chips.push(['rg', REGIONS[F.rg]]);
  if (F.pl >= 0) chips.push(['pl', 'Plano ' + PLANS[F.pl]]);
  if (F.ch >= 0) chips.push(['ch', CHN[F.ch]]);
  if (F.rep >= 0) chips.push(['rep', REPS[F.rep].n]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; if (key === 'rep' && F.rep >= 0) F.rg = REPS[F.rep].rg; if (key === 'rg' && F.rep >= 0 && REPS[F.rep].rg !== F.rg) F.rep = -1; render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-reg').onchange = e => { F.rg = +e.target.value; if (F.rep >= 0 && F.rg >= 0 && REPS[F.rep].rg !== F.rg) F.rep = -1; render(); };
  $('#f-pl').onchange = e => { F.pl = +e.target.value; render(); };
  $('#f-ch').onchange = e => { F.ch = +e.target.value; render(); };
  $('#f-rep').onchange = e => { F.rep = +e.target.value; if (F.rep >= 0) F.rg = REPS[F.rep].rg; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.rg = F.pl = F.ch = F.rep = -1; render(); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (k === 'per') setPreset('12'); else F[k] = -1; render(); };
}

/* ========== KPIs ========== */
const spark = vals => { if (vals.length < 2) return ''; const mx = Math.max(...vals), mn = Math.min(...vals), W = 100, H = 34, d = mx - mn || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 3 - (v - mn) / d * (H - 8)]);
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${H} ${line} ${W},${H}" fill="${T.primary}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${T.primary}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`; };
const ARROW = {up:'<svg viewBox="0 0 10 10"><path d="M5 1l4 6H1z"/></svg>', down:'<svg viewBox="0 0 10 10"><path d="M5 9L1 3h8z"/></svg>'};
function delta(cur, prev, kind, goodUp){
  if (cur == null || prev == null || !isFinite(prev) || prev === 0) return '<span class="pill flat">—</span>';
  const d = kind === 'pp' ? (cur - prev) * 100 : (cur / prev - 1) * 100, flat = Math.abs(d) < .05;
  const cls = flat ? 'flat' : ((d > 0) === goodUp ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${(d > 0 ? '+' : '') + N1.format(d)}${kind === 'pp' ? ' p.p.' : '%'}</span>`;
}
function kpis(A){
  const f = F.from, t = F.to, len = t - f + 1, pf = f - len, w0 = Math.max(0, t - 11), p = pred(), cr = (a, b) => safe(sum(A, 'ch', Math.max(1, a), b), (() => { let s = 0; for (let m = Math.max(1, a); m <= b; m++) s += A[m - 1].mrr; return s; })());
  const e = econ(p, f, t), ep = pf >= 0 ? econ(p, pf, f - 1) : null;
  const nr = nrr(p, t), nrp = f - 1 >= 12 ? nrr(p, f - 1) : null;
  const win = []; for (let m = w0; m <= t; m++) win.push(m);
  const nrS = win.map(m => nrr(p, m)).filter(v => v != null);
  const card = (l, v, d, sub, sp) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${v}</div><div class="d">${d}<span>${sub}</span></div>${sp}</article>`;
  const ratioBar = e.ratio == null ? '' : `<svg class="spark" viewBox="0 0 100 34" aria-hidden="true"><rect x="0" y="14" width="100" height="8" rx="4" fill="${T.grid}"/><rect x="0" y="14" width="${Math.min(100, e.ratio / 6 * 100).toFixed(1)}" height="8" rx="4" fill="${e.ratio >= 3 ? T.st[2] : T.st[1]}"/><rect x="49" y="10" width="2" height="16" fill="${T.text}"/></svg>`;
  $('#kpis').innerHTML =
    card('MRR', brlC(A[t].mrr), delta(A[t].mrr, t - len >= 0 ? A[t - len].mrr : null, 'rel', true), `${N0.format(A[t].n)} clientes ativos`, spark(win.map(m => A[m].mrr))) +
    card('ARR', brlC(A[t].mrr * 12), delta(A[t].mrr, t - len >= 0 ? A[t - len].mrr : null, 'rel', true), 'MRR × 12', spark(win.map(m => A[m].mrr))) +
    card('Novo MRR', brlC(sum(A, 'nw', f, t)), delta(sum(A, 'nw', f, t), f - len >= 0 ? sum(A, 'nw', f - len, f - 1) : null, 'rel', true), `${N0.format(sum(A, 'nwn', f, t))} novos clientes`, spark(win.map(m => A[m].nw))) +
    card('Churn de receita', pct(cr(f, t), 2), delta(cr(f, t), f - len >= 0 ? cr(f - len, f - 1) : null, 'pp', false), 'ao mês, média do período', spark(win.map(m => m ? safe(A[m].ch, A[m - 1].mrr) : 0).slice(win[0] ? 0 : 1))) +
    card('NRR 12 meses', nr == null ? '—' : pct(nr, 1), delta(nr, nrp, 'pp', true), 'base de 12 meses atrás', spark(nrS)) +
    card('LTV : CAC', e.ratio == null ? '—' : N1.format(e.ratio) + '×', delta(e.ratio, ep && ep.ratio, 'rel', true), e.payback ? `payback ${N0.format(e.payback)} meses` : 'sem novos clientes', ratioBar);
  $('#empty').style.display = (A[t].mrr || sum(A, 'nw', f, t)) ? 'none' : 'block';
}

/* ========== gráficos ========== */
function charts(A){
  const f = F.from, t = F.to, w0 = Math.max(0, t - 11), ms = []; for (let m = w0; m <= t; m++) ms.push(m);
  const labs = ms.map(mlab), inR = m => m >= f && m <= t, p = pred();

  // MRR por plano (empilhado)
  const pm = PLANS.map(() => ms.map(() => 0)), pp = pred('pl');
  for (const c of CU) if (pp(c)) for (let i = 0; i < ms.length; i++) pm[c.p][i] += c.mrr[ms[i]];
  mk('ch-mrr', {type:'bar', data:{labels:labs, datasets:PLANS.map((n, i) => ({label:n, data:pm[i], backgroundColor:pm[i].map((_, j) => fade(T.plan[i], F.pl < 0 || F.pl === i)), borderRadius:2, stack:'s'}))},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, ...gridY, ticks:tickC}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('pl', it.datasetIndex)}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`, footer:cs => 'Total: ' + brl(cs.reduce((a, c) => a + c.parsed.y, 0))}}},
      onClick:(e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); }}});

  // ponte
  const s0 = startMrr(A, f), nw = sum(A, 'nw', f, t), ex = sum(A, 'ex', f, t), co = sum(A, 'co', f, t), chn = sum(A, 'ch', f, t), end = A[t].mrr;
  const lv = [s0, s0 + nw, s0 + nw + ex, s0 + nw + ex - co, s0 + nw + ex - co - chn];
  const fl = [[0, s0], [s0, lv[1]], [lv[1], lv[2]], [lv[3], lv[2]], [lv[4], lv[3]], [0, end]];
  const mn = Math.min(s0, end, lv[4]) * .8, ymin = mn > 0 ? Math.floor(mn / 5e4) * 5e4 : 0;
  const amt = [s0, nw, ex, -co, -chn, end], names = ['Início','Novos','Expansão','Contração','Churn','Fim'];
  mk('ch-ponte', {type:'bar', data:{labels:names, datasets:[{data:fl, backgroundColor:[T.primary, T.st[2], T.st[2], T.st[0], T.st[0], T.primary], borderRadius:4, borderSkipped:false, barPercentage:.78, categoryPercentage:.9}]},
    options:{layout:{padding:{top:20}}, scales:{x:{grid:{display:false}}, y:{...gridY, min:ymin, ticks:tickC}}, plugins:{legend:{display:false}, ponte:{amt}, tooltip:{callbacks:{label:c => ' ' + (c.dataIndex === 0 || c.dataIndex === 5 ? 'MRR: ' + brl(amt[c.dataIndex]) : (amt[c.dataIndex] > 0 ? '+' : '−') + brl(Math.abs(amt[c.dataIndex])))}}}},
    plugins:[{id:'ponte', afterDatasetsDraw(ch, a, o){ const c = ch.ctx; c.save(); c.fillStyle = T.text; c.font = '600 11.5px ' + Chart.defaults.font.family; c.textAlign = 'center';
      ch.getDatasetMeta(0).data.forEach((b, i) => { const v = o.amt[i]; c.fillText((i && i < 5 ? (v > 0 ? '+' : '−') : '') + shortC(Math.abs(v)), b.x, Math.min(b.y, b.base) - 6); }); c.restore(); }}]});
  $('#br-sub').textContent = `${mlab(f)} a ${mlab(t)} · variação líquida ${(end - s0 >= 0 ? '+' : '−') + brlC(Math.abs(end - s0))} · eixo vertical começa em ${brlC(ymin)}`;

  // funil
  const oo = OP.filter(o => o.m >= f && o.m <= t && p(o)), cl = oo.filter(o => o.st !== 'O');
  const fv = [oo.reduce((a, o) => a + o.ld, 0), oo.reduce((a, o) => a + o.mql, 0), oo.length, oo.filter(o => o.reach >= 3).length, oo.filter(o => o.reach >= 4).length, oo.filter(o => o.st === 'W').length];
  const fn = ['Leads','MQL','Oportunidades','Propostas','Negociação','Ganhos'];
  const won = cl.filter(o => o.st === 'W');
  mk('ch-funil', {type:'bar', data:{labels:fn, datasets:[{data:fv, backgroundColor:T.fun, borderRadius:5, barThickness:30}]},
    options:{indexAxis:'y', layout:{padding:{right:92}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}}}, plugins:{legend:{display:false}, sl:{fn:i => N0.format(fv[i]) + (i ? ' · ' + pct(safe(fv[i], fv[i - 1]), 0) : '')},
      tooltip:{callbacks:{label:c => ` ${N0.format(c.parsed.x)}` + (c.dataIndex ? ` · ${pct(safe(c.parsed.x, fv[c.dataIndex - 1]), 1)} do estágio anterior` : '') + (c.dataIndex > 1 ? ` · ${pct(safe(c.parsed.x, fv[2]), 1)} das oportunidades` : '')}}}}, plugins:[sideLabels]});
  $('#fn-sub').textContent = cl.length ? `Taxa de ganho ${pct(safe(won.length, cl.length), 1)} · ciclo médio ${N0.format(safe(won.reduce((a, o) => a + o.cyc, 0), won.length))} dias · novo MRR médio por contrato ${brl(safe(won.reduce((a, o) => a + o.val, 0), won.length))}` : 'Sem negócios decididos no período.';

  // pipeline aberto
  const open = OP.filter(o => o.st === 'O' && pred('pl')(o)), pv = PLANS.map(() => [0, 0, 0]), pn = [0, 0, 0];
  open.forEach(o => { pv[o.p][o.reach - 2] += o.val; });
  const op2 = open.filter(p); op2.forEach(o => { pn[o.reach - 2]++; });
  const tot = [0, 1, 2].map(i => pv.reduce((a, r) => a + r[i], 0));
  mk('ch-pipe', {type:'bar', data:{labels:STG, datasets:PLANS.map((n, i) => ({label:n, data:pv[i], backgroundColor:fade(T.plan[i], F.pl < 0 || F.pl === i), borderRadius:3, stack:'s', barThickness:34}))},
    options:{indexAxis:'y', layout:{padding:{right:110}}, interaction:{mode:'nearest', intersect:true}, scales:{x:{stacked:true, ...gridY, ticks:tickC}, y:{stacked:true, grid:{display:false}}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('pl', it.datasetIndex)}, pipeTot:{tot, pn: [0,1,2].map(i => open.filter(o => o.reach - 2 === i).length)}, tooltip:{mode:'index', intersect:false, callbacks:{label:c => ` ${c.dataset.label}: ${brl(c.parsed.x)}`, footer:cs => 'Probabilidade do estágio: ' + pct(PROB[cs[0].dataIndex], 0)}}},
      onClick:(e, el) => { if (el.length) toggle('pl', el[0].datasetIndex); }},
    plugins:[{id:'pipeTot', afterDatasetsDraw(ch, a, o){ const c = ch.ctx, last = ch.getDatasetMeta(2); c.save(); c.fillStyle = T.text; c.font = '600 12px ' + Chart.defaults.font.family; c.textBaseline = 'middle';
      const xs = ch.scales.x; for (let i = 0; i < 3; i++) c.fillText(brlC(o.tot[i]) + ' · ' + o.pn[i], xs.getPixelForValue(o.tot[i]) + 8, last.data[i].y); c.restore(); }}]});
  const pipeAll = open.filter(p), pipeV = pipeAll.reduce((a, o) => a + o.val, 0), pipeW = pipeAll.reduce((a, o) => a + o.val * PROB[o.reach - 2], 0), q3 = sum(A, 'nw', 21, 23);
  $('#pp-sub').textContent = `${N0.format(pipeAll.length)} oportunidades · ${brlC(pipeV)} em MRR potencial (ponderado ${brlC(pipeW)}) · cobertura ${q3 ? N1.format(pipeV / q3) + '×' : '—'} o novo MRR do último trimestre · posição em 31/10/26`;
  PIPE = {pipeV, pipeW};

  // churn mensal
  const cr = ms.map(m => m ? safe(A[m].ch, A[m - 1].mrr) * 100 : null), cl2 = ms.map(m => m ? safe(A[m].chn, A[m - 1].n) * 100 : null);
  mk('ch-churn', {data:{labels:labs, datasets:[
    {type:'bar', label:'MRR perdido', data:ms.map(m => A[m].ch), backgroundColor:ms.map(m => fade(T.warm, inR(m))), borderRadius:3, yAxisID:'y', order:3},
    {type:'line', label:'Churn de receita', data:cr, borderColor:T.text, backgroundColor:T.text, borderWidth:2, pointRadius:2.5, tension:.3, yAxisID:'y2', order:1},
    {type:'line', label:'Churn de clientes', data:cl2, borderColor:T.acc, backgroundColor:T.acc, borderWidth:2, borderDash:[5, 4], pointRadius:2.5, tension:.3, yAxisID:'y2', order:2}]},
    options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}, ticks:{maxRotation:90, minRotation:0, autoSkip:true, maxTicksLimit:6}}, y:{...gridY, beginAtZero:true, ticks:tickC}, y2:{position:'right', beginAtZero:true, grid:{display:false}, border:{display:false}, ticks:{callback:v => nf(1).format(v) + '%'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.datasetIndex ? ` ${c.dataset.label}: ${nf(2).format(c.parsed.y)}%` : ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); }}});

  // metas por vendedor (só região respeita o filtro: cota é do vendedor inteiro)
  const rl = REPS.filter(r => F.rg < 0 || r.rg === F.rg).map(r => { let q = 0; for (let m = f; m <= t; m++) q += Q[r.i][m]; const got = OP.filter(o => o.st === 'W' && o.rep === r.i && o.m >= f && o.m <= t).reduce((a, o) => a + o.val, 0); return {i:r.i, got, q, at: safe(got, q)}; }).filter(x => x.q > 0).sort((a, b) => b.at - a.at);
  const colA = v => v >= 1 ? T.st[2] : v >= .8 ? T.st[1] : T.st[0];
  mk('ch-meta', {type:'bar', data:{labels:rl.map(x => REPS[x.i].n), datasets:[{data:rl.map(x => x.at * 100), backgroundColor:rl.map(x => fade(colA(x.at), F.rep < 0 || F.rep === x.i)), borderRadius:4, barThickness:17}]},
    options:{indexAxis:'y', layout:{padding:{right:104}}, scales:{x:{...gridY, beginAtZero:true, suggestedMax:120, ticks:{callback:v => v + '%'}}, y:{grid:{display:false}}},
      plugins:{legend:{display:false}, sl:{fn:i => N0.format(rl[i].at * 100) + '% · ' + brlC(rl[i].got)}, tooltip:{callbacks:{title:c => REPS[rl[c[0].dataIndex].i].n + ' · ' + REGIONS[REPS[rl[c[0].dataIndex].i].rg], label:c => [` Atingimento: ${N1.format(c.parsed.x)}%`, ` Novo MRR: ${brl(rl[c.dataIndex].got)}`, ` Meta: ${brl(rl[c.dataIndex].q)}`]}}},
      onClick:(e, el) => { if (el.length) toggle('rep', rl[el[0].index].i); }},
    plugins:[sideLabels, {id:'meta100', afterDatasetsDraw(ch){ const x = ch.scales.x.getPixelForValue(100), c = ch.ctx, ca = ch.chartArea; c.save(); c.strokeStyle = T.text; c.setLineDash([4, 4]); c.globalAlpha = .55; c.beginPath(); c.moveTo(x, ca.top); c.lineTo(x, ca.bottom); c.stroke(); c.restore(); }}]});

  // LTV x CAC por canal
  const base = pred('ch'), ecs = CHN.map((n, i) => ({i, ...econ(c => base(c) && c.ch === i, f, t)})).filter(x => x.n > 0);
  const mxN = Math.max(1, ...ecs.map(x => x.n));
  mk('ch-ltv', {type:'bubble', data:{datasets:ecs.map(x => ({label:CHN[x.i], backgroundColor:fade(T.ch[x.i] + 'cc', F.ch < 0 || F.ch === x.i), borderColor:fade(T.ch[x.i], F.ch < 0 || F.ch === x.i), borderWidth:1.5, data:[{x:x.cac, y:x.ltv, r:8 + Math.sqrt(x.n / mxN) * 16, e:x}]}))},
    options:{layout:{padding:{right:10, top:6}}, scales:{x:{title:{display:true, text:'CAC (R$)'}, ...gridY, beginAtZero:true, grace:'12%', ticks:tickC}, y:{title:{display:true, text:'LTV (R$)'}, ...gridY, beginAtZero:true, grace:'12%', ticks:tickC}},
      plugins:{legend:{position:'bottom', onClick:(e, it) => toggle('ch', ecs[it.datasetIndex].i)}, tooltip:{callbacks:{title:c => c[0].dataset.label, label:c => { const e = c.raw.e; return [` LTV : CAC ${e.ratio ? N1.format(e.ratio) + '×' : '—'}`, ` CAC ${brl(e.cac)} · LTV ${brl(e.ltv)}`, ` Payback ${e.payback ? N0.format(e.payback) : '—'} meses`, ` ${N0.format(e.n)} novos clientes · churn ${pct(e.churn, 2)} ao mês`]; }}}},
      onClick:(e, el) => { if (el.length) toggle('ch', ecs[el[0].datasetIndex].i); }},
    plugins:[{id:'r3', afterDatasetsDraw(ch){ const c = ch.ctx, xs = ch.scales.x, ys = ch.scales.y, ca = ch.chartArea; const xm = Math.min(xs.max, ys.max / 3);
      c.save(); c.setLineDash([5, 4]); c.strokeStyle = T.muted; c.lineWidth = 1.4; c.beginPath(); c.moveTo(xs.getPixelForValue(0), ys.getPixelForValue(0)); c.lineTo(xs.getPixelForValue(xm), ys.getPixelForValue(xm * 3)); c.stroke();
      c.setLineDash([]); c.fillStyle = T.muted; c.font = '600 11.5px ' + Chart.defaults.font.family; c.fillText('LTV = 3 × CAC', Math.max(ca.left + 8, xs.getPixelForValue(xm * .35)) , ys.getPixelForValue(xm * .35 * 3) - 8); c.restore(); }}]});

  forecast(A);
}
let PIPE = {pipeV: 0, pipeW: 0};

/* ========== previsão ========== */
function forecast(A){
  const t = F.to, H = 6, a = Math.max(1, t - 5), den = (() => { let s = 0; for (let m = a; m <= t; m++) s += A[m - 1].mrr; return s; })();
  const ex = safe(sum(A, 'ex', a, t), den), co = safe(sum(A, 'co', a, t), den), ch = safe(sum(A, 'ch', a, t), den), rr = sum(A, 'nw', Math.max(0, t - 2), t) / (Math.min(3, t + 1));
  const sc = (kn, kc, ke) => { const o = [A[t].mrr]; for (let h = 1; h <= H; h++) o.push(o[h - 1] * (1 + ex * ke - co - ch * kc) + rr * kn * Math.pow(1.012, h)); return o; };
  const base = sc(1, 1, 1), lo = sc(.82, 1.2, .9), hi = sc(1.18, .85, 1.1);
  const w0 = Math.max(0, t - 11), hist = []; for (let m = w0; m <= t; m++) hist.push(A[m].mrr);
  const labs = []; for (let m = w0; m <= t + H; m++) labs.push(mlab(m));
  const pad = n => Array(n).fill(null), nh = hist.length;
  const real = []; if (t < NM - 1) for (let h = 1; h <= H; h++) real.push(t + h < NM ? A[t + h].mrr : null);
  const ds = [
    {label:'Realizado', data:hist.concat(pad(H)), borderColor:T.primary, backgroundColor:T.primary, borderWidth:2.5, pointRadius:2.5, tension:.25, order:1},
    {label:'Conservador', data:pad(nh - 1).concat(lo), borderColor:T.st[0], backgroundColor:T.st[0], borderWidth:1.6, borderDash:[5, 4], pointRadius:0, tension:.25, order:3},
    {label:'Otimista', data:pad(nh - 1).concat(hi), borderColor:T.st[2], backgroundColor:T.st[2], borderWidth:1.6, borderDash:[5, 4], pointRadius:0, tension:.25, fill:'-1', order:4},
    {label:'Base', data:pad(nh - 1).concat(base), borderColor:T.primary, backgroundColor:T.primary, borderWidth:2.5, borderDash:[2, 3], pointRadius:3, tension:.25, order:2}];
  if (real.some(v => v != null)) ds.push({label:'Realizado depois (conferência)', data:pad(nh - 1).concat([A[t].mrr], real), borderColor:T.muted, backgroundColor:T.muted, borderWidth:1.8, pointRadius:2, tension:.25, order:5});
  const fillC = T.dark ? 'rgba(154,165,255,.10)' : 'rgba(67,56,202,.08)';
  ds[2].backgroundColor = fillC;
  mk('ch-prev', {type:'line', data:{labels:labs, datasets:ds}, options:{interaction:{mode:'index', intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:tickC}},
    plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.parsed.y == null ? null : ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}}}});
  const arr = v => brlC(v * 12);
  $('#fc-note').innerHTML = `<span>MRR em ${mlab(t + 3)} (base): <b>${brlC(base[3])}</b> · faixa ${brlC(lo[3])} a ${brlC(hi[3])}</span><span>ARR em ${mlab(t + H)} (base): <b>${arr(base[H])}</b></span><span>Hipóteses: expansão ${pct(ex, 2)}, contração ${pct(co, 2)} e churn ${pct(ch, 2)} ao mês; novo MRR ${brlC(rr)}/mês</span>` + (t === NM - 1 ? `<span>Pipeline ponderado hoje: <b>${brlC(PIPE.pipeW)}</b></span>` : '');
}

/* ========== coorte ========== */
let COH = 'l';
function cohort(){
  const p = pred(), t = F.to, c0 = Math.max(0, t - 11), th = COH === 'l' ? [.7, .8, .88, .95] : [.8, .92, 1, 1.1];
  const bin = v => th.filter(x => v >= x).length;
  const rows = [], sumN = Array(13).fill(0), sumD = Array(13).fill(0);
  for (let c = c0; c <= t; c++) {
    const cs = CU.filter(x => x.start === c && p(x)), n0 = cs.length, m0 = cs.reduce((a, x) => a + x.mrr[c], 0), cells = [];
    for (let k = 0; k <= 12; k++) {
      if (c + k >= NM || !n0) { cells.push(null); continue; }
      const num = COH === 'l' ? cs.filter(x => x.mrr[c + k] > 0).length : cs.reduce((a, x) => a + x.mrr[c + k], 0), den = COH === 'l' ? n0 : m0;
      cells.push({v: num / den, num, den}); sumN[k] += num; sumD[k] += den;
    }
    rows.push({c, n0, cells});
  }
  const cell = (cl, ttl) => cl ? `<td class="c" style="background:${T.heat[bin(cl.v)]};color:${T.heatTx[bin(cl.v)]}" title="${esc(ttl)}">${Math.round(cl.v * 100)}%</td>` : '<td class="c na"></td>';
  let h = '<table class="hm"><thead><tr><th class="rl" scope="col">Coorte</th><th class="cn" scope="col">Clientes</th>' + Array.from({length: 13}, (_, k) => `<th scope="col">M${k}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of rows) h += `<tr><th class="rl" scope="row">${mlab(r.c)}</th><td class="cn">${r.n0 || '—'}</td>` + r.cells.map((cl, k) => cell(cl, `Coorte ${mlab(r.c)} · mês ${k}: ${cl ? Math.round(cl.v * 100) + '% (' + (COH === 'l' ? cl.num + ' de ' + cl.den + ' clientes' : brlC(cl.num) + ' de ' + brlC(cl.den)) + ')' : ''}`)).join('') + '</tr>';
  h += '<tr class="avg"><th class="rl" scope="row">Média</th><td class="cn"></td>' + sumD.map((d, k) => cell(d ? {v: sumN[k] / d, num: sumN[k], den: d} : null, `Média ponderada das coortes · mês ${k}: ${d ? Math.round(sumN[k] / d * 100) + '%' : ''}`)).join('') + '</tr></tbody></table>';
  $('#coh').innerHTML = h;
  const lab = COH === 'l' ? ['< 70%', '70–80%', '80–88%', '88–95%', '≥ 95%'] : ['< 80%', '80–92%', '92–100%', '100–110%', '≥ 110%'];
  $('#co-lg').innerHTML = '<span style="margin-left:0">Escala:</span>' + T.heat.map((c, i) => `<i style="background:${c}"></i><span>${lab[i]}</span>`).join('');
  $('#co-sub').textContent = COH === 'l' ? 'Parcela dos clientes de cada coorte (mês de contratação) que seguem ativos, mês a mês' : 'Receita da coorte em relação ao MRR inicial, já com expansão, contração e churn (NRR)';
}

/* ========== tabelas ========== */
const TAB = {t:'o', q:'', sort:{o:['pond', -1], c:['mrr', -1], v:['at', -1]}, page:0}, PS = 8;
const pl = i => `<span class="tag n">${PLANS[i]}</span>`;
const COLS = {
  o:[['name','Oportunidade',v=>esc(v)],['p','Plano',pl,'h'],['rg','Região',v=>REGIONS[v]],['rep','Vendedor',v=>REPS[v].n],['reach','Estágio',v=>STG[v - 2]],['val','MRR potencial',v=>brl(v),'r'],['prob','Prob.',v=>pct(v, 0),'r'],['pond','Ponderado',v=>brl(v),'r'],['days','Dias no funil',v=>N0.format(v),'r'],['sit','Situação',v=>v ? '<span class="tag t-warn">Parada</span>' : '<span class="tag t-ok">No prazo</span>','h']],
  c:[['name','Cliente',v=>esc(v)],['p','Plano',pl,'h'],['rg','Região',v=>REGIONS[v]],['ch','Canal',v=>CHN[v]],['rep','Vendedor',v=>REPS[v].n],['start','Cliente desde',v=>v < 0 ? 'antes de nov/24' : mlab(v)],['mrr','MRR',v=>brl(v),'r'],['act','Situação',v=>v ? '<span class="tag t-ok">Ativo</span>' : '<span class="tag t-bad">Cancelado</span>','h']],
  v:[['name','Vendedor',v=>v],['rg','Região',v=>REGIONS[v]],['got','Novo MRR',v=>brl(v),'r'],['q','Meta',v=>brl(v),'r'],['at','Atingimento',v=>`<span class="tag ${v >= 1 ? 't-ok' : v >= .8 ? 't-warn' : 't-bad'}">${N0.format(v * 100)}%</span>`,'rh'],['won','Ganhos',v=>N0.format(v),'r'],['wr','Taxa de ganho',v=>pct(v),'r'],['cyc','Ciclo (dias)',v=>N0.format(v),'r'],['tk','MRR médio',v=>brl(v),'r'],['pipe','Pipeline aberto',v=>brl(v),'r']]
};
let ROWS = {o:[], c:[], v:[]};
function tablesCalc(A){
  const p = pred(), f = F.from, t = F.to;
  ROWS.o = OP.filter(o => o.st === 'O' && p(o)).map(o => { const prob = PROB[o.reach - 2]; return {name:o.name, p:o.p, rg:o.rg, rep:o.rep, reach:o.reach, val:o.val, prob, pond:o.val * prob, days:o.days, sit:o.days > 75 && o.reach < 4 ? 1 : 0, _t:[o.name, PLANS[o.p], REGIONS[o.rg], REPS[o.rep].n, STG[o.reach - 2]].join(' ')}; });
  ROWS.c = CU.filter(c => c.start <= t && p(c)).map(c => { const a = c.mrr; let last = t; while (last > 0 && !a[last]) last--; const act = a[t] > 0 ? 1 : 0;
    return {name:c.name, p:c.p, rg:c.rg, ch:c.ch, rep:c.rep, start:c.start, mrr:a[last], act, _t:[c.name, PLANS[c.p], REGIONS[c.rg], CHN[c.ch], REPS[c.rep].n, act ? 'ativo' : 'cancelado'].join(' ')}; }).filter(r => r.mrr > 0);
  ROWS.v = REPS.filter(r => F.rg < 0 || r.rg === F.rg).map(r => { let q = 0; for (let m = f; m <= t; m++) q += Q[r.i][m];
    const cl = oppIn(o => o.rep === r.i, f, t), w = cl.filter(o => o.st === 'W'), got = w.reduce((a, o) => a + o.val, 0), op = OP.filter(o => o.st === 'O' && o.rep === r.i);
    return {i:r.i, name:r.n, rg:r.rg, got, q, at:safe(got, q), won:w.length, wr:safe(w.length, cl.length), cyc:safe(w.reduce((a, o) => a + o.cyc, 0), w.length), tk:safe(got, w.length), pipe:op.reduce((a, o) => a + o.val, 0), _t:r.n + ' ' + REGIONS[r.rg]}; }).filter(r => r.q > 0);
}
function tableRows(){
  const cols = COLS[TAB.t], q = TAB.q.trim().toLowerCase();
  const out = q ? ROWS[TAB.t].filter(r => r._t.toLowerCase().includes(q)) : ROWS[TAB.t].slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  void cols; return out;
}
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${(c[3] || '').includes('r') ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS);
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="${TAB.t === 'v' ? 'click' : ''} ${TAB.t === 'v' && r.i === F.rep ? 'sel' : ''}" ${TAB.t === 'v' ? `data-r="${r.i}" title="Filtrar por este vendedor"` : ''}>` + cols.map(c => `<td class="${(c[3] || '').includes('r') ? 'r num' : ''}">${c[2](r[c[0]])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:24px">Nenhum resultado.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; ['o', 'c', 'v'].forEach(x => $('#tab-' + x).setAttribute('aria-selected', x === t)); table(); };
  $('#tab-o').onclick = () => tab('o'); $('#tab-c').onclick = () => tab('c'); $('#tab-v').onclick = () => tab('v');
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof ROWS[TAB.t][0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-r]'); if (tr) toggle('rep', +tr.dataset.r); };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#co-l').onclick = () => { COH = 'l'; $('#co-l').setAttribute('aria-pressed', true); $('#co-r').setAttribute('aria-pressed', false); cohort(); };
  $('#co-r').onclick = () => { COH = 'r'; $('#co-r').setAttribute('aria-pressed', true); $('#co-l').setAttribute('aria-pressed', false); cohort(); };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const txt = (c, v) => { const k = c[0]; if (k === 'p') return PLANS[v]; if (k === 'rg') return REGIONS[v]; if (k === 'rep') return REPS[v].n; if (k === 'ch') return CHN[v]; if (k === 'reach') return STG[v - 2]; if (k === 'start') return v < 0 ? 'antes de nov/24' : mlab(v); if (k === 'sit') return v ? 'Parada' : 'No prazo'; if (k === 'act') return v ? 'Ativo' : 'Cancelado'; if (k === 'prob' || k === 'at' || k === 'wr') return String(Math.round(v * 1000) / 10).replace('.', ',') + '%'; return typeof v === 'number' ? String(Math.round(v * 100) / 100).replace('.', ',') : v; };
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(txt(c, r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `vertice-cloud_${{o:'oportunidades', c:'clientes', v:'vendedores'}[TAB.t]}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const A = mov(null);
  kpis(A); charts(A); cohort(); tablesCalc(A); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('vc-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('vc-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
