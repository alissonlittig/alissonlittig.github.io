/* Porta fiel de onboard.py (validate, build) para JavaScript; os modelos de contrato/e-mail vêm do próprio Python (injetados). "Hoje" fixo = 2026-11-13. */
(function () {
  var TODAY = '2026-11-13', PLANS = {"basic": ["Basic", 8, "8 horas mensais de suporte e 1 relatório mensal"], "pro": ["Pro", 20, "20 horas mensais de suporte, 1 relatório mensal e 1 reunião de acompanhamento"], "enterprise": ["Enterprise", 40, "40 horas mensais de suporte, relatório semanal e reuniões quinzenais"]}, CONTRACT = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS Nº {num}\n\nCONTRATANTE: {company}, representada por {contact} ({email}), cidade: {city}.\nCONTRATADA: Estúdio Exemplo Ltda. (empresa fictícia de demonstração).\n\n1. OBJETO. Plano {plan}: {scope}.\n2. VALOR. R$ {value} por mês, pagos todo dia 10.\n3. INÍCIO E PRAZO. Início em {start}, por 12 meses, renovável por acordo escrito.\n4. RESCISÃO. Qualquer parte pode rescindir com 30 dias de aviso por escrito.\n\nEste texto é um MODELO de demonstração e não substitui revisão jurídica.\n", EMAIL = "Assunto: Boas-vindas, {company}!\n\nOlá, {first},\n\nFoi um prazer fechar o plano {plan} com a {company}. Deixei o contrato em anexo para sua leitura e assinatura; nosso início está marcado para {start}.\n\nPara começarmos, precisamos de: logo em alta resolução, acessos ao sistema atual e um contato técnico.\n\nQualquer dúvida, é só responder esta mensagem.\n\nUm abraço\n", CHECK = ["Revisar o contrato e anexar ao e-mail", "Enviar o e-mail (rascunho abaixo: um humano envia)", "Receber logo, acessos e contato técnico", "Cadastrar o cliente na cobrança do dia 10", "Agendar a reunião de início"];
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k]; }); }
  function slugify(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function cents(s) { s = s.trim(); if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('valor'); var p = s.split('.'); return parseInt(p[0], 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10); }
  function brl(c) { return String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + ('0' + (c % 100)).slice(-2); }
  function validDate(s) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s); if (!m) return false; var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]; }
  function validate(f) {
    var err = []; ['company', 'contact', 'email', 'city'].forEach(function (k) { if (!(f[k] || '').trim()) err.push(k + ': obrigatório'); });
    if ((f.email || '').trim() && !/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(f.email.trim())) err.push('email: formato inválido');
    if (!PLANS[f.plan]) err.push('plan: use basic, pro ou enterprise');
    try { if (cents(f.value || '') <= 0) err.push('value: deve ser maior que zero'); } catch (e) { err.push('value: use número com ponto, ex. 1500.00'); }
    if (!validDate(f.start || '')) err.push('start: use AAAA-MM-DD'); else if (f.start < TODAY) err.push('start: data já passou');
    return err;
  }
  function S(o) { return JSON.stringify(o); }
  window.DEMO = {
    start: 'start', resetMemory: true,
    init: function () { return { r: null }; },
    verify: function (expect, ctx) { return S(ctx.r) === S(expect); },
    nodes: {
      start: function (i, ctx) { ctx.f = i.body; ctx.r = null; return { out: { company: ctx.f.company, plan: ctx.f.plan }, ms: 5 }; },
      validate: function (i, ctx) { var e = validate(ctx.f); if (e.length) { ctx.r = { ok: false, errors: e }; return { out: { errors: e }, branch: 'invalid', ms: 2 }; } return { out: { errors: [] }, branch: 'ok', ms: 2 }; },
      folder: function (i, ctx) { ctx.slug = slugify(ctx.f.company.trim()); ctx.folders = ['01_contrato', '02_documentos', '03_entregas'].map(function (d) { return 'clientes/' + ctx.slug + '/' + d; }); return { out: { slug: ctx.slug, folders: ctx.folders }, ms: 6 }; },
      contract: function (i, ctx) {
        var f = ctx.f, p = PLANS[f.plan], d = f.start.split('-'), contact = f.contact.trim();
        ctx.v = { num: TODAY.slice(0, 4) + '-001', company: f.company.trim(), contact: contact, email: f.email.trim(), city: f.city.trim(), plan: p[0], scope: p[2], value: brl(cents(f.value)), start: d[2] + '/' + d[1] + '/' + d[0], first: contact.split(/\s+/)[0] };
        ctx.contractText = fill(CONTRACT, ctx.v); return { out: { contract_chars: ctx.contractText.length, number: ctx.v.num }, ms: 4 };
      },
      email: function (i, ctx) { ctx.emailText = fill(EMAIL, ctx.v); ctx.r = { ok: true, slug: ctx.slug, folders: ctx.folders, contract: ctx.contractText, email: ctx.emailText, checklist: CHECK }; return { out: { draft: true, sent: false }, ms: 3, end: true }; },
      reject: function (i, ctx) { return { out: { rejected: true }, ms: 1, end: true }; }
    },
    outputs: function (r) {
      if (r.failed) return [{ kind: 'error', title: { pt: 'Execução falhou', en: 'Execution failed' }, text: r.failed.message }];
      var x = r.ctx.r;
      if (!x.ok) return [{ kind: 'error', title: { pt: 'Formulário recusado: nada foi criado', en: 'Form rejected: nothing was created' }, text: x.errors.join('\n') }];
      return [{ kind: 'card', title: { pt: 'Pasta do cliente', en: 'Client folder' }, rows: [[{ pt: 'Cliente', en: 'Client' }, r.ctx.v.company], [{ pt: 'Pastas', en: 'Folders' }, x.folders.join(' · ')], [{ pt: 'Checklist', en: 'Checklist' }, x.checklist.length + ' itens', 'b-ok']] },
        { kind: 'email', title: { pt: 'Contrato preenchido (contrato.txt)', en: 'Filled contract (contrato.txt)' }, to: r.ctx.v.email, subject: 'Contrato nº ' + r.ctx.v.num, text: x.contract },
        { kind: 'email', title: { pt: 'Rascunho de e-mail (arquivo local, NÃO enviado)', en: 'E-mail draft (local file, NOT sent)' }, to: r.ctx.v.email, subject: x.email.split('\n')[0].replace('Assunto: ', ''), text: x.email.split('\n').slice(2).join('\n') }];
    }
  };
})();
