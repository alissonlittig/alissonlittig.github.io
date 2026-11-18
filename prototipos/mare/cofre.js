// DEMONSTRAÇÃO: cofre de mentira, só em memória. Qualquer PIN de 6 números serve. Nada é gravado no aparelho.
import * as D from './dados.js';
import * as pluggy from './pluggy.js';
const q = new URLSearchParams(location.search);
if (q.get('tema')) localStorage.setItem('mare_tema', q.get('tema'));
const pular = q.has('pular'); // entra direto, sem boas-vindas nem PIN (para quem só quer ver)
let aberto = false, db = null, criado = pular;
export const destravado = () => aberto;
export const existe = async () => criado;
export const trava = () => { aberto = false; };
export const criar = async () => { criado = true; aberto = true; };
export const destravarPin = async () => { aberto = true; return 'ok'; };
export const trocarPin = async () => true;
export const biometriaDisponivel = async () => false;
export const ligarBiometria = async () => false;
export const desligarBiometria = async () => {};
export const temBiometria = async () => pular;
export const destravarBiometria = async () => { aberto = true; return true; };
export const salvarDados = async obj => { db = obj; };
export async function lerDados() {
  if (db) return db;
  const e = D.novoEstado(); e.cred = { id: 'demo', secret: 'demo', itemId: 'demo' };
  D.aplicarSync(e, await pluggy.sincronizar(), '2000-01-01');
  e.meta = 50000; e.orc = { comida: 40000, compras: 30000 };
  return (db = e);
}
export const apagarTudo = async () => { aberto = false; db = null; criado = false; };
export const exportarArquivo = async (nome, texto) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' })); a.download = nome; a.click(); };
