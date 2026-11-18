// Importadores puros: OFX, CSV (Nubank conta/cartão, BB, genérico) e recibo de e-mail (Uber/iFood).
// Saída comum: [{ data:'YYYY-MM-DD', valor: centavos COM sinal (negativo = saída), desc, ext }]
import { parseValor, hojeISO } from './logic.js';

const p2 = n => String(n).padStart(2, '0');
export function parseData(s) {
  s = String(s).trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return `${m[3]}-${p2(m[2])}-${p2(m[1])}`;
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`; // OFX: 20261105120000[-3:BRT]
  return null;
}

export function parseOFX(texto) {
  const campo = (bloco, nome) => (bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i')) || [])[1]?.trim() ?? '';
  const itens = [];
  for (const bloco of texto.split(/<STMTTRN>/i).slice(1)) {
    const data = parseData(campo(bloco, 'DTPOSTED')), valor = parseValor(campo(bloco, 'TRNAMT'));
    if (!data || !Number.isFinite(valor) || valor === 0) continue;
    itens.push({ data, valor, desc: campo(bloco, 'MEMO') || campo(bloco, 'NAME'), ext: campo(bloco, 'FITID') || null });
  }
  return itens;
}

/** CSV com aspas e separador , ou ; -> matriz de strings. */
export function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primeira = texto.split(/\r?\n/, 1)[0];
  const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';' : ',';
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some(x => x.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some(x => x.trim())) linhas.push(linha);
  return linhas;
}

const sem = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
/**
 * Acha as colunas pelo cabeçalho. Conhecidos:
 *  Nubank conta:  Data,Valor,Identificador,Descrição        (negativo = saída)
 *  Nubank cartão: date,title,amount  (ou date,category,title,amount)  (positivo = compra)
 *  BB:            "Data","Lançamento","Detalhes","N° documento","Valor","Tipo Lançamento"  (ou Histórico/Dependencia Origem)
 */
export function parseCSV(texto) {
  const linhas = lerCSV(texto);
  const iCab = linhas.findIndex(l => l.some(c => /^(data|date)\b/.test(sem(c))) && l.some(c => /^(valor|amount)/.test(sem(c))));
  if (iCab < 0) throw new Error('Não achei as colunas de data e valor no CSV.');
  const cab = linhas[iCab].map(sem);
  const col = (...nomes) => cab.findIndex(c => nomes.some(n => c === n || c.startsWith(n)));
  const cData = col('data', 'date'), cValor = col('valor', 'amount');
  const cDesc = col('descricao', 'title', 'historico', 'lancamento', 'description', 'estabelecimento');
  const cDet = col('detalhes'), cId = col('identificador', 'id', 'n° documento', 'numero do documento', 'documento');
  const cTipo = col('tipo lancamento', 'tipo');
  const cartao = cab.includes('title') && cab.includes('amount'); // fatura Nubank: compra vem positiva
  const itens = [];
  for (const l of linhas.slice(iCab + 1)) {
    const data = parseData(l[cData] || ''); let valor = parseValor(l[cValor] || '');
    if (!data || !Number.isFinite(valor) || valor === 0) continue;
    if (cartao) valor = -valor;
    if (cTipo >= 0 && /saida|debito/.test(sem(l[cTipo] || '')) && valor > 0) valor = -valor;
    const desc = [l[cDesc], cDet >= 0 ? l[cDet] : ''].filter(x => x && x.trim()).join(' · ').replace(/\s+/g, ' ').trim();
    if (/^saldo\b|^s a l d o/i.test(desc)) continue; // linhas de saldo do BB não são movimento
    itens.push({ data, valor, desc, ext: cId >= 0 && l[cId]?.trim() ? l[cId].trim() : null });
  }
  return itens;
}

// ---------- recibo de e-mail ----------
function decodificarEml(bruto) {
  // Junta as partes text/plain e text/html já decodificadas (quoted-printable ou base64).
  const partes = bruto.split(/\r?\n--[^\r\n]+/).map(p => {
    const [cab, ...resto] = p.split(/\r?\n\r?\n/);
    let corpo = resto.join('\n\n');
    if (!/content-type:\s*text\//i.test(cab)) return /content-type:/i.test(cab) ? '' : p;
    if (/content-transfer-encoding:\s*base64/i.test(cab)) {
      try { corpo = new TextDecoder().decode(Uint8Array.from(atob(corpo.replace(/\s+/g, '')), c => c.charCodeAt(0))); } catch { /* parte ilegível: segue com o texto cru */ }
    } else if (/content-transfer-encoding:\s*quoted-printable/i.test(cab)) {
      const bytes = corpo.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      corpo = new TextDecoder().decode(Uint8Array.from(bytes, c => c.charCodeAt(0) & 255));
    }
    return corpo;
  });
  return partes.join('\n');
}
const MESES = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
/** Texto colado ou .eml de recibo -> { origem, valor (centavos, positivo), data, desc } ou null. */
export function parseRecibo(bruto, hoje = hojeISO()) {
  const cabData = (bruto.match(/^Date:\s*(.+)$/mi) || [])[1];
  const eEml = /^(From|Received|MIME-Version|Content-Type):/mi.test(bruto);
  const texto = (eEml ? decodificarEml(bruto) : bruto).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/[ \t ]+/g, ' ');
  const tudo = (bruto.slice(0, 3000) + texto).toLowerCase();
  const origem = /ifood/.test(tudo) ? 'ifood' : /uber/.test(tudo) ? 'uber' : /\b99\s?(app|pop|taxi)|99app/.test(tudo) ? '99' : /rappi/.test(tudo) ? 'rappi' : /z[eé] delivery/.test(tudo) ? 'ze-delivery' : null;
  const valores = [...texto.matchAll(/total[^\n\dR$]{0,40}R\$\s*([\d.]*\d,\d{2})/gi)].map(m => parseValor(m[1]));
  const todos = [...texto.matchAll(/R\$\s*([\d.]*\d,\d{2})/g)].map(m => parseValor(m[1]));
  const valor = valores.length ? Math.max(...valores) : todos.length ? Math.max(...todos) : NaN;
  if (!Number.isFinite(valor) || valor <= 0) return null;
  let data = null, m;
  if (cabData && !Number.isNaN(Date.parse(cabData))) data = hojeISO(new Date(cabData));
  else if ((m = texto.match(/(\d{1,2}) de ([a-zç]{3})[a-zç]* de (\d{4})/i)) && MESES[sem(m[2])]) data = `${m[3]}-${p2(MESES[sem(m[2])])}-${p2(m[1])}`;
  else if ((m = texto.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/))) data = parseData(m[1]);
  const loja = origem === 'ifood' ? (texto.match(/pedido (?:em|no|na|de)\s+([^\n.!,]{3,40})/i) || [])[1] : null;
  const nomes = { uber: 'Uber', ifood: 'iFood', '99': '99', rappi: 'Rappi', 'ze-delivery': 'Zé Delivery' };
  return { origem, valor, data: data || hoje, desc: [nomes[origem] || 'Recibo', loja?.trim()].filter(Boolean).join(' · ') };
}

/** Escolhe o parser pelo nome/conteúdo do arquivo. */
export function parseArquivo(nome, texto) {
  if (/\.ofx$/i.test(nome) || /<OFX>|<STMTTRN>/i.test(texto)) return { formato: 'OFX', itens: parseOFX(texto) };
  if (/\.(eml|txt)$/i.test(nome) && !/^[^\n]*[;,][^\n]*(valor|amount)/im.test(texto.slice(0, 500))) {
    const r = parseRecibo(texto);
    return { formato: 'Recibo', itens: r ? [{ data: r.data, valor: -r.valor, desc: r.desc, ext: null, origem: r.origem }] : [] };
  }
  return { formato: 'CSV', itens: parseCSV(texto) };
}
