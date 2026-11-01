// Busca do cabeçalho: sugestões enquanto digita + página de resultados (?q=). Índice: /search-index.json (por idioma).
(() => {
  const f = document.querySelector('form.hsearch');
  if (!f) return;
  const input = f.q, list = f.querySelector('.sg');
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  let idx = null, act = 0, shown = [];
  const load = () => idx || (idx = fetch(f.dataset.index).then((r) => r.json()).then((a) => a.map((e) => ({ ...e, x: norm(e.n), y: norm(e.a || '') }))));
  const rank = { Herói: 3, Hero: 3, Item: 2 };
  const find = (all, q, max) => {
    q = norm(q); if (!q) return [];
    const toks = q.split(/\s+/);
    const out = [];
    for (const e of all) {
      let s = 0;
      if (e.x === q) s = 100; else if (e.x.startsWith(q)) s = 85; else if (e.x.includes(' ' + q)) s = 70; else if (e.x.includes(q)) s = 50;
      else if (toks.every((t) => e.x.includes(t) || e.y.includes(t))) s = 35; else if (e.y.includes(q)) s = 25;
      if (s) out.push({ e, s: s + (rank[e.k] || 0) - e.x.length * 0.01 });
    }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, max).map((o) => o.e);
  };
  const li = (e, i) => {
    const l = document.createElement('li'), a = document.createElement('a'), k = document.createElement('small');
    l.role = 'option'; l.id = 'sg-' + i; a.href = e.u; a.tabIndex = -1; a.textContent = e.n; k.textContent = e.k; a.append(k); l.append(a); return l;
  };
  const paint = () => {
    [...list.children].forEach((c, i) => c.setAttribute('aria-selected', String(i === act)));
    input.setAttribute('aria-activedescendant', shown.length ? 'sg-' + act : '');
  };
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const show = async () => {
    const q = input.value; if (!norm(q)) return close();
    shown = find(await load(), q, 7); act = 0;
    list.replaceChildren(...shown.map(li));
    const all = document.createElement('li'), a = document.createElement('a');
    all.role = 'option'; all.id = 'sg-' + shown.length; a.href = f.action + '?q=' + encodeURIComponent(q); a.tabIndex = -1; a.textContent = f.dataset.all.replace('{q}', q); all.className = 'all'; all.append(a); list.append(all);
    shown.push({ u: a.href });
    list.hidden = false; input.setAttribute('aria-expanded', 'true'); paint();
  };
  input.addEventListener('input', show);
  input.addEventListener('focus', () => { load(); if (input.value) show(); });
  input.addEventListener('keydown', (ev) => {
    if (list.hidden) return;
    if (ev.key === 'ArrowDown') { act = (act + 1) % shown.length; paint(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { act = (act - 1 + shown.length) % shown.length; paint(); ev.preventDefault(); }
    else if (ev.key === 'Escape') close();
    else if (ev.key === 'Enter' && shown[act]) { ev.preventDefault(); location.href = shown[act].u; }
  });
  document.addEventListener('click', (ev) => { if (!f.contains(ev.target)) close(); });

  // Página de resultados
  const box = document.getElementById('results');
  if (box) {
    const q = new URLSearchParams(location.search).get('q') || '';
    input.value = q;
    const none = box.dataset.none.replace('{q}', q);
    load().then((all) => {
      const hits = find(all, q, 80);
      if (!q) return;
      if (!hits.length) { box.textContent = none; return; }
      const groups = new Map();
      for (const e of hits) { if (!groups.has(e.k)) groups.set(e.k, []); groups.get(e.k).push(e); }
      box.replaceChildren();
      for (const [k, es] of groups) {
        const h = document.createElement('h2'), ul = document.createElement('ul');
        h.className = 'cat'; h.textContent = k; ul.className = 'res';
        for (const e of es) { const l = document.createElement('li'), a = document.createElement('a'); a.href = e.u; a.textContent = e.n; l.append(a); ul.append(l); }
        box.append(h, ul);
      }
    });
  }
})();
