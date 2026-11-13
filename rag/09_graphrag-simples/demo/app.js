(async function () {
  const { B, T, esc, hl, bar, shell } = UI;
  const ix = window.RAG_INDEX;
  const EX = ["Qual rio influencia o lugar estudado por Marta Lacerda?", "Quem preside a fundação que financia o projeto de Helena Duarte?", "O que liga Otávio Brandão ao Projeto Maré Alta?", "Quem trabalha com Iuri Mendes?", "quem ganhou a copa de 2014?"];
  const COL = { "pessoa": "#ff7a2f", "organização": "#5bd18b", "projeto": "#f5c04a", "lugar": "#7db7ff" };
  shell({
    tag: ["Projeto RAG 09 · estudo", "RAG project 09 · study"], title: "GraphRAG simples",
    h1: ["Do texto ao grafo: busca que anda pelas conexões", "From text to graph: search that walks the connections"],
    sub: ["13 parágrafos fictícios sobre um instituto de pesquisa costeira. As entidades viram nós, parágrafos em comum viram arestas, e a pergunta abre uma vizinhança de N saltos em volta das entidades citadas.", "13 fictional paragraphs about a coastal research institute. Entities become nodes, shared paragraphs become edges, and the question opens an N-hop neighborhood around the entities it mentions."],
    pipe: [["Entidades", "Entities", "dicionário de 15 nomes (NER simulado)", "15-name dictionary (simulated NER)"], ["Grafo", "Graph", "aresta = duas entidades no mesmo parágrafo", "edge = two entities in the same paragraph"], ["Sementes", "Seeds", "entidades citadas na pergunta", "entities named in the question"], ["Vizinhança", "Neighborhood", "BFS de 0 a 2 saltos", "BFS of 0 to 2 hops"], ["Nota", "Score", "0,6 léxica + 0,4 grafo, resposta com [n]", "0.6 lexical + 0.4 graph, answer with [n]"]],
    real: [["Grafo, BFS, busca léxica (BM25 + n-gramas) e extração de frases rodam no navegador com os mesmos números do Python (teste de paridade).", "Graph, BFS, lexical search (BM25 + n-grams) and sentence extraction run in the browser with the same numbers as the Python code (parity test)."], ["Cada aresta é conferida em teste contra uma contagem feita à mão; os caminhos mostrados são sequências de arestas reais.", "Every edge is checked in a test against a hand count; the paths shown are sequences of real edges."]],
    sim: [["As entidades vêm de um dicionário escrito à mão, não de um modelo de NER; sem relações tipadas (só co-ocorrência).", "Entities come from a hand-written dictionary, not an NER model; no typed relations (co-occurrence only)."], ["Neste corpus minúsculo a busca léxica sozinha já acha quase tudo: o grafo aqui mostra as conexões, não melhora o recall (veja o README).", "In this tiny corpus plain lexical search already finds almost everything: here the graph shows the connections, it does not improve recall (see the README)."], ["Dados fictícios. Protótipo de portfólio, não está em produção em lugar nenhum. Sem LLM: resposta extrativa.", "Fictional data. Portfolio prototype, not in production anywhere. No LLM: extractive answer."]],
    foot: ["Estudo de RAG local · dados fictícios · sem chave, sem servidor.", "Local RAG study · fictional data · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><form class="ask" id="f"><label class="k" for="q" style="width:100%">${B("Sua pergunta (PT-BR)", "Your question (PT-BR)")}</label><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Perguntar", "Ask")}</button></form><div class="pre" id="ex"></div>
    <label class="sl"><span>${B("Saltos no grafo", "Graph hops")}: <b id="hv">1</b></span><input id="h" type="range" min="0" max="2" value="1"></label><div id="out" aria-live="polite"></div></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out"), h = stage.querySelector("#h");
    stage.querySelector("#ex").innerHTML = EX.map(e => `<button type="button" class="chip">${esc(e)}</button>`).join("");
    const xs = Object.values(ix.pos).map(p => p[0]), ys = Object.values(ix.pos).map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const P = id => { const p = ix.pos[id]; return [60 + (p[0] - x0) / (x1 - x0 || 1) * 520, 30 + (p[1] - y0) / (y1 - y0 || 1) * 330]; };
    const graph = r => {
      const d = r.dist, inb = new Set(r.hits.flatMap(x => ix.chunks[x.id].ents)), edges = ix.edges.map(([a, b, w]) => { const on = a in d && b in d; const [ax, ay] = P(a), [bx, by] = P(b); return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${on ? "#ff7a2f" : "#2b2b2b"}" stroke-width="${on ? 1.5 + w : 1}" opacity="${on ? 0.9 : 0.8}"/>`; }).join("");
      const nodes = ix.entities.map(e => { const [x, y] = P(e.id), s = r.seeds.includes(e.id), dd = d[e.id], on = dd !== undefined; return `<g><circle cx="${x}" cy="${y}" r="${s ? 11 : on ? 9 : 6}" fill="${on ? COL[e.tipo] : "#1b1b1b"}" stroke="${s ? "#f2f1ec" : COL[e.tipo]}" stroke-width="${s ? 3 : 1.5}" opacity="${on || !r.seeds.length ? 1 : 0.55}"/><text x="${x}" y="${y - 14}" text-anchor="middle" font-size="11" fill="${on ? "#f2f1ec" : "#a9a9a3"}" font-family="Archivo,system-ui,sans-serif">${esc(e.name)}</text></g>`; }).join("");
      return `<div class="gwrap"><svg viewBox="0 0 640 390" role="img" aria-label="${T("Grafo de entidades", "Entity graph")}">${edges}${nodes}</svg></div><p class="k">${Object.entries(COL).map(([t, c]) => `<span style="color:${c}">●</span> ${t}`).join(" &nbsp; ")} &nbsp; ◯ ${T("branco = semente", "white ring = seed")}</p>`;
    };
    const run = () => {
      const hops = +h.value; stage.querySelector("#hv").textContent = hops;
      const r = Engine.answer(ix, q.value, hops, 4), used = new Set(r.sources.map(s => s.id)), base = new Set(r.baseline);
      const ans = r.status === "answered"
        ? `<div class="ans">${esc(r.answer).replace(/\[(\d+)\]/g, "<sup>$1</sup>")}</div><p class="k">${r.sources.map((s, i) => `[${i + 1}] ${esc(s.doc)} · ${esc(s.section)} · ${T("linha", "line")} ${s.line}`).join("<br>")}</p>`
        : `<div class="ans no"><strong>${T("Não sei.", "I don't know.")}</strong> ${esc(r.reason || "")}</div>`;
      const max = Math.max(...r.hits.map(x => x.score), 1e-9);
      out.innerHTML = `<p style="margin:16px 0 0"><span class="tag ${r.status === "answered" ? "ok" : "warn"}">${r.status === "answered" ? T("respondida", "answered") : T("recusada", "refused")}</span><span class="tag">${T("sementes", "seeds")} (${r.seed_from === "pergunta" ? T("da pergunta", "from question") : T("dos trechos", "from passages")}): ${esc(r.seeds.map(i => ix.entities[i].name).join(", ") || "—")}</span></p>${ans}
      <div class="grid2"><div><h2 style="margin-top:14px">${T("Grafo", "Graph")}</h2>${graph(r)}</div><div><h2 style="margin-top:14px">${T("Trechos recuperados", "Retrieved passages")}</h2>` +
        r.hits.map((x, i) => { const c = ix.chunks[x.id]; return `<div class="psg ${used.has(x.id) ? "used" : ""}"><div class="meta"><span>#${i + 1}</span><span>${esc(c.section)} · ${T("linha", "line")} ${c.line}</span><span>${T("nota", "score")} ${x.score}</span><span>${T("léxica", "lexical")} ${x.lex}</span><span>${T("grafo", "graph")} ${x.graph}</span>${bar(x.score, max)}${base.has(x.id) ? "" : `<span class="tag warn">${T("só pelo grafo", "graph only")}</span>`}${used.has(x.id) ? `<span class="tag ok">${T("citado", "cited")}</span>` : ""}</div>${x.via.length ? `<div class="k" style="margin-bottom:6px">${T("caminho", "path")}: ${esc(x.via.join(" → "))}</div>` : ""}${hl(c.text, r.terms)}</div>`; }).join("") +
        `<p class="k">${T("Só busca léxica (sem grafo), top-3", "Lexical search only (no graph), top-3")}: ${r.baseline.map(i => "#" + ix.chunks[i].line).join(" · ") || "—"} ${T("(linhas)", "(lines)")}</p></div></div>`;
    };
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); run(); };
    h.oninput = run;
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => { q.value = b.textContent; run(); });
    document.addEventListener("langchange", run); run();
  });
})();
