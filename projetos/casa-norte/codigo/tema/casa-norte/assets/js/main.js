// Mobile menu toggle.
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (toggle && nav) {
	toggle.addEventListener('click', () => {
		const open = toggle.getAttribute('aria-expanded') === 'true';
		toggle.setAttribute('aria-expanded', String(!open));
		nav.classList.toggle('open', !open);
	});
	nav.addEventListener('click', (e) => {
		if (e.target.closest('a')) {
			toggle.setAttribute('aria-expanded', 'false');
			nav.classList.remove('open');
		}
	});
}

// Listings page: filter the cards live. The server already filters on submit
// (pre_get_posts); this keeps the same rules in the browser so it also works on a static host.
const list = document.getElementById('listings');
const form = list && document.querySelector('.page-head .filter');
if (form) {
	const url = new URLSearchParams(location.search);
	for (const el of form.elements) if (el.name && url.has(el.name)) el.value = url.get(el.name);
	const apply = () => {
		const f = Object.fromEntries(new FormData(form));
		let n = 0;
		for (const card of list.children) {
			const d = card.dataset;
			const ok =
				(!f.finalidade || d.finalidade === f.finalidade) &&
				(!f.tipo || d.tipo === f.tipo) &&
				(!f.bairro || d.bairro === f.bairro) &&
				(!f.quartos || +d.quartos >= +f.quartos) &&
				(!f.preco_max || +d.preco <= +f.preco_max);
			card.hidden = !ok;
			if (ok) n++;
		}
		document.getElementById('count').textContent = n;
		document.getElementById('empty').hidden = n > 0;
	};
	form.addEventListener('change', apply);
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		apply();
		history.replaceState(null, '', '?' + new URLSearchParams([...new FormData(form)].filter(([, v]) => v)));
	});
	apply();
}
