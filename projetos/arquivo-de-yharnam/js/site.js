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
