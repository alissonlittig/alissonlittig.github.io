// Regras puras do Maré (sem DOM, sem rede): estado, mesclagem da sincronização, resumos, orçamento, consentimento.
import { hojeISO, mesDe, somaMes, doMes, uid } from './logic.js';
import { categorizar, cat, chaveRegra } from './categorias.js';

export const novoEstado = () => ({ v: 1, cred: null, contas: [], lancs: [], faturas: [], regras: {}, orc: {}, meta: 0, sync: { ts: null, erro: null }, consent: null, faturasOk: null, status: null });

const chaveTx = l => `${l.conta}|${l.data}|${l.valor}|${chaveRegra(l.desc)}`;

/** Troca as transações da Pluggy da janela [desde, hoje] pelas novas; mantém categoria que ela editou à mão. */
export function aplicarSync(est, r, desde, agora = Date.now()) {
  const manuais = new Map();
  for (const l of est.lancs) if (l.man) manuais.set(chaveTx(l), l.cat);
  const contasNovas = new Set(r.contas.map(c => c.id));
  // fora da janela e as importadas ficam; dentro da janela, só o que a Pluggy mandou agora
  const mantidos = est.lancs.filter(l => l.fonte !== 'pluggy' ? true : l.data < desde && contasNovas.has(l.conta));
  const importadosIguais = new Set(mantidos.filter(l => l.fonte === 'import').map(chaveTx));
  const novos = [];
  for (const t of r.lancs) {
    if (importadosIguais.has(chaveTx(t))) continue; // já veio por arquivo: não duplica
    const k = chaveTx(t), m = manuais.get(k);
    novos.push({ ...t, cat: m || categorizar(t, est.regras), man: m ? true : undefined });
  }
  est.lancs = [...mantidos, ...novos].sort((a, b) => b.data.localeCompare(a.data));
  est.contas = r.contas; est.faturas = r.faturas; est.faturasOk = r.faturasOk;
  if (r.consent) est.consent = r.consent;
  est.status = r.status;
  est.sync = { ts: agora, erro: null };
  return est;
}

/** Lançamentos de arquivo OFX/CSV (plano B) -> estado, sem duplicar. Devolve quantos entraram. */
export function aplicarImport(est, itens, conta = 'arquivo') {
  const tem = new Set(est.lancs.map(chaveTx)), temExt = new Set(est.lancs.filter(l => l.ext).map(l => l.ext));
  let n = 0;
  for (const i of itens) {
    const l = { id: 'imp_' + uid(), conta, data: i.data, desc: i.desc || 'Sem descrição', valor: i.valor, pCat: '', fonte: 'import', ext: i.ext || undefined };
    if ((l.ext && temExt.has(l.ext)) || tem.has(chaveTx(l))) continue;
    l.cat = categorizar(l, est.regras); est.lancs.push(l); tem.add(chaveTx(l)); n++;
  }
  est.lancs.sort((a, b) => b.data.localeCompare(a.data));
  return n;
}

/** Ela troca a categoria: vale para este lançamento e vira regra para os próximos com a mesma descrição. */
export function mudarCategoria(est, id, catId, aprender = true) {
  const l = est.lancs.find(x => x.id === id);
  if (!l) return 0;
  l.cat = catId; l.man = true;
  let outros = 0;
  if (aprender) {
    const k = chaveRegra(l.desc);
    if (k) {
      est.regras[k] = catId;
      for (const x of est.lancs) if (x !== l && !x.man && chaveRegra(x.desc) === k) { x.cat = catId; outros++; }
    }
  }
  return outros;
}

const conta = (est, id) => est.contas.find(c => c.id === id);
export const ehGasto = l => l.valor < 0 && !cat(l.cat).neutra;
export const ehEntrada = l => l.valor > 0 && !cat(l.cat).neutra;

export function resumoMes(est, mes) {
  const ls = doMes(est.lancs, mes);
  let entradas = 0, saidas = 0; const por = new Map();
  for (const l of ls) {
    if (ehEntrada(l)) entradas += l.valor;
    else if (ehGasto(l)) { saidas -= l.valor; por.set(l.cat, (por.get(l.cat) || 0) - l.valor); }
  }
  const porCat = [...por].map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  return { mes, entradas, saidas, saldo: entradas - saidas, porCat, n: ls.length };
}
export function mesesComMovimento(est, hoje = hojeISO()) {
  const s = new Set([mesDe(hoje)]);
  for (const l of est.lancs) s.add(mesDe(l.data));
  return [...s].sort().reverse();
}
export const ultimosMeses = (est, mesFinal, n) => Array.from({ length: n }, (_, i) => resumoMes(est, somaMes(mesFinal, i - n + 1)));

/** Orçamento: por categoria, quanto gastou no mês contra o limite que ela definiu. */
export function orcamento(est, mes) {
  const r = resumoMes(est, mes), gasto = Object.fromEntries(r.porCat.map(c => [c.id, c.v]));
  return Object.entries(est.orc).filter(([, lim]) => lim > 0).map(([id, lim]) => ({ id, lim, gasto: gasto[id] || 0, pct: Math.round(((gasto[id] || 0) / lim) * 100) })).sort((a, b) => b.pct - a.pct);
}
/** Meta de economia: entradas - saídas do mês contra a meta. */
export const progressoMeta = (est, mes) => { const r = resumoMes(est, mes); return { meta: est.meta, feito: r.saldo, pct: est.meta > 0 ? Math.max(0, Math.round((r.saldo / est.meta) * 100)) : 0 }; };

export const saldoTotal = est => est.contas.filter(c => c.tipo === 'BANK').reduce((s, c) => s + c.saldo, 0);
export const dividaCartoes = est => est.contas.filter(c => c.tipo === 'CREDIT').reduce((s, c) => s + Math.max(0, c.saldo), 0);

/** Dias até o consentimento do Meu Pluggy vencer (null se não sabemos). Aviso a partir de 30 dias. */
export function diasConsent(est, hoje = hojeISO()) {
  if (!est.consent) return null;
  return Math.round((Date.parse(est.consent + 'T12:00:00') - Date.parse(hoje + 'T12:00:00')) / 864e5);
}
/** Precisa sincronizar? (nunca, ou há mais de 6 h.) */
export const precisaSync = (est, agora = Date.now()) => !!est.cred && (!est.sync.ts || agora - est.sync.ts > 6 * 3600e3);

export function exportarTudo(est) {
  const { cred, ...resto } = est; // as chaves dela NÃO vão no arquivo de dados
  return JSON.stringify({ app: 'Maré', exportadoEm: new Date().toISOString(), ...resto }, null, 1);
}
