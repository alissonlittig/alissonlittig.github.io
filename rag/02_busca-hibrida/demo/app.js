(function () {
  const { B, T, esc, bar, shell } = UI, ix = window.RAG_INDEX, E = Engine;
  const NAMES = { bm25: ["BM25 (palavras)", "BM25 (words)"], vector: ["Vetorial (n-gramas)", "Vector (n-grams)"], lsa: ["Denso (LSA)", "Dense (LSA)"], hybrid: ["Híbrido (RRF)", "Hybrid (RRF)"], rerank: ["Híbrido + rerank", "Hybrid + rerank"] };
  const EX = ["como recuperar arquivo excluído sem querer", "quem atende fora do expediente de madrugada", "jogar computador velho no lixo", "esqueci de bater o ponto"];
  const ev = E.evaluate(ix, ix.questions);
  shell({
    tag: ["Projeto RAG 02 · estudo", "RAG project 02 · study"], title: "Busca híbrida com reranking e métricas",
    h1: ["Cinco jeitos de buscar, medidos lado a lado", "Five ways to search, measured side by side"],
    sub: ["Uma wiki fictícia de TI e RH (37 trechos) e 34 perguntas com a resposta certa conhecida. Digite uma pergunta e veja o ranking de cada estratégia; embaixo, recall@k e MRR calculados aqui no navegador.", "A fictional IT/HR wiki (37 passages) and 34 questions with a known correct answer. Type a question and see each strategy's ranking; below, recall@k and MRR computed right here in the browser."],
    pipe: [["BM25", "BM25", "palavras, com peso por raridade", "words, weighted by rarity"], ["Vetorial esparso", "Sparse vector", "TF-IDF de n-gramas de 3 letras", "3-letter n-gram TF-IDF"], ["Denso LSA", "Dense LSA", "SVD do TF-IDF, 24 dimensões", "TF-IDF SVD, 24 dimensions"], ["Fusão RRF", "RRF fusion", "soma 1/(60+posição) dos três", "sums 1/(60+rank) of the three"], ["Reranker", "Reranker", "cobertura + bigramas + título (heurística)", "coverage + bigrams + title (heuristic)"]],
    real: [["Os cinco rankings, os scores e as métricas são calculados no navegador pelo mesmo código do Python (teste confere rankings, scores e métricas).", "The five rankings, scores and metrics are computed in the browser by the same logic as the Python code (a test checks rankings, scores and metrics)."], ["Recall@k = a resposta certa está entre os k primeiros; MRR = média de 1/posição da primeira resposta certa.", "Recall@k = the right answer is among the top k; MRR = mean of 1/rank of the first right answer."]],
    sim: [["Corpus minúsculo e fictício, e as perguntas foram escritas por mim para este corpus: os números mostram como comparar estratégias, não que uma é melhor em geral. Em 37 trechos, quase tudo já funciona bem.", "Tiny fictional corpus, and the questions were written by me for it: the numbers show how to compare strategies, not that one is better in general. With 37 passages almost everything already works."], ["O denso é LSA (local, estatístico), não um modelo neural de embeddings. O reranker é uma heurística, não um cross-encoder; aqui ele praticamente não muda o resultado.", "The dense part is LSA (local, statistical), not a neural embedding model. The reranker is a heuristic, not a cross-encoder; here it barely changes the result."], ["Não há geração de resposta neste projeto, só recuperação. Protótipo de portfólio, não está em produção.", "No answer generation in this project, retrieval only. Portfolio prototype, not in production."]],
    foot: ["Estudo de RAG local · dados fictícios · sem chave, sem servidor.", "Local RAG study · fictional data · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><form class="ask" id="f"><label class="k" for="q" style="width:100%">${B("Sua pergunta (PT-BR)", "Your question (PT-BR)")}</label><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Buscar", "Search")}</button></form><div class="pre" id="ex"></div><div id="out" aria-live="polite"></div></div>
    <div class="card" style="margin-top:18px"><h2 style="margin-bottom:10px">${B("Métricas nas 34 perguntas", "Metrics on the 34 questions")}</h2><div class="pre" id="seg" style="margin:0 0 12px"></div><div class="scroll" id="met"></div><p class="k" id="legend" style="margin-top:10px"></p></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out"); let seg = "all";
    stage.querySelector("#ex").innerHTML = EX.map(e => `<button type="button" class="chip">${esc(e)}</button>`).join("");
    const SEG = [["all", "Todas", "All"], ["L", "Mesmas palavras", "Same words"], ["P", "Paráfrase", "Paraphrase"], ["H", "Vocabulário diferente", "Different vocabulary"]];
    const run = () => {
      const s = E.search(ix, q.value), known = ix.questions.find(x => x.q === q.value.trim()), rel = known ? known.rel : [];
      out.innerHTML = `<p class="k" style="margin:16px 0 8px">${T("termos", "terms")}: ${esc(s.terms.join(" ")) || "—"}${known ? ` · <span class="tag ok">${T("resposta certa conhecida", "known right answer")}: ${esc(ix.passages[rel[0]].title)}</span>` : ""}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">` + E.MODES.map(m => { s[m] = s[m].slice(0, 5); const mx = s[m].length ? Math.max(...s[m].map(x => x[1])) : 1; return `<div><div class="k" style="margin-bottom:6px;color:var(--tx)">${T(...NAMES[m])}</div>` + (s[m].length ? s[m].map(([i, sc], n) => `<div class="psg ${rel.includes(i) ? "used" : ""}" style="padding:9px 11px;margin-bottom:6px"><div class="meta" style="margin:0"><span>#${n + 1}</span><span>${sc}</span>${bar(sc, mx)}</div>${esc(ix.passages[i].title)}${rel.includes(i) ? ` <span class="tag ok">✓</span>` : ""}</div>`).join("") : `<div class="psg">${T("nada encontrado", "nothing found")}</div>`) + `</div>`; }).join("") + `</div>`;
      document.querySelector("#legend").textContent = T("Melhor MRR do recorte em verde. Borda laranja = trecho certo (quando a pergunta é uma das 34).", "Best MRR of the slice in green. Orange border = right passage (when the question is one of the 34).");
    };
    const met = () => {
      const rows = seg === "all" ? ev.all : ev.by_type[seg], best = Math.max(...E.MODES.map(m => rows[m].mrr)), n = seg === "all" ? ix.questions.length : ix.questions.filter(x => x.type === seg).length;
      stage.querySelector("#met").innerHTML = `<table><tr><th>${T("Estratégia", "Strategy")} (n=${n})</th><th class="n">recall@1</th><th class="n">recall@3</th><th class="n">recall@5</th><th class="n">MRR</th></tr>` + E.MODES.map(m => `<tr class="${rows[m].mrr === best ? "best" : ""}"><td>${T(...NAMES[m])}</td>${["recall@1", "recall@3", "recall@5", "mrr"].map(k => `<td class="n">${rows[m][k].toFixed(3)}</td>`).join("")}</tr>`).join("") + `</table>`;
      stage.querySelector("#seg").innerHTML = SEG.map(x => `<button type="button" class="chip" aria-pressed="${x[0] === seg}" data-s="${x[0]}">${T(x[1], x[2])}</button>`).join("");
      stage.querySelectorAll("#seg .chip").forEach(b => b.onclick = () => { seg = b.dataset.s; met(); });
    };
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); run(); };
    stage.querySelectorAll("#ex .chip").forEach(b => b.onclick = () => { q.value = b.textContent; run(); });
    document.addEventListener("langchange", () => { run(); met(); }); run(); met();
  });
})();
