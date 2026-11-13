(async function () {
  const { B, T, esc, hl, bar, shell } = UI;
  const ix = window.RAG_INDEX, ch = ix.chunks;
  const EX = ["como calcular o valor do frete?", "como validar um CEP?", "qual o prazo de entrega para o nordeste?", "como fechar um pedido?", "como enviar e-mail de confirmação?"];
  const files = [...new Set(ch.map(c => c.file))];
  shell({
    tag: ["Projeto RAG 11 · estudo", "RAG project 11 · study"], title: "RAG de código com arquivo:linha",
    h1: ["Pergunte ao repositório e receba arquivo:linha", "Ask the repository and get file:line back"],
    sub: [`Um pacote Python fictício de frete (${files.length} arquivos, ${ch.length} trechos de código). O código é cortado por função, classe, método e constante; a resposta cita a docstring literal e o ponto exato do arquivo.`, `A fictional Python shipping package (${files.length} files, ${ch.length} code chunks). Code is split by function, class, method and constant; the answer quotes the literal docstring and the exact spot in the file.`],
    pipe: [["Chunking por AST", "AST chunking", "função, classe, método, constante, com linhas", "function, class, method, constant, with lines"], ["Identificadores", "Identifiers", "calcular_frete → calcular frete", "calcular_frete → calcular frete"], ["Busca híbrida", "Hybrid search", "BM25 + n-gramas, fusão RRF", "BM25 + n-grams, RRF fusion"], ["Citação", "Citation", "arquivo:linha do def/class", "file:line of the def/class"], ["Guardrail", "Guardrail", "cobertura < 50% → recusa", "coverage < 50% → refuses"]],
    real: [["O corte por AST (módulo ast do Python), a busca e a citação rodam de verdade; o teste abre cada arquivo e confere que o arquivo:linha citado é mesmo o def/class/constante.", "AST chunking (Python's ast module), search and citation are real; a test opens every file and checks that the cited file:line really is the def/class/constant."], ["A busca roda no navegador com os mesmos números do Python (teste de paridade); o repositório de exemplo tem um teste de fumaça que passa.", "Search runs in the browser with the same numbers as the Python code (parity test); the example repository has a smoke test that passes."]],
    sim: [["Sem LLM: a resposta é a 1ª linha da docstring (ou a linha da constante), não explica o código. Sem embeddings neurais. As perguntas e os docstrings estão em português; sem glossário de sinônimos, \"somar\" não acha \"soma\".", "No LLM: the answer is the first docstring line (or the constant line), it does not explain the code. No neural embeddings. Questions and docstrings are in Portuguese; with no synonym glossary, \"somar\" does not find \"soma\"."], ["Repositório de exemplo fictício, só Python, 7 arquivos. Protótipo de portfólio, não está em produção em lugar nenhum.", "Fictional example repository, Python only, 7 files. Portfolio prototype, not in production anywhere."]],
    foot: ["Estudo de RAG local · dados fictícios · sem chave, sem servidor.", "Local RAG study · fictional data · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><form class="ask" id="f"><label class="k" for="q" style="width:100%">${B("Sua pergunta sobre o código (PT-BR)", "Your question about the code (PT-BR)")}</label><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Perguntar", "Ask")}</button></form><div class="pre" id="ex"></div>
    <p class="k" style="margin:12px 0 0">${B("Arquivos do repositório", "Repository files")}: ${files.map(f => `<code>${esc(f)}</code>`).join(" · ")}</p><div id="out" aria-live="polite"></div></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out");
    stage.querySelector("#ex").innerHTML = EX.map(e => `<button type="button" class="chip">${esc(e)}</button>`).join("");
    const code = c => `<div class="code" tabindex="0" role="region" aria-label="${esc(c.file)}">${c.code.split("\n").map((l, n) => `<div class="${c.start + n === c.line ? "hit" : ""}"><i>${c.start + n}</i><span>${esc(l) || " "}</span></div>`).join("")}</div>`;
    const run = () => {
      const r = Engine.answer(ix, q.value, 4), used = new Set(r.sources.map(s => s.id)), max = Math.max(...r.hits.map(h => h.rrf), 1e-9);
      const ans = r.status === "answered"
        ? `<div class="ans">${esc(r.answer).replace(/\[(\d+)\]/g, "<sup>$1</sup>")}</div><p class="k">[1] <strong>${esc(r.sources[0].ref)}</strong> · ${esc(r.sources[0].kind)} ${esc(r.sources[0].name)}</p>`
        : `<div class="ans no"><strong>${T("Não sei.", "I don't know.")}</strong> ${esc(r.reason || "")}</div>`;
      out.innerHTML = `<p style="margin:16px 0 0"><span class="tag ${r.status === "answered" ? "ok" : "warn"}">${r.status === "answered" ? T("respondida", "answered") : T("recusada", "refused")}</span><span class="tag">${T("cobertura", "coverage")} ${Math.round(r.coverage * 100)}%</span><span class="tag">${T("termos", "terms")}: ${esc(r.terms.join(" "))}</span></p>${ans}<h2 style="margin-top:20px">${T("Trechos recuperados", "Retrieved chunks")}</h2>` +
        r.hits.map((h, i) => { const c = ch[h.id]; return `<div class="psg ${used.has(h.id) ? "used" : ""}"><div class="meta"><span>#${i + 1}</span><span><strong>${esc(c.file)}:${c.line}</strong></span><span>${esc(c.kind)} ${esc(c.name)}</span><span>BM25 ${h.bm25}</span><span>cos ${h.cos}</span><span>RRF ${h.rrf}</span>${bar(h.rrf, max)}${used.has(h.id) ? `<span class="tag ok">${T("citado", "cited")}</span>` : ""}</div>${code(c)}</div>`; }).join("");
    };
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); run(); };
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => { q.value = b.textContent; run(); });
    document.addEventListener("langchange", run); run();
  });
})();
