// Regras do CRM sem DOM: rodam no navegador e no Node (teste).
export const ETAPAS = ['Lead', 'Orçamento', 'Negociação', 'Produção', 'Entregue'];

export function novoProjeto(dados, id) {
  const cliente = String(dados.cliente ?? '').trim();
  const titulo = String(dados.titulo ?? '').trim();
  const bruto = String(dados.valor ?? '').trim();
  const valor = bruto === '' ? NaN : Number(bruto);
  if (!cliente) throw new Error('Informe o cliente.');
  if (!titulo) throw new Error('Informe o projeto.');
  if (!Number.isFinite(valor) || valor < 0) throw new Error('Informe um valor válido.');
  if (!ETAPAS.includes(dados.etapa)) throw new Error('Escolha uma etapa.');
  return { id, cliente, titulo, etapa: dados.etapa, valor: Math.round(valor * 100) / 100 };
}

export function moverProjeto(lista, id, etapa) {
  if (!ETAPAS.includes(etapa)) throw new Error('Etapa inválida.');
  return lista.map((p) => (p.id === id ? { ...p, etapa } : p));
}

export function resumo(lista) {
  const r = Object.fromEntries(ETAPAS.map((e) => [e, { qtd: 0, valor: 0 }]));
  for (const p of lista) {
    r[p.etapa].qtd += 1;
    r[p.etapa].valor += p.valor;
  }
  return r;
}

// Dado salvo no navegador pode estar corrompido: aceita só o que bate com o formato.
export function carregar(raw) {
  try {
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return null;
    return lista.filter(
      (p) => p && ETAPAS.includes(p.etapa) && typeof p.titulo === 'string' && Number.isFinite(p.valor),
    );
  } catch {
    return null;
  }
}

export function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
