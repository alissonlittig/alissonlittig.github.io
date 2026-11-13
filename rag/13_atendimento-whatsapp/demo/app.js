(function () {
  const { B, T, esc, bar, shell } = UI;
  const ix = window.RAG_INDEX, byId = Object.fromEntries(ix.docs.map(d => [d.id, d]));
  const EX = ["oi, boa tarde! quanto custa o vaso aurora grande?", "quanto custa o vaso aurora?", "tem espada de são jorge ainda?", "quanto demora a entrega pra Curitiba?", "a planta chegou murcha", "meu pedido 48213 não chegou", "vocês vendem orquídea phalaenopsis?", "vou denunciar no procon, que absurdo"];
  shell({
    tag: ["Projeto RAG 13 · estudo", "RAG project 13 · study"], title: "RAG de atendimento por WhatsApp (simulado)",
    h1: ["Um atendente que responde com o catálogo e sabe a hora de chamar um humano", "A support agent that answers from the catalog and knows when to call a human"],
    sub: ["Converse com a loja fictícia Casa Tramonto. A resposta usa só preço, estoque e texto da FAQ cadastrados. Se não há base, a conversa vai para uma pessoa, com um resumo do chamado.", "Chat with the fictional shop Casa Tramonto. Answers use only the registered price, stock and FAQ text. With no evidence, the conversation goes to a person, with a ticket summary."],
    pipe: [["Regras", "Rules", "saudação, pedido de humano, tema sensível, número de pedido", "greeting, human request, sensitive topic, order number"], ["Recuperar", "Retrieve", "BM25 + n-gramas (RRF) em produtos e políticas", "BM25 + n-grams (RRF) over products and policies"], ["Confiança", "Confidence", "0,5 · similaridade + 0,5 · cobertura dos termos", "0.5 · similarity + 0.5 · term coverage"], ["Montar", "Compose", "só campos cadastrados (preço, estoque, FAQ)", "registered fields only (price, stock, FAQ)"], ["Decidir", "Decide", "responde, pergunta de volta ou encaminha com chamado", "answer, ask back or hand off with a ticket"]],
    real: [["O motor roda de verdade, no navegador e em Python, com os mesmos resultados (teste de paridade). Respostas são montadas só com campos cadastrados; nada é gerado. O limiar foi fixado antes de medir a metade TESTE de 40 mensagens (README).", "The engine really runs, in the browser and in Python, with the same results (parity test). Answers are built only from registered fields; nothing is generated. The threshold was fixed before measuring the TEST half of 40 messages (README)."]],
    sim: [["Não existe WhatsApp aqui: é uma conversa simulada, nada é enviado a ninguém. O \"atendente humano\" é só um chamado mostrado na tela. Não consulta pedidos reais. Catálogo e loja são fictícios. Sem LLM.", "There is no WhatsApp here: it is a simulated chat and nothing is sent to anyone. The \"human agent\" is only a ticket shown on screen. It does not look up real orders. Catalog and shop are fictional. No LLM."], ["Limite conhecido: \"vocês vendem iphone?\" casa com \"vendem no atacado\" e é respondida. Com 20 mensagens por metade, uma mensagem mexe 5 pontos. Protótipo de portfólio, não está em produção em lugar nenhum.", "Known limit: \"do you sell iphone?\" matches \"wholesale\" and gets answered. With 20 messages per half, one message moves 5 points. Portfolio prototype, not in production anywhere."]],
    foot: ["Estudo de RAG local · loja fictícia · sem chave, sem servidor.", "Local RAG study · fictional shop · no key, no server."]
  }, stage => {
    stage.innerHTML = `<div class="card"><p class="sim">${B("Conversa simulada · nada é enviado", "Simulated chat · nothing is sent")}</p><div class="grid2"><div>
      <div class="chat" id="chat" role="log" aria-live="polite"></div>
      <form class="ask" id="f" style="margin-top:10px"><input id="q" autocomplete="off" aria-label="Mensagem / Message" placeholder="Escreva como no WhatsApp"><button class="btn" type="submit">${B("Enviar", "Send")}</button></form>
      <div class="pre" id="ex"></div>
      <label class="sl">${B("Limiar de confiança", "Confidence threshold")} <b id="tv" style="color:var(--tx)">0.50</b><input id="t" type="range" min="0.2" max="0.8" step="0.05" value="0.5"></label>
      <button class="btn sec" id="clr" type="button">${B("Limpar conversa", "Clear chat")}</button></div>
      <div id="back" aria-live="polite"></div></div></div>`;
    const chat = stage.querySelector("#chat"), q = stage.querySelector("#q"), back = stage.querySelector("#back"), tv = stage.querySelector("#t"); let hist = [], last = null;
    stage.querySelector("#ex").innerHTML = EX.map((x, i) => `<button class="chip" type="button" data-i="${i}">${esc(x)}</button>`).join("");
    const bub = (cls, txt, small) => `<div class="msg ${cls}">${esc(txt)}${small ? `<small>${small}</small>` : ""}</div>`;
    function paintBack() {
      if (!last) { back.innerHTML = `<p class="k">${T("Mande uma mensagem para ver os bastidores: trechos, scores e decisão.", "Send a message to see the back office: passages, scores and decision.")}</p>`; return; }
      const r = last, tag = { answer: ["ok", "respondeu", "answered"], clarify: ["warn", "perguntou de volta", "asked back"], handoff: ["err", "encaminhou", "handed off"], greeting: ["", "saudação", "greeting"], thanks: ["", "agradecimento", "thanks"] }[r.kind];
      back.innerHTML = `<p style="margin:0 0 10px"><span class="tag ${tag[0]}">${T(tag[1], tag[2])}</span>${r.conf != null ? `<span class="tag">${T("confiança", "confidence")} ${r.conf.toFixed(2)}</span>${bar(r.conf, 1)}` : ""}</p>` +
        (r.cands.length ? `<h2 style="margin-top:12px">${T("Candidatos recuperados", "Retrieved candidates")}</h2>` + r.cands.map((c, i) => { const d = byId[c.id]; return `<div class="psg ${c.id === r.doc ? "used" : ""}"><div class="meta"><span>#${i + 1}</span><span>${esc(d.kind)} · ${esc(c.id)}</span><span>BM25 ${c.bm25}</span><span>cos ${c.cos}</span><span>RRF ${c.rrf}</span></div>${esc(d.titulo)}</div>`; }).join("") : `<p class="k">${T("Nenhuma busca: resolvido por regra.", "No search: handled by a rule.")}</p>`) +
        (r.ticket ? `<div class="tk"><b>${T("Chamado para o atendente humano", "Ticket for the human agent")}</b><div>${T("motivo", "reason")}: ${esc(r.ticket.motivo)} · ${T("prioridade", "priority")}: ${esc(r.ticket.prioridade)}</div><div>${esc(r.ticket.resumo)}</div><div>${T("últimas mensagens", "last messages")}: ${r.ticket.mensagens.map(m => "“" + esc(m) + "”").join(" → ")}</div></div>` : "");
    }
    function send(text) {
      text = text.trim(); if (!text) return; const r = Engine.handle(ix, text, hist, +tv.value); hist.push(text); last = r;
      const src = r.kind === "answer" ? `${T("fonte", "source")}: ${esc(byId[r.doc].kind)} · ${esc(r.doc)}` : "";
      chat.insertAdjacentHTML("beforeend", bub("me", text) + bub(r.kind === "handoff" ? "hum" : "bot", r.reply, src)); chat.scrollTop = chat.scrollHeight; paintBack();
    }
    stage.querySelector("#f").onsubmit = e => { e.preventDefault(); send(q.value); q.value = ""; };
    stage.querySelectorAll(".chip").forEach(b => b.onclick = () => send(EX[+b.dataset.i]));
    tv.oninput = () => { stage.querySelector("#tv").textContent = (+tv.value).toFixed(2); };
    stage.querySelector("#clr").onclick = () => { chat.innerHTML = ""; hist = []; last = null; paintBack(); };
    document.addEventListener("langchange", paintBack); paintBack();
  });
})();
