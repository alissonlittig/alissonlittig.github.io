// Categorias automáticas: 1) regra que ela ensinou 2) palavras da descrição 3) categoria da Pluggy 4) Outros.
import { normalizar } from './logic.js';

// neutra: true = não entra em "gastei"/"recebi" (pagamento de fatura, investimento: só mudam de lugar)
export const CATS = [
  { id: 'mercado', nome: 'Mercado', h: 145, ic: 'cesta' },
  { id: 'comida', nome: 'Restaurantes', h: 55, ic: 'garfo' },
  { id: 'transporte', nome: 'Transporte', h: 230, ic: 'carro' },
  { id: 'moradia', nome: 'Moradia e contas', h: 285, ic: 'casa' },
  { id: 'saude', nome: 'Saúde', h: 15, ic: 'cruz' },
  { id: 'beleza', nome: 'Beleza e cuidados', h: 345, ic: 'brilho' },
  { id: 'compras', nome: 'Compras', h: 320, ic: 'sacola' },
  { id: 'assinaturas', nome: 'Assinaturas', h: 265, ic: 'play' },
  { id: 'lazer', nome: 'Lazer', h: 85, ic: 'estrela' },
  { id: 'educacao', nome: 'Educação', h: 200, ic: 'livro' },
  { id: 'viagem', nome: 'Viagem', h: 180, ic: 'aviao' },
  { id: 'transf', nome: 'Pix e transferências', h: 250, ic: 'setas' },
  { id: 'renda', nome: 'Renda', h: 150, ic: 'moeda' },
  { id: 'fatura', nome: 'Pagamento de fatura', h: 260, ic: 'cartao', neutra: true },
  { id: 'invest', nome: 'Investimentos', h: 210, ic: 'graf', neutra: true },
  { id: 'outros', nome: 'Outros', h: 250, ic: 'ponto' },
];
export const cat = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];

const PALAVRAS = [
  ['fatura', /pagamento (de |da )?fatura|pagamento recebido|fatura (nubank|cartao)|pgto fatura/],
  ['invest', /\brdb\b|\bcdb\b|aplicacao|resgate|tesouro|investimento|caixinha|\bnuinvest\b|rendimento/],
  ['mercado', /mercado|supermerc|atacad|assai|carrefour|extra |sacolao|hortifruti|padaria|acougue|dia %|angeloni|condor|muffato|zaffari|pao de acucar/],
  ['comida', /ifood|rappi|restaurante|lanchonete|pizza|burger|mc ?donald|subway|cafe|cafeteria|sorvet|churras|hamburg|sushi|bar |bk |outback|starbucks|zedelivery|ze delivery/],
  ['transporte', /uber|99 ?(app|pop|taxi)|99pop|cabify|posto |combustivel|shell|ipiranga|estaciona|pedagio|sem parar|metro|onibus|bilhete unico|passagem|gasolina/],
  ['assinaturas', /netflix|spotify|disney|hbo|max\b|prime video|amazon prime|youtube|apple\.com|icloud|google (one|play)|deezer|globoplay|paramount|crunchyroll|chatgpt|openai|microsoft|canva|adobe/],
  ['saude', /farmacia|drogaria|droga|raia|pacheco|panvel|hospital|clinica|consulta|laborat|exame|dentista|odonto|unimed|plano de saude|psicolog/],
  ['beleza', /salao|cabelereir|barbear|estetica|manicure|boticario|natura|sephora|beleza|cosmet|perfum|unha/],
  ['moradia', /aluguel|condominio|energia|luz |copel|cemig|enel|agua|sanepar|internet|vivo|claro|tim |oi fibra|gas |iptu|seguro residencial|net |telefon/],
  ['educacao', /curso|faculdade|universidade|escola|udemy|alura|livraria|livro|mensalidade|ingles|idioma/],
  ['viagem', /hotel|airbnb|booking|latam|gol |azul |decolar|hostel|passagem aerea|cvc|aeroporto/],
  ['lazer', /cinema|ingresso|ticket|sympla|teatro|show |parque|jogo|steam|playstation|xbox|bar e |balada/],
  ['compras', /amazon|mercado ?livre|shopee|shein|aliexpress|magalu|magazine|americanas|renner|riachuelo|c&a|zara|centauro|netshoes|kabum|casas bahia/],
  ['renda', /salario|folha|pagamento de salario|proventos|13o|ferias|restituicao|reembolso/],
];
const PLUGGY = [
  [/credit card payment|pagamento de fatura/i, 'fatura'], [/invest|fixed income|variable income|saving/i, 'invest'],
  [/grocer|supermarket|mercado/i, 'mercado'], [/eating out|restaurant|food|delivery|bars?\b/i, 'comida'],
  [/transport|taxi|ride|gas station|parking|toll|fuel|public transport/i, 'transporte'], [/health|pharmac|doctor|dental|saude/i, 'saude'],
  [/beauty|personal care|cosmetic/i, 'beleza'], [/streaming|subscription|digital services/i, 'assinaturas'],
  [/entertainment|leisure|games|cinema|lazer/i, 'lazer'], [/education|school|course|book/i, 'educacao'],
  [/travel|hotel|airline|trip/i, 'viagem'], [/shopping|clothing|electronic|online shopping|compras/i, 'compras'],
  [/housing|rent|utilities|telecom|internet|electricity|water|moradia|insurance/i, 'moradia'],
  [/income|salary|wage|renda|proceeds/i, 'renda'], [/transfer|pix|ted\b|doc\b/i, 'transf'],
];
/** regras = { descNormalizada: catId } aprendidas das edições dela. */
export function categorizar({ desc, pCat, valor }, regras = {}) {
  const n = normalizar(desc), chave = chaveRegra(desc);
  if (regras[chave]) return regras[chave];
  for (const [id, re] of PALAVRAS) if (re.test(n + ' ')) return id === 'renda' && valor < 0 ? 'outros' : id;
  const p = PLUGGY.find(([re]) => re.test(pCat || ''));
  if (p) return p[1] === 'renda' && valor < 0 ? 'outros' : p[1];
  return valor > 0 && /pix|transf|ted|doc/.test(n) ? 'transf' : 'outros';
}
/** Chave estável da regra: descrição sem números (datas, parcelas, ids). */
export const chaveRegra = desc => normalizar(desc).replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
