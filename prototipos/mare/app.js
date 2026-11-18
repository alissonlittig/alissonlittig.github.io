// Maré: telas. Tudo roda no aparelho; a única rede é api.pluggy.ai. Nada de log com valores.
import * as cofre from './cofre.js';
import * as pluggy from './pluggy.js';
import { parseArquivo } from './importers.js';
import { hojeISO, mesDe, somaMes, rotuloMes, rotuloDia, brl, brlCurto, parseValor, normalizar } from './logic.js';
import { CATS, cat } from './categorias.js';
import * as D from './dados.js';

const $ = s => document.querySelector(s), app = $('#app'), folha = $('#folha');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONES = {
  casa: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>', lista: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>',
  engr: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 00-2.8-1.6L13.3 2h-2.6l-.4 2.9A7 7 0 007.5 6.5l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.3-1a7 7 0 002.8 1.6l.4 2.9h2.6l.4-2.9a7 7 0 002.8-1.6l2.3 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6z"/>',
  cesta: '<path d="M5 9h14l-1.5 9a2 2 0 01-2 1.6h-7a2 2 0 01-2-1.6zM9 9l3-5 3 5"/>', garfo: '<path d="M7 3v8a2 2 0 002 2v8M11 3v6M7 7h4M17 21V3c-2 2-3 5-3 8h3"/>', carro: '<path d="M5 16l1.5-5a2 2 0 012-1.5h7a2 2 0 012 1.5L19 16M4 16h16v3H4zM7 19v1M17 19v1"/>',
  cruz: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>', brilho: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>', sacola: '<path d="M6 8h12l1 12H5zM9 8a3 3 0 016 0"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z"/>', estrela: '<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8L9.6 9z"/>', livro: '<path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h10"/>',
  aviao: '<path d="M3 13l18-8-6 15-3-6z"/>', setas: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>', moeda: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8m0 8v1.5"/>',
  cartao: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10.5h18M7 15h3"/>', graf: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>', ponto: '<circle cx="12" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', ant: '<path d="M15 5l-7 7 7 7"/>', prox: '<path d="M9 5l7 7-7 7"/>', att: '<path d="M20 12a8 8 0 10-2.5 5.8M20 5v5h-5"/>', alerta: '<path d="M12 4l9 16H3zM12 10v4m0 3h.01"/>',
  cadeado: '<rect x="5" y="11" width="14" height="9" rx="3"/><path d="M8 11V8a4 4 0 018 0v3M12 15v2"/>', cora: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  bio: '<path d="M12 11a3 3 0 013 3c0 2-1 3.5-2 5M9 14a3 3 0 016 0M6 14a6 6 0 0112 0c0 2-.5 3.5-1.2 5M4 11a8 8 0 0116 0M4 14c0 1.5.2 3 .7 4.5"/>', apagar: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n] || ICONES.ponto}</svg>`;
const selo = c => { const k = cat(c); return `<span class="sel" style="--h:${k.h}">${ic(k.ic)}</span>`; };
const corCat = id => `--h:${cat(id).h}`;
const fmtTs = ts => { const d = new Date(ts); return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };

let est = D.novoEstado(), aba = 'inicio', mes = mesDe(hojeISO()), busy = false, anim = true;
const ABAS = ['inicio', 'extrato', 'planejar', 'ajustes'];
let filtro = { q: '', tipo: 'todos', conta: 'todas' };
const salvar = () => cofre.salvarDados(est);
const aviso = msg => { const d = document.createElement('div'); d.setAttribute('role', 'status'); d.className = 'toast'; d.textContent = msg; document.body.append(d); setTimeout(() => d.remove(), 3200); };
const abrirFolha = html => { folha.innerHTML = `<div class="fl" role="dialog" aria-modal="true">${html}</div>`; folha.classList.add('aberta'); contar(folha); };
const fecharFolha = () => { folha.classList.remove('aberta'); folha.innerHTML = ''; };
/** Números que "contam" até o valor (só quando a tela entra; respeita movimento reduzido). */
function contar(raiz) {
  const els = raiz.querySelectorAll('[data-up]');
  if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now();
  const passo = t => {
    const p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
    els.forEach(el => { const f = el.dataset.fmt === 'curto' ? brlCurto : brl; el.textContent = f(Math.round(+el.dataset.up * e)); });
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
const num = (v, fmt) => `<span data-up="${v}"${fmt ? ` data-fmt="${fmt}"` : ''}>${fmt === 'curto' ? brlCurto(v) : brl(v)}</span>`;
folha.addEventListener('click', e => { if (e.target === folha) fecharFolha(); else clique(e); });

// ---------- PIN ----------
const TEC = '123456789'.split('').concat(['', '0', '⌫']);
function tecladoPin({ titulo, sub, extra = '', onPin }) {
  let pin = '';
  const pintar = (erro) => {
    app.innerHTML = `<section class="entrada"><img class="selo" src="icons/icone.svg" alt=""><div><h1>${esc(titulo)}</h1><p id="sub">${esc(sub)}</p></div>
      <div class="pontos ${erro ? 'erro' : ''}" id="pontos">${Array.from({ length: 6 }, (_, i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="teclado">${TEC.map(t => t ? `<button type="button" data-k="${t}" aria-label="${t === '⌫' ? 'Apagar' : t}">${t}</button>` : '<button class="vz" disabled></button>').join('')}</div>${extra}</section>`;
  };
  pintar();
  app.onclick = async e => {
    const b = e.target.closest('button[data-k]'); if (!b) { if (e.target.closest('#bio')) bioAbrir(); return; }
    const k = b.dataset.k;
    if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 6) pin += k;
    pintar();
    if (pin.length === 6) { const p = pin; pin = ''; const r = await onPin(p); if (typeof r === 'string') { pintar(true); $('#sub').textContent = r; } }
  };
}
async function bioAbrir() { if (await cofre.destravarBiometria()) entrar(); }
async function pedirPin() {
  const bio = await cofre.temBiometria();
  tecladoPin({ ...cfgPin(), extra: bio ? '<button class="botao suave" id="bio" type="button">' + ic('bio') + 'Usar biometria</button>' : '' });
  if (bio) bioAbrir();
}
const cfgPin = () => ({
  titulo: 'Maré', sub: 'Demonstração: qualquer PIN de 6 números', onPin: async p => {
    const r = await cofre.destravarPin(p);
    if (r === 'ok') { await entrar(); return null; }
    return r === 'errado' ? 'PIN incorreto' : `Muitas tentativas. Espere ${r.espera} s.`;
  },
});
function criarPin() {
  let primeiro = null;
  const passo = () => tecladoPin({
    titulo: primeiro ? 'Repita o PIN' : 'Escolha seu PIN', sub: primeiro ? 'Digite de novo para confirmar' : 'Na demonstração, qualquer PIN de 6 números serve.',
    onPin: async p => { if (!primeiro) { primeiro = p; passo(); return undefined; } if (p !== primeiro) { primeiro = null; passo(); $('#sub').textContent = 'Os PINs não batem. Comece de novo.'; return undefined; } await cofre.criar(p); await entrar(); return undefined; },
  });
  passo();
}

// ---------- boas-vindas (1ª abertura, antes do PIN) ----------
const DEFS = '<defs><linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc2a8"/><stop offset=".55" stop-color="#f58bb0"/><stop offset="1" stop-color="#bd97f2"/></linearGradient></defs>';
const ILUS = [
  `<svg viewBox="0 0 220 190" aria-hidden="true">${DEFS}<circle cx="110" cy="84" r="62" fill="url(#gA)" opacity=".28"/><circle cx="110" cy="76" r="38" fill="url(#gA)"/><circle cx="98" cy="64" r="9" fill="#fff" opacity=".7"/><path d="M26 128q21-24 42 0t42 0 42 0 42 0" fill="none" stroke="url(#gA)" stroke-width="12" stroke-linecap="round"/><path d="M26 156q21-24 42 0t42 0 42 0 42 0" fill="none" stroke="url(#gA)" stroke-opacity=".5" stroke-width="12" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 220 190" aria-hidden="true">${DEFS}<circle cx="110" cy="96" r="76" fill="url(#gA)" opacity=".22"/><path d="M82 92V74a28 28 0 0156 0v18" fill="none" stroke="url(#gA)" stroke-width="12" stroke-linecap="round"/><rect x="66" y="88" width="88" height="68" rx="24" fill="url(#gA)"/><path d="M110 138s-14-8.4-14-19a8 8 0 0114-5 8 8 0 0114 5c0 10.600-14 19-14 19z" fill="#fff"/><circle cx="178" cy="46" r="6" fill="#bd97f2"/><circle cx="40" cy="64" r="4" fill="#f58bb0"/></svg>`,
  `<svg viewBox="0 0 220 190" aria-hidden="true">${DEFS}<circle cx="110" cy="96" r="76" fill="url(#gA)" opacity=".22"/><rect x="50" y="62" width="120" height="76" rx="28" fill="url(#gA)"/><path d="M50 92h120" stroke="#fff" stroke-opacity=".5" stroke-width="10"/><rect x="66" y="112" width="34" height="9" rx="4.5" fill="#fff"/><path d="M164 34l4 11 11 4-11 4-4 11-4-11-11-4 11-4zM44 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f58bb0"/></svg>`,
];
const SLIDES = [
  ['Oi! Eu sou o Maré', 'Seu dinheiro num cantinho calmo e bonito, só seu.'],
  ['Só você vê', 'Tudo fica guardado neste celular, trancado com o seu PIN. Sem conta, sem servidor.'],
  ['Vamos começar?', 'Escolha um PIN de 6 números. Depois eu mostro o seu mês, bem simples.'],
];
function boasVindas(i = 0) {
  const [t, p] = SLIDES[i], ultimo = i === SLIDES.length - 1;
  app.classList.remove('ani');
  app.innerHTML = `<section class="entrada"><div class="passo-in" key="${i}"><div class="ilus">${ILUS[i]}</div><div><h1>${t}</h1><p>${p}</p></div></div>
    <div class="passos" aria-label="Passo ${i + 1} de 3">${SLIDES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="boas"><button class="botao primario largo" data-ato="${ultimo ? 'comecar' : 'prox'}">${ultimo ? 'Criar meu PIN' : 'Continuar'}</button>${ultimo ? '' : '<button class="botao largo" data-ato="comecar">Pular</button>'}</div></section>`;
  app.onclick = e => { const a = e.target.closest('[data-ato]')?.dataset.ato; if (a === 'prox') boasVindas(i + 1); else if (a === 'comecar') criarPin(); };
}

// ---------- ciclo ----------
async function entrar() {
  est = { ...D.novoEstado(), ...(await cofre.lerDados() || {}) };
  mes = mesDe(hojeISO()); aba = 'inicio'; anim = true; render();
  if (D.precisaSync(est)) sincronizar(false);
}
let ocultoEm = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ocultoEm = Date.now(); return; }
  if (cofre.destravado() && ocultoEm && Date.now() - ocultoEm > 120000) { cofre.trava(); fecharFolha(); pedirPin(); }
  else if (cofre.destravado() && D.precisaSync(est)) sincronizar(false);
});

async function sincronizar(manual) {
  if (busy || !est.cred) return;
  busy = true; render();
  const hoje = hojeISO(), desde = est.sync.ts ? shiftDias(hoje, -60) : pluggy.janelaInicial(hoje);
  try {
    const r = await pluggy.sincronizar(est.cred, { desde });
    D.aplicarSync(est, r, desde);
    await salvar();
    if (manual) aviso('Atualizado');
  } catch (e) {
    est.sync = { ...est.sync, erro: e instanceof pluggy.ErroPluggy ? e.message : 'Não consegui atualizar agora.' };
    await salvar();
  }
  busy = false; render();
}
const shiftDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return hojeISO(d); };

// ---------- telas ----------
function render() {
  if (!cofre.destravado()) return;
  if (!est.cred && !est.semConexao) return conectar();
  const tela = { inicio, extrato, planejar, ajustes }[aba]();
  app.classList.toggle('ani', anim);
  app.innerHTML = `<main>${tela}</main><div class="tabs"><nav aria-label="Seções">${[['inicio', 'casa', 'Início'], ['extrato', 'lista', 'Extrato'], ['planejar', 'alvo', 'Planos'], ['ajustes', 'engr', 'Ajustes']].map(([id, i, n]) => `<button data-aba="${id}" ${aba === id ? 'aria-current="page"' : ''}>${ic(i)}${n}</button>`).join('')}</nav></div>`;
  app.onclick = clique; app.oninput = entrada;
  if (anim) contar(app);
  anim = false;
}
const seletorMes = () => `<div class="mes"><button data-mes="-1" aria-label="Mês anterior">${ic('ant')}</button><span>${rotuloMes(mes).replace(/ \d{4}$/, m => m)}</span><button data-mes="1" aria-label="Próximo mês" ${mes >= mesDe(hojeISO()) ? 'disabled' : ''}>${ic('prox')}</button></div>`;
const quando = () => est.sync.ts ? `Atualizado em ${fmtTs(est.sync.ts)}` : est.cred ? 'Ainda não atualizado' : 'Sem conexão com o banco';
/** Avisos discretos: pílulas pequenas; o detalhe só aparece ao tocar. */
const avisos = () => {
  const d = D.diasConsent(est), out = [];
  if (est.sync.erro) out.push(`<button class="pilula erro" data-ato="sync">${ic('alerta')}Não consegui atualizar · tentar de novo</button>`);
  if (est.status === 'LOGIN_ERROR' || (d != null && d < 0)) out.push(`<button class="pilula erro" data-ato="renovar">${ic('alerta')}Autorização venceu · renovar</button>`);
  else if (d != null && d <= 30) out.push(`<button class="pilula" data-ato="renovar">${ic('alerta')}Renovar autorização · ${d} dia${d === 1 ? '' : 's'}</button>`);
  if (est.cred && est.faturasOk === false && est.contas.some(c => c.tipo === 'CREDIT')) out.push(`<button class="pilula" data-ato="fatura-info">${ic('cartao')}Fatura do cartão não veio</button>`);
  return out.length ? `<div class="pilulas">${out.join('')}</div>` : '';
};
const ONDAS = '<div class="ondas" aria-hidden="true"><svg viewBox="0 0 800 56" preserveAspectRatio="none"><path d="M0 28q50-30 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0V56H0z" fill="var(--sup)" fill-opacity=".5"/></svg><svg viewBox="0 0 800 56" preserveAspectRatio="none"><path d="M0 34q50-26 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0V56H0z" fill="var(--bg)"/></svg></div>';
const saudacao = () => { const h = new Date().getHours(); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

function inicio() {
  const r = resumo(), ant = D.resumoMes(est, somaMes(mes, -1)), top = r.porCat.slice(0, 3), maxc = top[0]?.v || 1;
  const dif = ant.saidas ? Math.round(((r.saidas - ant.saidas) / ant.saidas) * 100) : null, maxv = Math.max(r.saidas, ant.saidas, 1);
  const nMes = rotuloMes(mes).split(' ')[0], nAnt = rotuloMes(somaMes(mes, -1)).split(' ')[0];
  const frase = dif == null ? 'Ainda não tenho o mês passado para comparar.' : dif === 0 ? `Igualzinho a ${nAnt}.` : dif < 0 ? `${Math.abs(dif)}% a menos que em ${nAnt}. Que bom!` : `${dif}% a mais que em ${nAnt}.`;
  const temConta = est.contas.length > 0;
  return `<div class="topo"><div><p class="oi">${saudacao()}!</p><h1>Seu mês</h1></div>${seletorMes()}</div>${avisos()}
  <section class="card heroi ${temConta ? 'toque' : ''}" ${temConta ? 'data-ato="contas"' : ''}><div class="bolha"></div>
    <div class="linha"><p class="fraco">Saldo na conta</p>${est.cred ? `<button class="redondo ${busy ? 'gira' : ''}" data-ato="sync" ${busy ? 'disabled' : ''} aria-label="Atualizar agora">${ic('att')}</button>` : ''}</div>
    ${temConta ? `<p class="grande">${num(D.saldoTotal(est))}</p><button class="fraco" data-ato="contas" style="justify-self:start">${quando()} · ver contas ›</button>` : `<p class="mudo">${est.cred ? 'Toque no botão ao lado para buscar seu extrato.' : 'Sem banco conectado: use Ajustes → Importar extrato.'}</p>`}
    ${ONDAS}</section>
  <section class="card toque" data-ato="mes" aria-label="Gastos de ${nMes}"><h2><span>Gastei em ${nMes}</span><span class="seta">${ic('prox')}</span></h2>
    <p class="grande medio">${num(r.saidas)}</p>
    <div class="comp"><div><div class="linha"><span>${nMes}</span><span>${brlCurto(r.saidas)}</span></div><div class="barra"><i style="width:${Math.round((r.saidas / maxv) * 100)}%;--cor:var(--acento)"></i></div></div>
    <div><div class="linha"><span>${nAnt}</span><span>${brlCurto(ant.saidas)}</span></div><div class="barra antes"><i style="width:${Math.round((ant.saidas / maxv) * 100)}%;--cor:var(--lilas)"></i></div></div></div>
    <p class="dica">${frase}</p></section>
  ${top.length ? `<section class="card"><h2>Onde mais gastei</h2><div class="top3">${top.map(c => `<button class="cat toque" data-cat="${c.id}" style="${corCat(c.id)}">${selo(c.id)}<span class="t"><span class="linha"><b>${esc(cat(c.id).nome)}</b><b>${brlCurto(c.v)}</b></span><span class="barra"><i style="width:${Math.max(6, Math.round((c.v / maxc) * 100))}%"></i></span></span></button>`).join('')}</div></section>` : `<section class="card vazio"><b>Nada neste mês ainda</b><span class="fraco">Quando houver gastos, eles aparecem aqui.</span></section>`}`;
}
/** Detalhes (só ao tocar): contas e cartões / resumo completo do mês / lançamentos de uma categoria. */
function sheetContas() {
  const cartoes = est.contas.filter(c => c.tipo === 'CREDIT'), bancos = est.contas.filter(c => c.tipo !== 'CREDIT');
  abrirFolha(`<h2>Minhas contas</h2>${bancos.map(c => `<div class="card"><p class="fraco">${esc(c.nome)}</p><p class="grande medio">${num(c.saldo)}</p></div>`).join('')}
  ${cartoes.map(c => `<div class="card"><div class="lin"><div><b>${esc(c.nome)}${c.num ? ' ··' + esc(c.num) : ''}</b><b>${num(c.saldo)}</b></div>${c.limite ? `<div class="barra"><i style="width:${Math.min(100, Math.round((c.saldo / c.limite) * 100))}%"></i></div><div class="fraco linha"><span>Limite ${brl(c.limite)}${c.disp != null ? ' · disponível ' + brl(c.disp) : ''}</span><span>${c.venc ? 'vence ' + c.venc.split('-').reverse().slice(0, 2).join('/') : ''}</span></div>` : ''}</div></div>`).join('')}
  <p class="fraco">${quando()}</p><button class="botao suave largo" data-ato="fechar">Fechar</button>`);
}
function sheetMes() {
  const r = resumo(), total = r.porCat.reduce((s, c) => s + c.v, 0), orc = D.orcamento(est, mes), meta = D.progressoMeta(est, mes);
  let acc = 0; const circ = 2 * Math.PI * 54;
  const fatias = r.porCat.slice(0, 8).map((c, i) => { const f = total ? c.v / total : 0, x = `<circle cx="69" cy="69" r="54" stroke-dasharray="${Math.max(0, f * circ - 3)} ${circ}" stroke-dashoffset="${-acc * circ}" style="${corCat(c.id)};stroke:var(--cor);animation-delay:${i * 90}ms"/>`; acc += f; return x; }).join('');
  const meses6 = D.ultimosMeses(est, mes, 6), max = Math.max(1, ...meses6.map(m => m.saidas));
  abrirFolha(`<h2>${rotuloMes(mes).replace(/^./, c => c.toUpperCase())}</h2>
  <div class="trio"><div><small>Recebi</small><b class="pos">${num(r.entradas, 'curto')}</b></div><div><small>Gastei</small><b>${num(r.saidas, 'curto')}</b></div><div><small>Sobrou</small><b class="${r.saldo < 0 ? 'neg' : 'pos'}">${num(r.saldo, 'curto')}</b></div></div>
  ${total ? `<div class="card"><h2>Para onde foi</h2><div class="rosca"><svg viewBox="0 0 138 138" aria-hidden="true"><circle cx="69" cy="69" r="54" stroke="var(--sup3)" style="animation:none"/>${fatias}</svg><ul class="leg">${r.porCat.slice(0, 6).map(c => `<li style="${corCat(c.id)}"><i></i><span>${esc(cat(c.id).nome)}</span><b>${brlCurto(c.v)}</b></li>`).join('')}</ul></div></div>` : ''}
  <div class="card"><h2>Mês a mês · gastos</h2><div class="meses">${meses6.map((m, i) => `<div class="${m.mes === mes ? 'atual' : ''}"><i style="height:${Math.round((m.saidas / max) * 84)}px;animation-delay:${i * 70}ms"></i>${rotuloMes(m.mes).slice(0, 3)}</div>`).join('')}</div></div>
  ${orc.length ? `<div class="card"><h2>Limites do mês</h2>${orc.map(o => `<div class="lin" style="${corCat(o.id)}"><div><span>${esc(cat(o.id).nome)}</span><span><b>${brlCurto(o.gasto)}</b> <span class="fraco">de ${brlCurto(o.lim)}</span></span></div><div class="barra ${o.pct > 100 ? 'estourou' : ''}"><i style="width:${Math.min(100, o.pct)}%"></i></div></div>`).join('')}</div>` : ''}
  ${est.meta > 0 ? `<div class="card"><h2>Meta de economia</h2><div class="lin"><div><span>Guardar ${brlCurto(meta.meta)} por mês</span><b>${meta.pct}%</b></div><div class="barra"><i style="width:${Math.min(100, meta.pct)}%"></i></div></div></div>` : ''}
  <button class="botao suave largo" data-ato="fechar">Fechar</button>`);
}
function sheetCat(id) {
  const ls = est.lancs.filter(l => l.data.startsWith(mes) && l.cat === id && D.ehGasto(l)).sort((a, b) => a.valor - b.valor).slice(0, 12);
  abrirFolha(`<h2>${esc(cat(id).nome)}</h2><p class="mudo">${rotuloMes(mes)} · os maiores gastos</p><div>${ls.map(l => `<div class="tx"><span style="${corCat(l.cat)}">${selo(l.cat)}</span><span class="t"><b>${esc(l.desc)}</b><small>${rotuloDia(l.data)}</small></span><span class="v">${brl(l.valor)}</span></div>`).join('')}</div><button class="botao suave largo" data-ato="fechar">Fechar</button>`);
}
const resumo = () => D.resumoMes(est, mes);

function extrato() {
  const q = normalizar(filtro.q);
  const ls = est.lancs.filter(l => l.data.startsWith(mes) && (filtro.tipo === 'todos' || (filtro.tipo === 'gastos' ? l.valor < 0 : l.valor > 0)) && (filtro.conta === 'todas' || l.conta === filtro.conta) && (!q || normalizar(l.desc + ' ' + cat(l.cat).nome).includes(q)));
  // com busca, olha todos os meses
  const lista = q ? est.lancs.filter(l => normalizar(l.desc + ' ' + cat(l.cat).nome).includes(q)).slice(0, 200) : ls;
  const grupos = []; for (const l of lista) { const g = grupos[grupos.length - 1]; if (g && g[0] === l.data) g[1].push(l); else grupos.push([l.data, [l]]); }
  const total = lista.reduce((s, l) => s + (D.ehGasto(l) ? l.valor : 0), 0);
  return `<div class="topo"><h1>Extrato</h1>${q ? '' : seletorMes()}</div>
  <label class="busca">${ic('busca')}<input id="q" type="search" placeholder="Buscar em todos os meses" value="${esc(filtro.q)}" autocomplete="off" aria-label="Buscar"></label>
  <div class="chips">${[['todos', 'Tudo'], ['gastos', 'Gastos'], ['entradas', 'Entradas']].map(([id, n]) => `<button class="chip ${filtro.tipo === id ? 'on' : ''}" data-tipo="${id}">${n}</button>`).join('')}${est.contas.length > 1 ? est.contas.map(c => `<button class="chip ${filtro.conta === c.id ? 'on' : ''}" data-conta="${esc(filtro.conta === c.id ? 'todas' : c.id)}">${esc(c.nome)}</button>`).join('') : ''}</div>
  ${lista.length ? `<p class="fraco">${lista.length} lançamento${lista.length === 1 ? '' : 's'} · gastos ${brl(-total)}</p>` : `<section class="card vazio"><b>${q ? 'Nada encontrado' : 'Sem lançamentos'}</b><span class="fraco">${q ? 'Tente outra palavra.' : est.cred ? 'Atualize em Início ou importe um extrato em Ajustes.' : 'Importe um extrato em Ajustes.'}</span></section>`}
  ${grupos.map(([dia, ls2]) => `<div><p class="dia">${rotuloDia(dia)}</p>${ls2.map(l => `<button class="tx" data-tx="${esc(l.id)}"><span style="${corCat(l.cat)}">${selo(l.cat)}</span><span class="t"><b>${esc(l.desc)}</b><small>${esc(cat(l.cat).nome)}${l.pend ? ' · pendente' : ''}${cNome(l.conta)}</small></span><span class="v ${l.valor > 0 ? 'pos' : ''}">${brl(l.valor)}</span></button>`).join('')}</div>`).join('')}`;
}
const cNome = id => { const c = est.contas.find(x => x.id === id); return c && est.contas.length > 1 ? ' · ' + esc(c.nome) : ''; };

function planejar() {
  const cats = CATS.filter(c => !c.neutra && c.id !== 'renda');
  const faturas = est.faturas.filter(f => f.venc >= hojeISO()).sort((a, b) => a.venc.localeCompare(b.venc)).slice(0, 3);
  return `<div class="topo"><h1>Planejar</h1></div>
  <section class="card"><h2>Meta de economia por mês</h2><div class="campo"><label for="meta">Quanto quero guardar (R$)</label><input id="meta" inputmode="decimal" placeholder="Ex.: 500" value="${est.meta ? (est.meta / 100).toFixed(2).replace('.', ',') : ''}"></div><p class="fraco">Acompanho no Início: entradas menos gastos do mês.</p></section>
  <section class="card"><h2>Limite de gasto por categoria</h2>${cats.map(c => `<div class="limite" style="${corCat(c.id)}">${selo(c.id)}<span>${esc(c.nome)}</span><input data-orc="${c.id}" inputmode="decimal" placeholder="sem limite" aria-label="Limite de ${esc(c.nome)}" value="${est.orc[c.id] ? (est.orc[c.id] / 100).toFixed(2).replace('.', ',') : ''}"></div>`).join('')}</section>
  ${faturas.length ? `<section class="card"><h2>Próximas faturas</h2>${faturas.map(f => `<div class="lin"><div><span>Vence ${f.venc.split('-').reverse().join('/')}</span><b>${brl(f.total)}</b></div></div>`).join('')}</section>` : ''}`;
}

function ajustes() {
  const d = D.diasConsent(est);
  return `<div class="topo"><h1>Ajustes</h1></div>
  <section class="card"><h2>Conexão com o Nubank</h2><div class="lista">
    <div><span class="t"><b>${est.cred ? 'Conectado (Meu Pluggy)' : 'Não conectado'}</b><small>${quando()}${d != null ? ` · autorização até ${est.consent.split('-').reverse().join('/')}` : ''}</small></span></div>
    ${est.cred ? `<button data-ato="sync">${ic('att')}<span class="t"><b>Atualizar agora</b><small>O Meu Pluggy renova os dados a cada 24 h</small></span></button>` : ''}
    <button data-ato="chaves">${ic('engr')}<span class="t"><b>${est.cred ? 'Trocar chaves / código da conexão' : 'Conectar o Nubank'}</b></span></button>
    <button data-ato="renovar">${ic('alerta')}<span class="t"><b>Renovar autorização (1 vez por ano)</b><small>Passo a passo</small></span></button>
  </div></section>
  <section class="card"><h2>Importar extrato</h2><p class="mudo">Plano B: no app do Nubank, exporte o extrato (OFX ou CSV) e escolha o arquivo aqui.</p><label class="botao suave largo" for="arq">Escolher arquivo OFX ou CSV</label><input id="arq" type="file" accept=".ofx,.csv,.txt,text/csv,application/x-ofx" hidden></section>
  <section class="card"><h2>Segurança</h2><div class="lista"><button data-ato="pin">${ic('alvo')}<span class="t"><b>Trocar PIN</b></span></button><button data-ato="bio">${ic('bio')}<span class="t"><b>Biometria</b><small>Abrir com a digital ou o rosto</small></span></button></div></section>
  <section class="card"><h2>Meus dados</h2><div class="lista"><button data-ato="exportar">${ic('lista')}<span class="t"><b>Exportar meus dados</b><small>Gera um arquivo para você guardar (sem as chaves)</small></span></button><button data-ato="apagar" class="neg">${ic('apagar')}<span class="t"><b>Apagar tudo</b><small>Remove dados, chaves e PIN deste celular</small></span></button></div></section>
  <section class="card"><h2>Privacidade</h2><p class="mudo">Seus dados e suas chaves ficam só neste celular, cifrados. O app fala apenas com a Pluggy (api.pluggy.ai). Não há servidor, conta, análise de uso nem relatório de erros. Quem fez o app não vê nada seu.</p></section>`;
}

// ---------- conexão ----------
function conectar() {
  app.onclick = clique; app.oninput = null;
  app.innerHTML = `<section class="entrada"><img class="selo" src="icons/icone.svg" alt=""><div class="passos"><i class="on"></i><i class="on"></i><i></i></div><div><h1>Conectar o Nubank</h1><p>Cole as chaves do seu Meu Pluggy. Elas ficam só neste celular. O guia explica onde achar cada uma.</p></div>
  <form id="fcon" autocomplete="off"><div class="campo"><label for="cid">Client ID</label><input id="cid" required autocapitalize="off" spellcheck="false" autocomplete="off"></div>
  <div class="campo"><label for="csec">Client Secret</label><input id="csec" type="password" required autocapitalize="off" spellcheck="false" autocomplete="off"></div>
  <div class="campo"><label for="cit">Código da conexão (Item ID)</label><input id="cit" required autocapitalize="off" spellcheck="false" autocomplete="off"></div>
  <p class="fraco" id="msg" role="status"></p><button class="botao primario largo" id="bcon" type="submit">Testar e conectar</button>
  <button class="botao suave largo" type="button" data-ato="sem">Só importar arquivos por enquanto</button></form></section>`;
  $('#fcon').onsubmit = async e => {
    e.preventDefault();
    const cred = { id: $('#cid').value.trim(), secret: $('#csec').value.trim(), itemId: $('#cit').value.trim() };
    $('#bcon').disabled = true; $('#msg').textContent = 'Testando…';
    pluggy.esquecerChave();
    try {
      await pluggy.sincronizar(cred, { desde: shiftDias(hojeISO(), -1) });
      est.cred = cred; est.sync = { ts: null, erro: null }; await salvar(); render(); sincronizar(false);
    } catch (er) { $('#msg').textContent = er instanceof pluggy.ErroPluggy ? er.message : 'Não consegui conectar.'; $('#bcon').disabled = false; }
  };
}

// ---------- eventos ----------
async function clique(e) {
  const t = e.target;
  const a = t.closest('[data-aba]'); if (a) { const dx = ABAS.indexOf(a.dataset.aba) - ABAS.indexOf(aba); aba = a.dataset.aba; anim = true; app.style.setProperty('--dx', (dx > 0 ? 28 : dx < 0 ? -28 : 0) + 'px'); return render(); }
  const m = t.closest('[data-mes]'); if (m) { mes = somaMes(mes, +m.dataset.mes); anim = true; app.style.setProperty('--dx', (+m.dataset.mes * 22) + 'px'); return render(); }
  const tp = t.closest('[data-tipo]'); if (tp) { filtro.tipo = tp.dataset.tipo; return render(); }
  const cn = t.closest('[data-conta]'); if (cn) { filtro.conta = cn.dataset.conta; return render(); }
  const pk = t.closest('[data-pick]'); if (pk && editando) { editando.cat = pk.dataset.pick; folha.querySelectorAll('[data-pick]').forEach(b => b.classList.toggle('on', b === pk)); return; }
  const tx = t.closest('[data-tx]'); if (tx) return editarTx(tx.dataset.tx);
  const ct = t.closest('[data-cat]'); if (ct) return sheetCat(ct.dataset.cat);
  const at = t.closest('[data-ato]')?.dataset.ato; if (!at) return;
  if (at === 'contas') return sheetContas();
  if (at === 'mes') return sheetMes();
  if (at === 'fatura-info') return abrirFolha(`<h2>Fatura do cartão</h2><p class="mudo">As faturas detalhadas não vieram do Open Finance desta vez. O saldo do cartão e as compras aparecem normalmente.</p><button class="botao primario largo" data-ato="fechar">Entendi</button>`);
  if (at === 'sync') return sincronizar(true);
  if (at === 'sem') { est.semConexao = true; await salvar(); return render(); }
  if (at === 'chaves') { est.semConexao = false; const c = est.cred; est.cred = null; render(); if (c) { $('#cid').value = c.id; $('#cit').value = c.itemId; } return; }
  if (at === 'renovar') return abrirFolha(`<h2>Renovar a autorização</h2><p class="mudo">A autorização do Nubank no Meu Pluggy dura 1 ano. Para renovar:</p><ol class="mudo" style="padding-left:20px;display:grid;gap:6px"><li>Entre em <b>dashboard.pluggy.ai</b> com o mesmo e-mail do Meu Pluggy.</li><li>Applications → seu app → Demo → <b>Connect Account</b> → escolha <b>MeuPluggy</b> e entre.</li><li>Se o código da conexão (Item ID) mudou, copie o novo e cole em Ajustes → Trocar chaves.</li></ol><button class="botao primario largo" data-ato="fechar">Entendi</button>`);
  if (at === 'fechar') return fecharFolha();
  if (at === 'exportar') { await cofre.exportarArquivo(`mare-meus-dados-${hojeISO()}.json`, D.exportarTudo(est)); return aviso('Arquivo gerado'); }
  if (at === 'apagar') return abrirFolha(`<h2>Apagar tudo?</h2><p class="mudo">Remove do celular os dados, as chaves e o PIN. Não dá para desfazer. A autorização no Meu Pluggy e no Nubank continua: para revogar, use o app do Nubank.</p><button class="botao perigo largo" data-ato="apagar2">Apagar tudo agora</button><button class="botao suave largo" data-ato="fechar">Cancelar</button>`);
  if (at === 'apagar2') { await cofre.apagarTudo(); fecharFolha(); est = D.novoEstado(); return criarPin(); }
  if (at === 'pin') return trocarPinFolha();
  if (at === 'bio') return alternarBio();
  if (at === 'salvar-tx') return salvarTx();
}
async function entrada(e) {
  const t = e.target;
  if (t.id === 'q') { filtro.q = t.value; const pos = t.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); }
  else if (t.id === 'meta') { est.meta = Number.isFinite(parseValor(t.value)) ? parseValor(t.value) : 0; await salvar(); }
  else if (t.dataset.orc) { const v = parseValor(t.value); if (Number.isFinite(v) && v > 0) est.orc[t.dataset.orc] = v; else delete est.orc[t.dataset.orc]; await salvar(); }
  else if (t.id === 'arq') {
    const f = t.files[0]; if (!f) return;
    try {
      const r = parseArquivo(f.name, await f.text()), n = D.aplicarImport(est, r.itens);
      await salvar(); aviso(`${n} lançamento${n === 1 ? '' : 's'} importado${n === 1 ? '' : 's'} (${r.formato})${r.itens.length - n ? `, ${r.itens.length - n} já existiam` : ''}`); aba = 'extrato'; render();
    } catch (er) { aviso(er.message || 'Não consegui ler o arquivo'); }
  }
}
let editando = null;
function editarTx(id) {
  const l = est.lancs.find(x => x.id === id); if (!l) return; editando = { id, cat: l.cat };
  abrirFolha(`<h2>${esc(l.desc)}</h2><p class="mudo">${rotuloDia(l.data)} · <b class="${l.valor > 0 ? 'pos' : ''}">${brl(l.valor)}</b></p><div class="grade">${CATS.map(c => `<button data-pick="${c.id}" class="${c.id === l.cat ? 'on' : ''}" style="${corCat(c.id)}">${selo(c.id)}${esc(c.nome)}</button>`).join('')}</div><label class="check"><input type="checkbox" id="aprende" checked>Usar essa categoria nos próximos iguais</label><button class="botao primario largo" data-ato="salvar-tx">Salvar</button>`);
}
async function salvarTx() {
  if (!editando) return;
  const n = D.mudarCategoria(est, editando.id, editando.cat, $('#aprende')?.checked !== false);
  await salvar(); editando = null; fecharFolha(); render(); aviso(n ? `Categoria salva e aplicada em mais ${n}` : 'Categoria salva');
}
function trocarPinFolha() {
  abrirFolha(`<h2>Trocar PIN</h2><div class="campo"><label for="p1">PIN atual</label><input id="p1" type="password" inputmode="numeric" maxlength="6"></div><div class="campo"><label for="p2">Novo PIN (6 números)</label><input id="p2" type="password" inputmode="numeric" maxlength="6"></div><p class="fraco" id="pm" role="status"></p><button class="botao primario largo" id="pok">Trocar</button>`);
  $('#pok').onclick = async () => {
    const [a, b] = [$('#p1').value, $('#p2').value];
    if (!/^\d{6}$/.test(b)) return void ($('#pm').textContent = 'O novo PIN precisa ter 6 números.');
    if (await cofre.trocarPin(a, b)) { fecharFolha(); aviso('PIN trocado'); } else $('#pm').textContent = 'PIN atual incorreto.';
  };
}
async function alternarBio() {
  if (!(await cofre.biometriaDisponivel())) return aviso('Biometria indisponível neste aparelho');
  if (await cofre.temBiometria()) { await cofre.desligarBiometria(); return aviso('Biometria desligada'); }
  abrirFolha(`<h2>Ligar biometria</h2><p class="mudo">Digite seu PIN uma vez para confirmar.</p><div class="campo"><input id="p1" type="password" inputmode="numeric" maxlength="6" aria-label="PIN"></div><p class="fraco" id="pm"></p><button class="botao primario largo" id="pok">Ligar</button>`);
  $('#pok').onclick = async () => { if (await cofre.ligarBiometria($('#p1').value)) { fecharFolha(); aviso('Biometria ligada'); } else $('#pm').textContent = 'PIN incorreto.'; };
}

// ---------- início ----------
(async () => {
  const t = localStorage.getItem('mare_tema') || 'auto';
  document.documentElement.dataset.tema = t === 'escuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'escuro' : 'claro';
  if (await cofre.existe()) pedirPin(); else boasVindas();
})();
