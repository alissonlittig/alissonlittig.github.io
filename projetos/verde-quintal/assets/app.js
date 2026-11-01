(function () {
  'use strict';
  var D = window.VQ, B = document.body, L = B.dataset.lang, PT = L === 'pt', BASE = B.dataset.base;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var t = function (p, e) { return PT ? p : e; };
  var brl = function (n) { return 'R$ ' + n.toLocaleString('pt-BR'); };
  var nome = function (o) { return PT ? o.pt : o.en; };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* menu */
  var burger = $('.burger'), nav = $('#nav');
  burger.addEventListener('click', function () {
    var o = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', !o); nav.classList.toggle('open', !o);
    burger.setAttribute('aria-label', !o ? t('Fechar menu', 'Close menu') : t('Abrir menu', 'Open menu'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { burger.click(); burger.focus(); }
  });

  /* reduzir movimento */
  var rb = $('[data-reduce]'), root = document.documentElement;
  function setReduce(on) { root.classList.toggle('reduce', on); rb.setAttribute('aria-pressed', on); store.set('vq-reduce', on ? '1' : '0'); }
  if (store.get('vq-reduce') === '1') setReduce(true);
  rb.addEventListener('click', function () { setReduce(rb.getAttribute('aria-pressed') !== 'true'); });

  /* toast */
  var toastEl = $('[data-toast]'), tt;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2400); }

  /* sacola */
  var KEY = 'vq-bag', bag = { items: {}, note: '' };
  try { var s = JSON.parse(store.get(KEY)); if (s && s.items) bag = s; } catch (e) {}
  var dlg = $('#cart'), body = $('[data-cart-body]');
  function info(id) { return D.plantas[id] || D.kits[id]; }
  function save() { store.set(KEY, JSON.stringify(bag)); }
  function count() { return Object.keys(bag.items).reduce(function (a, k) { return a + bag.items[k]; }, 0); }
  function sub() { return Object.keys(bag.items).reduce(function (a, k) { return a + info(k).preco * bag.items[k]; }, 0); }
  function thumb(id) {
    var o = info(id), pid = o.ids ? o.ids[0] : id, p = D.plantas[pid];
    if (o.ids) { for (var i = 0; i < o.ids.length; i++) if (D.plantas[o.ids[i]].img) { p = D.plantas[o.ids[i]]; break; } }
    if (p.img) return '<span class="mini"><img src="' + BASE + 'img/' + p.img + '-480.webp" width="56" height="56" alt=""></span>';
    return '<span class="mini"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 36V18" stroke="#B9532F" stroke-width="3" stroke-linecap="round"/><path d="M20 22C8 22 5 12 6 6c9-1 15 3 14 16z" fill="#2F4A34"/><path d="M20 26c10 0 15-8 14-15-9 0-15 4-14 15z" fill="#5B7F4F"/></svg></span>';
  }
  function render() {
    var n = count(), cnt = $('[data-cart-count]');
    cnt.textContent = n; cnt.dataset.n = n;
    var ids = Object.keys(bag.items);
    if (!ids.length) {
      body.innerHTML = '<div class="empty"><p>' + t('Sua sacola está vazia.', 'Your bag is empty.') + '</p><a class="btn btn-terra btn-sm" href="' + B.dataset.catalogo + '">' + t('Ver o catálogo', 'Browse the catalog') + '</a></div>';
      return;
    }
    var st = sub(), fr = st >= 200 ? 0 : 18, li = ids.map(function (id) {
      var o = info(id), q = bag.items[id];
      return '<li>' + thumb(id) + '<div><b>' + nome(o) + '</b><small>' + brl(o.preco) + ' ' + t('cada', 'each') + '</small><div class="qty"><button type="button" data-q="-1" data-id="' + id + '" aria-label="' + t('Diminuir', 'Decrease') + ' ' + nome(o) + '">&minus;</button><span aria-live="polite">' + q + '</span><button type="button" data-q="1" data-id="' + id + '" aria-label="' + t('Aumentar', 'Increase') + ' ' + nome(o) + '">+</button></div></div><div style="text-align:right"><strong>' + brl(o.preco * q) + '</strong><br><button type="button" class="rm" data-rm="' + id + '">' + t('Remover', 'Remove') + '</button></div></li>';
    }).join('');
    body.innerHTML = '<ul class="cl">' + li + '</ul><div class="sum"><div><span>Subtotal</span><span>' + brl(st) + '</span></div><div><span>' + t('Frete (capital)', 'Shipping (city)') + '</span><span>' + (fr ? brl(fr) : t('grátis', 'free')) + '</span></div>' +
      (fr ? '<small>' + t('Faltam ', 'Add ') + brl(200 - st) + t(' para o frete grátis.', ' more for free shipping.') + '</small>' : '') +
      '<div class="tot"><span>Total</span><span>' + brl(st + fr) + '</span></div></div>' +
      '<label>' + t('Recado para o cartão (opcional)', 'Gift card message (optional)') + '<textarea id="note" maxlength="140" placeholder="' + t('Ex.: Feliz casa nova!', 'E.g. Happy new home!') + '">' + bag.note.replace(/</g, '&lt;') + '</textarea></label>' +
      '<div class="btns"><button type="button" class="btn btn-terra" data-copy>' + t('Copiar o pedido', 'Copy the order') + '</button><button type="button" class="btn btn-line btn-sm" data-clear>' + t('Esvaziar a sacola', 'Empty the bag') + '</button></div>' +
      '<p class="fn">' + t('Simulação: a loja é fictícia e nada é enviado. O texto copiado serviria para mandar o pedido por mensagem.', 'Simulation: the shop is fictional and nothing is sent. The copied text could be sent as an order message.') + '</p>';
  }
  function add(id) {
    bag.items[id] = (bag.items[id] || 0) + 1; save(); render();
    toast(nome(info(id)) + t(' entrou na sacola', ' added to the bag'));
  }
  function change(id, d) { bag.items[id] = (bag.items[id] || 0) + d; if (bag.items[id] < 1) delete bag.items[id]; save(); render(); }
  function openCart(btn) { render(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('button, dialog'); if (!el) return;
    if (el.dataset.add) add(el.dataset.add);
    else if (el.hasAttribute('data-cart-open')) openCart();
    else if (el.hasAttribute('data-cart-close')) dlg.close();
    else if (el === dlg && e.target === dlg) dlg.close();
    else if (el.dataset.q) { change(el.dataset.id, +el.dataset.q); var b = $('[data-q="' + el.dataset.q + '"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); }
    else if (el.dataset.rm) { delete bag.items[el.dataset.rm]; save(); render(); }
    else if (el.hasAttribute('data-clear')) { bag = { items: {}, note: '' }; save(); render(); }
    else if (el.hasAttribute('data-copy')) {
      var st = sub(), fr = st >= 200 ? 0 : 18, lines = [t('Pedido Verde Quintal (simulação)', 'Verde Quintal order (simulation)')];
      Object.keys(bag.items).forEach(function (id) { var o = info(id); lines.push(bag.items[id] + 'x ' + nome(o) + ' - ' + brl(o.preco * bag.items[id])); });
      lines.push('Subtotal: ' + brl(st), t('Frete: ', 'Shipping: ') + (fr ? brl(fr) : t('grátis', 'free')), 'Total: ' + brl(st + fr));
      if (bag.note) lines.push(t('Recado: ', 'Message: ') + bag.note);
      var txt = lines.join('\n');
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(t('Pedido copiado', 'Order copied')); }, function () {
        var ta = $('#note'); if (ta) { ta.value = txt; ta.select(); } toast(t('Selecione e copie o texto', 'Select and copy the text'));
      });
    }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'note') { bag.note = e.target.value; save(); } });
  render();

  /* catálogo: filtros */
  var grid = $('#grid'), form = $('#filtros');
  if (grid && form) {
    var cards = $$('.pcard', grid), nEl = $('#n'), vazio = $('#vazio'), qs = new URLSearchParams(location.search);
    function setR(name, v) { var r = $('input[name="' + name + '"][value="' + v + '"]', form); if (r) r.checked = true; }
    if (qs.get('luz')) setR('luz', qs.get('luz'));
    if (qs.get('dif')) setR('dif', qs.get('dif'));
    if (qs.get('pet') === '1') $('input[name=pet]', form).checked = true;
    function filtrar() {
      var luz = (form.elements.luz.value), dif = +form.elements.dif.value || 9, pet = form.elements.pet.checked, n = 0;
      cards.forEach(function (c) {
        var ok = (!luz || c.dataset.luz.split(' ').indexOf(luz) > -1) && +c.dataset.dif <= dif && (!pet || c.dataset.pet === '1');
        c.hidden = !ok; if (ok) n++;
      });
      nEl.textContent = n; vazio.hidden = n > 0; grid.hidden = n === 0;
      var p = new URLSearchParams(); if (luz) p.set('luz', luz); if (form.elements.dif.value) p.set('dif', form.elements.dif.value); if (pet) p.set('pet', '1');
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
    form.addEventListener('change', filtrar);
    form.addEventListener('reset', function () { setTimeout(filtrar, 0); });
    $('#limpar2').addEventListener('click', function () { form.reset(); });
    filtrar();
  }

  /* quiz */
  var quiz = $('#quiz');
  if (quiz) {
    var qsx = $$('.q', quiz), idx = 0, ans = {}, bar = $('#qbar'), back = $('#qback'), res = $('#result'), tpl = $('#tpl');
    function show(i) {
      idx = i; qsx.forEach(function (q, k) { q.hidden = k !== i; });
      bar.style.width = (i / qsx.length * 100) + '%'; back.hidden = i === 0;
      var f = $('input:checked', qsx[i]) || $('input', qsx[i]); if (f && i > 0) f.focus({ preventScroll: true });
    }
    quiz.addEventListener('change', function (e) {
      ans[e.target.name] = e.target.value;
      if (idx < qsx.length - 1) setTimeout(function () { show(idx + 1); }, 220); else setTimeout(finish, 220);
    });
    back.addEventListener('click', function () { show(idx - 1); });
    var LZ = { sombra: t('sombra', 'shade'), meia: t('meia-sombra', 'part shade'), sol: t('sol', 'sun') };
    function pick(strict) {
      return Object.keys(D.plantas).map(function (id) { var p = D.plantas[id]; p.id = id; return p; }).filter(function (p) {
        return p.luz.indexOf(ans.luz) > -1 && (ans.pet !== '1' || p.pet) && p.dif <= (strict.dif ? 3 : +ans.dif) && (strict.porte ? p.porte.indexOf(ans.porte) > -1 : true);
      });
    }
    function finish() {
      var list = pick({ porte: true }), relax = '';
      if (!list.length) { list = pick({ porte: false }); relax = t('Nenhuma planta atendeu a todos os critérios no espaço escolhido (' + (ans.porte === 'chao' ? 'chão' : 'mesa') + '), então o espaço foi o único critério afrouxado.', 'No plant met every criterion for the chosen space (' + (ans.porte === 'chao' ? 'floor' : 'desk') + '), so space was the only criterion loosened.'); }
      if (!list.length) { list = pick({ porte: false, dif: true }); relax = t('Com essa luz' + (ans.pet === '1' ? ' e pets em casa' : '') + ' não existe planta tão fácil no catálogo. Esta é a mais tranquila entre as que aceitam o seu cômodo.', 'With that light' + (ans.pet === '1' ? ' and pets at home' : '') + ' there is no plant that easy in the catalog. This is the most forgiving of those that suit your room.'); }
      list.sort(function (a, b) { return a.luz.length - b.luz.length || Math.abs(+ans.dif - a.dif) - Math.abs(+ans.dif - b.dif) || a.preco - b.preco; });
      var top = list[0], alts = list.slice(1, 3);
      var why = [t('Aceita ' + LZ[ans.luz], 'Tolerates ' + LZ[ans.luz])];
      if (ans.pet === '1') why.push(t('Segura para cães e gatos (lista da ASPCA)', 'Safe for dogs and cats (ASPCA list)'));
      why.push(t('Cuidado ' + ['fácil', 'médio', 'exigente'][top.dif - 1] + ', dentro do que você topa', 'Care level: ' + ['easy', 'medium', 'demanding'][top.dif - 1] + ', within what you signed up for'));
      if (top.porte.indexOf(ans.porte) > -1) why.push(t('Cabe ' + (ans.porte === 'chao' ? 'no chão' : 'na mesa ou estante'), 'Fits ' + (ans.porte === 'chao' ? 'on the floor' : 'on a desk or shelf')));
      why.push(t('Rega a cada ~' + top.rega + ' dias no verão', 'Water every ~' + top.rega + ' days in summer'));
      function pic(id) { var c = $('.pcard[data-id="' + id + '"] .pimg', tpl.content); return c ? c.innerHTML : ''; }
      function mini(id) { var c = $('.pcard[data-id="' + id + '"]', tpl.content); return c ? c.outerHTML : ''; }
      res.innerHTML = '<div class="res-main"><div class="arch">' + pic(top.id) + '</div><div><p class="eyebrow">' + t('Sua planta', 'Your plant') + '</p><h2>' + nome(top) + '</h2><p><em>' + top.sci + '</em>. ' + (PT ? top.dpt : top.den) + '</p><ul>' + why.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul><div class="cta"><button type="button" class="btn btn-terra" data-add="' + top.id + '">' + t('Adicionar por ', 'Add for ') + brl(top.preco) + '</button><button type="button" class="btn btn-line" id="again">' + t('Refazer o teste', 'Retake the quiz') + '</button></div></div></div>' +
        (relax ? '<p class="res-relax">' + relax + '</p>' : '') +
        (alts.length ? '<div class="res-alt"><h3>' + t('Também combinam', 'Also a fit') + '</h3><div class="grid">' + alts.map(function (a) { return mini(a.id); }).join('') + '</div></div>' : '');
      quiz.hidden = true; res.hidden = false; res.scrollIntoView({ behavior: root.classList.contains('reduce') ? 'auto' : 'smooth', block: 'start' });
      $('#again').addEventListener('click', function () { ans = {}; quiz.reset(); quiz.hidden = false; res.hidden = true; show(0); quiz.scrollIntoView(); });
    }
    show(0);
  }

  /* teste da sombra */
  var sres = $('#sres');
  if (sres) {
    var cat = B.dataset.catalogo;
    $$('.sh').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.sh').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        var k = b.dataset.luz, n = Object.keys(D.plantas).filter(function (id) { return D.plantas[id].luz.indexOf(k) > -1; }).length;
        sres.innerHTML = '<strong>' + { sol: t('Sol.', 'Sun.'), meia: t('Meia-sombra.', 'Part shade.'), sombra: t('Sombra.', 'Shade.') }[k] + '</strong> ' + t('Dá para criar ' + n + ' das 12 plantas aí. ', 'You can grow ' + n + ' of the 12 plants there. ') + '<a href="' + cat + '?luz=' + k + '">' + t('Ver só essas', 'See only those') + '</a>';
      });
    });
  }

  /* formulário */
  var cf = $('#contato');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = ['nome', 'email', 'msg'].filter(function (n) { var f = cf.elements[n], ok = f.value.trim() && (n !== 'email' || /^\S+@\S+\.\S+$/.test(f.value)); f.setAttribute('aria-invalid', !ok); return !ok; });
    var m = $('#fmsg'); m.className = 'fmsg' + (bad.length ? ' err' : '');
    if (bad.length) { m.textContent = t('Confira os campos marcados.', 'Check the highlighted fields.'); cf.elements[bad[0]].focus(); }
    else { m.textContent = t('Mensagem simulada. Nada foi enviado porque a loja é fictícia.', 'Simulated message. Nothing was sent because the shop is fictional.'); cf.reset(); }
  });

  /* revelar ao rolar */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.hero ~ section .luz, .hero ~ section .regras li, .hero ~ section .kitc, .hero ~ section .ent3 li, .hero ~ section .pcard').forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('rv'); io.observe(el); }
    });
  }
})();
