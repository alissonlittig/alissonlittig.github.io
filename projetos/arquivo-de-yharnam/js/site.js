// Menu, filtros e player de vídeo (YouTube nocookie, carrega só no clique).
(() => {
  const menu = document.querySelector('details.menu');
  if (menu) {
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.open = false; });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  }

  // Filtros: cada [data-filterable] tem botões [data-key][data-val] e cartões [data-card][data-<key>].
  document.querySelectorAll('[data-filterable]').forEach((root) => {
    const cards = [...root.querySelectorAll('[data-card]')];
    const btns = [...root.querySelectorAll('.fb')];
    const count = root.querySelector('[data-count]');
    const empty = root.querySelector('[data-empty]');
    const sel = {};
    const apply = () => {
      let n = 0;
      cards.forEach((c) => {
        const ok = Object.entries(sel).every(([k, v]) => !v || (c.dataset[k] || '').split('|').includes(v));
        c.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = `${n} / ${cards.length}`;
      if (empty) empty.classList.toggle('on', n === 0);
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      sel[b.dataset.key] = b.dataset.val;
      btns.filter((x) => x.dataset.key === b.dataset.key).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
    apply();
  });

  // Player em diálogo
  let dlg;
  const open = (id, title, from) => {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'pl'; dlg.setAttribute('aria-label', 'Player');
      dlg.innerHTML = '<div class="plf"></div><div class="plh"><strong></strong><button type="button"></button></div>';
      document.body.append(dlg);
      const stop = () => { dlg.querySelector('.plf').replaceChildren(); };
      dlg.querySelector('button').addEventListener('click', () => dlg.close());
      dlg.addEventListener('close', () => { stop(); if (dlg._from) dlg._from.focus(); });
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    }
    dlg._from = from;
    const lang = document.documentElement.lang.startsWith('pt');
    dlg.querySelector('button').textContent = lang ? 'Fechar' : 'Close';
    dlg.querySelector('strong').textContent = title;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    f.title = title; f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
    dlg.querySelector('.plf').replaceChildren(f);
    dlg.showModal();
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-yt]');
    if (b) open(b.dataset.yt, b.dataset.title || '', b);
  });
})();

// Miniaturas quebradas viram selo; menu móvel mostra o item atual.
(() => {
  document.querySelectorAll('.pic img').forEach((im) => {
    const bad = () => im.closest('.pic').classList.add('broken');
    im.addEventListener('error', bad);
    if (im.complete && im.naturalWidth === 0 && im.currentSrc) bad();
  });
  const cur = document.querySelector('.snav a[aria-current]');
  const nav = document.querySelector('.snav');
  if (cur && nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - 24);
})();

// Visualizador de imagens (lightbox): ESC fecha, setas navegam, foco volta ao botão.
(() => {
  const pt = document.documentElement.lang.startsWith('pt');
  const L = pt ? { prev: 'Anterior', next: 'Próxima', close: 'Fechar', cred: 'Imagem:', owner: '© Sony Interactive Entertainment, FromSoftware', src: 'Fextralife Bloodborne Wiki', srcF: 'Bloodborne Wiki (Fandom)', label: 'Visualizador de imagem', of: (a, b) => `${a} de ${b}` }
                 : { prev: 'Previous', next: 'Next', close: 'Close', cred: 'Image:', owner: '© Sony Interactive Entertainment, FromSoftware', src: 'Fextralife Bloodborne Wiki', srcF: 'Bloodborne Wiki (Fandom)', label: 'Image viewer', of: (a, b) => `${a} of ${b}` };
  let dlg, img, cap, ct, cr, bp, bn, items = [], i = 0, from;
  const arrow = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const build = () => {
    dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', L.label);
    dlg.innerHTML = `<div class="lbs"><button type="button" class="lbx">${L.close}</button><button type="button" class="lbb p" aria-label="${L.prev}">${arrow('M15 5l-7 7 7 7')}</button><img alt=""><button type="button" class="lbb n" aria-label="${L.next}">${arrow('M9 5l7 7-7 7')}</button></div><div class="lbf"><strong></strong><span class="ct" aria-live="polite"></span><p class="cr"></p></div>`;
    document.body.append(dlg);
    img = dlg.querySelector('img'); cap = dlg.querySelector('strong'); ct = dlg.querySelector('.ct'); cr = dlg.querySelector('.cr');
    bp = dlg.querySelector('.p'); bn = dlg.querySelector('.n');
    dlg.querySelector('.lbx').addEventListener('click', () => dlg.close());
    bp.addEventListener('click', () => go(-1)); bn.addEventListener('click', () => go(1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { img.removeAttribute('src'); if (from) from.focus({ preventScroll: true }); });
    document.addEventListener('keydown', (e) => {
      if (!dlg.open) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    let x0 = null;
    dlg.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
  };
  const show = () => {
    const b = items[i];
    img.classList.add('ld');
    img.onload = () => img.classList.remove('ld');
    img.onerror = () => img.classList.remove('ld');
    img.src = b.dataset.full; img.alt = b.dataset.cap || '';
    cap.textContent = b.dataset.cap || '';
    ct.textContent = items.length > 1 ? L.of(i + 1, items.length) : '';
    cr.replaceChildren(document.createTextNode(L.cred + ' '));
    const a = document.createElement('a'); a.href = b.dataset.src; a.target = '_blank'; a.rel = 'noopener'; a.textContent = b.dataset.credit === 'fandom' ? L.srcF : L.src;
    cr.append(a, document.createTextNode(' / ' + L.owner));
    bp.hidden = bn.hidden = items.length < 2;
    [1, -1].forEach((d) => { const n = items[(i + d + items.length) % items.length]; if (n) new Image().src = n.dataset.full; });
  };
  const go = (d) => { if (items.length < 2) return; i = (i + d + items.length) % items.length; show(); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lb]');
    if (!b) return;
    if (!dlg) build();
    const grp = b.closest('[data-lbgroup]');
    items = grp ? [...grp.querySelectorAll('[data-lb]')].filter((x) => !x.closest('[hidden]')) : [b];
    i = Math.max(0, items.indexOf(b)); from = b;
    show(); dlg.showModal();
  });
})();
