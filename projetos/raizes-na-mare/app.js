/* Raízes na Maré — protótipo funcional (sem servidor: tudo fica no aparelho). */
(() => {
  "use strict";
  const D = window.RNM;
  const $ = (s, r = document) => r.querySelector(s);
  const shell = $(".shell"), app = $("#app"), tabbar = $("#tabbar"), toastEl = $("#toast"), dlg = $("#dlg");

  /* ---------- estado salvo no aparelho ---------- */
  const KEY = "rnm.v1";
  let mem = null;
  const blank = () => ({ prog: {}, done: {}, seals: {}, contact: null });
  function S() {
    if (mem) return mem;
    try {
      const r = localStorage.getItem(KEY), o = r ? JSON.parse(r) : {}, b = blank();
      for (const k of ["prog", "done", "seals"]) if (o[k] && typeof o[k] === "object" && !Array.isArray(o[k])) b[k] = o[k];
      if (o.contact && typeof o.contact.nome === "string" && typeof o.contact.oficina === "string") b.contact = o.contact;
      mem = b;
    } catch (e) { mem = blank(); }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S())); } catch (e) { /* sem armazenamento */ } }
  function wipe() { mem = blank(); try { localStorage.removeItem(KEY); } catch (e) {} }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const trilha = (id) => D.trilhas.find((t) => t.id === id);
  const selo = (id) => D.selos.find((s) => s.id === id);
  const nSelos = () => D.selos.filter((s) => S().seals[s.id]).length;

  /* ---------- ícones e ilustrações originais (SVG) ---------- */
  const ICON = {
    home: '<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4Z" fill="currentColor"/>',
    trail: '<path d="M5 19 C5 12 12 14 12 8 C12 4 8 4 8 4 M19 5 C19 12 12 10 12 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="19" cy="5" r="2.2" fill="currentColor"/><circle cx="5" cy="19" r="2.2" fill="currentColor"/>',
    seal: '<circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 15 L6 22 L12 19 L18 22 L16 15" fill="currentColor"/>',
    hand: '<path d="M7 12 V6 a1.6 1.6 0 0 1 3.2 0 V11 M10.2 10 V4.6 a1.6 1.6 0 0 1 3.2 0 V10 M13.4 10 V5.6 a1.6 1.6 0 0 1 3.2 0 V13 c0 4-2.6 7-6 7 c-3 0-4.6-2-6-5 l-.4-1 a1.4 1.4 0 0 1 2.4-1.4 L7 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    share: '<path d="M12 15 V4 M7.5 8.5 L12 4 L16.5 8.5 M5 12 V20 H19 V12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<rect x="6" y="11" width="12" height="9" rx="2" fill="currentColor"/><path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0 V11" fill="none" stroke="currentColor" stroke-width="2.2"/>'
  };
  const icon = (n, s = 24) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[n]}</svg>`;

  const INK = "#2A5099", SUN = "#F2B84B", LEAF = "#2E7D5B";
  const ILU = {
    canoa: () => `<svg viewBox="0 0 320 170" aria-hidden="true"><circle cx="250" cy="48" r="26" fill="${SUN}"/><path d="M0 118 Q40 104 80 118 T160 118 T240 118 T320 118 V170 H0Z" fill="${INK}" opacity=".18"/><path d="M40 104 Q160 150 280 104 L262 124 Q160 160 58 124Z" fill="${INK}"/><path d="M92 96 L118 72 L134 100Z" fill="${LEAF}"/><rect x="150" y="62" width="4" height="40" fill="${INK}"/><path d="M154 62 L206 96 L154 96Z" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M0 138 Q40 124 80 138 T160 138 T240 138 T320 138 V170 H0Z" fill="${INK}" opacity=".45"/></svg>`,
    rabeca: () => `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="78" rx="28" ry="34" fill="${SUN}" stroke="${INK}" stroke-width="3"/><rect x="56" y="8" width="8" height="44" rx="3" fill="${INK}"/><circle cx="60" cy="10" r="7" fill="${INK}"/><path d="M44 72 Q60 62 76 72" stroke="${INK}" stroke-width="3" fill="none"/><path d="M40 100 L84 40" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
    peixe: () => `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M14 60 Q50 20 92 60 Q50 100 14 60Z" fill="${SUN}" stroke="${INK}" stroke-width="3"/><path d="M92 60 L112 40 L112 80Z" fill="${INK}"/><circle cx="38" cy="54" r="4" fill="${INK}"/></svg>`,
    prato: () => `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M16 62 H104 Q104 104 60 104 Q16 104 16 62Z" fill="${SUN}" stroke="${INK}" stroke-width="3"/><path d="M40 52 Q36 40 44 32 M60 52 Q56 36 64 26 M80 52 Q76 40 84 32" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
  };

  /* ---------- maré (estimativa ilustrativa, não é tábua oficial) ---------- */
  const PERIODO = 12.4206 * 3600e3;
  const ALTA0 = Date.parse("2026-01-01T06:00:00Z");
  const nivel = (t) => Math.cos(2 * Math.PI * (t - ALTA0) / PERIODO);
  const hm = (t) => { const d = new Date(t); return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`; };
  function mare() {
    const now = Date.now(), d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const ini = d0.getTime(), fim = ini + 864e5;
    const ext = []; // [tempo, 'alta'|'baixa']
    for (let k = Math.floor((ini - ALTA0) / PERIODO * 2) - 1; k <= Math.ceil((fim - ALTA0) / PERIODO * 2) + 1; k++) {
      const t = ALTA0 + k * PERIODO / 2;
      if (t >= ini && t < fim) ext.push([t, k % 2 === 0 ? "alta" : "baixa"]);
    }
    let pts = "";
    for (let i = 0; i <= 48; i++) {
      const t = ini + i * 864e5 / 48;
      pts += (i ? " L" : "M") + (i * 330 / 48).toFixed(1) + " " + (46 - 28 * nivel(t)).toFixed(1);
    }
    const x = (t) => ((t - ini) / 864e5 * 330).toFixed(1);
    const y = (t) => (46 - 28 * nivel(t)).toFixed(1);
    const dots = ext.map(([t]) => `<circle cx="${x(t)}" cy="${y(t)}" r="5" fill="${SUN}"/>`).join("");
    const agora = `<line x1="${x(now)}" x2="${x(now)}" y1="8" y2="78" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>`;
    const txt = ext.map(([t, k]) => `${k} às ${hm(t)}`).join(", ");
    const svg = `<svg viewBox="0 0 330 96" width="100%" role="img" aria-label="Gráfico da maré de hoje, exemplo ilustrativo sem porto real: ${txt}. A linha tracejada marca agora."><path d="${pts}" fill="none" stroke="#fff" stroke-width="3"/>${dots}${agora}<line x1="0" y1="80" x2="330" y2="80" stroke="#fff" opacity=".5"/><text x="0" y="94" fill="#fff" font-size="12">0h</text><text x="165" y="94" fill="#fff" font-size="12" text-anchor="middle">12h</text><text x="330" y="94" fill="#fff" font-size="12" text-anchor="end">24h</text></svg>`;
    const alta = ext.filter((e) => e[1] === "alta").map((e) => hm(e[0])).join(" e ");
    const baixa = ext.filter((e) => e[1] === "baixa").map((e) => hm(e[0])).join(" e ");
    return { svg, resumo: `Alta às ${alta} · Baixa às ${baixa}` };
  }

  /* ---------- avisos e janelas ---------- */
  let tt;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }
  function modal({ title, body, ok = "Confirmar", cancel = "Cancelar", onOk }) {
    dlg.innerHTML = `<form method="dialog"><h2 id="dt">${title}</h2>${body}<div class="acts"><button type="button" class="btn ghost" data-x="1">${cancel}</button><button type="submit" class="btn">${ok}</button></div></form>`;
    dlg.setAttribute("aria-labelledby", "dt");
    const f = dlg.querySelector("form");
    dlg.querySelector("[data-x]").onclick = () => dlg.close();
    f.onsubmit = (e) => { e.preventDefault(); if (onOk && onOk(f) === false) return; dlg.close(); };
    dlg.showModal();
  }
  function award(id) {
    if (S().seals[id]) return false;
    S().seals[id] = Date.now(); save();
    toast(`Selo ${selo(id).nome} conquistado!`);
    return true;
  }

  /* ---------- telas ---------- */
  const TABS = [["home", "Início", "#inicio"], ["trail", "Trilhas", "#trilhas"], ["seal", "Missões", "#missoes"], ["hand", "Participe", "#participe"]];
  const tabOf = (r) => (r === "inicio" ? 0 : r === "trilhas" ? 1 : r === "missoes" ? 2 : r === "participe" ? 3 : -1);

  function drawTabs(i) {
    tabbar.innerHTML = TABS.map((t, k) => `<a class="tab" href="${t[2]}"${k === i ? ' aria-current="page"' : ""}>${icon(t[0])}<span>${t[1]}</span></a>`).join("");
  }

  function emAndamento() {
    return D.trilhas.find((t) => (S().prog[t.id] || 0) > 0 && !S().done[t.id]);
  }

  function vInicio() {
    const m = mare(), cur = emAndamento();
    const retomar = cur ? `<div class="card"><div style="font-size:13px;font-weight:600">Continue de onde parou</div><a href="#trilha-${cur.id}-${S().prog[cur.id]}" style="display:block;font-weight:700;font-size:17px;margin-top:2px;min-height:44px;line-height:1.4">${cur.titulo} · ${S().prog[cur.id]} de ${cur.cards.length}</a><div class="bar"><i style="width:${S().prog[cur.id] / cur.cards.length * 100}%"></i></div></div>` : "";
    const tiles = D.trilhas.map((t) => `<a class="tile" href="#trilha-${t.id}-1"><div class="ill">${ILU[t.ilu]()}</div>${t.titulo}</a>`).join("");
    return `<h1>Oi! Veja como a maré está hoje.</h1>
<section class="tidecard" aria-label="Maré de hoje"><small>Maré de hoje · exemplo ilustrativo</small>${m.svg}<small>${m.resumo}</small></section>
<p class="fine" style="margin-top:8px">Os horários são de exemplo e não correspondem a nenhum porto. Não use para navegar. Consulte a tábua de marés oficial da Marinha.</p>
${retomar}<h2>Aprenda em poucos minutos</h2><div class="tiles">${tiles}</div>
<a class="btn" href="#trilhas">Começar uma trilha</a>
<p class="fine">Protótipo acadêmico (UFPR · Design da Informação). Não é um produto oficial do Instituto Raiz Caiçara. Textos de exemplo, a validar com mestres da cultura.</p>`;
  }

  function vTrilhas() {
    const itens = D.trilhas.map((t) => {
      const p = S().prog[t.id] || 0, ok = S().done[t.id], n = t.cards.length;
      const st = ok ? `<span class="badge">${icon("check", 16)} Concluída · selo ganho</span>` : p ? `<span>${p} de ${n} cards</span>` : `<span>${n} cards curtos · leitura rápida</span>`;
      const barra = p || ok ? `<div class="bar"><i style="width:${ok ? 100 : p / n * 100}%"></i></div>` : "";
      return `<li><a class="titem" href="#trilha-${t.id}-${ok ? 1 : Math.max(p, 1)}"><div class="ill">${ILU[t.ilu]()}</div><div style="flex:1"><strong>${t.titulo}</strong>${st}${barra}</div></a></li>`;
    }).join("");
    return `<h1>Trilhas</h1><p>Escolha um tema. Cada trilha tem 4 cards curtos e dá um selo no final.</p><ul class="tlist" style="margin-top:14px">${itens}</ul>`;
  }

  function vLeitor(id, n) {
    const t = trilha(id); if (!t) return vInicio();
    const tot = t.cards.length; n = Math.min(Math.max(n, 1), tot);
    S().prog[id] = Math.max(S().prog[id] || 0, n); save();
    const [tit, txt] = t.cards[n - 1];
    const segs = t.cards.map((_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
    const ultimo = n === tot;
    return `<div class="reader">
<div class="segs" aria-hidden="true">${segs}</div>
<div class="rhead"><span>Trilha ${t.titulo} · ${n} de ${tot}</span><a class="close" href="#trilhas" aria-label="Fechar a trilha">${icon("x", 20)}</a></div>
<div class="stage">${ILU[t.ilu]()}</div>
<p class="kick">${t.titulo}</p>
<h1 tabindex="-1" style="margin-top:4px">${esc(tit)}</h1>
<p class="txt">${esc(txt)}</p>
<p class="ex">Texto de exemplo, a validar com mestres da cultura.</p>
<div class="foot">${n > 1 ? `<a class="btn text" href="#trilha-${id}-${n - 1}">← Card anterior</a>` : ""}
<div class="row"><button class="btn ghost" data-act="share" data-id="${id}">${icon("share", 20)} Compartilhar</button>
<a class="btn" href="${ultimo ? `#trilha-${id}-fim` : `#trilha-${id}-${n + 1}`}">${ultimo ? "Concluir" : "Próximo"}</a></div></div></div>`;
  }

  function vFim(id) {
    const t = trilha(id); if (!t) return vInicio();
    S().prog[id] = t.cards.length; S().done[id] = true; save();
    const novo = award(id);
    return `<div class="reader done"><div class="big">${icon("check", 52)}</div>
<h1 tabindex="-1">Trilha concluída!</h1>
<p class="txt">Você terminou a trilha ${t.titulo}${novo ? ` e ganhou o selo ${selo(id).nome}.` : "."} Já são ${nSelos()} de ${D.selos.length} selos de raiz.</p>
<div class="foot"><a class="btn ghost" href="#trilhas" style="margin-bottom:12px">Outra trilha</a><a class="btn" href="#missoes">Ver minhas missões</a></div></div>`;
  }

  let seloAberto = null;
  function vMissoes() {
    const bs = D.selos.map((s) => {
      const on = !!S().seals[s.id];
      return `<button type="button" class="seal${on ? "" : " lock"}" data-seal="${s.id}" aria-pressed="${seloAberto === s.id}"><span class="c">${icon(on ? "check" : "lock", 22)}</span><span>${s.nome}</span><span class="vh">${on ? "conquistado" : "bloqueado"}</span></button>`;
    }).join("");
    const info = seloAberto ? (S().seals[seloAberto] ? `Selo ${selo(seloAberto).nome}: conquistado.` : `Como ganhar o selo ${selo(seloAberto).nome}: ${selo(seloAberto).como}`) : "Toque em um selo para ver como ganhar.";
    return `<h1>Suas missões</h1><p style="margin-bottom:14px">Você tem ${nSelos()} de ${D.selos.length} selos de raiz.</p>
<div class="seals">${bs}</div><p class="seal-info" id="sealinfo" role="status">${esc(info)}</p>
<div class="card"><h2>Missão de campo (exemplo)</h2><p>Numa versão real, você iria a uma oficina do Instituto e ganharia o selo Oficina. Aqui, a oficina e o código são de exemplo.</p>
${S().seals.oficina ? `<p class="ok" style="margin-top:14px">${icon("check", 20)} Selo Oficina conquistado.</p>` : `<a class="btn" href="#participe">Quero ir</a><button class="btn ghost" data-act="codigo" style="margin-top:10px">Já fui, tenho o código</button>`}</div>`;
  }

  function vParticipe(editar) {
    const c = S().contact;
    const hist = `<div class="card"><h2>Manda tua história</h2><p style="font-size:14px">Foto ou áudio de quem te ensinou algo da cultura caiçara.</p>
<label class="btn ghost filebtn" style="margin-top:12px">Escolher foto ou áudio<input class="vh" type="file" id="story" accept="image/*,audio/*"></label>
<div class="preview" id="preview" aria-live="polite"></div><p class="help">Protótipo: o arquivo não sai do seu aparelho.</p></div>`;
    const apagar = `<div style="margin-top:14px"><button class="linkbtn" data-act="apagar">Apagar meus dados deste aparelho</button></div>`;
    if (c && !editar) {
      return `<h1>Participe</h1>
<div class="ok" role="status">${icon("check", 20)}<div>${esc(c.nome.split(" ")[0])}, salvamos seu interesse na oficina de ${esc(c.oficina)}.<div class="help" style="font-weight:400;color:#1d4d37">Protótipo: nada foi enviado ao Instituto. O contato ficou salvo só neste aparelho. Numa versão real, a equipe poderia responder pelo WhatsApp.</div></div></div>
<div class="card"><h2>Enquanto isso</h2><p>Continue sua trilha e ganhe mais um selo.</p><a class="btn" href="#trilhas" style="margin-top:14px">Voltar às trilhas</a></div>
<button class="btn ghost" data-act="editar" style="margin-top:14px">Mudar meus dados</button>${hist}${apagar}`;
    }
    const pre = c && c.oficina;
    const chips = D.oficinas.map((o) => `<label class="chip"><input type="radio" name="oficina" value="${o}"${pre === o ? " checked" : ""} required><span>${o}</span></label>`).join("");
    return `<h1>Participe</h1>
<p class="ok" style="font-weight:600">Protótipo: nada será enviado ao Instituto. Seus dados ficam só neste aparelho.</p>
<form id="form" novalidate>
<label for="nome">Seu nome (obrigatório)</label>
<input type="text" id="nome" name="nome" autocomplete="name" maxlength="60" value="${c ? esc(c.nome) : ""}" aria-describedby="e-nome">
<div class="err" id="e-nome"></div>
<label for="whats">WhatsApp (obrigatório)</label>
<input type="tel" id="whats" name="whats" inputmode="tel" autocomplete="tel-national" placeholder="(41) 90000-0000" value="${c ? esc(c.whats) : ""}" aria-describedby="h-whats e-whats">
<div class="help" id="h-whats">Com DDD. Ex.: 41 90000-0000</div><div class="err" id="e-whats"></div>
<fieldset aria-describedby="e-oficina"><legend>Qual oficina te chama? (obrigatório)</legend><div class="chips">${chips}</div></fieldset>
<div class="err" id="e-oficina"></div>
<button class="btn" type="submit">Salvar neste aparelho</button></form>${hist}${apagar}`;
  }

  /* ---------- roteador ---------- */
  function route() {
    const h = (location.hash || "#inicio").replace(/^#\/?/, "").split(/[-\/]/);
    const r = h[0] || "inicio";
    let html, mode = "app", tab = tabOf(r), title = "Raízes na Maré";
    const tr = r === "trilha" ? trilha(h[1]) : null;
    if (r === "trilha" && !tr) { location.replace("#inicio"); return; }
    if (tr) {
      mode = "reader"; tab = -1;
      const lido = S().prog[tr.id] || 0;
      if (h[2] === "fim") {
        if (lido < tr.cards.length) { location.replace(`#trilha-${tr.id}-${lido + 1}`); return; }
        html = vFim(tr.id); title = "Trilha concluída";
      } else {
        const n = parseInt(h[2], 10) || 1;
        if (n > lido + 1) { location.replace(`#trilha-${tr.id}-${lido + 1}`); return; }
        html = vLeitor(tr.id, n); title = tr.titulo;
      }
    } else if (r === "trilhas") { html = vTrilhas(); title = "Trilhas"; }
    else if (r === "missoes") { html = vMissoes(); title = "Missões"; }
    else if (r === "participe") { html = vParticipe(false); title = "Participe"; }
    else { html = vInicio(); tab = 0; title = "Início"; }
    shell.dataset.mode = mode;
    app.innerHTML = html;
    document.title = `${title} · Raízes na Maré`;
    drawTabs(tab);
    app.scrollTop = 0;
    if (route.first) { const f = $("h1", app); if (f) { f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); } }
    route.first = true;
  }

  /* ---------- ações ---------- */
  async function compartilhar(id) {
    const t = trilha(id);
    const url = location.href.split("#")[0] + (t ? `#trilha-${t.id}-1` : "");
    const data = { title: "Raízes na Maré", text: `Aprenda sobre ${t ? t.titulo : "a cultura caiçara"} no Raízes na Maré.`, url };
    if (navigator.share) {
      try { await navigator.share(data); award("mutirao"); } catch (e) { /* cancelado */ }
    } else {
      try { await navigator.clipboard.writeText(url); toast("Link copiado. Cole numa conversa."); award("mutirao"); }
      catch (e) { toast("Copie o link na barra do navegador."); }
    }
  }

  function mascara(v) {
    let d = v.replace(/\D/g, "");
    if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  function foneOk(v) { const d = v.replace(/\D/g, ""); return /^[1-9][1-9]9?\d{8}$/.test(d) && (d.length === 10 || d[2] === "9"); }

  function enviar(form) {
    const nome = form.nome.value.trim(), whats = form.whats.value.trim();
    const of = (form.querySelector("input[name=oficina]:checked") || {}).value;
    const E = { nome: "", whats: "", oficina: "" };
    if (nome.length < 2) E.nome = "Escreva seu nome.";
    if (!whats) E.whats = "Escreva seu WhatsApp com DDD."; else if (!foneOk(whats)) E.whats = "Esse número parece incompleto. Use DDD e número. Ex.: 41 90000-0000.";
    if (!of) E.oficina = "Escolha uma oficina.";
    for (const k of ["nome", "whats"]) {
      $("#e-" + k).textContent = E[k]; form[k].setAttribute("aria-invalid", E[k] ? "true" : "false");
    }
    $("#e-oficina").textContent = E.oficina;
    const primeiro = E.nome ? form.nome : E.whats ? form.whats : E.oficina ? form.querySelector("input[name=oficina]") : null;
    if (primeiro) { primeiro.focus(); return; }
    S().contact = { nome, whats, oficina: of, ts: Date.now() }; save();
    app.innerHTML = vParticipe(false); app.scrollTop = 0;
    const h = $(".ok", app); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  let urlAtual = null;
  function previa(file) {
    const box = $("#preview"); if (!box) return;
    if (urlAtual) URL.revokeObjectURL(urlAtual);
    box.innerHTML = ""; if (!file) return;
    urlAtual = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) { const i = new Image(); i.src = urlAtual; i.alt = "Pré-visualização da foto escolhida"; box.appendChild(i); }
    else if (file.type.startsWith("audio/")) { const a = document.createElement("audio"); a.controls = true; a.src = urlAtual; a.setAttribute("aria-label", "Pré-visualização do áudio escolhido"); box.appendChild(a); }
    else { box.textContent = "Escolha uma foto ou um áudio."; }
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act],[data-seal]"); if (!el) return;
    if (el.dataset.seal) {
      seloAberto = el.dataset.seal;
      app.innerHTML = vMissoes(); const b = $(`[data-seal="${seloAberto}"]`, app); if (b) b.focus();
      return;
    }
    const a = el.dataset.act;
    if (a === "share") compartilhar(el.dataset.id);
    else if (a === "editar") { app.innerHTML = vParticipe(true); const n = $("#nome", app); if (n) n.focus(); }
    else if (a === "codigo") modal({
      title: "Código da oficina",
      body: `<p style="font-size:14px">Numa versão real, a equipe da oficina daria o código no fim da atividade.</p><label for="cod">Código</label><input type="text" id="cod" autocomplete="off" autocapitalize="characters" aria-describedby="h-cod e-cod"><div class="help" id="h-cod">Para testar o protótipo, use ${D.codigoOficina}.</div><div class="err" id="e-cod" role="alert"></div>`,
      ok: "Confirmar",
      onOk: (f) => {
        const v = f.querySelector("#cod").value.trim().toUpperCase();
        if (v !== D.codigoOficina) { const er = f.querySelector("#e-cod"); er.textContent = "Código não confere. Confira com a equipe."; f.querySelector("#cod").setAttribute("aria-invalid", "true"); f.querySelector("#cod").focus(); return false; }
        award("oficina"); setTimeout(route, 0);
      }
    });
    else if (a === "apagar") modal({
      title: "Apagar meus dados?",
      body: `<p style="font-size:14px">Isso apaga selos, progresso e contato salvos neste aparelho. Não dá para desfazer.</p>`,
      ok: "Apagar",
      onOk: () => { wipe(); seloAberto = null; toast("Dados apagados deste aparelho."); setTimeout(route, 0); }
    });
  });
  document.addEventListener("submit", (e) => { if (e.target.id === "form") { e.preventDefault(); enviar(e.target); } });
  document.addEventListener("input", (e) => { if (e.target.id === "whats") e.target.value = mascara(e.target.value); });
  document.addEventListener("change", (e) => { if (e.target.id === "story") previa(e.target.files[0]); });
  window.addEventListener("hashchange", route);
  route();

  /* ---------- funciona sem internet ---------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
