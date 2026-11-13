(function () {
  const { B, T, esc, bar, shell } = UI;
  const ix = window.RAG_INDEX, CH = ix.chunks;
  const EX = ["quanto vou pagar com 350 kWh no plano Casa?", "quanto economizo no plano Casa?", "qual a diferença entre Casa e Empresa para 600 kWh?", "quanto pago com 300 kWh?", "qual plano serve para 700 kWh?", "tem multa se eu cancelar?", "quanto custa o plano Premium com 200 kWh?", "qual o preço do bitcoin?"];
  shell({
    tag: ["Projeto RAG 15 · estudo", "RAG project 15 · study"], title: "RAG agêntico: buscar, calcular ou perguntar",
    h1: ["O agente decide o que fazer e mostra cada passo", "The agent decides what to do and shows each step"],
    sub: ["Um guia fictício de cooperativa de energia solar. Se a pergunta é de consulta, o agente busca. Se pede uma conta, busca os números e calcula. Se falta o consumo, pergunta de volta em vez de chutar. Se não tem base, recusa.", "A fictional guide of a solar energy co-op. For a lookup question the agent searches. For a calculation it fetches the numbers and computes. If the consumption is missing it asks back instead of guessing. With no evidence it refuses."],
    pipe: [["Entender", "Understand", "intenção (consulta, custo, economia, comparar, qual plano) + campos kWh e plano", "intent (lookup, cost, savings, compare, which plan) + kWh and plan fields"], ["Decidir", "Decide", "falta dado? pergunta. Precisa de número? busca e calcula. Senão, só busca", "missing data? ask. Needs a number? search and compute. Otherwise just search"], ["Buscar", "Search", "BM25 + n-gramas (RRF); tarifa e taxa extraídas dos trechos", "BM25 + n-grams (RRF); rate and fee extracted from the passages"], ["Calcular", "Compute", "aritmética segura, sem eval", "safe arithmetic, no eval"], ["Responder", "Answer", "com os trechos citados, ou recusar", "with the passages cited, or refuse"]],
    real: [["O planejador, a busca, a extração de números e a calculadora rodam de verdade, no navegador e em Python, com os mesmos passos e resultados (teste de paridade). A calculadora é um analisador próprio (+ − × ÷ e parênteses), sem eval. Em 29 perguntas, o agente escolheu a rota certa em todas (DEV e TESTE); o RAG simples acertou 0 das 7 contas (README).", "The planner, search, number extraction and calculator really run, in the browser and in Python, with the same steps and results (parity test). The calculator is its own parser (+ − × ÷ and parentheses), no eval. On 29 questions the agent picked the right route in all of them (DEV and TEST); plain RAG got 0 of the 7 calculations (README)."]],
    sim: [["Não há LLM: o \"raciocínio\" mostrado é texto de modelo, e a decisão vem de regras sobre a pergunta e o estado da conversa. Frase fora dos moldes (\"e se eu usar 20% mais?\") não é entendida. Um plano com nome próprio inexistente (\"plano Premium\") é recusado, mas escrito em minúscula passa despercebido. Guia, planos e preços são fictícios.", "There is no LLM: the \"reasoning\" shown is template text, and the decision comes from rules over the question and the conversation state. Phrasing outside the templates (\"what if I use 20% more?\") is not understood. A non-existent proper-name plan (\"plano Premium\") is refused, but written in lowercase it slips by. Guide, plans and prices are fictional."], ["Regras e glossário foram escritos pelo mesmo autor das perguntas, então a taxa de acerto é otimista (README). Protótipo de portfólio, não está em produção em lugar nenhum.", "Rules and glossary were written by the same author as the questions, so the hit rate is optimistic (README). Portfolio prototype, not in production anywhere."]],
    foot: ["Estudo de RAG local · cooperativa fictícia · sem chave, sem servidor.", "Local RAG study · fictional co-op · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><label class="k" for="q">${B("Pergunta", "Question")}</label><form class="ask" id="f"><input id="q" autocomplete="off" value="${esc(EX[0])}"><button class="btn" type="submit">${B("Perguntar", "Ask")}</button></form><div class="pre" id="ex"></div>
      <p class="k" id="pend" style="min-height:1.4em;margin:10px 0 0"></p><div id="out" aria-live="polite"></div></div>`;
    const q = stage.querySelector("#q"), out = stage.querySelector("#out"), pend = stage.querySelector("#pend"); let state = {}, last = null, lastQ = "";
    stage.querySelector("#ex").innerHTML = EX.map((x, i) => `<button class="chip" type="button" data-i="${i}">${esc(x)}</button>`).join("");
    const KIND = { pensar: ["", "pensar", "think"], buscar: ["", "buscar", "search"], calcular: ["calc", "calcular", "compute"], perguntar: ["ask", "perguntar", "ask back"], responder: ["", "responder", "answer"], recusar: ["stop", "recusar", "refuse"] };
    function paint() {
      pend.innerHTML = state.pending ? `${T("O agente está esperando o consumo em kWh: responda com um número (ex.: 400) ou faça outra pergunta.", "The agent is waiting for the consumption in kWh: reply with a number (e.g. 400) or ask something else.")}` : "";
      if (!last) { out.innerHTML = ""; return; }
      const r = last, tag = { answer: ["ok", "respondeu", "answered"], ask: ["warn", "perguntou de volta", "asked back"], refuse: ["err", "recusou", "refused"] }[r.kind];
      out.innerHTML = `<p style="margin:14px 0 6px"><span class="tag ${tag[0]}">${T(tag[1], tag[2])}</span><span class="tag">${r.steps.filter(s => s.k !== "pensar").length} ${T("ferramentas", "tool calls")}</span></p><ol class="steps">` + r.steps.map(s => {
        const k = KIND[s.k]; let body = "";
        if (s.k === "pensar") body = esc(s.t);
        else if (s.k === "buscar") body = `${esc(s.q)}<span class="obs">${T("confiança", "confidence")} ${s.conf.toFixed(2)} · ${s.hits.slice(0, 2).map(h => `#${CH[h.id].id} ${T("linha", "line")} ${CH[h.id].line}`).join(", ")}</span><span class="obs">→ ${esc(s.obs)}</span>`;
        else if (s.k === "calcular") body = `<code>${esc(s.expr.replace(/\*/g, " × ").replace(/\//g, " ÷ "))} = ${s.res}</code><span class="obs">${esc(s.obs)}</span>`;
        else body = esc(s.t);
        return `<li class="${k[0]}"><span class="tag">${T(k[1], k[2])}</span> ${body}</li>`;
      }).join("") + `</ol>` + (r.cite.length ? `<p class="k">${T("Fontes", "Sources")}: ${[...new Set(r.cite)].map(i => `<span class="cite">${CH[i].section} · ${T("linha", "line")} ${CH[i].line}</span>`).join(" ")}</p>` : "") +
        `<h2 style="margin-top:18px">${T("Para comparar: o RAG simples (sempre busca e devolve o melhor trecho)", "For comparison: plain RAG (always searches and returns the best passage)")}</h2><div class="psg">${esc(Engine.simpleRag(ix, lastQ))}</div>`;
    }
    function send(text) { text = text.trim(); if (!text) return; lastQ = text; last = Engine.agent(ix, text, state); state = last.state; paint(); }
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); send(q.value); if (state.pending) { q.value = ""; q.focus(); } };
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => { q.value = EX[+b.dataset.i]; state = {}; send(EX[+b.dataset.i]); });
    document.addEventListener("langchange", paint); send(EX[0]);
  });
})();
