/* Porta fiel de rag.py (tokens, sentences, index_from, bm25, answer) para JavaScript. Os 15 trechos abaixo foram extraídos DE VERDADE dos 3 PDFs fictícios pelo pypdf (output/index.json);
   a demo NÃO lê PDF no navegador. Busca e resposta usam o mesmo algoritmo do Python (BM25 + frase por peso de termo raro), conferido contra as saídas gravadas. Sem LLM e sem embeddings. */
(function () {
  var CHUNKS = [
 {
  "file": "guia_acesso_ti.pdf",
  "page": 1,
  "section": "",
  "text": "Guia de Acesso e Segurança de TI (Alfa Serviços, documento fictício)"
 },
 {
  "file": "guia_acesso_ti.pdf",
  "page": 1,
  "section": "1. Redefinir a senha",
  "text": "Para redefinir a senha, abra o portal de acesso e use a opção esqueci minha senha. O link de redefinição vale por 15 minutos. A nova senha precisa ter pelo menos 12 caracteres, com letras e números."
 },
 {
  "file": "guia_acesso_ti.pdf",
  "page": 1,
  "section": "2. Bloqueio de conta",
  "text": "A conta é bloqueada depois de 5 tentativas erradas seguidas. O desbloqueio é automático após 30 minutos ou imediato se o suporte de TI confirmar a identidade."
 },
 {
  "file": "guia_acesso_ti.pdf",
  "page": 2,
  "section": "3. Acesso por VPN",
  "text": "O acesso remoto à rede interna exige VPN e verificação em duas etapas pelo aplicativo autenticador. A VPN desconecta sozinha depois de 8 horas e precisa ser conectada de novo."
 },
 {
  "file": "guia_acesso_ti.pdf",
  "page": 2,
  "section": "4. Equipamento perdido",
  "text": "Notebook ou celular perdido deve ser comunicado ao suporte de TI no mesmo dia. O acesso do aparelho é revogado em até 1 hora depois do aviso."
 },
 {
  "file": "manual_atendimento.pdf",
  "page": 1,
  "section": "",
  "text": "Manual de Atendimento ao Cliente (Alfa Serviços, documento fictício)"
 },
 {
  "file": "manual_atendimento.pdf",
  "page": 1,
  "section": "1. Horário de atendimento",
  "text": "O atendimento por telefone e chat funciona de segunda a sexta, das 8h às 18h. Aos sábados o chat atende das 9h às 13h. Não há atendimento em domingos e feriados nacionais."
 },
 {
  "file": "manual_atendimento.pdf",
  "page": 1,
  "section": "2. Prazo de resposta",
  "text": "Todo chamado recebe a primeira resposta em até 4 horas úteis. Chamados marcados como urgentes, como sistema fora do ar, recebem resposta em até 1 hora."
 },
 {
  "file": "manual_atendimento.pdf",
  "page": 2,
  "section": "3. Cancelamento de contrato",
  "text": "O cliente pode cancelar o contrato a qualquer momento, com aviso de 30 dias. Não há multa para contratos com mais de 12 meses. Em contratos mais novos a multa é de 20% das mensalidades restantes."
 },
 {
  "file": "manual_atendimento.pdf",
  "page": 2,
  "section": "4. Escalonamento",
  "text": "Quando o atendente não resolve em 2 dias úteis, o chamado sobe para o coordenador do turno. Reclamações sobre cobrança vão direto para o time financeiro."
 },
 {
  "file": "politica_reembolso.pdf",
  "page": 1,
  "section": "",
  "text": "Política de Reembolso de Despesas (Alfa Serviços, documento fictício)"
 },
 {
  "file": "politica_reembolso.pdf",
  "page": 1,
  "section": "1. Quem pode pedir",
  "text": "Todo colaborador com contrato ativo pode pedir reembolso de despesas feitas a trabalho. Estagiários pedem pelo gestor da área. Despesas pessoais nunca são reembolsadas."
 },
 {
  "file": "politica_reembolso.pdf",
  "page": 1,
  "section": "2. Prazo para pedir",
  "text": "O pedido de reembolso deve ser feito em até 30 dias corridos após a data da despesa. Depois desse prazo o pedido é recusado, salvo aprovação por escrito da diretoria financeira."
 },
 {
  "file": "politica_reembolso.pdf",
  "page": 2,
  "section": "3. Limites por refeição",
  "text": "Em viagem a trabalho, o limite é de R$ 80 para almoço e R$ 120 para jantar. Bebida alcoólica não é reembolsada em nenhuma hipótese. Valores acima do limite ficam por conta do colaborador."
 },
 {
  "file": "politica_reembolso.pdf",
  "page": 2,
  "section": "4. Comprovantes",
  "text": "Todo pedido precisa de nota fiscal ou recibo legível com CNPJ, data e valor. Foto de cupom amassado ou ilegível é devolvida para correção. O pagamento sai em até 10 dias úteis depois da aprovação."
 }
];
  var K1 = 1.5, B = 0.75, COVERAGE_MIN = 0.5;
  var STOP = {}; 'a o as os um uma uns umas de do da dos das em no na nos nas por para com e ou que qual quais quando como se ao aos e sao ser tem ter pode posso preciso quero meu minha seu sua sobre mais ate quanto quantos quantas quanta onde ha foi vai fazer faco existe ser sua suas seus ja nao sim'.split(' ').forEach(function (w) { STOP[w] = 1; });
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function tokens(s) { var m = norm(s).match(/[a-z0-9]+/g) || [], out = []; m.forEach(function (t) { if (t.length < 2 || STOP[t]) return; out.push(t.length > 3 && t.charAt(t.length - 1) === 's' ? t.slice(0, -1) : t); }); return out; }
  function sentences(text) { return text.replace(/\s+/g, ' ').trim().split(/(?<=[a-zà-ú0-9][.!?])\s+/).filter(function (x) { return x; }); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function r4(x) { return Math.round(x * 1e4) / 1e4; }
  function buildIndex() {
    var df = {}, tot = 0, chunks = CHUNKS.map(function (c, i) { var o = { id: i, file: c.file, page: c.page, section: c.section, text: c.text, tokens: tokens(c.section + ' ' + c.text) }; uniq(o.tokens).forEach(function (t) { df[t] = (df[t] || 0) + 1; }); tot += o.tokens.length; return o; });
    return { chunks: chunks, df: df, avgdl: tot / Math.max(1, chunks.length) };
  }
  var IX = buildIndex();
  function bm25(q, c) {
    var N = IX.chunks.length, s = 0; uniq(q).forEach(function (t) { var tf = c.tokens.filter(function (x) { return x === t; }).length; if (tf) { var n = IX.df[t]; s += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * tf * (K1 + 1) / (tf + K1 * (1 - B + B * c.tokens.length / IX.avgdl)); } });
    return s;
  }
  function idf(t) { var n = IX.df[t], N = IX.chunks.length; return n === undefined ? 0 : Math.log(1 + (N - n + 0.5) / (n + 0.5)); }
  function inter(a, b) { var s = uniq(a); return s.filter(function (x) { return b.indexOf(x) >= 0; }); }
  function search(q, k) { return IX.chunks.map(function (c) { return { s: r4(bm25(q, c)), c: c }; }).sort(function (a, b) { return b.s - a.s || a.c.id - b.c.id; }).slice(0, k); }
  function pick(q, chunk) {
    var ss = sentences(chunk.text), sc = ss.map(function (x) { return r4(inter(q, tokens(x)).reduce(function (s, t) { return s + idf(t); }, 0)); }), rank = ss.map(function (_, i) { return i; }).sort(function (a, b) { return sc[b] - sc[a] || a - b; });
    var p = [rank[0]]; if (rank.length > 1 && sc[rank[1]] > 0 && sc[rank[1]] >= 0.5 * sc[rank[0]]) p.push(rank[1]);
    return p.sort(function (a, b) { return a - b; }).map(function (i) { return ss[i]; }).join(' ');
  }
  window.DEMO = {
    start: 'start',
    init: function () { return {}; },
    verify: function (e, ctx) { var r = ctx.res; return !!r && JSON.stringify([r.status, r.answer, r.terms, r.unmatched, r.coverage, r.sources]) === JSON.stringify([e.status, e.answer, e.terms, e.unmatched, e.coverage, e.sources]); },
    nodes: {
      start: function (i, ctx) { ctx.q = String(i.body.pergunta || ''); ctx.res = null; return { out: { pergunta: ctx.q, trechos_indexados: IX.chunks.length, pdfs: uniq(IX.chunks.map(function (c) { return c.file; })) }, ms: 4 }; },
      tokenize: function (i, ctx) {
        var q = tokens(ctx.q); ctx.t = q; var un = uniq(q).filter(function (t) { return IX.df[t] === undefined; }).sort();
        ctx.res = { status: 'refused', answer: null, terms: q, unmatched: un, coverage: 0, sources: [], reason: null };
        if (!q.length) { ctx.res.reason = 'a pergunta só tem palavras comuns; reescreva com o assunto'; return { out: { termos: q, motivo: ctx.res.reason }, branch: 'empty', ms: 1 }; }
        return { out: { termos: q, sem_correspondencia_nos_pdfs: un }, branch: 'ok', ms: 1 };
      },
      retrieve: function (i, ctx) {
        var h = search(ctx.t, 3); ctx.hits = h; var top = h[0]; ctx.res.coverage = Math.round(inter(ctx.t, top.c.tokens).length / uniq(ctx.t).length * 100) / 100;
        return { out: { top3: h.map(function (x) { return { arquivo: x.c.file, pagina: x.c.page, secao: x.c.section || '(abertura)', score_bm25: x.s }; }), cobertura_da_pergunta_no_melhor_trecho: ctx.res.coverage }, ms: 3 };
      },
      gate: function (i, ctx) { var top = ctx.hits[0], ok = top.s > 0 && ctx.res.coverage >= COVERAGE_MIN; if (!ok) ctx.res.reason = 'não encontrei isso nos documentos (cobertura da pergunta abaixo de 50%)'; return { out: { score: top.s, cobertura: ctx.res.coverage, minimo: COVERAGE_MIN }, branch: ok ? 'answer' : 'refuse', ms: 1 }; },
      extract: function (i, ctx) {
        var r = ctx.res; r.answer = pick(ctx.t, ctx.hits[0].c); r.status = r.unmatched.length ? 'partial' : 'answered';
        r.sources = ctx.hits.filter(function (x) { return x.s > 0; }).map(function (x) { return { file: x.c.file, page: x.c.page, section: x.c.section, score: x.s }; });
        return { out: { frase: r.answer, status: r.status, fontes: r.sources.length }, ms: 2, end: true };
      },
      refuse: function (i, ctx) { return { out: { status: 'refused', motivo: ctx.res.reason }, ms: 1, end: true }; }
    },
    outputs: function (r) {
      var c = r.ctx, x = c.res, o = [];
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      if (x.status === 'refused') o.push({ kind: 'error', title: { pt: 'Sem resposta: não está nos documentos', en: 'No answer: not in the documents' }, text: x.reason + '. O sistema prefere dizer isso a inventar.' });
      else {
        o.push({ kind: 'card', title: { pt: x.status === 'partial' ? 'Resposta PARCIAL' : 'Resposta (frase do documento)', en: x.status === 'partial' ? 'PARTIAL answer' : 'Answer (sentence from the document)' }, rows: [[{ pt: 'Frase', en: 'Sentence' }, x.answer], [{ pt: 'Fonte', en: 'Source' }, x.sources[0].file + ', p.' + x.sources[0].page + (x.sources[0].section ? ', ' + x.sources[0].section : '')]] });
        if (x.status === 'partial') o.push({ kind: 'error', title: { pt: 'Atenção: parte da pergunta não existe nos PDFs', en: 'Careful: part of the question is not in the PDFs' }, text: x.unmatched.join(', ') + ' (a resposta acima cobre só o resto da pergunta)' });
        o.push({ kind: 'sheet', title: { pt: 'Trechos usados (BM25)', en: 'Passages used (BM25)' }, cols: ['Arquivo', 'Pág.', 'Seção', 'Score'], rows: x.sources.map(function (s) { return [s.file, s.page, s.section || '(abertura)', s.score]; }) });
      }
      return o;
    }
  };
})();
