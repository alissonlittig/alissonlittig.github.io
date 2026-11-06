// Rodar: node --test teste.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS, novoProjeto, moverProjeto, resumo, carregar, fmtBRL } from './assets/crm.mjs';

const base = { cliente: 'Casa Ventura', titulo: 'Institucional', etapa: 'Lead', valor: '1000.456' };

test('novoProjeto valida e arredonda', () => {
  const p = novoProjeto(base, 1);
  assert.equal(p.valor, 1000.46);
  assert.throws(() => novoProjeto({ ...base, cliente: '  ' }, 1), /cliente/);
  assert.throws(() => novoProjeto({ ...base, valor: '' }, 1), /valor/);
  assert.throws(() => novoProjeto({ ...base, valor: '-5' }, 1), /valor/);
  assert.throws(() => novoProjeto({ ...base, etapa: 'Fechado' }, 1), /etapa/);
});

test('moverProjeto muda só o alvo e não altera a lista original', () => {
  const lista = [novoProjeto(base, 1), novoProjeto({ ...base, titulo: 'Reel' }, 2)];
  const nova = moverProjeto(lista, 2, 'Produção');
  assert.equal(nova[0].etapa, 'Lead');
  assert.equal(nova[1].etapa, 'Produção');
  assert.equal(lista[1].etapa, 'Lead');
  assert.throws(() => moverProjeto(lista, 2, 'X'), /inválida/);
});

test('resumo soma por etapa', () => {
  const lista = [
    novoProjeto({ ...base, etapa: 'Produção', valor: 300 }, 1),
    novoProjeto({ ...base, etapa: 'Produção', valor: 200 }, 2),
  ];
  const r = resumo(lista);
  assert.deepEqual(Object.keys(r), ETAPAS);
  assert.deepEqual(r.Produção, { qtd: 2, valor: 500 });
  assert.deepEqual(r.Lead, { qtd: 0, valor: 0 });
});

test('carregar descarta dado corrompido', () => {
  assert.equal(carregar('não é json'), null);
  assert.equal(carregar('{"a":1}'), null);
  const ok = carregar(JSON.stringify([{ titulo: 'a', etapa: 'Lead', valor: 1 }, { titulo: 'b', etapa: 'Zumbi', valor: 1 }]));
  assert.equal(ok.length, 1);
});

test('fmtBRL formata em reais', () => {
  assert.match(fmtBRL(1234.5), /R\$\s1\.234,50/);
});
