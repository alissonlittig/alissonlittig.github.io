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
