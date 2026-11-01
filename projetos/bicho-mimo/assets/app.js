(function () {
  'use strict';
  var D = window.BM, EN = document.documentElement.lang.indexOf('en') === 0, L = EN ? 1 : 0;
  var T = EN ? {
    brl: 'en-US', dias: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], closed: 'Closed', open: 'Open now', shut: 'Closed now', until: 'until',
    s1: '1. Who is coming', esp: 'Species', cao: 'Dog', gato: 'Cat', raca: 'Breed', pet: 'Pet name', petph: 'Ex.: Thor',
    s2: '2. Service', tosa: 'Grooming', nenhuma: 'Bath only', hig: 'Hygienic trim', comp: 'Full trim', hid: 'Moisturizing treatment', leva: 'Pick-up and drop-off',
    bairro: 'Neighborhood', s3: '3. Day and time', livre: 'No free slots on this day.', s4: '4. Your name', tutor: 'Owner name', tutorph: 'Ex.: Maria',
    gerar: 'Generate request', resumo: 'Your booking', pbanho: 'Bath', ptosa: 'Trim', phid: 'Moisturizing', pleva: 'Pick-up', total: 'Total', quando: 'When', quem: 'Pet',
    falta: 'Fill in: ', msgh: 'Request text (demo, nothing is sent)', copiar: 'Copy text', copiado: 'Copied', dur: 'About ', hmin: ' h', porte: 'size ', escolha: 'Choose a breed',
    saudacao: 'Hi, I would like to book a bath.', lPet: 'Pet', lServ: 'Service', lQuando: 'When', lTotal: 'Estimated total', lTutor: 'Owner', demo: 'Demo: the final price is confirmed at the shop.',
    nada: 'Nothing selected yet', ptsfix: 'size', semleva: 'We do not serve this neighborhood yet.',
    vNome: 'Pet name', vNasc: 'Birth date', vSalvar: 'Save pet', vVacina: 'Vaccine or treatment', vData: 'Date applied', vAdd: 'Add dose', vProx: 'Next dose', vVazio: 'No doses yet. Add the first one above.',
    vOk: 'Up to date', vPerto: 'Due in ', vAtraso: 'Late by ', vd: ' days', vRm: 'Remove', vIcs: 'Download reminders (.ics)', vImp: 'Print card', vLimpar: 'Delete this card',
    vTit: 'Vaccine card', vNoPet: 'Save your pet first.', vLocal: 'Stored only in this browser. Clearing site data erases it.', vUlt: 'Last dose ', vConf: 'Delete the card from this browser?',
    carrinho: 'Order', vazio: 'Your order is empty.', add: 'Add', mais: 'More', menos: 'Less', fechar: 'Close', pedir: 'Copy order text', retirada: 'Pick up at the shop', entrega: 'Delivery (R$ 12)',
    itens: 'items', nenhum: 'No products for this filter.', pedHi: 'Hi, I would like to order:', tEnt: 'Delivery', fatia: 'Subtotal',
    avulso: 'Single visits', noPlano: 'On the plan', eco: 'You save', mes: '/month', ok: 'Sent (demo): nothing left your browser.',
    fn: 'Name', fok: 'Thanks. This is a demo, so nothing was sent.', ferr: 'Please fill in your name and a message.', taxa: 'Fee ', gratis: 'Fee R$ ',
    hdist: 'Pick-up and drop-off fee: '
  } : {
    brl: 'pt-BR', dias: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], closed: 'Fechado', open: 'Aberto agora', shut: 'Fechado agora', until: 'até',
    s1: '1. Quem vem', esp: 'Espécie', cao: 'Cão', gato: 'Gato', raca: 'Raça', pet: 'Nome do pet', petph: 'Ex.: Thor',
    s2: '2. Serviço', tosa: 'Tosa', nenhuma: 'Só banho', hig: 'Tosa higiênica', comp: 'Tosa completa', hid: 'Hidratação do pelo', leva: 'Leva-e-traz',
    bairro: 'Bairro', s3: '3. Dia e hora', livre: 'Sem horário livre neste dia.', s4: '4. Seu nome', tutor: 'Nome do tutor', tutorph: 'Ex.: Maria',
    gerar: 'Gerar pedido', resumo: 'Seu agendamento', pbanho: 'Banho', ptosa: 'Tosa', phid: 'Hidratação', pleva: 'Leva-e-traz', total: 'Total', quando: 'Quando', quem: 'Pet',
    falta: 'Falta: ', msgh: 'Texto do pedido (demonstração, nada é enviado)', copiar: 'Copiar texto', copiado: 'Copiado', dur: 'Cerca de ', hmin: ' h', porte: 'porte ', escolha: 'Escolha uma raça',
    saudacao: 'Oi, quero marcar um banho.', lPet: 'Pet', lServ: 'Serviço', lQuando: 'Quando', lTotal: 'Total estimado', lTutor: 'Tutor', demo: 'Demonstração: o valor final é confirmado na loja.',
    nada: 'Nada escolhido ainda', ptsfix: 'porte', semleva: 'Ainda não atendemos esse bairro.',
    vNome: 'Nome do pet', vNasc: 'Nascimento', vSalvar: 'Salvar pet', vVacina: 'Vacina ou tratamento', vData: 'Data da aplicação', vAdd: 'Registrar dose', vProx: 'Próxima dose', vVazio: 'Nenhuma dose registrada. Adicione a primeira acima.',
    vOk: 'Em dia', vPerto: 'Vence em ', vAtraso: 'Atrasada há ', vd: ' dias', vRm: 'Remover', vIcs: 'Baixar lembretes (.ics)', vImp: 'Imprimir carteirinha', vLimpar: 'Apagar esta carteirinha',
    vTit: 'Carteirinha de vacinas', vNoPet: 'Salve primeiro o seu pet.', vLocal: 'Guardado só neste navegador. Limpar os dados do site apaga tudo.', vUlt: 'Última dose ', vConf: 'Apagar a carteirinha deste navegador?',
    carrinho: 'Pedido', vazio: 'Seu pedido está vazio.', add: 'Adicionar', mais: 'Mais', menos: 'Menos', fechar: 'Fechar', pedir: 'Copiar texto do pedido', retirada: 'Retirar na loja', entrega: 'Entrega (R$ 12)',
    itens: 'itens', nenhum: 'Nenhum produto neste filtro.', pedHi: 'Oi, quero pedir:', tEnt: 'Entrega', fatia: 'Subtotal',
    avulso: 'Avulso', noPlano: 'No plano', eco: 'Você economiza', mes: '/mês', ok: 'Enviado (demo): nada saiu do seu navegador.',
    fn: 'Nome', fok: 'Obrigado. Isto é uma demonstração, nada foi enviado.', ferr: 'Preencha seu nome e a mensagem.', taxa: 'Taxa ', gratis: 'Taxa R$ ',
    hdist: 'Taxa de leva-e-traz: '
  };
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (v) { return new Intl.NumberFormat(T.brl, { style: 'currency', currency: 'BRL' }).format(v).replace(/ /g, ' '); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
  var toast = function (m) { var t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 2400); };
  var copy = function (txt) { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(T.copiado); }, function () { var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast(T.copiado); } catch (e) {} a.remove(); }); };
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var fmtDate = function (s) { var p = s.split('-'); return EN ? p[1] + '/' + p[2] + '/' + p[0] : p[2] + '/' + p[1] + '/' + p[0]; };
  var radio = function (name, val, label, checked, extra) { return '<label class="opt"><input type="radio" name="' + name + '" value="' + esc(val) + '"' + (checked ? ' checked' : '') + (extra || '') + '><span>' + label + '</span></label>'; };

  /* ---- menu, calmo, reveal ---- */
  var b = $('.burger'), nav = $('#nav');
  if (b) {
    var shut = function () { nav.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', EN ? 'Open menu' : 'Abrir menu'); };
    b.addEventListener('click', function () { var o = nav.classList.toggle('open'); b.setAttribute('aria-expanded', o); b.setAttribute('aria-label', o ? (EN ? 'Close menu' : 'Fechar menu') : (EN ? 'Open menu' : 'Abrir menu')); if (o) $('a', nav).focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { shut(); b.focus(); } });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', shut); });
  }
  var cb = $('.calmo-b');
  if (store.get('bm_calmo')) document.documentElement.setAttribute('data-calmo', '');
  if (cb) { var up = function () { var on = document.documentElement.hasAttribute('data-calmo'); cb.setAttribute('aria-pressed', on); }; up(); cb.addEventListener('click', function () { var h = document.documentElement; if (h.hasAttribute('data-calmo')) { h.removeAttribute('data-calmo'); store.del('bm_calmo'); } else { h.setAttribute('data-calmo', ''); store.set('bm_calmo', 1); } up(); }); }
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 }); $$('.reveal').forEach(function (n) { io.observe(n); }); } else $$('.reveal').forEach(function (n) { n.classList.add('in'); });

  /* ---- aberto agora ---- */
  var HOR = { 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [8, 14], 0: null };
  $$('[data-aberto]').forEach(function (el) {
    var n = new Date(), h = HOR[n.getDay()], hh = n.getHours() + n.getMinutes() / 60, on = h && hh >= h[0] && hh < h[1];
    el.className = 'aberto' + (on ? ' on' : ''); el.innerHTML = '<i></i><span>' + (on ? T.open + ' ' + T.until + ' ' + h[1] + ':00' : T.shut) + '</span>';
  });

  /* ---- preco ---- */
  var raca = function (id) { for (var i = 0; i < D.racas.length; i++) if (D.racas[i][0] === id) return D.racas[i]; return null; };
  var precoBanho = function (r) { var p = D.banho[r[2]]; return p + (D.pelo[r[3]] || 0); };

  /* ---- agendador ---- */
  var ag = $('#agenda');
  if (ag) {
    var st = { esp: 'cao', raca: 'srd-p', tosa: 'nenhuma', hid: false, leva: false, bairro: 0, dia: '', hora: '', pet: '', tutor: '' };
    var hoje = new Date(), dias = [];
    for (var i = 0; dias.length < 10; i++) { var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i); if (d.getDay() !== 0) dias.push(d); }
    var horas = function (d) { var h = HOR[d.getDay()], o = []; for (var x = h[0]; x < h[1] - 1; x++) o.push(x); return o; };
    var ocupado = function (dia, h) { var s = dia + h, n = 7; for (var k = 0; k < s.length; k++) n = (n * 31 + s.charCodeAt(k)) % 997; return n % 100 < 38; };
    var passou = function (d, h) { var n = new Date(); return d.toDateString() === n.toDateString() && h <= n.getHours(); };
    st.dia = iso(dias[0]);
    var render = function () {
      var rs = D.racas.filter(function (r) { return r[1] === st.esp; });
      if (!raca(st.raca) || raca(st.raca)[1] !== st.esp) st.raca = rs[0][0];
      var dobj = dias.filter(function (d) { return iso(d) === st.dia; })[0] || dias[0];
      var hs = horas(dobj), algum = false;
      var slots = hs.map(function (h) { var x = ocupado(st.dia, h) || passou(dobj, h); if (!x) algum = true; return radio('hora', h, ('0' + h).slice(-2) + ':00', st.hora == h, x ? ' disabled' : ''); }).join('');
      var rc = raca(st.raca), isg = st.esp === 'gato';
      ag.innerHTML = '<div class="app"><form class="card" id="f-ag" novalidate>' +
        '<fieldset><legend>' + T.s1 + '</legend><div class="opts" role="radiogroup" aria-label="' + T.esp + '">' + radio('esp', 'cao', T.cao, st.esp === 'cao') + radio('esp', 'gato', T.gato, st.esp === 'gato') + '</div></fieldset>' +
        '<div class="grid2"><div><label class="f" for="raca">' + T.raca + '</label><select id="raca">' + rs.map(function (r) { return '<option value="' + r[0] + '"' + (r[0] === st.raca ? ' selected' : '') + '>' + esc(r[4 + L]) + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="f" for="pet">' + T.pet + '</label><input type="text" id="pet" maxlength="30" placeholder="' + T.petph + '" value="' + esc(st.pet) + '" autocomplete="off"></div></div><p></p>' +
        '<fieldset><legend>' + T.s2 + '</legend><div class="opts" role="radiogroup" aria-label="' + T.tosa + '">' + [['nenhuma', T.nenhuma], ['higienica', T.hig], ['completa', T.comp]].map(function (o) { return radio('tosa', o[0], o[1], st.tosa === o[0]); }).join('') + '</div><div class="opts" style="margin-top:.7rem"><label class="opt"><input type="checkbox" id="hid"' + (st.hid ? ' checked' : '') + '><span>' + T.hid + ' (+' + money(D.hidrata) + ')</span></label><label class="opt"><input type="checkbox" id="leva"' + (st.leva ? ' checked' : '') + '><span>' + T.leva + '</span></label></div>' +
        (st.leva ? '<div style="margin-top:.8rem"><label class="f" for="bairro">' + T.bairro + '</label><select id="bairro">' + D.bairros.map(function (x, i) { return '<option value="' + i + '"' + (i === +st.bairro ? ' selected' : '') + (x[2] === null ? ' disabled' : '') + '>' + esc(x[1 + L]) + (x[2] === null ? ' (' + T.semleva + ')' : ' (+' + money(x[2]) + ')') + '</option>'; }).join('') + '</select></div>' : '') + '</fieldset>' +
        '<fieldset><legend>' + T.s3 + '</legend><div class="dias" role="radiogroup" aria-label="' + T.s3 + '">' + dias.map(function (d) { var v = iso(d); return '<label class="opt"><input type="radio" name="dia" value="' + v + '"' + (v === st.dia ? ' checked' : '') + '><span><small>' + T.dias[d.getDay()] + '</small><b>' + d.getDate() + '</b></span></label>'; }).join('') + '</div>' +
        '<div class="slots" role="radiogroup" aria-label="' + T.s3 + '">' + slots + '</div>' + (algum ? '' : '<p class="bad">' + T.livre + '</p>') + '</fieldset>' +
        '<fieldset><legend>' + T.s4 + '</legend><label class="f" for="tutor">' + T.tutor + '</label><input type="text" id="tutor" maxlength="40" placeholder="' + T.tutorph + '" value="' + esc(st.tutor) + '" autocomplete="off"></fieldset>' +
        '<button class="btn" type="submit" id="gerar">' + T.gerar + '</button><p class="hint" style="margin-top:.8rem">' + T.demo + '</p></form>' +
        '<aside class="card sum" aria-live="polite" id="sum"></aside></div><div id="saida"></div>';
      resumo();
    };
    var calc = function () {
      var r = raca(st.raca), pb = precoBanho(r), k = r[2], pt = st.tosa === 'higienica' ? D.higienica[k] : st.tosa === 'completa' ? D.completa[k] : 0, ph = st.hid ? D.hidrata : 0, pl = st.leva ? (D.bairros[st.bairro][2] || 0) : 0;
      return { r: r, pb: pb, pt: pt, ph: ph, pl: pl, t: pb + pt + ph + pl, min: 60 + (st.tosa === 'completa' ? 60 : st.tosa === 'higienica' ? 20 : 0) + (st.hid ? 20 : 0) };
    };
    var quando = function () { return st.hora === '' ? '' : fmtDate(st.dia) + ', ' + ('0' + st.hora).slice(-2) + ':00'; };
    var resumo = function () {
      var c = calc(), s = $('#sum');
      s.innerHTML = '<h3>' + T.resumo + '</h3><dl><div><dt>' + T.quem + '</dt><dd>' + esc(st.pet || '—') + ', ' + esc(c.r[4 + L]) + (c.r[2] === 'gato' ? '' : ' (' + T.porte + (EN ? { P: 'S', M: 'M', G: 'L', GG: 'XL' }[c.r[2]] : c.r[2]) + ')') + '</dd></div>' +
        '<div><dt>' + T.pbanho + '</dt><dd>' + money(c.pb) + '</dd></div>' + (c.pt ? '<div><dt>' + T.ptosa + '</dt><dd>' + money(c.pt) + '</dd></div>' : '') + (c.ph ? '<div><dt>' + T.phid + '</dt><dd>' + money(c.ph) + '</dd></div>' : '') + (c.pl ? '<div><dt>' + T.pleva + '</dt><dd>' + money(c.pl) + '</dd></div>' : '') +
        '<div><dt>' + T.quando + '</dt><dd>' + (quando() || '—') + '</dd></div></dl><div class="total"><span>' + T.total + '</span><span>' + money(c.t) + '</span></div><p class="hint">' + T.dur + (c.min / 60).toFixed(1).replace('.', EN ? '.' : ',') + T.hmin + '</p>';
    };
    ag.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'esp') st.esp = t.value; else if (t.id === 'raca') st.raca = t.value; else if (t.name === 'tosa') st.tosa = t.value; else if (t.id === 'hid') st.hid = t.checked; else if (t.id === 'leva') st.leva = t.checked; else if (t.id === 'bairro') st.bairro = +t.value; else if (t.name === 'dia') { st.dia = t.value; st.hora = ''; } else if (t.name === 'hora') st.hora = +t.value; else return;
      var f = document.activeElement && document.activeElement.id, nm = t.name, v = t.value; render();
      var n = f ? document.getElementById(f) : $('input[name="' + nm + '"][value="' + v + '"]', ag); if (n) n.focus({ preventScroll: true });
    });
    ag.addEventListener('input', function (e) { if (e.target.id === 'pet') { st.pet = e.target.value; resumo(); } if (e.target.id === 'tutor') st.tutor = e.target.value; });
    ag.addEventListener('submit', function (e) {
      e.preventDefault(); var falta = []; if (!st.pet.trim()) falta.push(T.pet); if (st.hora === '') falta.push(T.s3.slice(3)); if (!st.tutor.trim()) falta.push(T.tutor);
      var out = $('#saida');
      if (falta.length) { out.innerHTML = '<p class="bad" role="alert" style="margin-top:1rem">' + T.falta + falta.join(', ') + '.</p>'; return; }
      var c = calc(), serv = [T.pbanho].concat(c.pt ? [st.tosa === 'higienica' ? T.hig : T.comp] : [], c.ph ? [T.hid] : [], st.leva ? [T.leva + ' (' + D.bairros[st.bairro][1 + L] + ')'] : []).join(' + ');
      var msg = T.saudacao + '\n' + T.lPet + ': ' + st.pet.trim() + ' (' + c.r[4 + L] + ')\n' + T.lServ + ': ' + serv + '\n' + T.lQuando + ': ' + quando() + '\n' + T.lTotal + ': ' + money(c.t) + '\n' + T.lTutor + ': ' + st.tutor.trim();
      out.innerHTML = '<div class="card" style="margin-top:1.6rem"><h3>' + T.msgh + '</h3><div class="msg" id="msgtxt">' + esc(msg) + '</div><button class="btn sm" type="button" id="cp">' + T.copiar + '</button></div>';
      $('#cp').addEventListener('click', function () { copy(msg); }); out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    render();
  }

  /* ---- carteirinha ---- */
  var cv = $('#carteira');
  if (cv) {
    var K = 'bm_pet', pet = store.get(K), dateOnly = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
    var vac = function (id) { for (var i = 0; i < D.vacinas.length; i++) if (D.vacinas[i][0] === id) return D.vacinas[i]; };
    var proxima = function (dose) { var v = vac(dose.v), d = dateOnly(dose.d); d.setDate(d.getDate() + v[1]); return d; };
    var diff = function (d) { var n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((d - n) / 864e5); };
    var tdy = iso(new Date());
    var rCart = function () {
      if (!pet) {
        cv.innerHTML = '<form class="card" id="f-pet" novalidate style="max-width:640px"><h3>' + T.vSalvar + '</h3><p class="hint">' + T.vLocal + '</p><fieldset class="opts" role="radiogroup" aria-label="' + T.esp + '">' + radio('esp', 'cao', T.cao, true) + radio('esp', 'gato', T.gato, false) + '</fieldset><div class="grid2"><div><label class="f" for="pn">' + T.vNome + '</label><input type="text" id="pn" maxlength="30" required autocomplete="off"></div><div><label class="f" for="pb">' + T.vNasc + '</label><input type="date" id="pb" max="' + tdy + '"></div></div><p></p><button class="btn" type="submit">' + T.vSalvar + '</button><p class="bad" id="pe" role="alert"></p></form>';
        return;
      }
      var vs = D.vacinas.filter(function (v) { return v[2] === 'ambos' || v[2] === pet.esp; });
      var doses = pet.doses.map(function (x, i) { return { x: x, i: i, p: proxima(x) }; }).sort(function (a, b) { return a.p - b.p; });
      cv.innerHTML = '<div class="app"><div class="pass" id="cartao"><div class="pass-h"><div class="av" aria-hidden="true"><svg viewBox="0 0 48 48"><g fill="#0A3A45"><ellipse cx="24" cy="32" rx="10" ry="8"/><ellipse cx="10" cy="22" rx="4.5" ry="6"/><ellipse cx="38" cy="22" rx="4.5" ry="6"/><ellipse cx="18" cy="12" rx="4.5" ry="6"/><ellipse cx="30" cy="12" rx="4.5" ry="6"/></g></svg></div><div><p class="hint" style="margin:0">' + T.vTit + ' · ' + (pet.esp === 'gato' ? T.gato : T.cao) + '</p><h3>' + esc(pet.nome) + '</h3>' + (pet.nasc ? '<p class="hint" style="margin:0">' + T.vNasc + ': ' + fmtDate(pet.nasc) + '</p>' : '') + '</div></div>' +
        (doses.length ? '<ul class="vac">' + doses.map(function (o) { var n = diff(o.p), cl = n < 0 ? 'atraso' : n <= 30 ? 'perto' : 'em', tx = n < 0 ? T.vAtraso + (-n) + T.vd : n <= 30 ? T.vPerto + n + T.vd : T.vOk; return '<li><strong>' + esc(vac(o.x.v)[3 + L]) + '</strong><span class="st ' + cl + '">' + tx + '</span><small>' + T.vUlt + fmtDate(o.x.d) + ' · ' + T.vProx + ': ' + fmtDate(iso(o.p)) + ' <button type="button" class="rm no-print" data-rm="' + o.i + '">' + T.vRm + '</button></small></li>'; }).join('') + '</ul>' : '<div class="empty">' + T.vVazio + '</div>') + '</div>' +
        '<div class="no-print"><form class="card" id="f-dose" novalidate><h3>' + T.vAdd + '</h3><div style="margin:.8rem 0"><label class="f" for="vv">' + T.vVacina + '</label><select id="vv">' + vs.map(function (v) { return '<option value="' + v[0] + '">' + esc(v[3 + L]) + '</option>'; }).join('') + '</select></div><div style="margin-bottom:1rem"><label class="f" for="vd">' + T.vData + '</label><input type="date" id="vd" max="' + tdy + '" value="' + tdy + '"></div><button class="btn" type="submit">' + T.vAdd + '</button></form>' +
        '<div class="opts" style="margin-top:1rem"><button class="btn alt sm" type="button" id="ics"' + (doses.length ? '' : ' disabled') + '>' + T.vIcs + '</button><button class="btn alt sm" type="button" onclick="window.print()">' + T.vImp + '</button><button class="btn alt sm" type="button" id="limpar">' + T.vLimpar + '</button></div><p class="hint" style="margin-top:.8rem">' + T.vLocal + '</p></div></div>';
    };
    cv.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.id === 'f-pet') { var n = $('#pn').value.trim(); if (!n) { $('#pe').textContent = T.vNome + '?'; return; } pet = { nome: n, esp: $('input[name=esp]:checked', cv).value, nasc: $('#pb').value, doses: [] }; store.set(K, pet); rCart(); }
      else { var d = $('#vd').value; if (!d) return; pet.doses.push({ v: $('#vv').value, d: d }); store.set(K, pet); rCart(); }
    });
    cv.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.rm) { pet.doses.splice(+t.dataset.rm, 1); store.set(K, pet); rCart(); }
      if (t.id === 'limpar' && confirm(T.vConf)) { store.del(K); pet = null; rCart(); }
      if (t.id === 'ics') {
        var ev = pet.doses.map(function (x, i) { var p = proxima(x), a = iso(p).replace(/-/g, ''), q = new Date(p); q.setDate(q.getDate() + 1); return 'BEGIN:VEVENT\r\nUID:bm' + i + a + '@bicho-mimo.demo\r\nDTSTAMP:20260101T000000Z\r\nDTSTART;VALUE=DATE:' + a + '\r\nDTEND;VALUE=DATE:' + iso(q).replace(/-/g, '') + '\r\nSUMMARY:' + vac(x.v)[3 + L] + ' - ' + pet.nome + '\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-P7D\r\nDESCRIPTION:' + vac(x.v)[3 + L] + '\r\nEND:VALARM\r\nEND:VEVENT'; }).join('\r\n');
        var blob = new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Bicho Mimo//demo//PT\r\n' + ev + '\r\nEND:VCALENDAR'], { type: 'text/calendar' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'carteirinha-' + pet.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics'; document.body.appendChild(a); a.click(); a.remove();
      }
    });
    rCart();
  }

  /* ---- loja ---- */
  var lj = $('#loja');
  if (lj) {
    var KC = 'bm_cart', cart = store.get(KC) || {}, f = { esp: '', tipo: '', fase: '' }, ent = false;
    var tipos = { racao: EN ? 'Food' : 'Ração', petisco: EN ? 'Treats' : 'Petiscos', higiene: EN ? 'Hygiene' : 'Higiene', brinquedo: EN ? 'Toys' : 'Brinquedos', acessorio: EN ? 'Accessories' : 'Acessórios' };
    var fases = { filhote: EN ? 'Puppy/kitten' : 'Filhote', adulto: EN ? 'Adult' : 'Adulto', senior: EN ? 'Senior' : 'Sênior', todas: EN ? 'All ages' : 'Todas as idades' };
    var icons = { racao: '<path d="M18 14h28l5 12v24a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V26z" fill="#fff" stroke="#0A3A45" stroke-width="3" stroke-linejoin="round"/><path d="M13 26h38" stroke="#0A3A45" stroke-width="3"/><circle cx="32" cy="41" r="6" fill="#CC3B28"/>', petisco: '<rect x="8" y="24" width="48" height="16" rx="8" transform="rotate(-20 32 32)" fill="#fff" stroke="#0A3A45" stroke-width="3"/><circle cx="20" cy="40" r="2" fill="#0A3A45"/><circle cx="34" cy="34" r="2" fill="#0A3A45"/>', higiene: '<rect x="22" y="22" width="20" height="34" rx="5" fill="#fff" stroke="#0A3A45" stroke-width="3"/><rect x="27" y="10" width="10" height="12" fill="#CC3B28" stroke="#0A3A45" stroke-width="3"/><circle cx="32" cy="40" r="6" fill="#CFE9E8" stroke="#0A3A45" stroke-width="2"/>', brinquedo: '<circle cx="32" cy="32" r="21" fill="#fff" stroke="#0A3A45" stroke-width="3"/><path d="M13 24c12 6 26 6 38 0M13 40c12-6 26-6 38 0" fill="none" stroke="#CC3B28" stroke-width="3"/>', acessorio: '<path d="M14 22c0-8 36-8 36 0v10c0 14-8 22-18 22S14 46 14 32z" fill="#fff" stroke="#0A3A45" stroke-width="3"/><circle cx="32" cy="38" r="6" fill="#FFE59A" stroke="#0A3A45" stroke-width="3"/>' };
    var chipRow = function (name, opts) { return '<fieldset><legend class="hint" style="font:700 .9rem var(--f2)">' + opts.legend + '</legend><div class="opts">' + radio(name, '', EN ? 'All' : 'Todos', !f[name]) + opts.items.map(function (o) { return radio(name, o[0], o[1], f[name] === o[0]); }).join('') + '</div></fieldset>'; };
    var cartTotals = function () { var n = 0, t = 0; D.prods.forEach(function (p) { var q = cart[p[0]] || 0; n += q; t += q * p[4]; }); return { n: n, t: t }; };
    var rLoja = function () {
      var list = D.prods.filter(function (p) { return (!f.esp || p[1] === f.esp) && (!f.tipo || p[3] === f.tipo) && (!f.fase || p[2] === f.fase || p[2] === 'todas'); });
      lj.innerHTML = '<div class="no-print">' + chipRow('esp', { legend: T.esp, items: [['cao', T.cao], ['gato', T.gato]] }) + chipRow('tipo', { legend: EN ? 'Type' : 'Tipo', items: Object.keys(tipos).map(function (k) { return [k, tipos[k]]; }) }) + chipRow('fase', { legend: EN ? 'Life stage' : 'Fase', items: [['filhote', fases.filhote], ['adulto', fases.adulto], ['senior', fases.senior]] }) + '</div>' +
        '<p class="hint" role="status">' + list.length + ' ' + (EN ? 'products' : 'produtos') + '</p><div class="prods">' + (list.length ? list.map(function (p) { return '<article class="card prod"><div class="ic" style="background:' + p[7] + '"><svg viewBox="0 0 64 64" aria-hidden="true">' + icons[p[3]] + '</svg></div><p class="tags">' + tipos[p[3]] + ' · ' + (p[1] === 'cao' ? T.cao : T.gato) + ' · ' + fases[p[2]] + '</p><h3>' + esc(p[5 + L]) + '</h3><div class="pr">' + money(p[4]) + '</div><button class="btn sm" type="button" data-add="' + p[0] + '" aria-label="' + T.add + ': ' + esc(p[5 + L]) + '">' + T.add + '</button></article>'; }).join('') : '<div class="empty">' + T.nenhum + '</div>') + '</div>' +
        '<div class="cart no-print"><button class="btn" type="button" id="abrir-cart" aria-haspopup="dialog">' + T.carrinho + ' <span class="cntb" id="cnt">' + cartTotals().n + '</span></button></div>' +
        '<div class="cartpanel" id="painel" role="dialog" aria-modal="true" aria-label="' + T.carrinho + '"></div>';
    };
    var rPainel = function () {
      var p = $('#painel'), tt = cartTotals(), ids = Object.keys(cart).filter(function (k) { return cart[k] > 0; });
      $('#cnt').textContent = tt.n;
      var frete = ent ? 12 : 0;
      p.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h3>' + T.carrinho + '</h3><button class="btn alt sm" type="button" id="fecha">' + T.fechar + '</button></div>' +
        (ids.length ? ids.map(function (k) { var pr = D.prods.filter(function (x) { return x[0] === k; })[0]; return '<div class="li"><span>' + esc(pr[5 + L]) + '<br><small>' + money(pr[4]) + '</small></span><span class="q"><button type="button" data-m="' + k + '" aria-label="' + T.menos + '">−</button><b>' + cart[k] + '</b><button type="button" data-p="' + k + '" aria-label="' + T.mais + '">+</button></span></div>'; }).join('') + '<fieldset style="margin-top:1rem"><div class="opts">' + radio('ent', '0', T.retirada, !ent) + radio('ent', '1', T.entrega, ent) + '</div></fieldset><div class="total"><span>' + T.total + '</span><span>' + money(tt.t + frete) + '</span></div><button class="btn" type="button" id="pedir">' + T.pedir + '</button><p class="hint" style="margin-top:.7rem">' + T.demo + '</p>' : '<p class="empty" style="margin-top:1rem">' + T.vazio + '</p>');
    };
    var abre = function (o) { var p = $('#painel'); p.classList.toggle('open', o); if (o) { rPainel(); var x = $('#fecha'); if (x) x.focus(); } else $('#abrir-cart').focus(); };
    var mexe = function (k, d) { cart[k] = Math.max(0, (cart[k] || 0) + d); store.set(KC, cart); rPainel(); };
    lj.addEventListener('change', function (e) { var t = e.target; if (t.name === 'ent') { ent = t.value === '1'; rPainel(); return; } if (f.hasOwnProperty(t.name)) { f[t.name] = t.value; rLoja(); var n = $('input[name="' + t.name + '"]:checked', lj); if (n) n.focus({ preventScroll: true }); } });
    lj.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.add) { cart[t.dataset.add] = (cart[t.dataset.add] || 0) + 1; store.set(KC, cart); $('#cnt').textContent = cartTotals().n; toast(T.add + ': ' + D.prods.filter(function (x) { return x[0] === t.dataset.add; })[0][5 + L]); }
      if (t.id === 'abrir-cart') abre(true); if (t.id === 'fecha') abre(false);
      if (t.dataset.p) mexe(t.dataset.p, 1); if (t.dataset.m) mexe(t.dataset.m, -1);
      if (t.id === 'pedir') { var tt = cartTotals(), ids = Object.keys(cart).filter(function (k) { return cart[k] > 0; }); copy(T.pedHi + '\n' + ids.map(function (k) { var pr = D.prods.filter(function (x) { return x[0] === k; })[0]; return cart[k] + 'x ' + pr[5 + L] + ' (' + money(pr[4]) + ')'; }).join('\n') + '\n' + (ent ? T.entrega : T.retirada) + '\n' + T.total + ': ' + money(tt.t + (ent ? 12 : 0))); }
    });
    document.addEventListener('keydown', function (e) { var p = $('#painel'); if (e.key === 'Escape' && p && p.classList.contains('open')) abre(false); });
    rLoja();
  }

  /* ---- planos ---- */
  var pc = $('#planos-calc');
  if (pc) {
    var sel = $('#pl-porte'), planos = [{ id: 'mimo', n: 2, d: .1 }, { id: 'mais', n: 4, d: .2 }, { id: 'total', n: 4, d: .2, hig: true, leva: true }];
    var upd = function () {
      var k = sel.value, base = D.banho[k];
      planos.forEach(function (p) {
        var av = p.n * base + (p.hig ? D.higienica[k] : 0) + (p.leva ? p.n * 15 : 0), no = Math.round(p.n * base * (1 - p.d));
        $('[data-av="' + p.id + '"]').textContent = money(av); $('[data-no="' + p.id + '"]').textContent = money(no); $('[data-eco="' + p.id + '"]').textContent = money(av - no);
      });
    };
    sel.addEventListener('change', upd); upd();
  }

  /* ---- contato: bairro e formulario ---- */
  var bc = $('#bairro-chk');
  if (bc) { var out = $('#bairro-out'); bc.innerHTML = '<option value="">' + (EN ? 'Choose' : 'Escolha') + '</option>' + D.bairros.map(function (x, i) { return '<option value="' + i + '">' + esc(x[1 + L]) + '</option>'; }).join(''); bc.addEventListener('change', function () { if (bc.value === '') { out.textContent = ''; return; } var x = D.bairros[bc.value]; out.className = x[2] === null ? 'bad' : 'ok'; out.textContent = x[2] === null ? T.semleva : T.hdist + money(x[2]); }); }
  var cf = $('#contato-form');
  if (cf) cf.addEventListener('submit', function (e) { e.preventDefault(); var o = $('#cf-out'); if (!$('#cf-n').value.trim() || !$('#cf-m').value.trim()) { o.className = 'bad'; o.textContent = T.ferr; return; } o.className = 'ok'; o.textContent = T.fok; cf.reset(); });
})();
