(function () {
'use strict';
const F = window.FIN, $ = id => document.getElementById(id);
const st = { per: '12m', reg: -1, lin: -1, bucket: -1, tipo: 'Todos', q: '', sk: 'dias', sd: 1, page: 0 };
const PAGE = 10, BUCKETS = ['A vencer', '1–30 dias', '31–60 dias', '61–90 dias', 'Mais de 90'];
const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
const nf = (d, o) => new Intl.NumberFormat('pt-BR', Object.assign({ minimumFractionDigits: d, maximumFractionDigits: d }, o));
const f0 = nf(0), f1 = nf(1), f2 = nf(2);
const brl = v => { const a = Math.abs(v), s = v < 0 ? '−' : ''; return a >= 1e6 ? s + 'R$ ' + f1.format(a / 1e6) + ' mi' : a >= 1e3 ? s + 'R$ ' + f0.format(a / 1e3) + ' mil' : s + 'R$ ' + f0.format(a); };
const brlFull = v => (v < 0 ? '−' : '') + 'R$ ' + f0.format(Math.abs(v));
const pct = (v, d = 1) => nf(d).format(v * 100) + '%';
const mi = v => f1.format(v / 1e6);
const cv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const alpha = (c, a) => { if (c[0] !== '#') return c; const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };

// ---------- Janelas e agregação ----------
function win(per) {
  const e = F.NREAL - 1, s = { '1m': e, '3m': e - 2, '6m': e - 5, '12m': e - 11, 'ytd': 14, '24m': 0 }[per];
  return { s, e, n: e - s + 1 };
}
function prevWin(w) {
  const sh = st.per === 'ytd' ? 12 : w.n, s = w.s - sh;
  return s < 0 ? null : { s, e: w.e - sh, n: w.n };
}
const rowsOf = (s, e, reg = st.reg, lin = st.lin) => F.rows.filter(r => r.i >= s && r.i <= e && (reg < 0 || r.r === reg) && (lin < 0 || r.l === lin));
function agg(rs) {
  const o = { bruta: 0, ded: 0, liq: 0, cpv: 0, opex: 0, ebitda: 0, da: 0, fin: 0, ir: 0, ll: 0, ent: 0, sai: 0, inad: 0, orcLiq: 0, orcCpv: 0, orcOpex: 0, prevEnt: 0, prevSai: 0, cc: F.CC.map(() => 0), orcCc: F.CC.map(() => 0) };
  rs.forEach(r => { for (const k in o) if (typeof o[k] === 'number' && k !== 'orcOpex') o[k] += r[k] || 0; r.cc.forEach((v, i) => { o.cc[i] += v; o.orcCc[i] += r.orcCc[i]; }); o.orcOpex += sum(r.orcCc, x => x); });
  o.orcEbitda = o.orcLiq - o.orcCpv - o.orcOpex; o.lb = o.liq - o.cpv; o.fluxo = o.ent - o.sai;
  return o;
}
function monthly(s, e, reg = st.reg, lin = st.lin) { const out = []; for (let i = s; i <= e; i++) out.push(agg(rowsOf(i, i, reg, lin))); return out; }
function liquidez(e) {
  const a = Math.max(0, e - 11), share = sum(rowsOf(a, e), r => r.liq) / sum(F.rows.filter(r => r.i >= a && r.i <= e), r => r.liq);
  const cum = sum(F.rows.filter(r => r.i <= e && (st.reg < 0 || r.r === st.reg) && (st.lin < 0 || r.l === st.lin)), r => r.ent - r.sai);
  const m = agg(rowsOf(e, e));
  const caixa = 9e6 * share + .45 * cum, ar = 1.25 * m.liq, est = 1.1 * m.cpv, ap = .7 * (m.cpv + m.opex), div = 14e6 * share + 2.2 * m.opex;
  return (caixa + ar + est) / (ap + div);
}

// ---------- Filtros ----------
function fillSel(el, arr, todas) { el.innerHTML = `<option value="-1">${todas}</option>` + arr.map((x, i) => `<option value="${i}">${x}</option>`).join(''); }
fillSel($('fReg'), F.REG, 'Todas as regiões'); fillSel($('fLin'), F.LIN, 'Todas as linhas');
$('fPer').onchange = e => { st.per = e.target.value; render(); };
$('fReg').onchange = e => { st.reg = +e.target.value; st.page = 0; render(); };
$('fLin').onchange = e => { st.lin = +e.target.value; st.page = 0; render(); };
$('limpar').onclick = () => { st.reg = st.lin = st.bucket = -1; st.q = ''; $('q').value = ''; st.page = 0; render(); };
function toggle(k, v) { st[k] = st[k] === v ? -1 : v; st.page = 0; render(); }
function chips() {
  const c = [];
  if (st.reg >= 0) c.push(['reg', 'Região: ' + F.REG[st.reg]]);
  if (st.lin >= 0) c.push(['lin', 'Linha: ' + F.LIN[st.lin]]);
  if (st.bucket >= 0) c.push(['bucket', 'Aging: ' + BUCKETS[st.bucket]]);
  $('chips').innerHTML = c.length ? '<small>Filtros ativos:</small>' + c.map(x => `<button class="chip" type="button" data-k="${x[0]}" aria-label="Remover filtro ${x[1]}">${x[1]}<i>×</i></button>`).join('') : '<small>Dica: clique nos gráficos (região, linha, faixa de aging) para filtrar o painel.</small>';
  $('chips').querySelectorAll('.chip').forEach(b => b.onclick = () => { st[b.dataset.k] = -1; st.page = 0; render(); });
}

// ---------- KPIs ----------
function spark(vals, color) {
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const p = vals.map((v, i) => `${(i / (vals.length - 1 || 1) * 100).toFixed(1)},${(28 - (v - mn) / r * 24).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${p}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function delta(cur, prv, kind, goodUp) {
  if (prv == null || !isFinite(prv) || prv === 0) return '<span class="d flat">sem comparativo</span>';
  let diff, txt;
  if (kind === 'pp') { diff = cur - prv; txt = (diff >= 0 ? '+' : '−') + nf(1).format(Math.abs(diff) * 100) + ' p.p.'; }
  else if (kind === 'x') { diff = cur - prv; txt = (diff >= 0 ? '+' : '−') + f2.format(Math.abs(diff)) + 'x'; }
  else { diff = cur / prv - 1; txt = (diff >= 0 ? '+' : '−') + nf(1).format(Math.abs(diff) * 100) + '%'; }
  const flat = Math.abs(diff) < (kind === 'x' ? .005 : .0005);
  const good = flat ? 'flat' : (diff > 0) === goodUp ? 'good' : 'bad';
  return `<span class="d ${good}">${flat ? '' : diff > 0 ? '▲ ' : '▼ '}${txt}</span>`;
}
function kpis(w, pw) {
  const cu = agg(rowsOf(w.s, w.e)), pr = pw ? agg(rowsOf(pw.s, pw.e)) : null;
  const ms = monthly(Math.max(0, w.e - Math.max(w.n, 6) + 1), w.e);
  const sp = f => ms.map(f);
  const liqC = liquidez(w.e), liqP = pw ? liquidez(pw.e) : null;
  const c1 = cv('--c1'), vs = 'vs ' + (pw ? 'período anterior' : '—');
  const ov = cu.ebitda / cu.orcEbitda - 1;
  const K = [
    ['Receita líquida', brl(cu.liq), delta(cu.liq, pr && pr.liq, 'pct', true), vs, sp(m => m.liq)],
    ['EBITDA', brl(cu.ebitda), delta(cu.ebitda, pr && pr.ebitda, 'pct', true), vs, sp(m => m.ebitda)],
    ['Margem EBITDA', pct(cu.ebitda / cu.liq), delta(cu.ebitda / cu.liq, pr && pr.ebitda / pr.liq, 'pp', true), 'sobre receita líquida', sp(m => m.ebitda / m.liq)],
    ['Lucro líquido', brl(cu.ll), delta(cu.ll, pr && pr.ll, 'pct', true), 'margem ' + pct(cu.ll / cu.liq), sp(m => m.ll)],
    ['Geração de caixa', brl(cu.fluxo), delta(cu.fluxo, pr && pr.fluxo, 'pct', true), 'entradas − saídas', sp(m => m.fluxo)],
    ['Liquidez corrente', f2.format(liqC) + 'x', delta(liqC, liqP, 'x', true), 'ativo ÷ passivo circ.', null],
    ['Inadimplência', pct(cu.inad / cu.liq), delta(cu.inad / cu.liq, pr && pr.inad / pr.liq, 'pp', false), '> 30 dias, s/ faturado', sp(m => m.inad / m.liq)],
    ['EBITDA vs orçamento', (ov >= 0 ? '+' : '−') + pct(Math.abs(ov)), `<span class="d ${ov >= 0 ? 'good' : 'bad'}">${ov >= 0 ? 'acima' : 'abaixo'} da meta</span>`, 'orçado ' + brl(cu.orcEbitda), null]
  ];
  $('kpis').innerHTML = K.map(k => `<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div><div class="s">${k[2]}<span>${k[3]}</span></div>${k[4] ? spark(k[4], c1) : ''}</div>`).join('');
  return cu;
}

// ---------- Gráficos ----------
const charts = {};
function draw(id, cfg) {
  if (charts[id]) charts[id].destroy();
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 } }, cfg.options);
  cfg.options.plugins = Object.assign({ legend: { display: false } }, cfg.options.plugins);
  charts[id] = new Chart($(id), cfg);
}
const valLabels = { id: 'valLabels', afterDatasetsDraw(ch, a, o) {
  if (!o || !o.fmt) return; const { ctx } = ch; ctx.save(); ctx.font = '600 11px "Segoe UI",system-ui,sans-serif'; ctx.fillStyle = o.color; ctx.textAlign = 'center';
  ch.data.datasets.forEach((ds, di) => { ch.getDatasetMeta(di).data.forEach((b, i) => { const v = ds.data[i]; if (v == null) return; const val = Array.isArray(v) ? v[1] : v; ctx.fillText(o.fmt(val, i), b.x, Math.min(b.y, b.base) - 5); }); });
  ctx.restore(); } };
const band = { id: 'band', beforeDatasetsDraw(ch, a, o) {
  if (!o || o.from == null) return; const x = ch.scales.x, { top, bottom, right } = ch.chartArea, x0 = x.getPixelForValue(o.from) - (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2;
  ch.ctx.save(); ch.ctx.fillStyle = o.fill; ch.ctx.fillRect(x0, top, right - x0, bottom - top); ch.ctx.fillStyle = o.text; ch.ctx.font = '600 11px "Segoe UI",system-ui,sans-serif'; ch.ctx.fillText('PREVISÃO', x0 + 6, top + 12); ch.ctx.restore(); } };
const center = { id: 'center', afterDraw(ch, a, o) {
  if (!o || !o.t) return; const m = ch.getDatasetMeta(0).data[0]; if (!m) return; const { ctx } = ch; ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = o.c1; ctx.font = '700 20px "Segoe UI",system-ui,sans-serif'; ctx.fillText(o.t, m.x, m.y + 2); ctx.fillStyle = o.c2; ctx.font = '12px "Segoe UI",system-ui,sans-serif'; ctx.fillText(o.s, m.x, m.y + 20); ctx.restore(); } };

function theme() {
  const t = { ink: cv('--ink'), muted: cv('--muted'), grid: cv('--grid'), card: cv('--card'), c1: cv('--c1'), c2: cv('--c2'), c3: cv('--c3'), c4: cv('--c4'), pos: cv('--pos'), neg: cv('--neg') };
  Chart.defaults.color = t.muted; Chart.defaults.font.family = '"Segoe UI",system-ui,sans-serif'; Chart.defaults.font.size = 12;
  return t;
}
const ax = (t, o = {}) => Object.assign({ grid: { color: t.grid }, border: { display: false }, ticks: { color: t.muted } }, o);
const noGrid = t => ax(t, { grid: { display: false }, border: { color: t.grid } });
const tip = (t, extra) => Object.assign({ backgroundColor: t.ink, titleColor: t.card, bodyColor: t.card, padding: 10, cornerRadius: 8, boxPadding: 4 }, extra);
const leg = t => ({ display: true, position: 'bottom', labels: { color: t.muted, usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 14 } });
const hover = (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; };

function trendRange(w) { const n = Math.max(w.n, 12); return [Math.max(0, w.e - n + 1), w.e]; }

function chartEbitda(t, w) {
  const [s, e] = trendRange(w), ms = monthly(s, e), lb = F.meses.slice(s, e + 1).map(m => m.lbl);
  $('subEb').textContent = 'EBITDA em R$ mi (barras) e margem sobre a receita líquida (linha)';
  draw('cEb', { data: { labels: lb, datasets: [
    { type: 'bar', label: 'EBITDA (R$ mi)', data: ms.map(m => m.ebitda), backgroundColor: ms.map((m, i) => i === ms.length - 1 ? t.c1 : alpha(t.c1, .55)), borderRadius: 4, yAxisID: 'y', order: 2 },
    { type: 'line', label: 'Margem EBITDA', data: ms.map(m => m.ebitda / m.liq), borderColor: t.c2, backgroundColor: t.c2, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, tension: .3, yAxisID: 'y1', order: 1 }] },
    options: { interaction: { mode: 'index', intersect: false }, scales: { x: noGrid(t), y: ax(t, { ticks: { color: t.muted, callback: v => mi(v) }, beginAtZero: true }), y1: ax(t, { position: 'right', grid: { display: false }, ticks: { color: t.muted, callback: v => pct(v, 0) } }) },
      plugins: { legend: leg(t), tooltip: tip(t, { callbacks: { label: c => c.dataset.yAxisID === 'y1' ? ' Margem: ' + pct(c.parsed.y) : ' EBITDA: ' + brl(c.parsed.y) } }) } } });
}
function chartWf(t, c, w) {
  $('subWf').textContent = 'DRE consolidada em R$ mi (' + F.meses[w.s].lbl + ' a ' + F.meses[w.e].lbl + ')';
  const lab = ['Receita bruta', 'Deduções', 'Receita líquida', 'CPV', 'Lucro bruto', 'Despesas op.', 'EBITDA', 'D&A e financeiro', 'IR/CSLL', 'Lucro líquido'];
  const mob = innerWidth < 640, lab2 = mob ? ['Bruta', 'Deduç.', 'Líquida', 'CPV', 'L. bruto', 'Desp.', 'EBITDA', 'D&A/fin.', 'IR', 'L. líq.'] : lab;
  const lair = c.ebitda - c.da + c.fin;
  const d = [[0, c.bruta], [c.liq, c.bruta], [0, c.liq], [c.lb, c.liq], [0, c.lb], [c.ebitda, c.lb], [0, c.ebitda], [lair, c.ebitda], [c.ll, lair], [0, c.ll]];
  const kind = ['T', 'N', 'T', 'N', 'T', 'N', 'T', 'N', 'N', 'T'];
  const col = kind.map((k, i) => k === 'T' ? (i === 9 ? t.pos : t.c1) : alpha(t.neg, .85));
  draw('cWf', { type: 'bar', plugins: [valLabels], data: { labels: lab2, datasets: [{ data: d, backgroundColor: col, borderRadius: 3, borderSkipped: false }] },
    options: { scales: { x: Object.assign(noGrid(t), { ticks: { color: t.muted, maxRotation: 0, autoSkip: false, font: { size: mob ? 9 : 10.5 }, callback(v) { const l = this.getLabelForValue(v); return l.length > 11 ? l.split(' ') : l; } } }), y: ax(t, { ticks: { color: t.muted, callback: v => mi(v) } }) },
      layout: { padding: { top: 16 } }, plugins: { valLabels: { color: t.ink, fmt: (v, i) => kind[i] === 'N' ? '−' + mi(d[i][1] - d[i][0]) : mi(v) }, tooltip: tip(t, { callbacks: { label: x => ' ' + (kind[x.dataIndex] === 'N' ? '−' : '') + brlFull(Math.abs(x.raw[1] - x.raw[0])) } }) } } });
}
function chartCaixa(t, w) {
  const [s, e] = trendRange(w), E = e + 3, ms = monthly(s, E), lb = F.meses.slice(s, E + 1).map(m => m.lbl), nr = e - s + 1;
  const fc = i => i >= nr;
  draw('cCx', { data: { labels: lb, datasets: [
    { type: 'bar', label: 'Entradas', data: ms.map(m => m.ent), backgroundColor: ms.map((m, i) => alpha(t.c1, fc(i) ? .3 : .85)), borderColor: t.c1, borderWidth: ms.map((m, i) => fc(i) ? 1 : 0), borderRadius: 3, stack: 's', order: 3 },
    { type: 'bar', label: 'Saídas', data: ms.map(m => -m.sai), backgroundColor: ms.map((m, i) => alpha(t.c2, fc(i) ? .3 : .85)), borderColor: t.c2, borderWidth: ms.map((m, i) => fc(i) ? 1 : 0), borderRadius: 3, stack: 's', order: 3 },
    { type: 'line', label: 'Líquido realizado', data: ms.map((m, i) => fc(i) ? null : m.ent - m.sai), borderColor: t.ink, backgroundColor: t.ink, borderWidth: 2.5, pointRadius: 3, tension: .25, order: 1 },
    { type: 'line', label: 'Líquido previsto', data: ms.map(m => m.prevEnt - m.prevSai), borderColor: t.c3, backgroundColor: t.c3, borderWidth: 2.5, borderDash: [6, 4], pointRadius: 2.5, tension: .25, order: 2 }] },
    plugins: [band], options: { interaction: { mode: 'index', intersect: false }, scales: { x: noGrid(t), y: ax(t, { ticks: { color: t.muted, callback: v => mi(v) } }) },
      plugins: { legend: leg(t), band: { from: nr, fill: alpha(t.c3, .09), text: t.c3 }, tooltip: tip(t, { callbacks: { label: c => ' ' + c.dataset.label + ': ' + brl(c.parsed.y) } }) } } });
}
function chartOrc(t, c) {
  const v = c.cc.map((x, i) => x / c.orcCc[i] - 1), idx = c.cc.map((_, i) => i).sort((a, b) => v[b] - v[a]);
  $('subOr').textContent = 'Despesas operacionais no período (R$ mi). Em vermelho: mais de 2% acima do orçado.';
  draw('cOr', { type: 'bar', data: { labels: idx.map(i => `${F.CC[i]}  ${v[i] >= 0 ? '▲' : '▼'} ${nf(1).format(Math.abs(v[i]) * 100)}%`), datasets: [
    { label: 'Orçado', data: idx.map(i => c.orcCc[i]), backgroundColor: alpha(t.muted, .45), borderRadius: 3 },
    { label: 'Realizado', data: idx.map(i => c.cc[i]), backgroundColor: idx.map(i => v[i] > .02 ? t.neg : t.c1), borderRadius: 3 }] },
    options: { indexAxis: 'y', scales: { x: ax(t, { ticks: { color: t.muted, callback: v => mi(v) } }), y: Object.assign(noGrid(t), { ticks: { color: t.ink, font: { size: 11.5 } } }) },
      plugins: { legend: leg(t), tooltip: tip(t, { callbacks: { label: x => ' ' + x.dataset.label + ': ' + brlFull(x.raw) } }) } } });
}
const bk = d => d >= 0 ? 0 : d >= -30 ? 1 : d >= -60 ? 2 : d >= -90 ? 3 : 4;
function agingData() {
  const open = F.titulos.filter(x => x.status !== 'Pago' && (st.reg < 0 || x.r === st.reg) && (st.lin < 0 || x.l === st.lin));
  const out = { Receber: [0, 0, 0, 0, 0], Pagar: [0, 0, 0, 0, 0] }; open.forEach(x => out[x.tipo][bk(x.dias)] += x.valor);
  return out;
}
function chartAging(t) {
  const out = agingData(), ar = sum(out.Receber, x => x), ven = ar - out.Receber[0];
  $('subAg').textContent = `Posição em ${F.HOJE}. A receber vencido: ${brl(ven)} (${pct(ar ? ven / ar : 0)} da carteira). Clique numa faixa.`;
  const dim = c => BUCKETS.map((_, i) => st.bucket < 0 || st.bucket === i ? c : alpha(c, .3));
  draw('cAg', { type: 'bar', plugins: [valLabels], data: { labels: BUCKETS.map(b => b.replace(' dias', '')), datasets: [
    { label: 'A receber', data: out.Receber, backgroundColor: dim(t.c1), borderRadius: 3 }, { label: 'A pagar', data: out.Pagar, backgroundColor: dim(t.c2), borderRadius: 3 }] },
    options: { layout: { padding: { top: 14 } }, scales: { x: noGrid(t), y: ax(t, { ticks: { color: t.muted, callback: v => mi(v) } }) }, onClick: (e, el) => { if (el.length) toggle('bucket', el[0].index); }, onHover: hover,
      plugins: { legend: leg(t), valLabels: { color: t.muted, fmt: v => v ? mi(v) : '' }, tooltip: tip(t, { callbacks: { title: x => 'Atraso: ' + BUCKETS[x[0].dataIndex], label: x => ' ' + x.dataset.label + ': ' + brlFull(x.raw) } }) } } });
}
function chartInad(t, w) {
  const [s, e] = trendRange(w), ms = monthly(s, e), lb = F.meses.slice(s, e + 1).map(m => m.lbl), meta = .035;
  const v = ms.map(m => m.inad / m.liq);
  draw('cIn', { type: 'line', data: { labels: lb, datasets: [
    { label: 'Inadimplência', data: v, borderColor: t.neg, backgroundColor: alpha(t.neg, .12), fill: true, borderWidth: 2.5, tension: .3, pointRadius: 3, pointBackgroundColor: v.map(x => x > meta ? t.neg : t.pos), pointBorderColor: v.map(x => x > meta ? t.neg : t.pos) },
    { label: 'Limite da política (3,5%)', data: v.map(() => meta), borderColor: t.muted, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false }] },
    options: { interaction: { mode: 'index', intersect: false }, scales: { x: noGrid(t), y: ax(t, { ticks: { color: t.muted, callback: x => pct(x, 1) } }) }, plugins: { legend: leg(t), tooltip: tip(t, { callbacks: { label: c => ' ' + c.dataset.label.split(' (')[0] + ': ' + pct(c.parsed.y, 2) } }) } } });
}
function chartRegiao(t, w) {
  const R = F.REG.map((_, r) => agg(rowsOf(w.s, w.e, r, st.lin)));
  const dim = c => F.REG.map((_, i) => st.reg < 0 || st.reg === i ? c : alpha(c, .3));
  draw('cRg', { type: 'bar', plugins: [valLabels], data: { labels: F.REG, datasets: [
    { label: 'Margem bruta', data: R.map(x => x.lb / x.liq), backgroundColor: dim(t.c3), borderRadius: 3 },
    { label: 'Margem EBITDA', data: R.map(x => x.ebitda / x.liq), backgroundColor: dim(t.c1), borderRadius: 3 }] },
    options: { layout: { padding: { top: 14 } }, scales: { x: noGrid(t), y: ax(t, { beginAtZero: true, ticks: { color: t.muted, callback: x => pct(x, 0) } }) }, onClick: (e, el) => { if (el.length) toggle('reg', el[0].index); }, onHover: hover,
      plugins: { legend: leg(t), valLabels: { color: t.muted, fmt: v => pct(v, 0) }, tooltip: tip(t, { callbacks: { label: x => ' ' + x.dataset.label + ': ' + pct(x.raw) } }) } } });
}
function chartLinha(t, w) {
  const L = F.LIN.map((_, l) => agg(rowsOf(w.s, w.e, st.reg, l)).liq), tot = sum(L, x => x);
  const cols = [t.c1, t.c3, t.c4];
  $('lt').innerHTML = F.LIN.map((n, l) => { const m = agg(rowsOf(w.s, w.e, st.reg, l)); return `<div><i style="background:${cols[l]}"></i><span>${n}</span><b>${brl(m.liq)}</b><small>EBITDA ${pct(m.ebitda / m.liq)}</small></div>`; }).join('');
  draw('cLn', { type: 'doughnut', plugins: [center], data: { labels: F.LIN, datasets: [{ data: L, backgroundColor: L.map((_, i) => st.lin < 0 || st.lin === i ? cols[i] : alpha(cols[i], .25)), borderColor: t.card, borderWidth: 3, hoverOffset: 6 }] },
    options: { cutout: '66%', onClick: (e, el) => { if (el.length) toggle('lin', el[0].index); }, onHover: hover,
      plugins: { legend: leg(t), center: { t: brl(tot), s: 'receita líquida', c1: t.ink, c2: t.muted }, tooltip: tip(t, { callbacks: { label: x => ` ${brl(x.raw)} (${pct(x.raw / tot)})` } }) } } });
}

// ---------- DRE tabela ----------
let dreCache = null;
function dre(w, pw) {
  const nm = Math.min(6, w.n), s = w.e - nm + 1, ms = monthly(s, w.e), tot = agg(rowsOf(w.s, w.e)), pr = pw ? agg(rowsOf(pw.s, pw.e)) : null;
  const rowsDef = [
    ['Receita bruta', m => m.bruta, 'n'], ['(−) Deduções e impostos', m => -m.ded, 'n'], ['Receita líquida', m => m.liq, 't'],
    ['(−) Custo dos produtos e serviços', m => -m.cpv, 'n'], ['Lucro bruto', m => m.lb, 't'], ['Margem bruta', m => m.lb / m.liq, 'p'],
    ...F.CC.map((c, i) => ['(−) ' + c, m => -m.cc[i], 'i']),
    ['EBITDA', m => m.ebitda, 't'], ['Margem EBITDA', m => m.ebitda / m.liq, 'p'], ['(−) Depreciação e amortização', m => -m.da, 'n'], ['Resultado financeiro', m => m.fin, 'n'],
    ['(−) IR e CSLL', m => -m.ir, 'n'], ['Lucro líquido', m => m.ll, 't'], ['Margem líquida', m => m.ll / m.liq, 'p']];
  $('subDre').textContent = `Últimos ${nm} ${nm === 1 ? 'mês' : 'meses'} do período, total do período e variação vs ${pw ? 'período anterior' : '—'} (R$ mil)`;
  const fm = (v, k) => k === 'p' ? pct(v) : (v < 0 ? '−' : '') + f0.format(Math.abs(v) / 1e3);
  const head = '<thead><tr><th>R$ mil</th>' + ms.map((_, i) => `<th>${F.meses[s + i].lbl}</th>`).join('') + '<th class="hl">Período</th><th>Δ vs ant.</th></tr></thead>';
  const body = rowsDef.map(([n, f, k]) => {
    const cur = f(tot), pv = pr ? f(pr) : null;
    const dl = pv == null || pv === 0 ? '—' : k === 'p' ? (cur - pv >= 0 ? '+' : '−') + nf(1).format(Math.abs(cur - pv) * 100) + ' p.p.' : (cur / pv - 1 >= 0 ? '+' : '−') + nf(1).format(Math.abs(cur / pv - 1) * 100) + '%';
    const cls = k === 't' ? 'tot' : k === 'p' ? 'sub' : k === 'i' ? 'ind' : '';
    return `<tr class="${cls}"><td>${n}</td>${ms.map(m => `<td class="${f(m) < 0 && k !== 'p' ? 'neg' : ''}">${fm(f(m), k)}</td>`).join('')}<td class="hl">${fm(cur, k)}</td><td>${dl}</td></tr>`;
  }).join('');
  $('tDre').innerHTML = head + '<tbody>' + body + '</tbody>';
  dreCache = { rowsDef, ms, s, tot };
}

// ---------- Títulos ----------
const COLS = [['id', 'Documento'], ['tipo', 'Tipo'], ['parte', 'Contraparte'], ['reg', 'Região'], ['lin', 'Linha'], ['venc', 'Vencimento'], ['dias', 'Atraso'], ['valor', 'Valor'], ['status', 'Status']];
function titulosFiltrados() {
  const q = st.q.trim().toLowerCase();
  const a = F.titulos.filter(x => (st.reg < 0 || x.r === st.reg) && (st.lin < 0 || x.l === st.lin) && (st.tipo === 'Todos' || x.tipo === st.tipo) &&
    (st.bucket < 0 || (x.status !== 'Pago' && bk(x.dias) === st.bucket)) && (!q || x.id.toLowerCase().includes(q) || x.parte.toLowerCase().includes(q)));
  const key = { reg: x => F.REG[x.r], lin: x => F.LIN[x.l], dias: x => x.status === 'Pago' ? 1e9 : x.dias }[st.sk] || (x => x[st.sk]);
  a.sort((x, y) => { const p = key(x), q2 = key(y); return (p < q2 ? -1 : p > q2 ? 1 : 0) * st.sd; });
  return a;
}
function titulos() {
  const all = titulosFiltrados(), pages = Math.max(1, Math.ceil(all.length / PAGE)); st.page = Math.min(st.page, pages - 1);
  const open = all.filter(x => x.status !== 'Pago');
  $('subTit').textContent = `${f0.format(all.length)} títulos · em aberto: ${brl(sum(open, x => x.valor))} · vencido: ${brl(sum(open.filter(x => x.dias < 0), x => x.valor))}`;
  const num = k => k === 'valor' || k === 'dias';
  const head = '<thead><tr>' + COLS.map(([k, n]) => `<th style="text-align:${num(k) ? 'right' : 'left'}" aria-sort="${st.sk === k ? (st.sd > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-k="${k}">${n}${st.sk === k ? (st.sd > 0 ? ' ↑' : ' ↓') : ''}</button></th>`).join('') + '</tr></thead>';
  const pg = all.slice(st.page * PAGE, st.page * PAGE + PAGE);
  const dt = s => s.split('-').reverse().join('/');
  const body = pg.length ? pg.map(x => `<tr class="tl"><td class="t">${x.id}</td><td class="t">${x.tipo === 'Receber' ? 'A receber' : 'A pagar'}</td><td class="t">${x.parte}</td><td class="t">${F.REG[x.r]}</td><td class="t">${F.LIN[x.l]}</td><td class="t">${dt(x.venc)}</td><td>${x.status === 'Pago' ? '—' : x.dias < 0 ? -x.dias + ' d' : 'em ' + x.dias + ' d'}</td><td>${brlFull(x.valor)}</td><td class="t"><span class="badge b-${x.status.replace(' ', '')}">${x.status}</span></td></tr>`).join('') : '<tr><td colspan="9" class="empty">Nenhum título encontrado com esses filtros.</td></tr>';
  $('tTit').innerHTML = head + '<tbody>' + body + '</tbody>';
  $('tTit').querySelectorAll('th button').forEach(b => b.onclick = () => { const k = b.dataset.k; st.sd = st.sk === k ? -st.sd : 1; st.sk = k; st.page = 0; titulos(); });
  $('pgInfo').textContent = all.length ? `${st.page * PAGE + 1}–${Math.min(all.length, st.page * PAGE + PAGE)} de ${f0.format(all.length)}` : '0 resultados';
  $('prev').disabled = st.page === 0; $('next').disabled = st.page >= pages - 1;
}
$('prev').onclick = () => { st.page--; titulos(); }; $('next').onclick = () => { st.page++; titulos(); };
$('q').oninput = e => { st.q = e.target.value; st.page = 0; titulos(); };
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { st.tipo = b.dataset.t; document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); st.page = 0; titulos(); });

// ---------- CSV ----------
function csv(nome, head, linhas) {
  const q = v => { const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const txt = '﻿' + [head, ...linhas].map(l => l.map(q).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
}
$('csvTit').onclick = () => csv('titulos-vetor-norte.csv', COLS.map(c => c[1]).concat('Emissão'), titulosFiltrados().map(x => [x.id, x.tipo === 'Receber' ? 'A receber' : 'A pagar', x.parte, F.REG[x.r], F.LIN[x.l], x.venc, x.status === 'Pago' ? '' : -x.dias, x.valor, x.status, x.emissao]));
$('csvDre').onclick = () => { const d = dreCache, v = (f, k, m) => k === 'p' ? +(f(m) * 100).toFixed(2) : Math.round(f(m)); csv('dre-vetor-norte.csv', ['Conta (R$)', ...d.ms.map((_, i) => F.meses[d.s + i].lbl), 'Período'], d.rowsDef.map(([n, f, k]) => [n, ...d.ms.map(m => v(f, k, m)), v(f, k, d.tot)])); };

// ---------- Tema e render ----------
function setTema(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('fin-tema', t); } catch (e) { /* armazenamento indisponível: segue sem salvar */ } $('temaTxt').textContent = t === 'dark' ? 'Modo claro' : 'Modo escuro'; }
$('tema').onclick = () => { setTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); render(); };

function render() {
  $('fReg').value = st.reg; $('fLin').value = st.lin;
  const t = theme(), w = win(st.per), pw = prevWin(w);
  chips(); const c = kpis(w, pw);
  chartEbitda(t, w); chartWf(t, c, w); chartCaixa(t, w); chartOrc(t, c); chartAging(t); chartInad(t, w); chartRegiao(t, w); chartLinha(t, w);
  dre(w, pw); titulos();
}
setTema(document.documentElement.dataset.theme);
render();
})();
