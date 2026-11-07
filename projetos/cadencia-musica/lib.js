// Pure logic for the booking flow (no DOM), so it can be unit-tested.
export const INSTRUMENTS = [
  { id: 'piano', name: 'Piano', teacher: 'Helena Brandt', level: 'Do zero ao avançado', blurb: 'Leitura de partitura e ouvido, com repertório que você escolhe desde a primeira semana.' },
  { id: 'violao', name: 'Violão', teacher: 'Caio Mendonça', level: 'Popular e clássico', blurb: 'Acordes, ritmo e acompanhamento. Em um mês você toca uma música inteira.' },
  { id: 'bateria', name: 'Bateria', teacher: 'Rafa Tolentino', level: 'Estúdio com isolamento', blurb: 'Coordenação, pulso e groove em sala tratada, com kit completo à disposição.' },
  { id: 'canto', name: 'Canto', teacher: 'Marina Osei', level: 'Técnica vocal', blurb: 'Respiração, afinação e interpretação, sem forçar a voz e sem medo de errar.' },
  { id: 'violino', name: 'Violino', teacher: 'Teodoro Vilela', level: 'Cordas e orquestra', blurb: 'Postura, arco e afinação com um método gradual, para crianças e adultos.' },
];

export const TIMES = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30', '20:00'];

// Next `n` weekdays (Mon-Sat) after `from`, as ISO yyyy-mm-dd (UTC-safe).
export function nextDays(from, n = 6) {
  const out = [];
  const d = new Date(from + 'T12:00:00Z');
  while (out.length < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Deterministic "availability": some slots are taken so the UI feels real.
export function slotsFor(instrumentId, day) {
  const seed = [...(instrumentId + day)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return TIMES.map((t, i) => ({ time: t, free: ((seed >> (i + 1)) & 3) !== 0 }));
}

export function formatPhone(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

export function validate({ name, phone, instrument, day, time }) {
  const e = {};
  if (!name || name.trim().split(/\s+/).length < 2) e.name = 'Informe nome e sobrenome.';
  if (String(phone).replace(/\D/g, '').length < 10) e.phone = 'Informe um WhatsApp com DDD.';
  if (!INSTRUMENTS.some((i) => i.id === instrument)) e.instrument = 'Escolha um instrumento.';
  if (!day) e.day = 'Escolha um dia.';
  else if (!time) e.time = 'Escolha um horário.';
  else if (!slotsFor(instrument, day).find((s) => s.time === time && s.free)) e.time = 'Esse horário não está livre.';
  return e;
}

export function dayLabel(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const wd = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getUTCDay()];
  return { wd, num: String(d.getUTCDate()).padStart(2, '0'), mon: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getUTCMonth()] };
}
