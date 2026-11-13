/* Espelho de rag.py (atendimento simulado) para o navegador. Conferido por tests/parity.js contra o Python. */
(function (g) {
  const R = typeof require !== "undefined" ? require("./core.js") : g.RAG;
  const brl = v => "R$ " + v.toFixed(2).replace(".", ",");
  const docText = d => d.titulo + ". " + d.titulo + ". " + d.texto;
  const prep = ix => ix._toks || (ix._toks = ix.docs.map(d => R.tokens(docText(d))));
  const re = (ix, k) => new RegExp(ix.rules[k]);
  function retrieve(ix, q) {
    const [groups, qt] = R.expand(ix.glossary, q), toks = prep(ix), qv = R.ngVec(qt, ix.ng_idf);
    const b = toks.map(t => R.bm25(ix.bm25, qt, t)), v = ix.ng_vecs.map(x => R.cos(qv, x));
    return { groups, qt, toks, b, v, fused: R.rrf([R.rank(b), R.rank(v)]).slice(0, 3) };
  }
  function confidence(ix, groups, toks, v, top) {
    const N = ix.bm25.n, df = ix.bm25.df, mx = Math.log(1 + (N + .5) / .5);
    const w = gr => { const k = gr.filter(t => t in df); return k.length ? Math.max(0, ...k.map(t => Math.log(1 + (N - df[t] + .5) / (df[t] + .5)))) : mx; };
    const tot = groups.reduce((a, gr) => a + w(gr), 0), cov = groups.length ? groups.filter(gr => gr.some(t => toks[top].includes(t))).reduce((a, gr) => a + w(gr), 0) / tot : 0;
    return [+(0.5 * Math.min(1, v[top] / 0.6) + 0.5 * cov).toFixed(3), +cov.toFixed(3)];
  }
  function compose(ix, d, nq) {
    if (d.kind === "politica") return d.a;
    const p = d.p, wp = re(ix, "preco").test(nq), we = re(ix, "estoque").test(nq), out = [];
    if (wp || !we) out.push(`${d.titulo} custa ${brl(p.preco)}.`);
    if (we || !wp) out.push(p.estoque ? `Temos ${p.estoque} em estoque.` : `Está esgotado no momento; reposição em ${p.reposicao || "data a confirmar"}.`);
    if (!wp && !we) out.unshift(p.desc);
    return out.join(" ");
  }
  const ticket = (hist, motivo, detalhe) => ({ motivo, prioridade: ["sensivel", "pedido_humano"].includes(motivo) ? "alta" : "normal", resumo: detalhe, mensagens: hist.slice(-4) });
  function handle(ix, msg, history = [], t = 0.5) {
    const nq = R.norm(msg).trim(), hist = [...history, msg];
    for (const k of ["greeting", "thanks"]) if (re(ix, k).test(nq)) return { kind: k, reply: k === "greeting" ? "Oi! Sou o assistente da Casa Tramonto. Pergunte sobre produtos, preços, entrega e trocas." : "Por nada! Se precisar de mais alguma coisa, é só chamar.", doc: null, conf: null, cands: [] };
    for (const [k, motivo, texto] of [["humano", "pedido_humano", "Cliente pediu atendente."], ["sensivel", "sensivel", "Tema sensível (reclamação, cobrança ou órgão de defesa)."], ["pedido", "pedido", "Pergunta sobre um pedido específico; este protótipo não consulta pedidos."]])
      if (re(ix, k).test(nq)) return { kind: "handoff", reply: "Entendi. Vou passar sua conversa para um atendente humano (seg a sex, 9h às 18h). Ele já vai ver o histórico, não precisa repetir.", doc: null, conf: null, cands: [], ticket: ticket(hist, motivo, texto) };
    const clean = nq.split(/\s+/).filter(w => w && !ix.noise.includes(w)).join(" "), { groups, qt, toks, b, v, fused } = retrieve(ix, clean);
    const r = { kind: "handoff", doc: null, conf: 0, cands: fused.map(([i, s]) => ({ id: ix.docs[i].id, rrf: +s.toFixed(5), bm25: +b[i].toFixed(4), cos: +v[i].toFixed(4) })), terms: qt };
    if (fused.length) {
      const top = fused[0][0]; [r.conf, r.cov] = confidence(ix, groups, toks, v, top); const d = ix.docs[top];
      if (r.conf >= t) {
        const fam = d.kind === "produto" ? ix.docs.filter(x => x.kind === "produto" && x.p.nome === d.p.nome) : [];
        if (fam.length > 1 && !fam.some(x => qt.includes(R.tokens(x.p.variante)[0]))) return Object.assign(r, { kind: "clarify", doc: d.id, reply: `Temos o ${d.p.nome} em ` + fam.map(x => `${x.p.variante} (${brl(x.p.preco)})`).join(" e ") + ". Qual você quer?" });
        return Object.assign(r, { kind: "answer", doc: d.id, reply: compose(ix, d, nq) });
      }
    }
    r.reply = "Não encontrei isso no nosso catálogo nem nas perguntas frequentes, e não quero te passar informação errada. Vou chamar um atendente humano (seg a sex, 9h às 18h).";
    r.ticket = ticket(hist, "sem_base", "Sem base no catálogo/FAQ (confiança " + r.conf.toFixed(2) + ")."); return r;
  }
  g.Engine = { handle }; if (typeof module !== "undefined") module.exports = g.Engine;
})(typeof window !== "undefined" ? window : globalThis);
