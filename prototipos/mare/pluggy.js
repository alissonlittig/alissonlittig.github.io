// DEMONSTRAÇÃO: no lugar da API da Pluggy, gera dados FALSOS (nenhuma rede, nenhuma chave).
import { hojeISO, somaMes } from './logic.js';
export class ErroPluggy extends Error {}
export const esquecerChave = () => {};
export const janelaInicial = (hoje = hojeISO()) => somaMes(hoje.slice(0, 7), -12) + hoje.slice(7);

// [dia, descrição, valor em reais (− gasto, + entrada), conta]
const MODELO = [
  [2, 'Supermercado Condor', -186.4, 'b'], [3, 'Uber *TRIP', -23.9, 'b'], [4, 'Netflix.com', -39.9, 'c'], [4, 'Spotify', -21.9, 'c'],
  [5, 'Salário Estúdio Aurora', 3850, 'b'], [6, 'Aluguel', -1250, 'b'], [7, 'Padaria Pão Doce', -18.5, 'b'], [8, 'Salão Bella Hair', -95, 'c'],
  [9, 'Farmácia Panvel', -64.2, 'c'], [10, 'iFood *Pedido', -58.9, 'c'], [11, 'Supermercado Condor', -142.1, 'b'], [12, 'Zara Shopping (1/3)', -73.3, 'c'],
  [13, 'Cinema Cinemark', -46, 'c'], [14, 'Energia Copel', -118.7, 'b'], [15, 'Uber *TRIP', -31.2, 'b'], [16, 'Starbucks Café', -28.5, 'c'],
  [17, 'Pix enviado Mãe', -120, 'b'], [18, 'Pgto fatura Nubank', -1100, 'b'], [19, 'Supermercado Condor', -203.3, 'b'], [20, 'Natura Cosméticos', -87, 'c'],
  [21, 'Restaurante Sabor & Arte', -96, 'c'], [22, 'Curso Alura', -79.9, 'c'], [23, 'Internet Vivo Fibra', -99.9, 'b'], [24, 'Aplicação RDB', -300, 'b'],
  [25, 'Livraria Cultura', -54.9, 'c'], [26, 'Posto Ipiranga', -160, 'b'], [27, 'Mercado Zaffari', -121.8, 'b'], [28, 'iFood *Pedido', -42.5, 'c'],
];
const FATOR = [1.16, 0.97, 1.05, 1.22, 1.08, 1];
const p2 = n => String(n).padStart(2, '0');

export async function sincronizar() {
  await new Promise(r => setTimeout(r, 900));
  const hoje = new Date(), mesAtual = hojeISO(hoje).slice(0, 7), lancs = [];
  FATOR.forEach((f, i) => {
    const mes = somaMes(mesAtual, i - 5);
    MODELO.forEach(([dia, desc, v, c], k) => {
      const data = `${mes}-${p2(dia)}`;
      if (data > hojeISO(hoje)) return;
      const fixo = v > 0 || /Aluguel|fatura|RDB|Energia|Internet|Netflix|Spotify/.test(desc), cents = Math.round(v * (fixo ? 1 : f * (0.9 + ((k * 7 + i * 3) % 5) / 20)) * 100);
      lancs.push({ id: `demo-${i}-${k}`, conta: c === 'b' ? 'demo-banco' : 'demo-cartao', data, desc, valor: cents, pCat: '', pend: false, fonte: 'pluggy' });
    });
  });
  const venc = new Date(hoje.getTime() + 9 * 864e5), consent = new Date(hoje.getTime() + 24 * 864e5);
  return {
    contas: [
      { id: 'demo-banco', tipo: 'BANK', nome: 'Conta Nubank', num: '4410', saldo: 284735, limite: null, disp: null, venc: null, fecha: null },
      { id: 'demo-cartao', tipo: 'CREDIT', nome: 'Cartão Nubank', num: '4821', saldo: 123640, limite: 600000, disp: 476360, venc: hojeISO(venc), fecha: null },
    ],
    lancs, faturas: [{ id: 'f1', conta: 'demo-cartao', venc: hojeISO(venc), total: 123640, minimo: null }], faturasOk: true, consent: hojeISO(consent), status: 'UPDATED',
  };
}
