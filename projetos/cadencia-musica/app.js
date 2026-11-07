import { INSTRUMENTS, nextDays, slotsFor, formatPhone, validate, dayLabel } from './lib.js';

const $ = (id) => document.getElementById(id);
const h = (tag, attrs = {}, html = '') => Object.assign(document.createElement(tag), attrs, { innerHTML: html });

/* ---------- Piano ---------- */
const WHITE = [['Dó', 261.63, 'a'], ['Ré', 293.66, 's'], ['Mi', 329.63, 'd'], ['Fá', 349.23, 'f'], ['Sol', 392.0, 'g'], ['Lá', 440.0, 'h'], ['Si', 493.88, 'j'], ['Dó', 523.25, 'k']];
const BLACK = [[0, 'Dó#', 277.18, 'w'], [1, 'Ré#', 311.13, 'e'], [3, 'Fá#', 369.99, 't'], [4, 'Sol#', 415.3, 'y'], [5, 'Lá#', 466.16, 'u']];
let ctx;
function play(freq, el, name) {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.25);
  el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 160);
  $('note').textContent = name;
}
const keys = $('keys'), byKey = {};
WHITE.forEach(([n, f, k], i) => {
  const b = h('button', { className: 'key', type: 'button' }, k.toUpperCase());
  b.setAttribute('aria-label', n); b.onpointerdown = (e) => { e.preventDefault(); play(f, b, n); };
  b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(f, b, n); } };
  keys.append(b); byKey[k] = [f, b, n];
});
BLACK.forEach(([i, n, f, k]) => {
  const b = h('button', { className: 'key black', type: 'button' });
  b.style.left = `calc(${((i + 1) / 8) * 100}% - 5.5%)`;
  b.setAttribute('aria-label', n); b.onpointerdown = (e) => { e.preventDefault(); play(f, b, n); };
  b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(f, b, n); } };
  keys.append(b); byKey[k] = [f, b, n];
});
addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const k = byKey[e.key.toLowerCase()];
  if (k) play(k[0], k[1], k[2]);
});

/* ---------- Instruments + teachers ---------- */
const COLORS = ['#7a2433', '#2f5d50', '#3a4a7a', '#8a5a17', '#5b3a6e'];
$('inst-grid').innerHTML = INSTRUMENTS.map((i) => `<article class="card"><span class="ico" aria-hidden="true">${i.name[0]}</span><h3>${i.name}</h3><p>${i.blurb}</p><span class="lvl">${i.level}</span><a href="#agendar" data-pick="${i.id}">Agendar ${i.name.toLowerCase()}</a></article>`).join('');
$('teachers').innerHTML = INSTRUMENTS.map((i, n) => `<div class="teacher"><div class="avatar" style="background:${COLORS[n]}" aria-hidden="true">${i.teacher.split(' ').map((w) => w[0]).join('')}</div><h3>${i.teacher}</h3><p>${i.name}</p></div>`).join('');
document.querySelectorAll('[data-pick]').forEach((a) => a.addEventListener('click', () => select('instrument', a.dataset.pick)));

/* ---------- Booking ---------- */
const state = { instrument: '', day: '', time: '' };
const TODAY = new Date().toISOString().slice(0, 10);
const DAYS = nextDays(TODAY, 6);

function chip(label, value, group, disabled = false, html) {
  const b = h('button', { type: 'button', className: 'chip', disabled }, html || label);
  b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(state[group] === value));
  b.onclick = () => select(group, value);
  return b;
}
function select(group, value) {
  state[group] = value;
  if (group !== 'time' && state.time && !slotsFor(state.instrument, state.day).find((s) => s.time === state.time && s.free)) state.time = '';
  render();
}
function render() {
  $('f-inst').replaceChildren(...INSTRUMENTS.map((i) => chip(i.name, i.id, 'instrument')));
  $('f-day').replaceChildren(...DAYS.map((d) => { const l = dayLabel(d); return chip(d, d, 'day', false, `<small>${l.wd}</small><b>${l.num}</b><small>${l.mon}</small>`); }));
  const ready = state.instrument && state.day;
  $('f-time').replaceChildren(...(ready ? slotsFor(state.instrument, state.day).map((s) => chip(s.time, s.time, 'time', !s.free)) : [h('p', { className: 'demo' }, 'Escolha instrumento e dia para ver os horários.')]));
  const ins = INSTRUMENTS.find((i) => i.id === state.instrument);
  $('t-main').textContent = ins ? `Aula experimental de ${ins.name.toLowerCase()}` : 'Escolha instrumento, dia e horário.';
  $('t-teacher').textContent = ins ? ins.teacher : '—';
  const l = state.day && dayLabel(state.day);
  $('t-when').textContent = l ? `${l.wd}, ${l.num}/${l.mon}${state.time ? ' às ' + state.time : ''}` : '—';
}
render();

$('phone').addEventListener('input', (e) => { e.target.value = formatPhone(e.target.value); });
$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = { ...state, name: $('name').value, phone: $('phone').value };
  const errs = validate(data);
  for (const k of ['instrument', 'day', 'time', 'name', 'phone']) $('e-' + k).textContent = errs[k] || '';
  const first = Object.keys(errs)[0];
  const ok = $('t-ok');
  if (first) { ok.hidden = true; (first === 'name' || first === 'phone' ? $(first) : $('e-' + first)).scrollIntoView({ block: 'center' }); if (first === 'name' || first === 'phone') $(first).focus(); return; }
  ok.hidden = false;
  ok.textContent = `Reservado, ${data.name.trim().split(/\s+/)[0]}! (demonstração: nada foi enviado)`;
  ok.scrollIntoView({ block: 'nearest' });
});
