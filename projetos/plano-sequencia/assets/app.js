import { ETAPAS, novoProjeto, moverProjeto, resumo, carregar, fmtBRL } from './crm.mjs';

const CHAVE = 'plano-sequencia:v1';
const SEMENTE = [
  { id: 1, cliente: 'Casa Ventura', titulo: 'Institucional 2 min', etapa: 'Orçamento', valor: 4800 },
  { id: 2, cliente: 'Padaria Brasa', titulo: 'Reels de lançamento (3)', etapa: 'Negociação', valor: 1500 },
  { id: 3, cliente: 'Clínica Sol Nascente', titulo: 'Depoimentos em vídeo', etapa: 'Produção', valor: 3200 },
  { id: 4, cliente: 'Ateliê Lua', titulo: 'Documentário de marca', etapa: 'Produção', valor: 7900 },
  { id: 5, cliente: 'Bistrô Figueira', titulo: 'Vídeo de cardápio', etapa: 'Entregue', valor: 950 },
];

const h = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids.flat().filter((k) => k !== null && k !== undefined));
  return n;
};

const $ = (sel) => document.querySelector(sel);
const resumoEl = $('#resumo');
const quadro = $('#quadro');
const form = $('#novo');
const aviso = $('#aviso');
const etapaSelect = $('#f-etapa');

let lista = [];
let focar = null;

function lerSalvo() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    aviso.textContent = 'Não foi possível guardar neste navegador; os dados somem ao recarregar.';
  }
}

function cartao(p) {
  const sel = h('select', { id: `mv-${p.id}`, 'data-id': String(p.id) });
  for (const e of ETAPAS) {
    const opt = h('option', { value: e }, e);
    opt.selected = e === p.etapa;
    sel.append(opt);
  }
  sel.addEventListener('change', () => {
    lista = moverProjeto(lista, p.id, sel.value);
    focar = p.id;
    salvar();
    render();
  });
  return h(
    'li',
    { class: 'cartao' },
    h('h3', {}, p.titulo),
    h('p', { class: 'cli' }, p.cliente),
    h('p', { class: 'valor' }, fmtBRL(p.valor)),
    h('label', { class: 'mover', for: `mv-${p.id}` }, 'Mover para ', sel),
  );
}

function coluna(etapa, i) {
  const itens = lista.filter((p) => p.etapa === etapa);
  return h(
    'section',
    { class: 'coluna', 'aria-labelledby': `col-${i}` },
    h('h2', { id: `col-${i}` }, etapa, h('span', { class: 'n' }, String(itens.length))),
    itens.length
      ? h('ul', { class: 'cards' }, ...itens.map(cartao))
      : h('p', { class: 'vazio' }, 'Nenhum projeto nesta etapa.'),
  );
}

function render() {
  const r = resumo(lista);
  resumoEl.replaceChildren(
    ...ETAPAS.map((e) =>
      h('div', { class: 'stat' }, h('dt', {}, e), h('dd', {}, fmtBRL(r[e].valor)), h('small', {}, `${r[e].qtd} ${r[e].qtd === 1 ? 'projeto' : 'projetos'}`)),
    ),
  );
  quadro.replaceChildren(...ETAPAS.map(coluna));
  if (focar !== null) {
    quadro.querySelector(`select[data-id="${focar}"]`)?.focus();
    focar = null;
  }
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  try {
    const id = Math.max(0, ...lista.map((p) => p.id)) + 1;
    lista = [...lista, novoProjeto(Object.fromEntries(new FormData(form)), id)];
    salvar();
    form.reset();
    etapaSelect.value = 'Lead';
    aviso.textContent = 'Projeto adicionado.';
    render();
  } catch (err) {
    aviso.textContent = err.message;
  }
});

const salvo = carregar(lerSalvo());
lista = salvo ?? SEMENTE;
if (!salvo) salvar();
render();
