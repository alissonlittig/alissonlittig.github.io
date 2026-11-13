(() => {
'use strict';
const $ = s => document.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ===== dados sintéticos (semente fixa) ===== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261113);
const NM = 24;                                    // nov/24 .. out/26
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);
const dim = m => new Date(yr(m), cal(m) + 1, 0).getDate();

const UNITS = [
  { n:'Beira-Mar', rooms:58, occ:.74, adr:520, los:2.6, w:[.22,.36,.2,.05,.17],
    seas:[1.22,1.18,.95,.84,.7,.72,1.0,.8,.86,.92,.98,1.2], wd:[.86,.8,.82,.88,1.12,1.3,1.1] },
  { n:'Serra', rooms:34, occ:.64, adr:410, los:2.2, w:[.28,.3,.17,.05,.2],
    seas:[.9,.8,.78,.86,.94,1.2,1.4,1.05,.8,.8,.86,1.08], wd:[.7,.7,.74,.82,1.2,1.5,1.2] },
  { n:'Centro', rooms:80, occ:.7, adr:285, los:1.7, w:[.12,.2,.14,.42,.12],
    seas:[.8,.92,1.04,1.04,1.04,.98,.9,1.04,1.1,1.1,1.08,.82], wd:[.7,1.22,1.3,1.28,1.1,.62,.5] }
].map((u,i)=>({...u,i}));
const CH = [
  { n:'Site próprio', com:0,   adj:1.06, cx:.05, lead:24 },
  { n:'Portal A',     com:.16, adj:1.0,  cx:.21, lead:38 },
  { n:'Portal B',     com:.15, adj:.97,  cx:.18, lead:30 },
  { n:'Corporativo',  com:.05, adj:.88,  cx:.06, lead:12 },
  { n:'Agências',     com:.10, adj:.92,  cx:.09, lead:45 }
];
const CHC = ['#0b6e8a','#e0802b','#7a5cc7','#2e9d6a','#c24a6c'];
const ROOMS = [{n:'Standard',mult:1,mix:.55,occ:.97},{n:'Superior',mult:1.22,mix:.3,occ:.9},{n:'Suíte',mult:1.7,mix:.15,occ:.72}];
const LEAD_B = ['0-3 dias','4-7','8-14','15-30','31-60','60+'], LEAD_M = [2,5,11,22,45,90];
const WDN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const leadDist = d => { const w = LEAD_M.map(m => Math.exp(-Math.pow(Math.log(m / d), 2) / (2 * .8 * .8))), s = w.reduce((a, b) => a + b, 0); return w.map(x => x / s); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const rows = [];
for (let m = 0; m < NM; m++) for (const u of UNITS) {
  const cm = cal(m), grow = Math.pow(1.0045, m);
  const occ = clamp(u.occ * u.seas[cm] * grow * (.97 + R() * .06), .22, .95);
  const adr = u.adr * (.88 + .12 * u.seas[cm]) * Math.pow(1.0055, m) * (.98 + R() * .04);
  const nights = occ * u.rooms * dim(m);
  const wts = u.w.map(x => x * (.94 + R() * .12)), ws = wts.reduce((a, b) => a + b, 0);
  const norm = wts.reduce((a, x, c) => a + x / ws * CH[c].adj, 0);
  CH.forEach((c, ci) => {
    const n = nights * wts[ci] / ws;
    const rev = n * adr * c.adj / norm;
    const bk = n / u.los, cx = bk * c.cx / (1 - c.cx);
    rows.push({ m, u: u.i, c: ci, n, rev, bk: bk + cx, cx, com: rev * c.com, cap: ci === 0 ? u.rooms * dim(m) : 0 });
  });
}
const END = NM - 1;

/* ===== estado e agregações ===== */
const S = { per: 12, uni: -1, can: -1 };
const PER = [[12,'Últimos 12 meses'],[6,'Últimos 6 meses'],[3,'Últimos 3 meses'],[1,'Último mês (out/26)']];
const fmtR = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const fmtK = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi' : v >= 1e3 ? 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mil' : fmtR(v);
const pct = (v, d = 1) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d }) + '%';
const int = v => Math.round(v).toLocaleString('pt-BR');
function agg(m0, m1, uni = S.uni, can = S.can) {
  const a = { n: 0, rev: 0, bk: 0, cx: 0, com: 0, cap: 0 };
  for (const r of rows) {
    if (r.m < m0 || r.m > m1) continue;
    if (uni >= 0 && r.u !== uni) continue;
    a.cap += r.cap;                               // capacidade não depende do canal
    if (can >= 0 && r.c !== can) continue;
    a.n += r.n; a.rev += r.rev; a.bk += r.bk; a.cx += r.cx; a.com += r.com;
  }
  a.occ = a.cap ? a.n / a.cap : 0; a.adr = a.n ? a.rev / a.n : 0; a.revpar = a.cap ? a.rev / a.cap : 0;
  a.cxr = a.bk ? a.cx / a.bk : 0; a.net = a.rev - a.com;
  return a;
}
const cur = () => agg(END - S.per + 1, END), prev = () => agg(END - S.per + 1 - 12, END - 12);

/* ===== gráficos ===== */
const charts = {};
function mk(id, cfg) {
  if (charts[id]) charts[id].destroy();
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.color = css('--muted');
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 } }, cfg.options);
  charts[id] = new Chart($('#' + id), cfg);
}
const grid = () => ({ color: css('--border') });
const tip = { backgroundColor: '#0a1e29', titleColor: '#fff', bodyColor: '#e8f3f7', padding: 10, cornerRadius: 8 };
const leg = { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } };
const dec = v => v.toFixed(1).replace('.', ',');

function kpiCard(l, v, d, inv) {
  const up = d > 0.0005, dn = d < -0.0005, good = inv ? dn : up;
  const cls = !up && !dn ? 'flat' : good ? 'up' : 'down';
  const arrow = up ? '<svg viewBox="0 0 10 10"><path d="M5 1l4 7H1z"/></svg>' : dn ? '<svg viewBox="0 0 10 10"><path d="M5 9L1 2h8z"/></svg>' : '';
  return `<div class="card kpi"><div class="l">${l}</div><div class="v num">${v}</div><div class="d"><span class="pill ${cls}">${arrow}${dec(Math.abs(d) * 100)}%</span> vs. mesmo período do ano anterior</div></div>`;
}
const dl = (a, b) => b ? a / b - 1 : 0;

function render() {
  const c = cur(), p = prev();
  const m0 = END - S.per + 1;
  $('#range').textContent = mlab(m0) + ' a ' + mlab(END);
  const chips = [];
  if (S.uni >= 0) chips.push(['uni', 'Unidade: ' + UNITS[S.uni].n]);
  if (S.can >= 0) chips.push(['can', 'Canal: ' + CH[S.can].n]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button">${t}<i aria-hidden="true">×</i></button>`).join('');
  $('#kpis').innerHTML =
    kpiCard('Receita de hospedagem', fmtK(c.rev), dl(c.rev, p.rev)) +
    kpiCard('Ocupação', pct(c.occ), dl(c.occ, p.occ)) +
    kpiCard('Diária média (ADR)', fmtR(c.adr), dl(c.adr, p.adr)) +
    kpiCard('RevPAR', fmtR(c.revpar), dl(c.revpar, p.revpar)) +
    kpiCard('Receita líquida', fmtK(c.net), dl(c.net, p.net)) +
    kpiCard('Cancelamentos', pct(c.cxr), dl(c.cxr, p.cxr), true);

  const pri = css('--primary');
  /* mensal */
  const ms = Array.from({ length: 12 }, (_, i) => END - 11 + i);
  const A = ms.map(m => agg(m, m)), B = ms.map(m => agg(m - 12, m - 12));
  mk('ch-mes', { data: { labels: ms.map(mlab), datasets: [
    { type: 'bar', label: 'RevPAR', data: A.map(a => a.revpar), backgroundColor: pri, borderRadius: 5, yAxisID: 'y', order: 2 },
    { type: 'line', label: 'RevPAR ano anterior', data: B.map(a => a.revpar), borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, borderWidth: 2, yAxisID: 'y', order: 1 },
    { type: 'line', label: 'Ocupação', data: A.map(a => a.occ * 100), borderColor: '#e0802b', backgroundColor: '#e0802b', pointRadius: 3, borderWidth: 2.5, tension: .3, yAxisID: 'y1', order: 0 }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + (x.dataset.yAxisID === 'y1' ? dec(x.parsed.y) + '%' : fmtR(x.parsed.y)) } } },
      scales: { x: { grid: { display: false } }, y: { grid: grid(), ticks: { callback: v => 'R$ ' + v }, beginAtZero: true }, y1: { position: 'right', grid: { display: false }, min: 0, max: 100, ticks: { callback: v => v + '%' } } } } });
  /* canais */
  const byC = CH.map((_, i) => agg(m0, END, S.uni, i).rev), totC = byC.reduce((a, b) => a + b, 0) || 1;
  mk('ch-can', { type: 'doughnut', data: { labels: CH.map(x => x.n), datasets: [{ data: byC, backgroundColor: CHC, borderColor: css('--surface'), borderWidth: 2, offset: CH.map((_, i) => i === S.can ? 10 : 0) }] },
    options: { cutout: '62%', onClick: (_, el) => { if (el.length) { S.can = S.can === el[0].index ? -1 : el[0].index; sync(); } }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.label + ': ' + fmtK(x.parsed) + ' (' + pct(x.parsed / totC) + ')' } } } } });
  /* mapa de calor */
  const us = S.uni >= 0 ? [UNITS[S.uni]] : UNITS, totRooms = us.reduce((a, u) => a + u.rooms, 0);
  let h = '<span></span>' + ms.map(m => `<span class="hl">${MN[cal(m)]}</span>`).join('');
  const hv = WDN.map((_, d) => ms.map(m => { let num = 0; for (const u of us) { const o = agg(m, m, u.i, -1).occ, mean = u.wd.reduce((a, b) => a + b, 0) / 7; num += clamp(o * u.wd[d] / mean, .05, .99) * u.rooms; } return num / totRooms; }));
  const lo = Math.min(...hv.flat()), hi = Math.max(...hv.flat());
  WDN.forEach((dn, d) => { h += `<span class="hl d">${dn}</span>` + hv[d].map(v => { const t = (v - lo) / (hi - lo || 1); return `<span class="hc${t > .55 ? ' hi' : ''}" style="--t:${t.toFixed(2)}" title="${dn}: ${pct(v, 0)}">${Math.round(v * 100)}</span>`; }).join(''); });
  $('#heat').innerHTML = h;
  /* unidades */
  const ur = UNITS.map(u => agg(m0, END, u.i, S.can));
  mk('ch-uni', { type: 'bar', data: { labels: UNITS.map(u => u.n), datasets: [{ data: ur.map(a => a.revpar), backgroundColor: UNITS.map(u => u.i === S.uni || S.uni < 0 ? pri : css('--border')), borderRadius: 6 }] },
    options: { indexAxis: 'y', onClick: (_, el) => { if (el.length) { S.uni = S.uni === el[0].index ? -1 : el[0].index; sync(); } }, plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => 'RevPAR ' + fmtR(x.parsed.x), afterLabel: x => 'Ocupação ' + pct(ur[x.dataIndex].occ) + ' · ADR ' + fmtR(ur[x.dataIndex].adr) } } }, scales: { x: { grid: grid(), beginAtZero: true, ticks: { callback: v => 'R$ ' + v } }, y: { grid: { display: false } } } } });
  /* reservas futuras */
  const base = new Date(2026, 10, 16), wl = [], fin = [], ob = [], ly = [];
  for (let w = 0; w < 13; w++) {
    const d = new Date(base.getTime() + w * 7 * 864e5); wl.push(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'));
    let num = 0; for (const u of us) { const f0 = clamp(u.occ * u.seas[d.getMonth()] * Math.pow(1.0045, 25 + w / 4.3), .2, .97); num += f0 * u.rooms; }
    const f = num / totRooms, k = Math.exp(-.14 * w) * .96 + (w > 8 ? .02 : 0);
    fin.push(f * 100); ob.push(f * k * 100 * (1 + .015 * Math.sin(w * 1.7))); ly.push(f * k * 100 * (.86 + .006 * w) * (1 + .02 * Math.cos(w * 1.3)));
  }
  mk('ch-pace', { type: 'line', data: { labels: wl, datasets: [
    { label: 'Confirmado hoje', data: ob, borderColor: pri, backgroundColor: pri + '33', fill: true, tension: .35, pointRadius: 3, borderWidth: 2.5 },
    { label: 'Mesmo ponto no ano anterior', data: ly, borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, tension: .35, borderWidth: 2 },
    { label: 'Previsão final', data: fin, borderColor: '#e0802b', borderDash: [2, 4], pointRadius: 0, tension: .35, borderWidth: 2 }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { title: x => 'Semana de ' + x[0].label, label: x => x.dataset.label + ': ' + dec(x.parsed.y) + '%' } } }, scales: { x: { grid: { display: false }, title: { display: true, text: 'semana de hospedagem (início)' } }, y: { grid: grid(), min: 0, max: 100, ticks: { callback: v => v + '%' } } } } });
  /* tipo de quarto */
  const norm = ROOMS.reduce((a, r) => a + r.mix * r.mult, 0);
  mk('ch-room', { data: { labels: ROOMS.map(r => r.n), datasets: [
    { type: 'bar', label: 'Diária média', data: ROOMS.map(r => c.adr * r.mult / norm), backgroundColor: pri, borderRadius: 6, yAxisID: 'y', order: 2 },
    { type: 'line', label: 'Ocupação', data: ROOMS.map(r => clamp(c.occ * r.occ, 0, .99) * 100), borderColor: '#e0802b', backgroundColor: '#e0802b', pointRadius: 4, borderWidth: 2.5, yAxisID: 'y1', order: 0 }] },
    options: { plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + (x.datasetIndex ? dec(x.parsed.y) + '%' : fmtR(x.parsed.y)) } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: v => 'R$ ' + v } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: v => v + '%' } } } } });
  /* antecedência */
  const bks = CH.map((_, i) => agg(m0, END, S.uni, i).bk), tb = bks.reduce((a, b) => a + b, 0) || 1;
  const ld = LEAD_B.map((_, b) => CH.reduce((a, ch, i) => a + bks[i] * leadDist(ch.lead)[b], 0) / tb * 100);
  mk('ch-lead', { type: 'bar', data: { labels: LEAD_B, datasets: [{ data: ld, backgroundColor: pri, borderRadius: 6 }] },
    options: { plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => dec(x.parsed.y) + '% das reservas' } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: v => v + '%' } } } } });
  /* cancelamento e comissão */
  const cr = CH.map((_, i) => agg(m0, END, S.uni, i));
  mk('ch-cx', { type: 'bar', data: { labels: CH.map(x => x.n), datasets: [
    { label: 'Cancelamento', data: cr.map(a => a.cxr * 100), backgroundColor: '#c24a6c', borderRadius: 5 },
    { label: 'Comissão', data: cr.map(a => a.rev ? a.com / a.rev * 100 : 0), backgroundColor: '#e0802b', borderRadius: 5 }] },
    options: { plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + dec(x.parsed.y) + '%' } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: v => v + '%' } } } } });
  table();
}

/* ===== tabela ===== */
let tab = 'u', sortK = 'revpar', sortD = -1, tableRows = [];
const COLS = [['n', 'Nome', 0], ['nights', 'Diárias', 1], ['occ', 'Ocupação', 1], ['adr', 'ADR', 1], ['revpar', 'RevPAR', 1], ['rev', 'Receita', 1], ['net', 'Líquida', 1], ['cxr', 'Cancel.', 1]];
function table() {
  const m0 = END - S.per + 1, q = $('#q').value.trim().toLowerCase();
  const list = tab === 'u' ? UNITS.map(u => ({ name: u.n, a: agg(m0, END, u.i, S.can) })) : CH.map((c, i) => ({ name: c.n, a: agg(m0, END, S.uni, i) }));
  tableRows = list.map(({ name, a }) => ({ n: name, nights: a.n, occ: a.occ, adr: a.adr, revpar: a.revpar, rev: a.rev, net: a.net, cxr: a.cxr })).filter(r => r.n.toLowerCase().includes(q));
  tableRows.sort((x, y) => (sortK === 'n' ? x.n.localeCompare(y.n) : x[sortK] - y[sortK]) * sortD);
  $('#tbl thead').innerHTML = '<tr>' + COLS.map(([k, t, r]) => `<th class="${r ? 'r' : ''}" data-k="${k}" tabindex="0" ${sortK === k ? `aria-sort="${sortD > 0 ? 'ascending' : 'descending'}"` : ''}>${t}</th>`).join('') + '</tr>';
  $('#tbl tbody').innerHTML = tableRows.length ? tableRows.map(r => `<tr><td>${r.n}</td><td class="r num">${int(r.nights)}</td><td class="r num">${pct(r.occ)}</td><td class="r num">${fmtR(r.adr)}</td><td class="r num">${fmtR(r.revpar)}</td><td class="r num">${fmtR(r.rev)}</td><td class="r num">${fmtR(r.net)}</td><td class="r num">${pct(r.cxr)}</td></tr>`).join('') : '<tr><td colspan="8">Nada encontrado.</td></tr>';
}

/* ===== controles ===== */
function sync() { $('#f-per').value = S.per; $('#f-uni').value = S.uni; $('#f-can').value = S.can; render(); }
$('#f-per').innerHTML = PER.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
$('#f-uni').innerHTML = '<option value="-1">Todas as unidades</option>' + UNITS.map(u => `<option value="${u.i}">${u.n}</option>`).join('');
$('#f-can').innerHTML = '<option value="-1">Todos os canais</option>' + CH.map((c, i) => `<option value="${i}">${c.n}</option>`).join('');
$('#f-per').onchange = e => { S.per = +e.target.value; sync(); };
$('#f-uni').onchange = e => { S.uni = +e.target.value; sync(); };
$('#f-can').onchange = e => { S.can = +e.target.value; sync(); };
$('#clear').onclick = () => { S.per = 12; S.uni = -1; S.can = -1; sync(); };
$('#chips').onclick = e => { const b = e.target.closest('.chip'); if (b) { S[b.dataset.k] = -1; sync(); } };
function setTab(t) { tab = t; $('#tab-u').setAttribute('aria-selected', t === 'u'); $('#tab-c').setAttribute('aria-selected', t === 'c'); table(); }
$('#tab-u').onclick = () => setTab('u'); $('#tab-c').onclick = () => setTab('c');
$('#q').oninput = table;
const sortBy = th => { if (!th) return; const k = th.dataset.k; sortD = sortK === k ? -sortD : (k === 'n' ? 1 : -1); sortK = k; table(); };
$('#tbl thead').onclick = e => sortBy(e.target.closest('th'));
$('#tbl thead').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(e.target.closest('th')); } };
$('#csv').onclick = () => {
  const head = COLS.map(c => c[1]).join(';'), body = tableRows.map(r => [r.n, r.nights.toFixed(0), (r.occ * 100).toFixed(1), r.adr.toFixed(2), r.revpar.toFixed(2), r.rev.toFixed(2), r.net.toFixed(2), (r.cxr * 100).toFixed(1)].join(';'));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + [head, ...body].join('\n')], { type: 'text/csv' })); a.download = 'maresia-' + (tab === 'u' ? 'unidades' : 'canais') + '.csv'; a.click();
};
function theme(t) { document.documentElement.dataset.theme = t; $('#theme-t').textContent = t === 'dark' ? 'Claro' : 'Escuro'; try { localStorage.setItem('maresia-tema', t); } catch (e) { /* modo privado: tema não persiste */ } if (charts['ch-mes']) render(); }
$('#theme').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
let t0 = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; try { t0 = localStorage.getItem('maresia-tema') || t0; } catch (e) { /* sem storage */ }
theme(t0); sync();
})();
