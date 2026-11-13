(async function () {
  const { B, T, esc, hl, bar, shell } = UI;
  const ix = window.RAG_INDEX, ch = ix.chunks;
  const EX = ["banco de dados", "segurança da conta", "como reduzimos custos?", "quem ganhou a copa de 2014?"];
  const uniq = k => [...new Set(ch.map(c => c[k]))].sort();
  const months = [...new Set(ch.map(c => c.month))].sort();
  const F = { cats: [], authors: [], years: [], frm: "", to: "" };
  shell({
    tag: ["Projeto RAG 10 · estudo", "RAG project 10 · study"], title: "RAG com filtros por metadados e facetas",
    h1: ["Filtre por categoria, autor e data — e veja as facetas mudarem", "Filter by category, author and date — and watch the facets change"],
    sub: ["31 posts fictícios de um blog técnico. O filtro vale antes da busca (pré-filtro), as contagens de cada faceta respeitam os outros filtros, e a demo compara com o pós-filtro.", "31 fictional posts from a tech blog. The filter applies before the search (pre-filter), each facet count respects the other filters, and the demo compares it with post-filtering."],
    pipe: [["Metadados", "Metadata", "autor, categoria e data em cada post", "author, category and date on every post"], ["Pré-filtro", "Pre-filter", "só quem passa nos filtros entra no ranking", "only posts passing the filters enter the ranking"], ["Busca híbrida", "Hybrid search", "BM25 + n-gramas, fusão RRF", "BM25 + n-grams, RRF fusion"], ["Facetas", "Facets", "contagens que ignoram o próprio filtro", "counts that ignore their own filter"], ["Resposta", "Answer", "frase literal + [n] com autor e data", "literal sentence + [n] with author and date"]],
    real: [["Pré-filtro, facetas (contagens conferidas à mão em teste), busca híbrida e extração de frase rodam no navegador com os mesmos números do Python.", "Pre-filter, facets (counts checked by hand in a test), hybrid search and sentence extraction run in the browser with the same numbers as the Python code."], ["Todo resultado devolvido satisfaz os filtros escolhidos (teste).", "Every returned result satisfies the chosen filters (test)."]],
    sim: [["Os filtros são escolhidos por controles, não extraídos da frase da pergunta. Sem LLM: resposta extrativa. Sem embeddings neurais.", "Filters are chosen with controls, not parsed from the question text. No LLM: extractive answer. No neural embeddings."], ["Corpus minúsculo e fictício (31 posts): as contagens mostram o mecanismo, não desempenho em escala. Protótipo de portfólio, não está em produção em lugar nenhum.", "Tiny fictional corpus (31 posts): the counts show the mechanism, not performance at scale. Portfolio prototype, not in production anywhere."]],
    foot: ["Estudo de RAG local · dados fictícios · sem chave, sem servidor.", "Local RAG study · fictional data · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><form class="ask" id="f"><label class="k" for="q" style="width:100%">${B("Sua pergunta (PT-BR) — vazia = só navegar pelos filtros", "Your question (PT-BR) — empty = just browse by filters")}</label><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Buscar", "Search")}</button></form><div class="pre" id="ex"></div>
    <div class="facets" id="fac"></div><div id="out" aria-live="polite"></div></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out"), fac = stage.querySelector("#fac");
    stage.querySelector("#ex").innerHTML = EX.map(e => `<button type="button" class="chip">${esc(e)}</button>`).join("");
    const box = (key, name, vals, counts, sel) => `<fieldset><legend>${name}</legend>${vals.map(v => `<label><input type="checkbox" data-k="${key}" value="${esc(v)}" ${sel.includes(v) ? "checked" : ""}>${esc(v)}<span class="n">${counts[v] || 0}</span></label>`).join("")}</fieldset>`;
    const opts = (id, cur, lab) => `<select id="${id}" aria-label="${lab}"><option value="">${lab}</option>${months.map(m => `<option ${m === cur ? "selected" : ""}>${m}</option>`).join("")}</select>`;
    let keep = null;
    const run = () => {
      const r = Engine.answer(ix, q.value, F, 5), used = new Set(r.sources.map(s => s.id)), max = Math.max(...r.hits.map(h => h.rrf), 1e-9);
      fac.innerHTML = box("cats", T("Categoria", "Category"), uniq("category"), r.facets.cat, F.cats) + box("authors", T("Autor", "Author"), uniq("author"), r.facets.autor, F.authors) + box("years", T("Ano", "Year"), uniq("year"), r.facets.ano, F.years) +
        `<fieldset><legend>${T("Período", "Period")}</legend>${opts("frm", F.frm, T("de (mês)", "from (month)"))}<div style="height:8px"></div>${opts("to", F.to, T("até (mês)", "to (month)"))}<button type="button" class="btn sec" id="clr" style="margin-top:10px;min-height:38px;width:100%">${T("Limpar filtros", "Clear filters")}</button></fieldset>`;
      fac.querySelectorAll("input[type=checkbox]").forEach(i => i.onchange = () => { keep = `[data-k="${i.dataset.k}"][value="${i.value}"]`; const a = F[i.dataset.k]; i.checked ? a.push(i.value) : a.splice(a.indexOf(i.value), 1); run(); });
      fac.querySelector("#frm").onchange = e => { keep = "#frm"; F.frm = e.target.value; run(); }; fac.querySelector("#to").onchange = e => { keep = "#to"; F.to = e.target.value; run(); };
      fac.querySelector("#clr").onclick = () => { F.cats = []; F.authors = []; F.years = []; F.frm = F.to = ""; run(); };
      if (keep) { fac.querySelector(keep)?.focus(); keep = null; }  // o painel é redesenhado: devolve o foco ao controle usado
      const ans = r.status === "answered"
        ? `<div class="ans">${esc(r.answer).replace(/\[(\d+)\]/g, "<sup>$1</sup>")}</div><p class="k">[1] ${esc(r.sources[0].title)} · ${esc(r.sources[0].author)} · ${r.sources[0].date} · ${esc(r.sources[0].category)}</p>`
        : r.status === "browse" ? `<p class="k">${T("Sem pergunta: mostrando os mais recentes dentro dos filtros.", "No question: showing the most recent within the filters.")}</p>`
        : `<div class="ans no"><strong>${T("Não sei.", "I don't know.")}</strong> ${esc(r.reason || "")}</div>`;
      const cmp = r.status === "browse" ? "" : `<span class="tag">${T("pré-filtro", "pre-filter")}: ${r.hits.length} ${T("resultados", "results")}</span><span class="tag warn">${T("pós-filtro (top-5 sem filtro, depois filtra)", "post-filter (top-5 unfiltered, then filter)")}: ${r.post_filter_n ?? 0}</span>`;
      out.innerHTML = `<p style="margin:8px 0 0"><span class="tag ${r.status === "refused" ? "warn" : "ok"}">${{ answered: T("respondida", "answered"), refused: T("recusada", "refused"), browse: T("navegação", "browse") }[r.status]}</span><span class="tag">${r.n_cand} / ${ch.length} ${T("posts passam nos filtros", "posts pass the filters")}</span>${cmp}</p>${ans}<h2 style="margin-top:20px">${T("Resultados", "Results")}</h2>` +
        (r.hits.length ? r.hits.map((h, i) => { const c = ch[h.id]; return `<div class="psg ${used.has(h.id) ? "used" : ""}"><div class="meta"><span>#${i + 1}</span><span>${esc(c.category)}</span><span>${esc(c.author)}</span><span>${c.date}</span>${r.status === "browse" ? "" : `<span>BM25 ${h.bm25}</span><span>cos ${h.cos}</span><span>RRF ${h.rrf}</span>${bar(h.rrf, max)}`}${used.has(h.id) ? `<span class="tag ok">${T("citado", "cited")}</span>` : ""}</div><strong>${hl(c.title, r.terms)}</strong><br>${hl(c.text, r.terms)}</div>`; }).join("") : `<p class="k">${T("Nenhum resultado.", "No results.")}</p>`);
    };
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); run(); };
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => { q.value = b.textContent; run(); });
    document.addEventListener("langchange", run); run();
  });
})();
