(() => {
'use strict';
const $ = s => document.querySelector(s);

/* ========== dados sintéticos (semente fixa) ========== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261104);
const NM = 24, PRE = 5;                          // nov/24 .. out/26 (+5 meses ocultos de leads para a coorte)
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m + 120) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);

const CHANNELS = ['Google Search','Google Shopping','Meta Ads','TikTok Ads','Influenciadores','E-mail e WhatsApp'];
const OBJ = ['Aquisição','Remarketing','Retenção'];
const LINES = ['Alimentação','Higiene e saúde','Brinquedos','Acessórios','Clube Orla','Institucional'];
// [nome, canal, objetivo, linha, investimento/mês inicial, CPM, CTR, clique→lead, lead→venda, ticket, crescimento/mês, deriva do CPM, ROAS-alvo]
const CAMPS = [
  ['Search · Marca','',0,0,5,12000,42,.085,.16,0.179,168,1.008,1.000,8.0],
  ['Search · Ração premium','',0,0,0,26000,31,.052,.11,0.125,214,1.010,1.004,4.2],
  ['Search · Antipulgas e vermífugo','',0,0,1,14000,28,.046,.12,0.14,132,1.010,1.003,3.8],
  ['Shopping · Rações','',1,0,0,22000,19,.018,0.106,0.22,238,1.012,1.004,4.0],
  ['Shopping · Acessórios','',1,0,3,10000,17,.016,.09,0.206,156,1.012,1.003,2.9],
  ['Performance Max · Catálogo','',1,0,5,18000,15,.014,0.097,0.22,196,1.022,1.002,3.6],
  ['Meta · Lançamento Clube Orla','',2,0,4,20000,24,.011,.14,0.149,189,1.018,1.007,2.0],
  ['Meta · Brinquedos interativos','',2,0,2,12000,21,.013,0.182,0.22,118,1.012,1.006,2.4],
  ['Meta · Remarketing de carrinho','',2,1,5,9000,29,.022,.26,0.244,172,1.016,1.006,6.5],
  ['Meta · Lookalike de compradores','',2,0,0,16000,26,.010,0.127,0.22,204,1.014,1.007,2.5],
  ['TikTok · Pets em ação','',3,0,2,11000,14,.009,0.088,0.22,96,1.032,1.002,1.5],
  ['TikTok · Spark Ads acessórios','',3,0,3,8000,13,.008,0.108,0.22,124,1.030,1.002,1.4],
  ['Influ · Veterinários parceiros','',4,0,1,10000,18,.012,0.134,0.22,162,1.014,1.000,3.0],
  ['Influ · Embaixadores do Clube','',4,0,4,8000,16,.014,.15,0.129,184,1.020,1.000,3.2],
  ['CRM · Carrinho abandonado','',5,1,5,3000,55,.060,.30,0.282,158,1.012,1.000,14],
  ['CRM · Recompra de ração','',5,2,0,4000,48,.070,.24,0.241,226,1.014,1.000,18],
  ['CRM · Reativação 90 dias','',5,2,5,2500,52,.035,.20,0.354,148,1.010,1.000,8]
].map((a, i) => ({i, n:a[0], ch:a[2], ob:a[3], ln:a[4], sp:a[5], cpm:a[6], ctr:a[7], c2l:a[8], l2s:a[9], aov:a[10], g:a[11], cd:a[12], tr:a[13], fast:a[3] > 0}));
CAMPS.forEach(c => { c.ob = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,2,2][c.i]; }); // objetivo por campanha
CAMPS[0].ln = 5; CAMPS[5].ln = 5; CAMPS[8].ln = 5; CAMPS[14].ln = 5; CAMPS[16].ln = 5; CAMPS[15].ln = 0;
CAMPS.forEach(c => { c.fast = c.ob > 0; });
const SS = [.88,.85,.92,.95,1.0,.98,.97,1.0,1.02,1.08,1.5,1.25];     // sazonalidade do investimento (jan..dez)
const LAG = [.5,.22,.12,.08,.05,.03], LAGF = [.72,.18,.06,.02,.01,.01]; // quando o lead vira venda (mês 0..5)

/* leads e vendas por campanha e mês (m = -5..23) */
const L = CAMPS.map(() => []);
for (const c of CAMPS) for (let m = -PRE; m < NM; m++) {
  const cm = cal(m), bf = cm === 10;
  const spend = c.sp * Math.pow(c.g, m) * SS[cm] * (.94 + R() * .12) * (c.ch === 3 && bf ? .9 : 1);
  const cpm = c.cpm * Math.pow(c.cd, m) * (bf ? 1.22 : cm === 11 ? 1.1 : 1) * (.96 + R() * .08);
  const imp = spend / cpm * 1000, clk = imp * c.ctr * (bf ? 1.05 : 1) * (.95 + R() * .1);
  const leads = clk * c.c2l * (.95 + R() * .1), rate = c.l2s * (bf ? 1.15 : cm === 11 ? 1.05 : 1) * (.9 + R() * .2);
  L[c.i][m + PRE] = {spend, imp, clk, leads, rate};
}
const rows = [];
for (let m = 0; m < NM; m++) for (const c of CAMPS) {
  const x = L[c.i][m + PRE], d = c.fast ? LAGF : LAG;
  let sales = 0; for (let j = 0; j < 6; j++) { const o = L[c.i][m - j + PRE]; sales += o.leads * o.rate * d[j]; }
  const cm = cal(m), rev = sales * c.aov * (cm === 10 ? .93 : 1) * (.97 + R() * .06);
  rows.push({m, cp:c.i, ch:c.ch, ob:c.ob, ln:c.ln, spend:Math.round(x.spend), imp:Math.round(x.imp), clk:Math.round(x.clk), leads:Math.round(x.leads), sales:Math.round(sales), rev:Math.round(rev),
    gRev:Math.round(rev * (.88 + R() * .24)), gSpend:Math.round(x.spend * (.95 + R() * .1)), gLeads:Math.round(x.leads * (.9 + R() * .2))});
}

/* criativos: 2 a 3 por campanha, dividindo impressões e resultado da campanha */
const FMT = [['Anúncio responsivo A','Anúncio responsivo B'], ['Feed de produtos','Imagens do catálogo'], ['Reels 15s','Carrossel','Imagem estática','Stories'], ['Vídeo UGC','Spark Ad'], ['Reel do parceiro','Story com cupom'], ['E-mail A','E-mail B','WhatsApp']];
const FKIND = [['Texto','Texto'], ['Feed','Feed'], ['Vídeo','Carrossel','Imagem','Story'], ['Vídeo','Vídeo'], ['Vídeo','Story'], ['E-mail','E-mail','Mensagem']];
const HOOKS = ['antes e depois','depoimento de tutor','frete grátis','unboxing','comparativo','cupom de primeira compra','dica do veterinário','pet em destaque','oferta relâmpago','teste de sabor'];
const CREAT = [];
for (const c of CAMPS) {
  const n = c.ch === 2 ? 3 : (c.i % 2 ? 2 : 3), fm = FMT[c.ch], base = [];
  for (let j = 0; j < Math.min(n, fm.length); j++) base.push({w:.4 + R() * .6, ctrm:.72 + R() * .66, cvrm:.8 + R() * .45, j});
  const sw = base.reduce((a, b) => a + b.w, 0);
  base.forEach((b, j) => CREAT.push({code:'CR-' + String(CREAT.length + 1).padStart(3, '0'), name:fm[j] + ' · ' + HOOKS[(c.i * 3 + j * 2 + c.ch) % HOOKS.length], fmt:FKIND[c.ch][j], cp:c.i, w:b.w / sw, ctrm:b.ctrm, cvrm:b.cvrm}));
}
CAMPS.forEach(c => { const cs = CREAT.filter(k => k.cp === c.i); const sa = cs.reduce((a, k) => a + k.w * k.ctrm, 0), sb = cs.reduce((a, k) => a + k.w * k.ctrm * k.cvrm, 0);
  cs.forEach(k => { k.cs = k.w * k.ctrm / sa; k.ss = k.w * k.ctrm * k.cvrm / sb; }); });

/* ========== agregação ========== */
const z0 = () => ({spend:0,imp:0,clk:0,leads:0,sales:0,rev:0,gRev:0,gSpend:0,gLeads:0});
const add = (a, r) => { for (const k in a) a[k] += r[k]; return a; };
const PRESETS = {'3':'Últimos 3 meses','6':'Últimos 6 meses','12':'Últimos 12 meses','ytd':'2026 (jan–out)'};
const F = {per:'12', from:12, to:23, ch:-1, ob:-1, ln:-1, cp:-1};
function setPreset(p){ F.per = p; F.to = 23; F.from = p === 'ytd' ? 14 : 24 - +p; }
const pred = skip => r => (skip==='ch'||F.ch<0||r.ch===F.ch) && (skip==='ob'||F.ob<0||r.ob===F.ob) && (skip==='ln'||F.ln<0||r.ln===F.ln) && (skip==='cp'||F.cp<0||r.cp===F.cp);
const byMonth = skip => { const p = pred(skip), a = Array.from({length: NM}, z0); for (const r of rows) if (p(r)) add(a[r.m], r); return a; };
const sumR = (a, f, t) => { const s = z0(); for (let m = Math.max(0, f); m <= t; m++) add(s, a[m]); return s; };
function group(key, skip, f, t, n){ const a = Array.from({length: n}, z0), p = pred(skip); for (const r of rows) if (r.m >= f && r.m <= t && p(r)) add(a[key(r)], r); return a; }

/* ========== formatação ========== */
const nf = (d=0) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const N0 = nf(0), N1 = nf(1), N2 = nf(2);
const brl = v => 'R$ ' + N2.format(v);
const brlC = v => { const a = Math.abs(v); return a >= 1e6 ? 'R$ ' + nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e3 ? 'R$ ' + N0.format(v/1e3) + ' mil' : 'R$ ' + N0.format(v); };
const numC = v => { const a = Math.abs(v); return a >= 1e6 ? nf(a>=1e7?1:2).format(v/1e6) + ' mi' : a >= 1e4 ? N0.format(v/1e3) + ' mil' : N0.format(v); };
const pct = (v, d=1) => nf(d).format(v * 100) + '%';
const xf = v => N2.format(v) + '×';
const safe = (a, b) => b ? a / b : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== tema e cores ========== */
let T = {};
const PAL = {light:{cat:['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00'], warm:'#d4553f', seq:['#5b3fd1','#9b86ea','#d3c9f7']},
             dark:{cat:['#56B4E9','#F0B429','#2FD0A0','#E58FC2','#8FA8FF','#FF8A57'], warm:'#ff8f84', seq:['#a898ff','#6a5bb8','#3a3170']}};
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
const campOk = c => (F.ch < 0 || c.ch === F.ch) && (F.ob < 0 || c.ob === F.ob) && (F.ln < 0 || c.ln === F.ln);
function fillSelects(){
  const opt = (v, t) => `<option value="${v}">${esc(t)}</option>`;
  $('#f-per').innerHTML = Object.entries(PRESETS).map(([k, v]) => opt(k, v)).join('') + '<option value="mes" hidden></option>';
  $('#f-can').innerHTML = opt(-1, 'Todos os canais') + CHANNELS.map((r, i) => opt(i, r)).join('');
  $('#f-obj').innerHTML = opt(-1, 'Todos os objetivos') + OBJ.map((r, i) => opt(i, r)).join('');
  $('#f-lin').innerHTML = opt(-1, 'Todas as linhas') + LINES.map((r, i) => opt(i, r)).join('');
}
function syncFilters(){
  if (F.cp >= 0 && !campOk(CAMPS[F.cp])) F.cp = -1;
  const pm = $('#f-per'); pm.querySelector('[value=mes]').textContent = 'Mês: ' + mlab(F.to); pm.value = F.per;
  $('#f-can').value = F.ch; $('#f-obj').value = F.ob; $('#f-lin').value = F.ln;
  $('#f-cmp').innerHTML = '<option value="-1">Todas as campanhas</option>' + CAMPS.filter(campOk).map(c => `<option value="${c.i}">${esc(c.n)}</option>`).join('');
  $('#f-cmp').value = F.cp;
  const chips = [];
  if (F.per === 'mes') chips.push(['per', 'Mês: ' + mlab(F.to)]);
  if (F.ch >= 0) chips.push(['ch', CHANNELS[F.ch]]);
  if (F.ob >= 0) chips.push(['ob', OBJ[F.ob]]);
  if (F.ln >= 0) chips.push(['ln', LINES[F.ln]]);
  if (F.cp >= 0) chips.push(['cp', CAMPS[F.cp].n]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i>×</i></button>`).join('');
  const len = F.to - F.from + 1, pf = F.from - len;
  $('#range').textContent = `${mlab(F.from)} a ${mlab(F.to)}` + (pf >= 0 ? ` · comparado com ${mlab(pf)} a ${mlab(F.from - 1)}` : ' · sem período anterior disponível');
}
function toggle(key, val){ F[key] = F[key] === val ? -1 : val; if (key === 'cp' && F.cp >= 0) { const c = CAMPS[F.cp]; F.ch = c.ch; } render(); }
function bindFilters(){
  $('#f-per').onchange = e => { setPreset(e.target.value); render(); };
  $('#f-can').onchange = e => { F.ch = +e.target.value; render(); };
  $('#f-obj').onchange = e => { F.ob = +e.target.value; render(); };
  $('#f-lin').onchange = e => { F.ln = +e.target.value; render(); };
  $('#f-cmp').onchange = e => { F.cp = +e.target.value; render(); };
  $('#clear').onclick = () => { setPreset('12'); F.ch = F.ob = F.ln = F.cp = -1; render(); };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (k === 'per') setPreset('12'); else F[k] = -1; render(); };
}

/* ========== KPIs ========== */
const spark = vals => { const mx = Math.max(...vals), mn = Math.min(...vals), W = 100, H = 34, d = mx - mn || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 3 - (v - mn) / d * (H - 8)]);
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${H} ${line} ${W},${H}" fill="${T.primary}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${T.primary}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`; };
const ARROW = {up:'<svg viewBox="0 0 10 10"><path d="M5 1l4 6H1z"/></svg>', down:'<svg viewBox="0 0 10 10"><path d="M5 9L1 3h8z"/></svg>'};
function delta(cur, prev, kind, good){
  if (prev == null || !isFinite(prev) || prev === 0) return '<span class="pill flat">—</span>';
  const d = kind === 'pp' ? (cur - prev) * 100 : (cur / prev - 1) * 100, flat = Math.abs(d) < .05;
  const cls = flat ? 'flat' : good === null ? 'neu' : ((d > 0) === good ? 'up' : 'down');
  return `<span class="pill ${cls}">${flat ? '' : ARROW[d > 0 ? 'up' : 'down']}${(d > 0 ? '+' : '') + N1.format(d)}${kind === 'pp' ? ' p.p.' : '%'}</span>`;
}
function kpis(M){
  const cur = sumR(M, F.from, F.to), len = F.to - F.from + 1, pf = F.from - len, prev = pf >= 0 ? sumR(M, pf, F.from - 1) : null;
  const w0 = Math.max(0, F.to - 11), W = M.slice(w0, F.to + 1);
  const defs = [
    ['Investimento', a => a.spend, brlC, null],
    ['Receita atribuída', a => a.rev, brlC, true],
    ['ROAS', a => safe(a.rev, a.spend), xf, true],
    ['CPA (custo por venda)', a => safe(a.spend, a.sales), brl, false],
    ['CPC (custo por clique)', a => safe(a.spend, a.clk), brl, false],
    ['Leads gerados', a => a.leads, v => N0.format(v), true]
  ];
  $('#kpis').innerHTML = defs.map(([l, f, fm, good]) => `<article class="card kpi"><div class="l">${l}</div><div class="v num">${cur.spend ? fm(f(cur)) : '—'}</div><div class="d">${cur.spend && prev && prev.spend ? delta(f(cur), f(prev), 'rel', good) : '<span class="pill flat">—</span>'}<span>vs. período anterior</span></div>${spark(W.map(f))}</article>`).join('');
  $('#empty').style.display = cur.spend ? 'none' : 'block';
  return cur;
}

/* ========== gráficos ========== */
function charts(M){
  const w0 = Math.max(0, F.to - 11), ms = []; for (let m = w0; m <= F.to; m++) ms.push(m);
  const inR = m => m >= F.from && m <= F.to, labs = ms.map(mlab);
  const tickC = {callback: v => brlC(v)};

  mk('ch-mes', {data:{labels:labs, datasets:[
    {type:'bar', label:'Investimento', data:ms.map(m => M[m].spend), backgroundColor:ms.map(m => fade(T.primary, inR(m))), borderRadius:5, order:3, yAxisID:'y'},
    {type:'line', label:'Receita atribuída', data:ms.map(m => M[m].rev), borderColor:T.cat[2], backgroundColor:T.cat[2], borderWidth:2.4, pointRadius:3, tension:.3, order:1, yAxisID:'y'},
    {type:'line', label:'ROAS', data:ms.map(m => safe(M[m].rev, M[m].spend)), borderColor:T.cat[1], backgroundColor:T.cat[1], borderDash:[5,4], borderWidth:2, pointRadius:2.5, tension:.3, order:2, yAxisID:'y2'}]},
    options:{interaction:{mode:'index',intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:tickC, beginAtZero:true}, y2:{position:'right', grid:{display:false}, border:{display:false}, beginAtZero:true, ticks:{callback:v => v + '×'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => c.dataset.yAxisID === 'y2' ? ` ROAS: ${xf(c.parsed.y)}` : ` ${c.dataset.label}: ${brl(c.parsed.y)}`}}},
      onClick:(e, el) => { if (!el.length) return; const m = ms[el[0].index]; if (F.per === 'mes' && F.to === m) setPreset('12'); else { F.per = 'mes'; F.from = F.to = m; } render(); }}});

  const cc = group(r => r.ch, 'ch', F.from, F.to, 6), ts = cc.reduce((a, x) => a + x.spend, 0);
  mk('ch-mix', {type:'doughnut', data:{labels:CHANNELS, datasets:[{data:cc.map(x => x.spend), backgroundColor:CHANNELS.map((_, i) => fade(T.cat[i], F.ch < 0 || F.ch === i)), borderColor:T.surface, borderWidth:2, hoverOffset:6}]},
    options:{cutout:'62%', plugins:{legend:{position:'bottom', labels:{padding:10, boxWidth:8}}, tooltip:{callbacks:{label:c => ` ${brl(c.parsed)} · ${pct(safe(c.parsed, ts))}`}}}, onClick:(e, el) => { if (el.length) toggle('ch', el[0].index); }}});

  // evolução de CPC e CPA
  mk('ch-cus', {type:'line', data:{labels:labs, datasets:[
    {label:'CPC (R$)', data:ms.map(m => M[m].clk ? safe(M[m].spend, M[m].clk) : null), borderColor:T.cat[0], backgroundColor:T.cat[0], borderWidth:2.4, pointRadius:3, tension:.3, yAxisID:'y'},
    {label:'CPA (R$)', data:ms.map(m => M[m].sales ? safe(M[m].spend, M[m].sales) : null), borderColor:T.cat[5], backgroundColor:T.cat[5], borderWidth:2.4, pointRadius:3, tension:.3, yAxisID:'y2'}]},
    options:{interaction:{mode:'index',intersect:false}, scales:{x:{grid:{display:false}}, y:{...gridY, ticks:{callback:v => 'R$ ' + N2.format(v)}, grace:'10%', title:{display:true, text:'CPC'}}, y2:{position:'right', grid:{display:false}, border:{display:false}, grace:'10%', ticks:{callback:v => 'R$ ' + N0.format(v)}, title:{display:true, text:'CPA'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label.slice(0, 3)}: ${brl(c.parsed.y)}`}}}}});

  // ROAS por canal
  const rc = cc.map((x, i) => ({i, v:safe(x.rev, x.spend), s:x.spend})).filter(x => x.s).sort((a, b) => b.v - a.v);
  mk('ch-roas', {type:'bar', data:{labels:rc.map(x => CHANNELS[x.i]), datasets:[{data:rc.map(x => x.v), backgroundColor:rc.map(x => fade(T.cat[x.i], F.ch < 0 || F.ch === x.i)), borderRadius:5, barThickness:24}]},
    options:{indexAxis:'y', layout:{padding:{right:46}}, scales:{x:{display:false, beginAtZero:true}, y:{grid:{display:false}, ticks:{callback(v){ const l = this.getLabelForValue(v); return l.length > 14 ? l.split(' ').reduce((a, w) => (a.length && (a[a.length - 1] + ' ' + w).length < 14) ? (a[a.length - 1] += ' ' + w, a) : (a.push(w), a), []) : l; }}}},
      plugins:{legend:{display:false}, vl:{fmt:v => xf(v)}, tooltip:{callbacks:{label:c => [` ROAS: ${xf(c.parsed.x)}`, ` Investimento: ${brlC(rc[c.dataIndex].s)}`]}}}, onClick:(e, el) => { if (el.length) toggle('ch', rc[el[0].index].i); }}, plugins:[valueLabels]});

  // bolhas por campanha
  const cp = group(r => r.cp, 'cp', F.from, F.to, CAMPS.length), mxS = Math.max(1, ...cp.map(x => x.spend));
  mk('ch-bol', {type:'bubble', data:{datasets:CHANNELS.map((n, ci) => ({label:n, backgroundColor:T.cat[ci] + 'cc', borderColor:T.cat[ci], borderWidth:1.5,
      data:CAMPS.filter(c => c.ch === ci && cp[c.i].sales).map(c => ({x:safe(cp[c.i].spend, cp[c.i].sales), y:safe(cp[c.i].rev, cp[c.i].spend), r:5 + Math.sqrt(cp[c.i].spend / mxS) * 18, c:c.i, spend:cp[c.i].spend}))}))},
    options:{scales:{x:{title:{display:true, text:'CPA (R$ por venda)'}, grid:{color:() => T.grid}, border:{display:false}, ticks:{callback:v => 'R$ ' + v}, beginAtZero:true, grace:'8%'}, y:{title:{display:true, text:'ROAS (×)'}, ...gridY, grace:'10%', beginAtZero:true, ticks:{callback:v => v + '×'}}},
      plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{title:c => CAMPS[c[0].raw.c].n, label:c => [` Investimento: ${brlC(c.raw.spend)}`, ` CPA: ${brl(c.raw.x)}`, ` ROAS: ${xf(c.raw.y)}`]}}},
      onClick:(e, el) => { if (el.length) { const d = CHARTS['ch-bol'].data.datasets[el[0].datasetIndex].data[el[0].index]; toggle('cp', d.c); } }}});
}

/* ========== funil, coorte e metas (HTML) ========== */
function funil(M){
  const s = sumR(M, F.from, F.to), st = [['Impressões', s.imp, T.seq[0]], ['Cliques', s.clk, T.seq[0]], ['Leads', s.leads, T.seq[1]], ['Vendas', s.sales, T.cat[2]]];
  const mx = Math.log10(Math.max(2, st[0][1])), rt = ['', `CTR ${pct(safe(s.clk, s.imp), 2)}`, `${pct(safe(s.leads, s.clk), 1)} dos cliques`, `${pct(safe(s.sales, s.leads), 1)} dos leads`];
  $('#funil').innerHTML = st.map(([n, v, c], i) => `<div class="fn-row"><div class="fn-l">${n}</div><div class="fn-b" style="--c:${c}"><i style="width:${v > 1 ? Math.max(4, Math.log10(v) / mx * 100).toFixed(1) : 0}%"></i><span class="num">${numC(v)}</span></div><div class="fn-r">${i ? `<b>${rt[i].split(' ')[0] === 'CTR' ? rt[i].slice(4) : rt[i].split(' ')[0]}</b>${rt[i].split(' ')[0] === 'CTR' ? 'CTR · cliques por impressão' : rt[i].split(' ').slice(1).join(' ')}` : ''}</div></div>`).join('');
  $('#fn-note').textContent = s.sales ? `De cada 1.000 impressões saem ${N1.format(s.sales / s.imp * 1000)} vendas · uma venda a cada ${N0.format(safe(s.clk, s.sales))} cliques.` : '';
}
function cohort(){
  const m1 = Math.max(0, F.to - 7), out = [], lg = [0, 1, 2, 3, 4, 5], pc = CAMPS.filter(c => campOk(c) && (F.cp < 0 || c.i === F.cp));
  let mx = 0;
  for (let m = m1; m <= F.to; m++) {
    let ld = 0; const cum = lg.map(() => 0);
    for (const c of pc) { const o = L[c.i][m + PRE], d = c.fast ? LAGF : LAG; ld += o.leads; let a = 0; lg.forEach(j => { a += o.leads * o.rate * d[j]; cum[j] += a; }); }
    const cells = lg.map(j => m + j > NM - 1 || !ld ? null : cum[j] / ld); cells.forEach(v => { if (v != null) mx = Math.max(mx, v); });
    out.push({m, ld, cells});
  }
  $('#coh').innerHTML = '<thead><tr><th>Captação</th><th>Leads</th>' + lg.map(j => `<th>Mês ${j}</th>`).join('') + '</tr></thead><tbody>' + out.map(r =>
    `<tr><td class="m">${mlab(r.m)}</td><td class="n num">${N0.format(r.ld)}</td>` + r.cells.map(v => v == null ? '<td class="e"></td>' : (() => { const k = safe(v, mx) * 100; return `<td class="num" style="background:color-mix(in srgb,var(--primary) ${(8 + k * .8).toFixed(0)}%,var(--surface));color:${k > 52 ? 'var(--on-primary)' : 'var(--text)'}">${pct(v, 1)}</td>`; })()).join('') + '</tr>').join('') + '</tbody>';
}
function metas(M){
  const a = M[F.to], tag = (c, t) => `<span class="tag ${c}">${t}</span>`;
  $('#meta-sub').textContent = `${mlab(F.to)} · realizado contra o planejado, com os filtros atuais`;
  if (!a.spend) { $('#goals').innerHTML = ''; return; }
  const gr = safe(a.gRev, a.gSpend);
  const defs = [
    ['Receita atribuída', a.rev, a.gRev, brlC, v => v >= 1 ? ['t-ok', 'Meta batida'] : v >= .93 ? ['t-warn', 'Quase lá'] : ['t-bad', 'Abaixo da meta'], T.cat[2]],
    ['Investimento', a.spend, a.gSpend, brlC, v => v <= 1 ? ['t-ok', 'Dentro do orçamento'] : v <= 1.05 ? ['t-warn', 'Acima do orçamento'] : ['t-bad', 'Estourou o orçamento'], T.primary],
    ['Leads', a.leads, a.gLeads, v => N0.format(v), v => v >= 1 ? ['t-ok', 'Meta batida'] : v >= .93 ? ['t-warn', 'Quase lá'] : ['t-bad', 'Abaixo da meta'], T.cat[3]],
    ['ROAS', safe(a.rev, a.spend), gr, xf, v => v >= 1 ? ['t-ok', 'Meta batida'] : v >= .93 ? ['t-warn', 'Quase lá'] : ['t-bad', 'Abaixo da meta'], T.cat[1]]
  ];
  $('#goals').innerHTML = defs.map(([n, v, g, fm, st, col]) => { const p = safe(v, g), [cl, tx] = st(p);
    return `<div><div class="gh"><b>${n}</b><span class="v num">${fm(v)} de ${fm(g)}</span></div><div class="gb" style="--c:${col}" role="img" aria-label="${n}: ${pct(p, 0)} da meta"><i style="width:${Math.min(p, 1.25) / 1.25 * 100}%"></i><u style="left:80%"></u></div><div class="gf"><span class="num">${pct(p, 0)} do planejado</span>${tag(cl, tx)}</div></div>`; }).join('');
}

/* ========== tabelas ========== */
let CAMP_ROWS = [], CREAT_ROWS = [];
const STN = ['Escalar', 'Manter', 'Revisar'], STC = ['t-ok', 't-info', 't-bad'];
const KST = ['Vencedor', 'Estável', 'Fadiga'];
function calc(){
  const a = group(r => r.cp, 'cp', F.from, F.to, CAMPS.length);
  const rowOf = (x, ex) => ({...ex, spend:x.spend, rev:x.rev, roas:safe(x.rev, x.spend), cpa:safe(x.spend, x.sales), cpc:safe(x.spend, x.clk), ctr:safe(x.clk, x.imp), imp:x.imp, leads:x.leads, sales:x.sales});
  CAMP_ROWS = CAMPS.filter(c => campOk(c) && a[c.i].spend).map(c => { const r = rowOf(a[c.i], {i:c.i, name:c.n, ch:CHANNELS[c.ch], ob:OBJ[c.ob], tr:c.tr}); r.st = r.roas >= c.tr * 1.1 ? 0 : r.roas >= c.tr * .85 ? 1 : 2; return r; });
  const tot = sumR(byMonth(null), F.from, F.to), avg = safe(tot.rev, tot.spend);
  CREAT_ROWS = [];
  for (const k of CREAT) { const c = CAMPS[k.cp], x = a[k.cp]; if (!campOk(c) || !x.spend || (F.cp >= 0 && F.cp !== k.cp)) continue;
    const y = {spend:x.spend * k.w, imp:x.imp * k.w, clk:x.clk * k.cs, leads:x.leads * k.ss, sales:x.sales * k.ss, rev:x.rev * k.ss};
    const r = rowOf(y, {code:k.code, name:k.name, camp:c.n, fmt:k.fmt}); r.st = r.roas >= c.tr * 1.15 ? 0 : r.roas < c.tr * .8 ? 2 : 1; CREAT_ROWS.push(r); }
}
const TAB = {t:'c', q:'', sort:{c:['rev', -1], k:['roas', -1]}, page:0}, PS = 8;
const mon = v => 'R$ ' + N0.format(v);
const COLS = {
  c:[['name','Campanha',v=>v],['ch','Canal',v=>v],['ob','Objetivo',v=>v],['spend','Investimento',mon,'r'],['rev','Receita',mon,'r'],['roas','ROAS',xf,'r'],['cpa','CPA',brl,'r'],['cpc','CPC',brl,'r'],['ctr','CTR',v=>pct(v,2),'r'],['leads','Leads',v=>N0.format(v),'r'],['sales','Vendas',v=>N0.format(v),'r'],['st','Ação sugerida',v=>`<span class="tag ${STC[v]}">${STN[v]}</span>`,'h']],
  k:[['code','Código',v=>v],['name','Criativo',v=>v],['camp','Campanha',v=>v],['fmt','Formato',v=>v],['imp','Impressões',v=>N0.format(v),'r'],['ctr','CTR',v=>pct(v,2),'r'],['cpc','CPC',brl,'r'],['sales','Vendas',v=>N0.format(v),'r'],['cpa','CPA',brl,'r'],['roas','ROAS',xf,'r'],['st','Situação',v=>`<span class="tag ${['t-ok','t-info','t-warn'][v]}">${KST[v]}</span>`,'h']]
};
const stName = r => TAB.t === 'c' ? STN[r.st] : KST[r.st];
function tableRows(){
  const cols = COLS[TAB.t], src = TAB.t === 'c' ? CAMP_ROWS : CREAT_ROWS, q = TAB.q.trim().toLowerCase();
  const txt = r => cols.map(c => c[0] === 'st' ? stName(r) : r[c[0]]).join(' ').toLowerCase();
  const out = q ? src.filter(r => txt(r).includes(q)) : src.slice();
  const [k, d] = TAB.sort[TAB.t]; out.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x ?? -Infinity) - (y ?? -Infinity)) * d; });
  return out;
}
function table(){
  const cols = COLS[TAB.t], all = tableRows(), pages = Math.max(1, Math.ceil(all.length / PS)); TAB.page = Math.min(TAB.page, pages - 1);
  const [sk, sd] = TAB.sort[TAB.t];
  $('#tbl thead').innerHTML = '<tr>' + cols.map(c => `<th class="${c[3] === 'r' ? 'r' : ''}" data-k="${c[0]}" tabindex="0" ${c[0] === sk ? `aria-sort="${sd > 0 ? 'ascending' : 'descending'}"` : ''}>${c[1]}</th>`).join('') + '</tr>';
  const pg = all.slice(TAB.page * PS, TAB.page * PS + PS), isC = TAB.t === 'c';
  $('#tbl tbody').innerHTML = pg.length ? pg.map(r => `<tr class="${isC ? 'click' : ''} ${isC && r.i === F.cp ? 'sel' : ''}" ${isC ? `data-c="${r.i}" title="Filtrar por esta campanha"` : ''}>` + cols.map(c => `<td class="${c[3] === 'r' ? 'r num' : ''}">${c[3] === 'h' ? c[2](r[c[0]]) : esc(c[2](r[c[0]]))}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:24px">Nenhum resultado.</td></tr>`;
  const a = all.length ? TAB.page * PS + 1 : 0;
  $('#pginfo').textContent = `${a}–${Math.min(all.length, a + PS - 1)} de ${all.length}`;
  $('#pgbtns').innerHTML = `<button type="button" data-p="-1" ${TAB.page ? '' : 'disabled'} aria-label="Página anterior">‹</button><button type="button" disabled>${TAB.page + 1} / ${pages}</button><button type="button" data-p="1" ${TAB.page < pages - 1 ? '' : 'disabled'} aria-label="Próxima página">›</button>`;
}
function bindTable(){
  const tab = t => { TAB.t = t; TAB.page = 0; $('#tab-c').setAttribute('aria-selected', t === 'c'); $('#tab-k').setAttribute('aria-selected', t === 'k'); table(); };
  $('#tab-c').onclick = () => tab('c'); $('#tab-k').onclick = () => tab('k');
  $('#q').oninput = e => { TAB.q = e.target.value; TAB.page = 0; table(); };
  const sort = e => { const th = e.target.closest('th'); if (!th) return; if (e.type === 'keydown' && e.key !== 'Enter') return; const k = th.dataset.k, s = TAB.sort[TAB.t]; TAB.sort[TAB.t] = [k, s[0] === k ? -s[1] : (typeof (TAB.t === 'c' ? CAMP_ROWS : CREAT_ROWS)[0]?.[k] === 'string' ? 1 : -1)]; table(); };
  $('#tbl thead').onclick = sort; $('#tbl thead').onkeydown = sort;
  $('#tbl tbody').onclick = e => { const tr = e.target.closest('tr[data-c]'); if (tr) toggle('cp', +tr.dataset.c); };
  $('#pgbtns').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { TAB.page += +b.dataset.p; table(); } };
  $('#csv').onclick = () => {
    const cols = COLS[TAB.t], fmt = (c, v) => c[0] === 'st' ? (TAB.t === 'c' ? STN : KST)[v] : v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : v;
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = [cols.map(c => q(c[1])).join(';'), ...tableRows().map(r => cols.map(c => q(fmt(c, r[c[0]]))).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'}));
    a.download = `orla-pet_${TAB.t === 'c' ? 'campanhas' : 'criativos'}_${mlab(F.from).replace('/', '-')}_${mlab(F.to).replace('/', '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ========== orquestração ========== */
function render(){
  syncFilters();
  const M = byMonth(null);
  kpis(M); charts(M); funil(M); cohort(); metas(M); calc(); table();
}
function setTheme(d){
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  $('#theme-t').textContent = d ? 'Claro' : 'Escuro';
  $('#theme-i').setAttribute('d', d ? 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z');
  try { localStorage.setItem('op-tema', d ? 'dark' : 'light'); } catch (e) { /* storage bloqueado: segue sem persistir */ }
  readTheme();
}
let saved = null; try { saved = localStorage.getItem('op-tema'); } catch (e) { /* idem */ }
fillSelects(); bindFilters(); bindTable();
setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').onclick = () => { setTheme(document.documentElement.dataset.theme !== 'dark'); render(); };
render();
})();
