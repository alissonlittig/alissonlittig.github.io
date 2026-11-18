// Regras puras (sem DOM, sem rede): datas, dinheiro, agregações, sugestões, fixas, objetivo.
// Valores sempre em centavos inteiros; datas 'YYYY-MM-DD'; meses 'YYYY-MM'.

const p2 = n => String(n).padStart(2, '0');
export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const mesDe = iso => iso.slice(0, 7);
export function somaMes(mes, n) {
  const t = +mes.slice(0, 4) * 12 + (+mes.slice(5, 7) - 1) + n;
  return `${Math.floor(t / 12)}-${p2((t % 12) + 1)}`;
}
export const diasNoMes = mes => new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate();
export const dataNoMes = (dia, mes) => `${mes}-${p2(Math.min(dia, diasNoMes(mes)))}`;
export const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return hojeISO(d); };

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeMes = (mes, longo) => (longo ? MESES_LONGOS : MESES)[+mes.slice(5, 7) - 1];
export const rotuloMes = mes => `${nomeMes(mes, true)} ${mes.slice(0, 4)}`;
export const rotuloMesCurto = mes => `${nomeMes(mes)}/${mes.slice(2, 4)}`;
export function rotuloDia(iso, hoje = hojeISO()) {
  if (iso === hoje) return 'Hoje';
  if (iso === somaDias(hoje, -1)) return 'Ontem';
  const d = new Date(iso + 'T12:00:00');
  const sem = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getDay()];
  return `${sem}, ${d.getDate()} de ${MESES[d.getMonth()]}${iso.slice(0, 4) !== hoje.slice(0, 4) ? ' ' + iso.slice(0, 4) : ''}`;
}

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = c => fmt.format(Math.abs(c) / 100);
export const brl = c => `${c < 0 ? '−' : ''}R$ ${num(c)}`;
export function brlCurto(c) {
  const v = Math.abs(c) / 100, s = c < 0 ? '−' : '';
  if (v >= 10000) return `${s}R$ ${(v / 1000).toFixed(v >= 100000 ? 0 : 1).replace('.', ',')} mil`;
  return `${s}R$ ${Math.round(v).toLocaleString('pt-BR')}`;
}

/** "12,34" | "1.234,56" | "1234.56" | "-7" -> centavos (NaN se não for número). */
export function parseValor(txt) {
  let s = String(txt).replace(/[R$\s ]/g, '').replace('−', '-');
  if (!/^[-+]?[\d.,]+$/.test(s)) return NaN;
  const v = s.lastIndexOf(','), p = s.lastIndexOf('.');
  if (v >= 0 && p >= 0) s = v > p ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (v >= 0) s = s.replace(',', '.');
  else if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // 1.234 = milhar no padrão BR
  return Math.round(parseFloat(s) * 100);
}

// ---------- agregações ----------
export const doMes = (lancs, mes) => lancs.filter(l => l.data.startsWith(mes));
export function totais(lancs) {
  let entradas = 0, saidas = 0;
  for (const l of lancs) l.tipo === 'entrada' ? (entradas += l.valor) : (saidas += l.valor);
  return { entradas, saidas, saldo: entradas - saidas };
}
/** [[chave, total]] do maior para o menor. */
export function somaPor(lancs, chave) {
  const m = new Map();
  for (const l of lancs) m.set(l[chave] ?? null, (m.get(l[chave] ?? null) || 0) + l.valor);
  return [...m].sort((a, b) => b[1] - a[1]);
}
/** Saídas acumuladas por dia do mês: índice 0 = dia 1. */
export function acumuladoDiario(lancs, mes) {
  const dias = new Array(diasNoMes(mes)).fill(0);
  for (const l of lancs) if (l.tipo === 'saida' && l.data.startsWith(mes)) dias[+l.data.slice(8, 10) - 1] += l.valor;
  let acc = 0;
  return dias.map(v => (acc += v));
}
export function fluxo(lancs, mesFinal, n) {
  const linhas = [];
  for (let i = n - 1; i >= 0; i--) {
    const mes = somaMes(mesFinal, -i);
    linhas.push({ mes, ...totais(doMes(lancs, mes)) });
  }
  return linhas;
}
/** Média de saídas dos meses já fechados (antes de `mesAtual`) que tiveram movimento; mês vazio ou em curso distorce a média. */
export function mediaSaidas(linhas, mesAtual) {
  const ok = linhas.filter(f => f.mes < mesAtual && (f.entradas || f.saidas));
  return ok.length ? Math.round(ok.reduce((s, f) => s + f.saidas, 0) / ok.length) : null;
}
export function porDiaDaSemana(lancs) {
  const tot = new Array(7).fill(0);
  for (const l of lancs) if (l.tipo === 'saida') tot[new Date(l.data + 'T12:00:00').getDay()] += l.valor;
  return tot;
}

// ---------- sugestões por histórico ----------
const manual = l => l.origem !== 'importacao_planilha' && !l.fixa && !l.parc;
/** Categorias ordenadas pelo uso recente (90 dias pesa 3x), depois pela ordem cadastrada. */
export function ordemCategorias(cats, lancs, tipo, hoje = hojeISO()) {
  const corte = somaDias(hoje, -90), uso = new Map();
  for (const l of lancs) if (l.tipo === tipo && manual(l) && l.data <= hoje) uso.set(l.cat, (uso.get(l.cat) || 0) + (l.data >= corte ? 3 : 1));
  return cats.filter(c => c.tipo === tipo && c.ativa !== false)
    .sort((a, b) => (uso.get(b.id) || 0) - (uso.get(a.id) || 0) || (a.ordem ?? 0) - (b.ordem ?? 0));
}
/** Atalhos "categoria + valor" que mais se repetem nos últimos 120 dias (mín. 2 vezes). */
export function atalhos(lancs, hoje = hojeISO(), max = 4) {
  const corte = somaDias(hoje, -120), m = new Map();
  for (const l of lancs) {
    if (l.tipo !== 'saida' || !manual(l) || l.data < corte || l.data > hoje) continue;
    const k = `${l.cat}|${l.valor}`, a = m.get(k) || { cat: l.cat, valor: l.valor, conta: l.conta, n: 0, ult: '' };
    a.n++; if (l.data > a.ult) { a.ult = l.data; a.conta = l.conta; }
    m.set(k, a);
  }
  return [...m.values()].filter(a => a.n >= 2).sort((a, b) => b.n - a.n || (a.ult < b.ult ? 1 : -1)).slice(0, max);
}
export const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Palavras de extrato que não dizem nada sobre a categoria.
const GENERICAS = new Set('compra compras debito credito pix pagamento pagto transferencia transf enviado enviada recebido recebida parcelada parcela boleto cartao conta para com the ltda sao'.split(' '));
/** Categoria provável para uma descrição: histórico igual > palavra em comum no histórico > nome da categoria. */
export function sugerirCategoria(desc, lancs, cats, tipo = 'saida') {
  const alvo = normalizar(desc).replace(/\d+/g, '').trim();
  if (!alvo) return null;
  const validas = new Set(cats.filter(c => c.tipo === tipo).map(c => c.id));
  const votos = new Map(), palavras = alvo.split(' ').filter(p => p.length > 2 && !GENERICAS.has(p));
  for (const l of lancs) {
    if (!l.desc || !validas.has(l.cat)) continue;
    const d = normalizar(l.desc).replace(/\d+/g, '').trim();
    if (!d) continue;
    const peso = d === alvo ? 5 : palavras.some(p => d.split(' ').includes(p)) ? 1 : 0;
    if (peso) votos.set(l.cat, (votos.get(l.cat) || 0) + peso);
  }
  if (votos.size) return [...votos].sort((a, b) => b[1] - a[1])[0][0];
  for (const c of cats) {
    if (!validas.has(c.id)) continue;
    if (normalizar(c.nome).split(' ').some(p => p.length > 2 && palavras.includes(p))) return c.id;
  }
  return null;
}

// ---------- parcelas e contas fixas ----------
/** Nome para mostrar: tira "· 2/3" e "parcelada 3x" do texto; descrição genérica vira o nome da categoria. */
export function nomeLanc(l, nomeCat = '') {
  const m = l.parc ? (l.desc || '').match(/ · (\d+\/\d+)$/) : null;
  let d = (l.desc || '').replace(/ · \d+\/\d+$/, '').trim();
  if (l.parc) d = /^compra parcelada$/i.test(d) ? '' : d.replace(/\s+parcelad[ao](\s+\d+x)?$/i, '');
  return { nome: d || nomeCat || 'Sem categoria', generico: !d, parcela: m ? m[1] : '' };
}
/** Valor de cada parcela: os centavos que sobram da divisão vão nas primeiras (a soma fecha com o total). */
export const valoresParcelas = (total, n) => Array.from({ length: n }, (_, i) => Math.floor(total / n) + (i < total % n ? 1 : 0));
/** Uma compra de `base.valor` (total) em n parcelas vira n lançamentos mensais com o mesmo `parc`. */
export function parcelar(base, n, parcId) {
  if (n <= 1) return [base];
  const dia = +base.data.slice(8, 10), mes0 = mesDe(base.data), vs = valoresParcelas(base.valor, n);
  return Array.from({ length: n }, (_, i) => ({
    ...base, valor: vs[i], data: dataNoMes(dia, somaMes(mes0, i)), parc: parcId,
    desc: `${base.desc || 'Compra parcelada'} · ${i + 1}/${n}`,
  }));
}
export const idFixa = (fixaId, mes) => `fx_${fixaId}_${mes}`;
/**
 * Lançamentos de contas fixas que faltam até `mesAtual`.
 * `regsLanc` = registros brutos {id, d, x} (inclui apagados: o que foi apagado não renasce).
 * O carimbo `u` é o dia 1 do mês (UTC): mais antigo que qualquer edição, então nunca desfaz mudança.
 */
export function fixasFaltando(fixas, regsLanc, mesAtual) {
  const tem = new Set();
  for (const r of regsLanc) { tem.add(r.id); if (r.d.fixa) tem.add(`${r.d.fixa}|${mesDe(r.d.data)}`); }
  const novos = [];
  for (const f of fixas) {
    for (let mes = f.inicio; mes <= mesAtual; mes = somaMes(mes, 1)) {
      const id = idFixa(f.id, mes);
      if (tem.has(id) || tem.has(`${f.id}|${mes}`)) continue;
      novos.push({ id, u: Date.parse(`${mes}-01T00:00:00Z`), d: { tipo: f.tipo, valor: f.valor, data: dataNoMes(f.dia, mes), cat: f.cat, conta: f.conta ?? null, desc: f.desc, origem: 'fixa', fixa: f.id } });
    }
  }
  return novos;
}

// ---------- objetivo (reserva) ----------
/** Saldo do objetivo = base informada + aportes (saídas na categoria do objetivo) até hoje, depois da data da base. */
export function saldoObjetivo(obj, lancs, hoje = hojeISO()) {
  let s = obj.base || 0;
  for (const l of lancs) if (l.cat === obj.cat && l.data <= hoje && (!obj.baseData || l.data > obj.baseData)) s += l.tipo === 'saida' ? l.valor : -l.valor;
  return s;
}
/** Projeção mês a mês a partir do mês atual, com o aporte mensal. */
export function projecao(obj, saldo, mesAtual) {
  const falta = Math.max(0, obj.alvo - saldo);
  const mesesAtePrazo = Math.max(0, (+obj.prazo.slice(0, 4) - +mesAtual.slice(0, 4)) * 12 + (+obj.prazo.slice(5, 7) - +mesAtual.slice(5, 7)));
  const necessario = falta === 0 ? 0 : Math.ceil(falta / Math.max(1, mesesAtePrazo));
  const mesesNoRitmo = falta === 0 ? 0 : obj.aporte > 0 ? Math.ceil(falta / obj.aporte) : Infinity;
  const chegaEm = Number.isFinite(mesesNoRitmo) ? somaMes(mesAtual, mesesNoRitmo) : null;
  const n = Math.max(mesesAtePrazo, Math.min(Number.isFinite(mesesNoRitmo) ? mesesNoRitmo : 0, 60), 1);
  const serie = Array.from({ length: n + 1 }, (_, i) => ({ mes: somaMes(mesAtual, i), ritmo: Math.min(obj.alvo, saldo + obj.aporte * i), ideal: Math.min(obj.alvo, saldo + necessario * i) }));
  return { falta, mesesAtePrazo, necessario, mesesNoRitmo, chegaEm, noPrazo: chegaEm !== null && chegaEm <= obj.prazo, serie };
}

// ---------- sincronização ----------
/** O registro remoto substitui o local? (última escrita vence; local sujo e mais novo fica) */
/** Carimbo de uma alteração: nunca menor que o da versão que ela substitui (relógio de outro aparelho adiantado não faz a edição perder). */
export const carimbo = (anterior, agora = Date.now()) => Math.max(agora, (anterior ?? -1) + 1);
export const remotoVence = (local, remoto) => !local || !local.s || remoto.u >= local.u;
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
