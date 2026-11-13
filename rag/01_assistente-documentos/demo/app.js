(async function () {
  const { B, T, esc, hl, bar, shell } = UI;
  const ix = window.RAG_INDEX;
  const EX = ["como reinicio o roteador?", "quanto tempo dura a garantia?", "quantos dias por semana posso trabalhar de casa?", "quem ganhou a copa de 2014?"];
  shell({
    tag: ["Projeto RAG 01 · estudo", "RAG project 01 · study"], title: "Assistente de documentos com citação",
    h1: ["Pergunte ao manual e veja de onde veio cada frase", "Ask the manual and see where each sentence came from"],
    sub: ["Três documentos fictícios em PT-BR (manual de roteador, política de home office, garantia). A resposta é montada só com frases literais dos documentos, cada uma com [n] apontando para documento, seção e linha.", "Three fictional PT-BR documents (router manual, remote-work policy, warranty). The answer is built only from literal document sentences, each with [n] pointing to document, section and line."],
    pipe: [["Chunking por seção", "Section chunking", "30 trechos de até 45 palavras", "30 passages of up to 45 words"], ["Busca híbrida", "Hybrid search", "BM25 + TF-IDF de n-gramas, fusão RRF", "BM25 + char n-gram TF-IDF, RRF fusion"], ["Glossário", "Glossary", "sinônimos só na pergunta", "synonyms on the question side only"], ["Frases + citação", "Sentences + citation", "até 2 frases literais com [n]", "up to 2 literal sentences with [n]"], ["Guardrail", "Guardrail", "cobertura < 50% → recusa", "coverage < 50% → refuses"]],
    real: [["Chunking, BM25, vetores de n-gramas, fusão RRF e extração de frases rodam aqui no navegador, com os mesmos números do código Python (teste de paridade).", "Chunking, BM25, n-gram vectors, RRF fusion and sentence extraction run right here in the browser, with the same numbers as the Python code (parity test)."], ["Toda frase da resposta existe palavra por palavra no documento citado (conferido em teste).", "Every sentence in the answer exists word for word in the cited document (checked in a test)."]],
    sim: [["Não há LLM: a resposta é extrativa, não explica nem junta ideias. Não há embeddings neurais: a parte vetorial é TF-IDF de n-gramas.", "There is no LLM: the answer is extractive, it does not explain or merge ideas. There are no neural embeddings: the vector part is n-gram TF-IDF."], ["Documentos fictícios, escritos para este estudo. Protótipo de portfólio, não está em produção em lugar nenhum.", "Fictional documents written for this study. Portfolio prototype, not in production anywhere."], ["Sinônimos dependem de um glossário escrito à mão; sem ele, \"reiniciar\" não acha \"redefinir\".", "Synonyms rely on a hand-written glossary; without it, \"reiniciar\" does not find \"redefinir\"."]],
    foot: ["Estudo de RAG local · dados fictícios · sem chave, sem servidor.", "Local RAG study · fictional data · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><form class="ask" id="f"><label class="k" for="q" style="width:100%">${B("Sua pergunta (PT-BR)", "Your question (PT-BR)")}</label><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Perguntar", "Ask")}</button></form><div class="pre" id="ex"></div><div id="out" aria-live="polite"></div></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out");
    stage.querySelector("#ex").innerHTML = EX.map(e => `<button type="button" class="chip">${esc(e)}</button>`).join("");
    const run = () => {
      const r = Engine.answer(ix, q.value, 4), used = new Set(r.sources.map(s => s.id)), max = Math.max(...r.hits.map(h => h.rrf), 1e-9);
      const ans = r.status === "answered"
        ? `<div class="ans">${esc(r.answer).replace(/\[(\d+)\]/g, "<sup>$1</sup>")}</div><p class="k">${r.sources.map((s, i) => `[${i + 1}] ${esc(s.doc)} · ${esc(s.section)} · ${T("linha", "line")} ${s.line}`).join("<br>")}</p>`
        : `<div class="ans no"><strong>${T("Não sei.", "I don't know.")}</strong> ${esc(r.reason || "")}</div>`;
      out.innerHTML = `<p style="margin:16px 0 0"><span class="tag ${r.status === "answered" ? "ok" : "warn"}">${r.status === "answered" ? T("respondida", "answered") : T("recusada", "refused")}</span><span class="tag">${T("cobertura", "coverage")} ${Math.round(r.coverage * 100)}%</span><span class="tag">${T("termos", "terms")}: ${esc(r.terms.join(" "))}</span></p>${ans}
      <h2 style="margin-top:20px">${T("Trechos recuperados", "Retrieved passages")}</h2>` + r.hits.map((h, i) => { const c = ix.chunks[h.id]; return `<div class="psg ${used.has(h.id) ? "used" : ""}"><div class="meta"><span>#${i + 1}</span><span>${esc(c.doc)} · ${esc(c.section)}</span><span>BM25 ${h.bm25}</span><span>cos ${h.cos}</span><span>RRF ${h.rrf}</span>${bar(h.rrf, max)}${used.has(h.id) ? `<span class="tag ok">${T("citado", "cited")}</span>` : ""}</div>${hl(c.text, r.terms)}</div>`; }).join("");
    };
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); run(); };
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => { q.value = b.textContent; run(); });
    document.addEventListener("langchange", run); run();
  });
})();
