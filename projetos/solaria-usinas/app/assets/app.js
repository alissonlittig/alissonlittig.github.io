(() => {
'use strict';
const $ = s => document.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ===== dados sintéticos (semente fixa) ===== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261114);
const NM = 24;                                    // nov/24 .. out/26
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);
const dim = m => new Date(yr(m), cal(m) + 1, 0).getDate();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// irradiação relativa por mês (hemisfério sul)
const IRR = [1.15,1.1,1.0,.88,.75,.68,.72,.85,.92,1.05,1.12,1.18];
const PLANTS = [
  { n:'Cerrado I',         uf:'GO', t:0, kwp:5400, y:1.00, tar:.31, soil:.012, down:.004 },
  { n:'Sertão',            uf:'BA', t:0, kwp:7200, y:1.12, tar:.29, soil:.018, down:.006 },
  { n:'Telhado Logística', uf:'PR', t:1, kwp:1450, y:.90,  tar:.62, soil:.010, down:.003 },
  { n:'Telhado Shopping',  uf:'SP', t:1, kwp:2100, y:.93,  tar:.71, soil:.014, down:.003 },
  { n:'Fazenda Alvorada',  uf:'MT', t:0, kwp:3800, y:1.04, tar:.33, soil:.03,  down:.005 },
  { n:'Condomínio Brisa',  uf:'SC', t:1, kwp:680,  y:.88,  tar:.74, soil:.008, down:.002 }
].map((p,i)=>({...p,i}));
const TIPOS = ['Solo (mercado livre)', 'Telhado (economia do cliente)'];
const COLOR = ['#e08a00','#2f7fd1','#2e9d6a','#7a5cc7','#c24a6c','#5a6b7a'];
const CAUSAS = ['Sujeira nos módulos','Calor nos módulos','Sombreamento','Inversores','Indisponibilidade'];
const CAUSAC = ['#b8845a','#e0802b','#7a5cc7','#2f7fd1','#c24a6c'];
const DESIGN_LOSS = .17, CO2 = .074, BASEY = 4.9;

const rows = [];
for (let m = 0; m < NM; m++) for (const p of PLANTS) {
  const cm = cal(m), dry = [4,5,6,7,8].includes(cm);
  const clouds = clamp(1 - (cm < 3 || cm > 9 ? .08 + R() * .16 : R() * .06), .7, 1);
  const pot = p.kwp * BASEY * IRR[cm] * dim(m) * p.y * clouds * Math.pow(.995, m / 12);
  // perdas como fração do potencial
  const cleaned = p.n === 'Fazenda Alvorada' && m >= 17;           // lavagem robotizada a partir de abr/26
  const soil = (p.soil * (dry ? 2.4 : 1) * (cleaned ? .25 : 1)) * (.8 + R() * .4) * (1 + (m % 12) * .02);
  const heat = (.035 + .05 * (IRR[cm] - .68) / .5) * (p.t ? 1.15 : 1) * (.9 + R() * .2);
  const shade = (p.t ? .028 : .006) * (.8 + R() * .4);
  const inv = .018 * (.8 + R() * .4);
  let down = p.down * (.5 + R());
  if (p.n === 'Sertão' && m === 16) down = .11;                    // falha de inversor em mar/26
  if (p.n === 'Cerrado I' && m === 21) down = .045;
  const loss = [soil, heat, shade, inv, down];
  const real = pot * (1 - loss.reduce((a, b) => a + b, 0));
  rows.push({ m, p: p.i, pot, real, meta: pot * (1 - DESIGN_LOSS) / clouds, loss: loss.map(x => x * pot), rev: real * p.tar });
}
const END = NM - 1;
const ALERTS = [
  ['12/11/2026', 1, 'Inversor 07', 'Queda de tensão no barramento CC', 'Alta', 5300, 'Equipe a caminho'],
  ['11/11/2026', 4, 'Strings 14 a 19', 'Corrente 18% abaixo da vizinhança (sujeira)', 'Média', 2100, 'Lavagem agendada'],
  ['10/11/2026', 0, 'Estação meteorológica', 'Sensor de irradiação sem leitura', 'Baixa', 0, 'Aberto'],
  ['09/11/2026', 3, 'Inversor 02', 'Limitação por temperatura acima de 75 °C', 'Média', 900, 'Em análise'],
  ['08/11/2026', 2, 'Quadro geral', 'Fator de potência abaixo de 0,92', 'Média', 0, 'Aberto'],
  ['06/11/2026', 1, 'Tracker 31', 'Motor com ciclos fora do padrão', 'Alta', 1800, 'Peça solicitada'],
  ['05/11/2026', 5, 'Inversor 01', 'Comunicação intermitente com o monitoramento', 'Baixa', 0, 'Em análise'],
  ['03/11/2026', 4, 'Strings 02 a 05', 'Diodo de bypass em curto', 'Alta', 3400, 'Equipe a caminho'],
  ['02/11/2026', 0, 'Inversor 11', 'Isolamento abaixo do limite', 'Alta', 4200, 'Peça solicitada'],
  ['30/10/2026', 3, 'Módulos fileira C', 'Sombra de nova antena no telhado', 'Média', 650, 'Em análise'],
  ['28/10/2026', 2, 'Inversor 03', 'Atualização de firmware pendente', 'Baixa', 0, 'Aberto']
].map(([d, p, eq, t, g, kwh, st]) => ({ d, p, eq, t, g, kwh, st }));

/* ===== estado e agregações ===== */
const S = { per: 12, usi: -1, tip: -1 };
const PER = [[12,'Últimos 12 meses'],[6,'Últimos 6 meses'],[3,'Últimos 3 meses'],[1,'Último mês (out/26)']];
const dec = (v, d = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtR = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const fmtK = v => v >= 1e6 ? 'R$ ' + dec(v / 1e6, 2) + ' mi' : v >= 1e3 ? 'R$ ' + dec(v / 1e3, 0) + ' mil' : fmtR(v);
const mwh = v => dec(v / 1000, v >= 1e6 ? 0 : 1) + ' MWh';
const pct = (v, d = 1) => dec(v * 100, d) + '%';
const ok = (p, usi = S.usi, tip = S.tip) => (usi < 0 || p === usi) && (tip < 0 || PLANTS[p].t === tip);
function agg(m0, m1, usi = S.usi, tip = S.tip) {
  const a = { pot: 0, real: 0, meta: 0, rev: 0, loss: [0, 0, 0, 0, 0] };
  for (const r of rows) {
    if (r.m < m0 || r.m > m1 || !ok(r.p, usi, tip)) continue;
    a.pot += r.pot; a.real += r.real; a.meta += r.meta; a.rev += r.rev; r.loss.forEach((x, i) => a.loss[i] += x);
  }
  a.pr = a.pot ? a.real / a.pot : 0;
  a.co2 = a.real / 1000 * CO2;                      // kWh -> MWh -> t
  a.avail = a.pot ? 1 - a.loss[4] / a.pot : 0;
  return a;
}
const cur = () => agg(END - S.per + 1, END), prev = () => agg(END - S.per + 1 - 12, END - 12);
const openAlerts = () => ALERTS.filter(a => ok(a.p));

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
const tip = { backgroundColor: '#1f1708', titleColor: '#fff', bodyColor: '#f7f1e1', padding: 10, cornerRadius: 8 };
const leg = { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } };

function kpiCard(l, v, d, inv, note) {
  const up = d > 0.0005, dn = d < -0.0005, good = inv ? dn : up;
  const cls = !up && !dn ? 'flat' : good ? 'up' : 'down';
  const arrow = up ? '<svg viewBox="0 0 10 10"><path d="M5 1l4 7H1z"/></svg>' : dn ? '<svg viewBox="0 0 10 10"><path d="M5 9L1 2h8z"/></svg>' : '';
  return `<div class="card kpi"><div class="l">${l}</div><div class="v num">${v}</div><div class="d"><span class="pill ${cls}">${arrow}${dec(Math.abs(d) * 100)}%</span> ${note || 'vs. ano anterior'}</div></div>`;
}
const dl = (a, b) => b ? a / b - 1 : 0;

function render() {
  const c = cur(), p = prev(), m0 = END - S.per + 1, al = openAlerts();
  $('#range').textContent = mlab(m0) + ' a ' + mlab(END);
  const chips = [];
  if (S.usi >= 0) chips.push(['usi', 'Usina: ' + PLANTS[S.usi].n]);
  if (S.tip >= 0) chips.push(['tip', 'Tipo: ' + TIPOS[S.tip]]);
  $('#chips').innerHTML = chips.map(([k, t]) => `<button class="chip" data-k="${k}" type="button">${t}<i aria-hidden="true">×</i></button>`).join('');
  $('#kpis').innerHTML =
    kpiCard('Geração', mwh(c.real), dl(c.real, p.real)) +
    kpiCard('Contra a meta', pct(c.meta ? c.real / c.meta : 0, 1), dl(c.real / c.meta, p.real / p.meta), false, 'da meta, vs. ano anterior') +
    kpiCard('Performance ratio', pct(c.pr), dl(c.pr, p.pr)) +
    kpiCard('Disponibilidade', pct(c.avail), dl(c.avail, p.avail)) +
    kpiCard('Receita e economia', fmtK(c.rev), dl(c.rev, p.rev)) +
    `<div class="card kpi"><div class="l">CO2 evitado</div><div class="v num">${dec(c.co2, 0)} t</div><div class="d"><span class="pill ${al.some(a => a.g === 'Alta') ? 'down' : 'flat'}">${al.length}</span> alertas abertos${al.some(a => a.g === 'Alta') ? ' · ' + al.filter(a => a.g === 'Alta').length + ' altos' : ''}</div></div>`;

  const pri = css('--primary');
  /* mensal */
  const ms = Array.from({ length: 12 }, (_, i) => END - 11 + i), A = ms.map(m => agg(m, m));
  mk('ch-mes', { data: { labels: ms.map(mlab), datasets: [
    { type: 'bar', label: 'Geração (MWh)', data: A.map(a => a.real / 1000), backgroundColor: pri, borderRadius: 5, yAxisID: 'y', order: 2 },
    { type: 'line', label: 'Meta (MWh)', data: A.map(a => a.meta / 1000), borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, borderWidth: 2, yAxisID: 'y', order: 1 },
    { type: 'line', label: 'Performance ratio', data: A.map(a => a.pr * 100), borderColor: '#2f7fd1', backgroundColor: '#2f7fd1', pointRadius: 3, borderWidth: 2.5, tension: .3, yAxisID: 'y1', order: 0 }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label.split(' (')[0] + ': ' + (x.dataset.yAxisID === 'y1' ? dec(x.parsed.y) + '%' : dec(x.parsed.y, 0) + ' MWh') } } },
      scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: v => v + ' MWh' } }, y1: { position: 'right', grid: { display: false }, min: 50, max: 100, ticks: { callback: v => v + '%' } } } } });
  /* PR por usina */
  const ur = PLANTS.map(u => agg(m0, END, u.i, S.tip));
  mk('ch-usi', { type: 'bar', data: { labels: PLANTS.map(u => u.n), datasets: [{ data: ur.map(a => a.pr * 100), backgroundColor: PLANTS.map(u => (S.usi < 0 || u.i === S.usi) && (S.tip < 0 || u.t === S.tip) ? COLOR[u.i] : css('--border')), borderRadius: 6 }] },
    options: { indexAxis: 'y', onClick: (_, el) => { if (el.length) { S.usi = S.usi === el[0].index ? -1 : el[0].index; sync(); } }, plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => 'PR ' + dec(x.parsed.x) + '%', afterLabel: x => dec(PLANTS[x.dataIndex].kwp / 1000, 2) + ' MWp · ' + PLANTS[x.dataIndex].uf } } }, scales: { x: { grid: grid(), min: 60, max: 100, ticks: { callback: v => v + '%' } }, y: { grid: { display: false } } } } });
  /* mapa de calor hora x mês */
  const HRS = Array.from({ length: 13 }, (_, i) => 6 + i);
  let h = '<span></span>' + HRS.map((x, i) => `<span class="hl">${i % 2 ? '' : x + 'h'}</span>`).join('');
  const hv = ms.map(m => { // meia duração do dia (h): maior em dez/jan
    const half = (12.2 + 1.5 * Math.cos(((cal(m) + .5) % 12) / 12 * 2 * Math.PI)) / 2;                       // pico em dez/jan
    return HRS.map(x => { const t = (x + .5 - 12.3) / half; return Math.abs(t) >= 1 ? 0 : Math.pow(Math.cos(t * Math.PI / 2), 1.6) * IRR[cal(m)] ** .35; }); });
  const hmax = Math.max(...hv.flat());
  ms.forEach((m, i) => { h += `<span class="hl d">${MN[cal(m)]}</span>` + hv[i].map((v, j) => { const t = v / hmax; return `<span class="hc${t > .55 ? ' hi' : ''}" style="--t:${t.toFixed(2)}" title="${MN[cal(m)]}, ${HRS[j]}h: ${Math.round(t * 100)}% do pico">${Math.round(t * 100)}</span>`; }).join(''); });
  $('#heat').innerHTML = h;
  /* perdas */
  const L = c.loss.map(x => c.pot ? x / c.pot * 100 : 0);
  mk('ch-perd', { type: 'bar', data: { labels: CAUSAS, datasets: [{ data: L, backgroundColor: CAUSAC, borderRadius: 6 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: x => dec(x.parsed.x, 2) + '% do potencial', afterLabel: x => dec(c.loss[x.dataIndex] / 1000, 0) + ' MWh perdidos' } } }, scales: { x: { grid: grid(), beginAtZero: true, ticks: { callback: v => v + '%' } }, y: { grid: { display: false } } } } });
  /* dia típico */
  const last = agg(END, END), dayK = last.real / dim(END), dayM = last.meta / dim(END);
  const shape = HRS.map(x => { const t = (x + .5 - 12.3) / 6.2; return Math.abs(t) >= 1 ? 0 : Math.pow(Math.cos(t * Math.PI / 2), 1.6); });
  const ss = shape.reduce((a, b) => a + b, 0) || 1;
  const dip = HRS.map(x => 1 - (x === 13 ? .07 : x === 14 ? .05 : 0));
  const dd = shape.map((s, i) => s / ss * dayK * dip[i]), de = shape.map(s => s / ss * dayM);
  mk('ch-dia', { type: 'line', data: { labels: HRS.map(x => x + 'h'), datasets: [
    { label: 'Real', data: dd, borderColor: pri, backgroundColor: pri + '33', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5 },
    { label: 'Esperado', data: de, borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, tension: .4, borderWidth: 2 }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + dec(x.parsed.y, 0) + ' kW' } } }, scales: { x: { grid: { display: false } }, y: { grid: grid(), beginAtZero: true, ticks: { callback: v => v >= 1000 ? dec(v / 1000, 1) + ' MW' : v + ' kW' } } } } });
  /* receita por tipo */
  const rt = [0, 1].map(t => ms.map(m => agg(m, m, S.usi, t).rev));
  mk('ch-rec', { type: 'bar', data: { labels: ms.map(mlab), datasets: TIPOS.map((t, i) => ({ label: t.split(' (')[0], data: S.tip >= 0 && S.tip !== i ? ms.map(() => 0) : rt[i], backgroundColor: i ? '#2f7fd1' : pri, borderRadius: 3 })) },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: leg, tooltip: { ...tip, callbacks: { label: x => x.dataset.label + ': ' + fmtK(x.parsed.y) } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, callback: function (v, i) { return i % 2 ? '' : this.getLabelForValue(v); } } }, y: { stacked: true, grid: grid(), ticks: { callback: v => fmtK(v).replace('R$ ', '') } } } } });
  table();
}

/* ===== tabela ===== */
let tab = 'u', sortK = 'pr', sortD = -1, tableRows = [], cols = [];
const COLS_U = [['n', 'Usina', 0], ['uf', 'UF', 0], ['kwp', 'Potência (kWp)', 1], ['real', 'Geração (MWh)', 1], ['meta', 'Meta (%)', 1], ['pr', 'PR', 1], ['avail', 'Disponib.', 1], ['rev', 'Receita', 1]];
const COLS_A = [['d', 'Data', 0], ['usina', 'Usina', 0], ['eq', 'Equipamento', 0], ['t', 'Alerta', 0], ['g', 'Gravidade', 0], ['kwh', 'Perda (kWh/dia)', 1], ['st', 'Situação', 0]];
function table() {
  const m0 = END - S.per + 1, q = $('#q').value.trim().toLowerCase();
  if (tab === 'u') {
    cols = COLS_U;
    tableRows = PLANTS.filter(u => ok(u.i)).map(u => { const a = agg(m0, END, u.i, -1); return { n: u.n, uf: u.uf, kwp: u.kwp, real: a.real / 1000, meta: a.real / a.meta * 100, pr: a.pr * 100, avail: a.avail * 100, rev: a.rev }; });
  } else {
    cols = COLS_A;
    tableRows = openAlerts().map(a => ({ d: a.d, usina: PLANTS[a.p].n, eq: a.eq, t: a.t, g: a.g, kwh: a.kwh, st: a.st }));
  }
  tableRows = tableRows.filter(r => Object.values(r).join(' ').toLowerCase().includes(q));
  if (!cols.some(c => c[0] === sortK)) { sortK = tab === 'u' ? 'pr' : 'kwh'; sortD = -1; }
  tableRows.sort((x, y) => (typeof x[sortK] === 'string' ? x[sortK].localeCompare(y[sortK], 'pt-BR') : x[sortK] - y[sortK]) * sortD);
  $('#tbl thead').innerHTML = '<tr>' + cols.map(([k, t, r]) => `<th class="${r ? 'r' : ''}" data-k="${k}" tabindex="0" ${sortK === k ? `aria-sort="${sortD > 0 ? 'ascending' : 'descending'}"` : ''}>${t}</th>`).join('') + '</tr>';
  const cell = (k, v) => k === 'g' ? `<span class="tag ${v === 'Alta' ? 't-bad' : v === 'Média' ? 't-warn' : 't-info'}">${v}</span>` : k === 'kwp' || k === 'kwh' ? Math.round(v).toLocaleString('pt-BR') : k === 'real' ? dec(v, 0) : k === 'rev' ? fmtR(v) : ['meta', 'pr', 'avail'].includes(k) ? dec(v) + '%' : v;
  $('#tbl tbody').innerHTML = tableRows.length ? tableRows.map(r => '<tr>' + cols.map(([k, , rr]) => `<td class="${rr ? 'r num' : ''}">${cell(k, r[k])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${cols.length}">${tab === 'a' ? 'Nenhum alerta aberto para este filtro.' : 'Nada encontrado.'}</td></tr>`;
}

/* ===== controles ===== */
function sync() { $('#f-per').value = S.per; $('#f-usi').value = S.usi; $('#f-tip').value = S.tip; render(); }
$('#f-per').innerHTML = PER.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
$('#f-usi').innerHTML = '<option value="-1">Todas as usinas</option>' + PLANTS.map(u => `<option value="${u.i}">${u.n} (${u.uf})</option>`).join('');
$('#f-tip').innerHTML = '<option value="-1">Todos os tipos</option>' + TIPOS.map((t, i) => `<option value="${i}">${t}</option>`).join('');
$('#f-per').onchange = e => { S.per = +e.target.value; sync(); };
$('#f-usi').onchange = e => { S.usi = +e.target.value; sync(); };
$('#f-tip').onchange = e => { S.tip = +e.target.value; if (S.usi >= 0 && S.tip >= 0 && PLANTS[S.usi].t !== S.tip) S.usi = -1; sync(); };
$('#clear').onclick = () => { S.per = 12; S.usi = -1; S.tip = -1; sync(); };
$('#chips').onclick = e => { const b = e.target.closest('.chip'); if (b) { S[b.dataset.k] = -1; sync(); } };
function setTab(t) { tab = t; $('#tab-u').setAttribute('aria-selected', t === 'u'); $('#tab-a').setAttribute('aria-selected', t === 'a'); table(); }
$('#tab-u').onclick = () => setTab('u'); $('#tab-a').onclick = () => setTab('a');
$('#q').oninput = table;
const sortBy = th => { if (!th) return; const k = th.dataset.k; sortD = sortK === k ? -sortD : (cols.find(c => c[0] === k)[2] ? -1 : 1); sortK = k; table(); };
$('#tbl thead').onclick = e => sortBy(e.target.closest('th'));
$('#tbl thead').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(e.target.closest('th')); } };
$('#csv').onclick = () => {
  const body = tableRows.map(r => cols.map(([k]) => typeof r[k] === 'number' ? r[k].toFixed(2) : r[k]).join(';'));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + [cols.map(c => c[1]).join(';'), ...body].join('\n')], { type: 'text/csv' })); a.download = 'solaria-' + (tab === 'u' ? 'usinas' : 'alertas') + '.csv'; a.click();
};
function theme(t) { document.documentElement.dataset.theme = t; $('#theme-t').textContent = t === 'dark' ? 'Claro' : 'Escuro'; try { localStorage.setItem('solaria-tema', t); } catch (e) { /* modo privado: tema não persiste */ } if (charts['ch-mes']) render(); }
$('#theme').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
let t0 = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; try { t0 = localStorage.getItem('solaria-tema') || t0; } catch (e) { /* sem storage */ }
theme(t0); sync();
})();
