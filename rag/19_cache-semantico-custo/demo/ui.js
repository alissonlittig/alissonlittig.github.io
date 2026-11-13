/* Casca comum das demos: troca PT/EN, blocos "como funciona" e "o que é real", utilitários. */
(function (g) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const B = (pt, en) => `<span lang="pt">${pt}</span><span lang="en">${en}</span>`;
  const T = (pt, en) => document.documentElement.dataset.lang === "en" ? en : pt;
  function hl(text, terms) { // destaca termos da pergunta (comparando sem acento/plural, como o motor)
    return esc(text).replace(/[\wÀ-ÿ]+/g, w => { const t = RAG.tokens(w); return t.length && terms.includes(t[0]) ? `<mark>${w}</mark>` : w; });
  }
  const bar = (v, max) => `<span class="bar"><i style="width:${Math.max(0, Math.min(100, max ? v / max * 100 : 0)).toFixed(0)}%"></i></span>`;
  function shell(c, mount) {
    document.title = c.title + " · Alisson Littig";
    const pipe = c.pipe.map(p => `<div><b>${B(p[0], p[1])}</b>${B(p[2], p[3])}</div>`).join("");
    const li = a => a.map(x => `<li>${B(x[0], x[1])}</li>`).join("");
    document.getElementById("app").innerHTML = `
<header class="top"><a href="${c.back || "../../../#rag"}">← ${B("Portfólio", "Portfolio")}</a><div class="lg" role="group" aria-label="Idioma / Language"><button data-l="pt" aria-pressed="true">PT</button><button data-l="en" aria-pressed="false">EN</button></div></header>
<main class="wrap"><div class="hero"><p class="eyebrow">${B(c.tag[0], c.tag[1])}</p><h1>${B(c.h1[0], c.h1[1])}</h1><p>${B(c.sub[0], c.sub[1])}</p></div>
<section><h2><b>1</b>${B("Como funciona", "How it works")}</h2><div class="card"><div class="pipe">${pipe}</div></div></section>
<section><h2><b>2</b>${B("Teste você mesmo", "Try it yourself")}</h2><div id="stage"></div></section>
<section><h2><b>3</b>${B("O que é real e o que é simulado", "What is real and what is simulated")}</h2><div class="card hon"><strong>${B("Real", "Real")}</strong><ul>${li(c.real)}</ul><strong>${B("Simulado / limites", "Simulated / limits")}</strong><ul>${li(c.sim)}</ul></div></section></main>
<footer class="foot">${B(c.foot[0], c.foot[1])}</footer>`;
    const setLang = l => { document.documentElement.dataset.lang = l; document.documentElement.lang = l; document.querySelectorAll(".lg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.l === l)); document.dispatchEvent(new Event("langchange")); };
    document.querySelectorAll(".lg button").forEach(b => b.onclick = () => setLang(b.dataset.l));
    mount(document.getElementById("stage")); setLang((navigator.language || "pt").startsWith("en") ? "en" : "pt");
  }
  g.UI = { esc, B, T, hl, bar, shell };
})(window);
