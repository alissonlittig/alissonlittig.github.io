(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var brl = function (n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };

  /* revelar no scroll */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  $$('.rv, .mod').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });

  /* perfil da trilha: leitura do ponto */
  var mods = $$('.mod').map(function (m) { return { t: $('h3', m).textContent, k: $('.tag', m).textContent, o: $('.out', m).textContent.replace('Você sai com', '') }; });
  var pts = $$('.pt');
  function show(i) {
    pts.forEach(function (p) { p.classList.toggle('on', +p.dataset.i === i); });
    $('#r-k').textContent = 'Semana ' + (i + 1) + ' · ' + mods[i].k;
    $('#r-t').textContent = mods[i].t; $('#r-d').textContent = mods[i].o;
  }
  pts.forEach(function (p) {
    var i = +p.dataset.i;
    p.addEventListener('mouseenter', function () { show(i); });
    p.addEventListener('focus', function () { show(i); });
    p.addEventListener('click', function () { var d = $('#mod-' + (i + 1) + ' details'); if (d) d.open = true; });
  });

  /* um módulo aberto por vez */
  $$('details.m').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) $$('details.m').forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* planos: à vista x parcelado */
  var pay = 'cash', plans = $$('.plan');
  function render() {
    plans.forEach(function (p) {
      var c = +p.dataset.cash, i = +p.dataset.inst;
      $('[data-val]', p).textContent = pay === 'cash' ? brl(c) : brl(i);
      $('[data-per]', p).textContent = pay === 'cash' ? 'à vista' : 'x 12';
      $('[data-total]', p).textContent = pay === 'cash' ? 'Pagamento único, sem juros.' : 'Total de R$ ' + brl(Math.round(i * 12 * 100) / 100) + ' no cartão.';
      if (pay === 'inst') $('[data-val]', p).textContent = '12x ' + brl(i), $('[data-per]', p).textContent = '';
    });
    var s = $('#stick b'); if (s) s.textContent = pay === 'cash' ? 'R$ 497 à vista' : '12x R$ 49,70';
  }
  $$('.switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      pay = b.dataset.pay;
      $$('.switch button').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      render();
    });
  });
  render();

  /* compra simulada */
  var dlg = $('#dlg'), f = $('#f'), done = $('#done'), last;
  $$('[data-buy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.closest('.plan'); last = b;
      $('#d-plan').textContent = $('h3', p).textContent;
      $('#d-price').textContent = pay === 'cash' ? 'R$ ' + brl(+p.dataset.cash) + ' à vista' : '12x R$ ' + brl(+p.dataset.inst);
      f.hidden = false; done.hidden = true; f.reset();
      $$('input', f).forEach(function (i) { i.removeAttribute('aria-invalid'); }); $$('.err', f).forEach(function (e) { e.textContent = ''; });
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      $('input', f).focus();
    });
  });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { if (last) last.focus(); });
  function bad(name, msg) { var i = f.elements[name]; i.setAttribute('aria-invalid', 'true'); $('#e-' + name).textContent = msg; return i; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    $$('input', f).forEach(function (i) { i.removeAttribute('aria-invalid'); }); $$('.err', f).forEach(function (x) { x.textContent = ''; });
    var n = f.elements.nome.value.trim(), m = f.elements.email.value.trim(), first;
    if (n.length < 3) first = bad('nome', 'Digite o seu nome completo.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { var ei = bad('email', 'Digite um e-mail válido, como nome@exemplo.com.'); first = first || ei; }
    if (first) { first.focus(); return; }
    $('#d-msg').textContent = n.split(' ')[0] + ', sua vaga na turma de 1º de dezembro está reservada (simulação).';
    f.hidden = true; done.hidden = false; $('h3', done).setAttribute('tabindex', '-1'); $('h3', done).focus();
  });

  /* barra fixa no celular */
  var st = $('#stick'), hero = $('.hero'), planos = $('#planos'), vis = { h: true, p: false };
  function upd() { var on = !vis.h && !vis.p; st.classList.toggle('on', on); st.setAttribute('aria-hidden', !on); $('a', st).tabIndex = on ? 0 : -1; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { vis.h = es[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (es) { vis.p = es[0].isIntersecting; upd(); }).observe(planos);
  }
})();
