(function () {
  "use strict";
  var P = window.PRODUTOS, C = window.CORES, TAB = window.TABELA, LOJA = window.LOJA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var brl = function (n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var ST = { cat: "", tam: "", cor: "" };
  var SKEY = "fio-sacola-v1", MKEY = "fio-tamanho-v1";
  var sacola = [], meuTam = "";
  try { sacola = JSON.parse(localStorage.getItem(SKEY)) || []; meuTam = localStorage.getItem(MKEY) || ""; } catch (e) { sacola = []; }
  sacola = sacola.filter(function (i) { return P.some(function (p) { return p.id === i.id; }); });

  /* ---------- desenho das peças (SVG) ---------- */
  function sombra(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var m = function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); };
    return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  }
  var FORMAS = {
    Camisas: function (c, l) { return '<path d="M70 38 100 52 130 38 166 56 190 178 164 186 150 112V216H50V112L36 186 10 178 34 56Z"/>' +
      '<path fill="' + l + '" d="M82 36 100 56 118 36 112 28 100 40 88 28Z"/><path class="fio" d="M100 56V216"/>' +
      [76, 104, 132, 160, 188].map(function (y) { return '<circle cx="100" cy="' + y + '" r="2.2" fill="' + l + '" stroke="none"/>'; }).join("") +
      '<path class="fio" d="M50 112 62 118M150 112 138 118"/>'; },
    Vestidos: function (c, l) { return '<path d="M80 30 100 54 120 30 140 40 146 80 134 98 174 216Q100 230 26 216L66 98 54 80 60 40Z"/>' +
      '<path fill="' + l + '" d="M80 30 100 54 120 30 112 26 100 40 88 26Z"/><path class="fio" d="M66 98Q100 108 134 98M100 104V220"/>' +
      '<path class="fio" d="M84 130 74 214M116 130 126 214"/>'; },
    "Calças": function (c, l) { return '<path d="M56 30H144L154 226H110L100 100 90 226H46Z"/>' +
      '<path fill="' + l + '" d="M56 30H144V44H56Z"/><path class="fio" d="M100 44V100M72 56Q82 76 88 74M128 56Q118 76 112 74M52 160 90 160M110 160 148 160"/>' +
      '<circle cx="100" cy="37" r="2.4" fill="' + c + '" stroke="none"/>'; },
    Saias: function (c, l) { return '<path d="M64 34H136L172 214Q100 230 28 214Z"/>' +
      '<path fill="' + l + '" d="M64 34H136V50H64Z"/>' +
      '<path class="fio" d="M80 50 62 218M100 50V222M120 50 138 218M90 50 80 220M110 50 120 220"/>'; },
    "Tricô": function (c, l) { return '<path d="M72 34Q100 50 128 34L170 62 180 152 152 156 148 102V216H52V102L48 156 20 152 30 62Z"/>' +
      '<path fill="' + l + '" d="M52 200H148V218H52Z"/><path fill="' + l + '" d="M20 152 48 156 46 170 18 166ZM180 152 152 156 154 170 182 166Z"/>' +
      '<path fill="none" stroke="' + l + '" stroke-width="5" d="M76 36Q100 54 124 36"/>'; }
  };
  function desenho(cat, hex) {
    var lado = sombra(hex, .72), claro = sombra(hex, .88), tex = cat === "Tricô" ? "trico" : "linho";
    var f = FORMAS[cat](hex, claro);
    return '<svg class="peca" viewBox="0 0 200 244" role="img" aria-hidden="true" focusable="false">' +
      '<path d="M100 4V12M100 12Q88 12 88 20M100 12Q112 12 112 20" fill="none" stroke="#6a6256" stroke-width="1.4" stroke-linecap="round" transform="translate(0 -2)"/>' +
      '<g transform="translate(0 6)" fill="' + hex + '" stroke="' + lado + '" stroke-width="1.6" stroke-linejoin="round">' + f +
      '<g fill="url(#' + tex + ')" stroke="none">' + f.split('<path class="fio"')[0] + '</g></g>' +
      '</svg>';
  }
  /* o traço .fio é costura: linha fina mais escura que a peça */
  var estilo = document.createElement("style");
  estilo.textContent = ".peca .fio{fill:none;stroke:rgba(0,0,0,.28);stroke-width:1;stroke-dasharray:3 2.2;stroke-linecap:round}";
  document.head.appendChild(estilo);

  /* ---------- tamanho pelo provador ---------- */
  function sugerir(b, c, q, folga) {
    var ordem = TAB.map(function (r) { return r.t; });
    var idx = 0;
    TAB.forEach(function (r, i) { if (b > r.busto || c > r.cintura || q > r.quadril) idx = Math.min(ordem.length - 1, i + 1); });
    var fora = b > TAB[3].busto || c > TAB[3].cintura || q > TAB[3].quadril;
    return { tam: ordem[Math.min(ordem.length - 1, idx + (folga === 2 ? 1 : 0))], fora: fora };
  }

  /* ---------- estado dos filtros ---------- */
  function visiveis() {
    return P.filter(function (p) {
      return (!ST.cat || p.cat === ST.cat) && (!ST.tam || p.tams.indexOf(ST.tam) > -1) && (!ST.cor || p.cores.indexOf(ST.cor) > -1);
    });
  }
  function chips(el, itens, chave, extra) {
    el.innerHTML = itens.map(function (i) {
      var on = ST[chave] === i.v;
      return '<button type="button" class="chip' + (chave === "cor" ? " cor" : "") + (on ? " on" : "") + '" data-k="' + chave + '" data-v="' + i.v + '" aria-pressed="' + on + '">' +
        (chave === "cor" && i.hex ? '<i style="background:' + i.hex + '"></i>' : "") + i.t + '</button>';
    }).join("");
  }
  function montarFiltros() {
    var cats = ["Camisas", "Vestidos", "Calças", "Saias", "Tricô"];
    chips($("#fCat"), [{ v: "", t: "Todas" }].concat(cats.map(function (c) { return { v: c, t: c }; })), "cat");
    chips($("#fTam"), [{ v: "", t: "Todos" }].concat(["P", "M", "G", "GG"].map(function (t) { return { v: t, t: t }; })), "tam");
    chips($("#fCor"), [{ v: "", t: "Todas" }].concat(Object.keys(C).map(function (k) { return { v: k, t: C[k].nome, hex: C[k].hex }; })), "cor");
    var ativo = ST.cat || ST.tam || ST.cor;
    $("#limpar").hidden = !ativo;
  }

  /* ---------- cartões ---------- */
  function ficha(p) {
    var d = { P: -6, M: 0, G: 6, GG: 14 };
    var linhas = p.tams.map(function (t) { return "<tr><th scope='row'>" + t + "</th><td>" + (p.busto + d[t]) + "</td><td>" + (p.comp + (d[t] > 0 ? d[t] / 2 : d[t] / 3 | 0)) + "</td></tr>"; }).join("");
    return '<details class="ficha"><summary>Medidas da peça</summary><table><thead><tr><th scope="col">Tam.</th><th scope="col">Busto</th><th scope="col">Comp.</th></tr></thead><tbody>' + linhas + '</tbody></table><p>Em centímetros, medida da peça esticada na mesa.</p></details>';
  }
  function cartao(p, compacto) {
    var cor = ST.cor && p.cores.indexOf(ST.cor) > -1 ? ST.cor : p.cores[0];
    var tam = ST.tam && p.tams.indexOf(ST.tam) > -1 ? ST.tam : (meuTam && p.tams.indexOf(meuTam) > -1 ? meuTam : "");
    var semMeu = meuTam && p.tams.indexOf(meuTam) < 0;
    var id = (compacto ? "n-" : "c-") + p.id;
    var sw = p.cores.map(function (k) {
      return '<button type="button" class="amostra' + (k === cor ? " on" : "") + '" data-acao="cor" data-cor="' + k + '" style="--c:' + C[k].hex + '" aria-label="' + C[k].nome + '" aria-pressed="' + (k === cor) + '"></button>';
    }).join("");
    var tams = ["P", "M", "G", "GG"].map(function (t) {
      var tem = p.tams.indexOf(t) > -1;
      return '<button type="button" class="tam' + (t === tam ? " on" : "") + (t === meuTam ? " meu" : "") + '" data-acao="tam" data-tam="' + t + '"' + (tem ? "" : " disabled") + ' aria-pressed="' + (t === tam) + '" aria-label="Tamanho ' + t + (tem ? "" : ", esgotado") + (t === meuTam ? ", seu tamanho" : "") + '">' + t + '</button>';
    }).join("");
    return '<li class="cartao' + (compacto ? " compacto" : "") + '" data-id="' + p.id + '" data-cor="' + cor + '" data-tam="' + tam + '">' +
      '<div class="quadro">' + (p.novo ? '<span class="selo">Chegou agora</span>' : "") + (semMeu ? '<span class="selo sem">Sem o ' + meuTam + '</span>' : "") + '<div class="desenho">' + desenho(p.cat, C[cor].hex) + '</div></div>' +
      '<div class="info"><div class="linha"><h3>' + p.nome + '</h3><p class="preco">' + brl(p.preco) + '</p></div>' +
      '<p class="tec">' + p.tecido + ' · ' + p.caimento + '</p>' +
      '<div class="amostras" role="group" aria-label="Cor de ' + p.nome + '"><span class="cor-nome">' + C[cor].nome + '</span>' + sw + '</div>' +
      '<div class="tams" role="group" aria-label="Tamanho de ' + p.nome + '">' + tams + '</div>' +
      (compacto ? "" : ficha(p)) +
      '<button type="button" class="btn peq" data-acao="add"><svg width="18" height="18" aria-hidden="true"><use href="#i-sacola"/></svg> Adicionar à sacola</button>' +
      '<p class="dica" role="alert" hidden>Escolha um tamanho.</p></div></li>';
  }
  function render() {
    montarFiltros();
    var v = visiveis();
    $("#grade").innerHTML = v.map(function (p) { return cartao(p); }).join("");
    $("#vazio").hidden = v.length > 0;
    $("#resultado").textContent = v.length === P.length ? P.length + " peças" : v.length + " de " + P.length + " peças";
    $("#novos").innerHTML = P.filter(function (p) { return p.novo; }).map(function (p) { return cartao(p, true); }).join("");
  }

  /* ---------- sacola ---------- */
  function salvar() { try { localStorage.setItem(SKEY, JSON.stringify(sacola)); } catch (e) {} }
  function qtd() { return sacola.reduce(function (a, i) { return a + i.q; }, 0); }
  function total() { return sacola.reduce(function (a, i) { return a + i.q * prod(i.id).preco; }, 0); }
  function prod(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function pintarSacola() {
    var n = qtd(), cont = $("#contSacola");
    cont.textContent = n; cont.setAttribute("aria-label", n + (n === 1 ? " item" : " itens")); cont.classList.toggle("tem", n > 0);
    $("#itens").innerHTML = sacola.map(function (i, k) {
      var p = prod(i.id);
      return '<li class="item" data-k="' + k + '"><div class="mini">' + desenho(p.cat, C[i.cor].hex) + '</div>' +
        '<div class="item-info"><p class="item-nome">' + p.nome + '</p><p class="item-det">' + C[i.cor].nome + ' · Tam. ' + i.tam + '</p>' +
        '<div class="qtd" role="group" aria-label="Quantidade de ' + p.nome + '"><button type="button" data-q="-1" aria-label="Menos um">−</button><span aria-live="polite">' + i.q + '</span><button type="button" data-q="1" aria-label="Mais um">+</button></div></div>' +
        '<div class="item-dir"><p>' + brl(p.preco * i.q) + '</p><button type="button" class="link" data-q="x">Tirar</button></div></li>';
    }).join("");
    $("#sacVazia").hidden = n > 0; $("#formPedido").hidden = n === 0;
    $("#total").textContent = brl(total());
  }
  var ultimoFoco = null;
  function abrir() {
    ultimoFoco = document.activeElement;
    $("#sacola").hidden = false; $("#veu").hidden = false;
    ["#topo", "main", ".rodape", ".ribbon"].forEach(function (s) { var e = $(s); if (e) e.inert = true; });
    document.body.classList.add("trava");
    requestAnimationFrame(function () { $("#sacola").classList.add("aberta"); $("#veu").classList.add("on"); $("#fecharSacola").focus(); });
  }
  function fechar() {
    $("#sacola").classList.remove("aberta"); $("#veu").classList.remove("on");
    ["#topo", "main", ".rodape", ".ribbon"].forEach(function (s) { var e = $(s); if (e) e.inert = false; });
    document.body.classList.remove("trava");
    setTimeout(function () { $("#sacola").hidden = true; $("#veu").hidden = true; }, 260);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  var tt;
  function aviso(t) { var e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { e.classList.remove("on"); }, 2200); }

  function pedidoTexto() {
    var f = $("#formPedido"), nome = f.nome.value.trim(), ent = f.entrega.value;
    var linhas = sacola.map(function (i) {
      var p = prod(i.id); return "• " + i.q + "x " + p.nome + " (" + C[i.cor].nome + ", " + i.tam + "): " + brl(p.preco * i.q);
    });
    return "Olá, " + LOJA.nome + "! " + (nome ? "Sou " + nome + ". " : "") + "Quero fazer este pedido:\n\n" + linhas.join("\n") +
      "\n\nTotal das peças: " + brl(total()) + "\n" + ent + ".\nPode confirmar se tem tudo?";
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a"); if (!t) return;
    if (t.classList.contains("chip")) {
      var k = t.dataset.k; ST[k] = ST[k] === t.dataset.v ? "" : t.dataset.v; render();
      var again = document.querySelector('.chip[data-k="' + k + '"][data-v="' + t.dataset.v + '"]'); if (again) again.focus();
      return;
    }
    var li = t.closest(".cartao");
    if (li && t.dataset.acao) {
      var p = prod(li.dataset.id), acao = t.dataset.acao;
      if (acao === "cor") {
        li.dataset.cor = t.dataset.cor;
        li.querySelector(".desenho").innerHTML = desenho(p.cat, C[t.dataset.cor].hex);
        li.querySelector(".cor-nome").textContent = C[t.dataset.cor].nome;
        li.querySelectorAll(".amostra").forEach(function (b) { var on = b === t; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      } else if (acao === "tam") {
        li.dataset.tam = t.dataset.tam; li.querySelector(".dica").hidden = true;
        li.querySelectorAll(".tam").forEach(function (b) { var on = b === t; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      } else if (acao === "add") {
        if (!li.dataset.tam) { var d = li.querySelector(".dica"); d.hidden = false; li.querySelector(".tam:not(:disabled)").focus(); return; }
        var ex = sacola.filter(function (i) { return i.id === p.id && i.cor === li.dataset.cor && i.tam === li.dataset.tam; })[0];
        if (ex) ex.q = Math.min(9, ex.q + 1); else sacola.push({ id: p.id, cor: li.dataset.cor, tam: li.dataset.tam, q: 1 });
        salvar(); pintarSacola();
        var cont = $("#contSacola"); cont.classList.remove("pulo"); void cont.offsetWidth; cont.classList.add("pulo");
        aviso(p.nome + " (" + C[li.dataset.cor].nome + ", " + li.dataset.tam + ") na sacola.");
      }
      return;
    }
    var it = t.closest(".item");
    if (it && t.dataset.q) {
      var i = sacola[+it.dataset.k], q = t.dataset.q;
      if (q === "x") sacola.splice(+it.dataset.k, 1);
      else { i.q += +q; if (i.q < 1) sacola.splice(+it.dataset.k, 1); if (i.q > 9) i.q = 9; }
      salvar(); pintarSacola(); return;
    }
    if (t.id === "abrirSacola") abrir();
    else if (t.id === "fecharSacola" || t.id === "irCatalogo") { fechar(); if (t.id === "irCatalogo") setTimeout(function () { location.hash = "#catalogo"; }, 280); }
    else if (t.id === "limpar") { ST = { cat: "", tam: "", cor: "" }; render(); }
    else if (t.id === "trocarTam") { meuTam = ""; try { localStorage.removeItem(MKEY); } catch (x) {} pintarMeu(); render(); location.hash = "#provador"; $("#mBusto").focus(); }
  });
  $("#veu").addEventListener("click", fechar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#sacola").hidden) fechar(); });

  $("#formPedido").addEventListener("submit", function (e) {
    e.preventDefault(); if (!sacola.length) return;
    window.open("https://wa.me/" + LOJA.whatsapp + "?text=" + encodeURIComponent(pedidoTexto()), "_blank", "noopener");
  });

  /* ---------- provador ---------- */
  function pintarMeu() {
    $("#avisoMedida").hidden = !meuTam; if (meuTam) $("#meuTam").textContent = meuTam;
  }
  $("#tabBody").innerHTML = TAB.map(function (r) { return "<tr data-t='" + r.t + "'><th scope='row'>" + r.t + "</th><td>até " + r.busto + "</td><td>até " + r.cintura + "</td><td>até " + r.quadril + "</td></tr>"; }).join("");
  function mostrarRes(tam, fora, folga) {
    var txt = { 0: "justo ao corpo", 1: "normal", 2: "folgado" }[folga];
    var n = P.filter(function (p) { return p.tams.indexOf(tam) > -1; }).length;
    $("#resProv").innerHTML = '<div class="res-ok"><p class="peq">Seu tamanho, vestindo ' + txt + '</p><p class="grande">' + tam + '</p>' +
      (fora ? '<p class="alerta">Suas medidas passam do nosso GG. Fale com a gente pelo WhatsApp: algumas peças podem ser feitas sob medida.</p>' : "") +
      '<p>' + n + ' de ' + P.length + ' peças têm o ' + tam + ' agora.</p><a class="btn" href="#catalogo">Ver peças no ' + tam + ' <svg width="18" height="18" aria-hidden="true"><use href="#i-seta"/></svg></a></div>';
    document.querySelectorAll("#tabBody tr").forEach(function (tr) { tr.classList.toggle("marca", tr.dataset.t === tam); });
  }
  $("#formProv").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, v = ["busto", "cintura", "quadril"].map(function (k) { return +f[k].value; });
    var er = $("#erroProv"), lim = [[60, 160], [50, 150], [70, 170]], rot = ["busto", "cintura", "quadril"];
    for (var i = 0; i < 3; i++) if (!v[i] || v[i] < lim[i][0] || v[i] > lim[i][1]) {
      er.textContent = "Confira o " + rot[i] + ": digite em centímetros, entre " + lim[i][0] + " e " + lim[i][1] + "."; er.hidden = false; f[rot[i]].focus(); f[rot[i]].setAttribute("aria-invalid", "true"); return;
    }
    er.hidden = true; f.querySelectorAll("input").forEach(function (x) { x.removeAttribute("aria-invalid"); });
    var folga = +f.caimento.value, s = sugerir(v[0], v[1], v[2], folga);
    meuTam = s.tam; try { localStorage.setItem(MKEY, meuTam); } catch (x) {}
    mostrarRes(s.tam, s.fora, folga); pintarMeu(); render();
  });
  $("#formProv").addEventListener("input", function (e) { e.target.removeAttribute("aria-invalid"); });

  /* ---------- início ---------- */
  render(); pintarSacola(); pintarMeu();
  if (meuTam) mostrarRes(meuTam, false, 1);
})();
