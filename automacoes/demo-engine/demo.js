/* Demo engine: lê demo.json + window.DEMO (logic.js) e monta a página. Sem dependências. */
(function () {
  'use strict';
  var IC = {
    webhook: '<path d="M8 17a4 4 0 1 1 3.5-6M12 8a3 3 0 1 1 5.2 2M7 17h9a3 3 0 1 0-1.5-5.6"/>',
    set: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    code: '<path d="M9 8l-5 4 5 4M15 8l5 4-5 4"/>',
    file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
    sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>',
    if: '<path d="M12 4v6M12 10l-6 6M12 10l6 6M6 16v4M18 16v4"/>',
    switch: '<path d="M4 8h5l4 8h7M4 16h5l4-8h7"/>',
    http: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    respond: '<path d="M10 7L4 12l6 5M4 12h11a5 5 0 0 1 5 5"/>',
    llm: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z"/>',
    memory: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
    loop: '<path d="M17 3l3 3-3 3M20 6H9a5 5 0 0 0-5 5M7 21l-3-3 3-3M4 18h11a5 5 0 0 0 5-5"/>',
    pdf: '<path d="M7 3h7l4 4v14H7z"/><path d="M9 14h6M9 17h6M9 11h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var LANG = (function () { var l; try { l = localStorage.getItem('lang'); } catch (e) { } return l === 'en' || l === 'pt' ? l : ((navigator.language || 'pt').slice(0, 2) === 'en' ? 'en' : 'pt'); })();
  var UI = {
    run: { pt: 'Rodar', en: 'Run' }, rerun: { pt: 'Rodar de novo', en: 'Run again' },
    drag: { pt: 'Arraste o fluxo para os lados · toque num nó para ver o JSON', en: 'Drag the flow sideways · tap a node to see its JSON' },
    back: { pt: '← Portfólio', en: '← Portfolio' },
    s1: { pt: 'Entrada (edite à vontade)', en: 'Input (edit freely)' }, s2: { pt: 'Fluxo, nó a nó', en: 'Flow, node by node' }, s3: { pt: 'Resultado', en: 'Result' }, s4: { pt: 'Estudo de caso', en: 'Case study' },
    sim: { pt: 'Simular erro', en: 'Simulate a failure' }, sim0: { pt: 'Nenhum', en: 'None' }, sim1: { pt: 'Temporário (retry resolve)', en: 'Temporary (retry fixes it)' }, sim2: { pt: 'Permanente (alerta de erro)', en: 'Permanent (error alert)' },
    speed: { pt: 'Velocidade', en: 'Speed' }, skip: { pt: 'Pular animação', en: 'Skip animation' },
    inp: { pt: 'Entrada', en: 'Input' }, out: { pt: 'Saída', en: 'Output' }, pick: { pt: 'Clique em um nó para inspecionar o JSON.', en: 'Click a node to inspect its JSON.' },
    idle: { pt: 'Aguardando', en: 'Waiting' }, running: { pt: 'Rodando', en: 'Running' }, okk: { pt: 'Sucesso', en: 'Success' }, fail: { pt: 'Falhou', en: 'Failed' },
    nodes: { pt: 'nós', en: 'nodes' }, tm: { pt: 'tempo simulado', en: 'simulated time' }, never: { pt: 'Nenhuma execução ainda. Aperte Rodar.', en: 'No run yet. Press Run.' },
    prob: { pt: 'Problema', en: 'Problem' }, sol: { pt: 'Solução', en: 'Solution' }, gain: { pt: 'Ganho estimado (honesto)', en: 'Estimated gain (honest)' }, stack: { pt: 'Stack', en: 'Stack' },
    imp: { pt: 'Como importar no n8n', en: 'How to import into n8n' }, dl: { pt: 'Baixar workflow.json', en: 'Download workflow.json' }, how: { pt: 'Como esta demo funciona', en: 'How this demo works' },
    retry: { pt: 'tentativa', en: 'attempt' }, resetm: { pt: 'Limpar memória', en: 'Clear memory' },
    impsteps: { pt: ['Baixe o workflow.json acima.', 'No n8n: Workflows, menu de três pontos, Import from file.', 'Abra o nó Config e ajuste URLs e caminhos para o seu ambiente.', 'Crie as credenciais pedidas (nenhuma vai no arquivo) e ative o fluxo.'], en: ['Download workflow.json above.', 'In n8n: Workflows, three-dot menu, Import from file.', 'Open the Config node and set URLs and paths for your setup.', 'Create the credentials it asks for (none are in the file) and activate the flow.'] }
  };
  var L = function (x) { if (x == null) return ''; if (typeof x === 'string') return x; return x[LANG] != null ? x[LANG] : (x.pt || ''); };
  var T = function (k) { return L(UI[k]); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function hl(o) {
    var s = JSON.stringify(o, null, 2); if (s === undefined) s = 'undefined';
    return esc(s).replace(/(&quot;[^&]*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(\.\d+)?\b/g, function (m, str, colon, b) {
      if (str) return colon ? '<span class="jk">' + str + '</span>' + colon : '<span class="js">' + str + '</span>';
      if (b) return '<span class="jb">' + m + '</span>';
      return '<span class="jn">' + m + '</span>';
    });
  }

  fetch('demo.json').then(function (r) { return r.json(); }).then(start).catch(function (e) { document.body.insertAdjacentHTML('beforeend', '<p style="padding:20px">demo.json: ' + esc(e.message) + '</p>'); });

  function start(CFG) {
    var LG = window.DEMO, root = $('#app');
    var ctx, execs = {}, selected = null, running = false, speed = 1, skip = false, form = {};
    var byId = {}; CFG.nodes.forEach(function (n) { byId[n.id] = n; });
    var NW = 136, NH = 92, GX = 172, GY = 118, PAD = 36;
    var pos = function (n) { return { x: PAD + n.col * GX, y: PAD + n.row * GY }; };
    var cols = Math.max.apply(null, CFG.nodes.map(function (n) { return n.col; })) + 1, rows = Math.max.apply(null, CFG.nodes.map(function (n) { return n.row; })) + 1;
    var CW = PAD * 2 + (cols - 1) * GX + NW, CH = PAD * 2 + (rows - 1) * GY + NH;

    function paint() {
      document.documentElement.dataset.lang = LANG; document.documentElement.lang = LANG;
      document.title = L(CFG.title) + ' · Alisson Littig';
      root.innerHTML = '';
      var top = el('div', 'top wrap');
      top.innerHTML = '<a href="../../../#automacoes">' + esc(T('back')) + '</a>';
      var lg = el('div', 'lg'); lg.setAttribute('role', 'group'); lg.setAttribute('aria-label', 'Language');
      ['pt', 'en'].forEach(function (l) { var b = el('button', '', l.toUpperCase()); b.type = 'button'; b.setAttribute('aria-pressed', l === LANG); b.onclick = function () { LANG = l; try { localStorage.setItem('lang', l); } catch (e) { } paint(); }; lg.appendChild(b); });
      top.appendChild(lg); root.appendChild(top);
      var w = el('main', 'wrap'); root.appendChild(w);
      w.appendChild(el('div', 'hero', '<p class="eyebrow">' + (CFG.case.run ? '' : 'n8n · ') + esc(L(CFG.tag)) + '</p><h1>' + esc(L(CFG.title)) + '</h1><p>' + esc(L(CFG.summary)) + '</p>'));
      // 1 entrada
      var s1 = el('section'); s1.appendChild(el('h2', '', '<b>1</b>' + esc(T('s1'))));
      var c1 = el('div', 'card'); s1.appendChild(c1);
      c1.appendChild(el('div', 'trig', '<span>TRIGGER</span><code>' + esc(L(CFG.input.trigger)) + '</code>'));
      var pre = el('div', 'pre'); pre.setAttribute('role', 'group');
      (CFG.input.presets || []).forEach(function (p, i) { var b = el('button', 'chip', esc(L(p.label))); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.onclick = function () { Object.assign(form, p.values); pre.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); fill(); }; pre.appendChild(b); });
      c1.appendChild(pre);
      var fh = el('div'); c1.appendChild(fh);
      CFG.input.fields.forEach(function (f) {
        var lab = el('label', 'fld'); lab.appendChild(el('span', '', esc(L(f.label))));
        var inp;
        if (f.type === 'textarea') { inp = el('textarea'); inp.rows = f.rows || (String(f.value || '').split(String.fromCharCode(10)).length > 4 ? 9 : 3); } else if (f.type === 'select') { inp = el('select'); f.options.forEach(function (o) { inp.appendChild(new Option(L(o.label || o), o.value != null ? o.value : o)); }); } else { inp = el('input'); inp.type = f.type || 'text'; }
        inp.name = f.key; inp.id = 'f-' + f.key; if (f.type !== 'select') inp.autocomplete = 'off';
        inp.oninput = inp.onchange = function () { form[f.key] = inp.value; };
        lab.appendChild(inp); fh.appendChild(lab);
      });
      var ac = el('div', 'acts');
      var sim = el('label', 'sim', '<span>' + esc(T('sim')) + '</span>'); var ss = el('select'); ss.id = 'sim';
      [['none', 'sim0'], ['temp', 'sim1'], ['perm', 'sim2']].forEach(function (o) { ss.appendChild(new Option(T(o[1]), o[0])); }); sim.appendChild(ss);
      var rb = el('button', 'btn', '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg><span id="rl">' + esc(T('run')) + '</span>'); rb.type = 'button'; rb.id = 'runbtn';
      if (!CFG.input.nosim) ac.appendChild(sim); ac.appendChild(rb);
      if (LG.resetMemory) { var mb = el('button', 'btn g', esc(T('resetm'))); mb.type = 'button'; mb.onclick = function () { ctx = LG.init(); status(); }; ac.appendChild(mb); }
      c1.appendChild(ac);
      c1.appendChild(el('p', 'note', esc(L(CFG.input.note))));
      w.appendChild(s1);
      // 2 fluxo
      var s2 = el('section'); s2.appendChild(el('h2', '', '<b>2</b>' + esc(T('s2'))));
      var st = el('div', 'stat'); st.id = 'stat'; s2.appendChild(st);
      var tl = el('div', 'tools'); var sp = el('button', 'chip', esc(T('speed')) + ' 1x'); sp.type = 'button'; sp.onclick = function () { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; sp.textContent = T('speed') + ' ' + speed + 'x'; };
      var sk = el('button', 'chip', esc(T('skip'))); sk.type = 'button'; sk.onclick = function () { skip = true; };
      tl.appendChild(sp); tl.appendChild(sk); s2.appendChild(tl);
      var fl = el('div', 'flow'); s2.appendChild(fl); fl.appendChild(el('p', 'hint', esc(T('drag'))));
      var cv = el('div', 'cv'); cv.id = 'cv'; var inner = el('div'); inner.id = 'cvi'; inner.style.width = CW + 'px'; inner.style.height = CH + 'px'; cv.appendChild(inner);
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', CW); svg.setAttribute('height', CH); svg.setAttribute('aria-hidden', 'true'); inner.appendChild(svg);
      CFG.edges.forEach(function (e, i) {
        var d = path(e), p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); p.setAttribute('class', 'ed'); p.id = 'e' + i; svg.appendChild(p);
        if (e.when) { var L2 = p.getTotalLength(), m = p.getPointAtLength(L2 * (e.lp || .5)), tx = document.createElementNS('http://www.w3.org/2000/svg', 'text'); tx.setAttribute('class', 'edl'); tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('x', m.x); tx.setAttribute('y', m.y - 6); tx.textContent = e.label || e.when; svg.appendChild(tx); }
      });
      CFG.nodes.forEach(function (n) {
        var p = pos(n), b = el('button', 'nd idle', '<i><svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[n.icon] || IC.code) + '</svg></i><b>' + esc(n.name) + '</b><small></small>');
        b.type = 'button'; b.id = 'n-' + n.id; b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', n.name);
        b.onclick = function () { select(n.id); }; inner.appendChild(b);
      });
      fl.appendChild(cv);
      var ins = el('div', 'ins'); ins.id = 'ins'; fl.appendChild(ins);
      w.appendChild(s2);
      // 3 resultado
      var s3 = el('section'); s3.appendChild(el('h2', '', '<b>3</b>' + esc(T('s3')))); var rs = el('div', 'res'); rs.id = 'res'; rs.setAttribute('aria-live', 'polite'); s3.appendChild(rs); w.appendChild(s3);
      // 4 caso
      var C = CFG.case, s4 = el('section'); s4.appendChild(el('h2', '', '<b>4</b>' + esc(T('s4'))));
      var cs = el('div', 'cs');
      cs.appendChild(el('div', 'card', '<h3>' + esc(T('prob')) + '</h3><p>' + esc(L(C.problem)) + '</p><h3>' + esc(T('sol')) + '</h3><p>' + esc(L(C.solution)) + '</p>'));
      cs.appendChild(el('div', 'card', '<h3>' + esc(T('gain')) + '</h3><p>' + esc(L(C.gain)) + '</p><h3>' + esc(T('stack')) + '</h3><div class="stack">' + C.stack.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>'));
      var R = C.run; // run = {title, steps[], files:[{href,label}]} (demos que nao sao n8n)
      cs.appendChild(R ? el('div', 'card', '<h3>' + esc(L(R.title)) + '</h3><ol>' + L(R.steps).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' + R.files.map(function (f) { return '<a class="btn dl" href="' + esc(f.href) + '" download>' + esc(L(f.label)) + '</a> '; }).join('')) : el('div', 'card', '<h3>' + esc(T('imp')) + '</h3><ol>' + L(UI.impsteps).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><a class="btn dl" href="workflow.json" download>' + esc(T('dl')) + '</a>'));
      cs.appendChild(el('div', 'card', '<h3>' + esc(T('how')) + '</h3><p>' + esc(L(C.honesty)) + '</p>'));
      s4.appendChild(cs); w.appendChild(s4);
      w.appendChild(el('footer', '', esc(L(CFG.footer))));
      fill(); rb.onclick = run; sizeFit(); status(); drawInspector();
      Object.keys(execs).forEach(paintNode);
      if (lastResult) results(lastResult);
      else $('#res').innerHTML = '<p class="empty">' + esc(T('never')) + '</p>';
    }
    var lastResult = null, lastMeta = null;
    function fill() { CFG.input.fields.forEach(function (f) { var i = $('#f-' + f.key); if (i) { if (form[f.key] == null) form[f.key] = f.value != null ? f.value : ''; i.value = form[f.key]; } }); }
    function sizeFit() { var cv = $('#cv'), inner = $('#cvi'); if (!cv) return; var narrow = cv.clientWidth < 600, s = narrow ? .8 : Math.min(1, cv.clientWidth / CW); inner.style.transform = 'scale(' + s + ')'; inner.dataset.s = s; inner.style.marginBottom = (CH * s - CH) + 'px'; inner.style.marginRight = (CW * s - CW) + 'px'; cv.style.height = (CH * s + 4) + 'px'; cv.dataset.scroll = CW * s > cv.clientWidth + 2 ? '1' : '0'; }
    window.addEventListener('resize', sizeFit);

    function pt(id, side) { var n = byId[id], p = pos(n); return side === 'r' ? { x: p.x + NW, y: p.y + 40 } : { x: p.x, y: p.y + 40 }; }
    function path(e) {
      var A = byId[e.from], B = byId[e.to], pa = pos(A), pb = pos(B), a, b, h;
      if (e.route) { // waypoints em grade [col,row]: sai por cima/baixo do nó, segue em y de calha entre linhas
        var pts = e.route.map(function (r) { return { x: PAD + r[0] * GX + NW / 2, y: PAD + r[1] * GY + (r[2] === 'b' ? NH + 13 : r[2] === 't' ? -13 : NH / 2) }; });
        a = { x: pa.x + NW / 2, y: e.rs === 'b' ? pa.y + NH : pa.y }; b = { x: pb.x + NW / 2, y: e.re === 't' ? pb.y : pb.y + NH };
        var q = [a].concat(pts, [b]), d = 'M' + q[0].x + ' ' + q[0].y; for (var k = 1; k < q.length; k++) d += ' L' + q[k].x + ' ' + q[k].y; return d;
      }
      if (B.col === A.col) { var dn = B.row > A.row; a = { x: pa.x + NW / 2, y: pa.y + (dn ? NH : 0) }; b = { x: pb.x + NW / 2, y: pb.y + (dn ? 0 : NH) }; h = Math.max(24, Math.abs(b.y - a.y) / 2); return 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + (a.y + (dn ? h : -h)) + ',' + b.x + ' ' + (b.y + (dn ? -h : h)) + ',' + b.x + ' ' + b.y; }
      var back = B.col < A.col; a = { x: pa.x + (back ? 0 : NW), y: pa.y + 40 }; b = { x: pb.x + (back ? NW : 0), y: pb.y + 40 };
      var dx = Math.max(24, Math.abs(b.x - a.x) / 2) * (back ? -1 : 1); return 'M' + a.x + ' ' + a.y + ' C' + (a.x + dx) + ' ' + a.y + ',' + (b.x - dx) + ' ' + b.y + ',' + b.x + ' ' + b.y;
    }
    function status(kind, txt) {
      var s = $('#stat'); if (!s) return; kind = kind || (lastMeta ? lastMeta.kind : 'idle'); txt = txt || (lastMeta ? lastMeta.txt : T('idle'));
      var t = lastMeta && kind !== 'run' ? '<span class="pill">' + lastMeta.n + ' ' + esc(T('nodes')) + ' · ' + (lastMeta.ms / 1000).toFixed(2) + ' s (' + esc(T('tm')) + ')</span>' : '';
      s.innerHTML = '<span class="pill ' + (kind === 'idle' ? '' : kind) + '" role="status">' + esc(txt) + '</span>' + t;
    }
    function paintNode(id) {
      var b = $('#n-' + id); if (!b) return; var xs = execs[id] || [], last = xs[xs.length - 1];
      b.className = 'nd ' + (last ? last.state : 'idle'); var sm = $('small', b), bd = $('.bd', b); if (bd) bd.remove();
      sm.textContent = last && last.ms != null && last.state === 'ok' ? last.ms + ' ms' : last && last.label ? last.label : '';
      if (xs.length > 1) b.appendChild(el('span', 'bd', '×' + xs.length));
      else if (last && last.state === 'ok') b.appendChild(el('span', 'bd', '✓'));
      else if (last && last.state === 'err') b.appendChild(el('span', 'bd', '!'));
    }
    var tab = 'out', iter = null;
    function select(id) { selected = id; iter = null; document.querySelectorAll('.nd').forEach(function (b) { b.setAttribute('aria-pressed', b.id === 'n-' + id); }); drawInspector(); }
    function drawInspector() {
      var ins = $('#ins'); if (!ins) return;
      if (!selected) { ins.innerHTML = '<header><b>JSON</b><span>' + esc(T('pick')) + '</span></header>'; return; }
      var n = byId[selected], xs = execs[selected] || [], i = iter == null ? xs.length - 1 : iter, x = xs[i];
      ins.innerHTML = '<header><b>' + esc(n.name) + '</b><span>' + esc(L(n.sub) || n.icon) + (x ? ' · ' + (x.ms != null ? x.ms + ' ms' : '') : '') + '</span></header>';
      var tb = el('div', 'tabs'); tb.setAttribute('role', 'tablist');
      [['in', 'inp'], ['out', 'out']].forEach(function (t) { var b = el('button', '', esc(T(t[1]))); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', tab === t[0]); b.onclick = function () { tab = t[0]; drawInspector(); }; tb.appendChild(b); });
      if (xs.length > 1) xs.forEach(function (_, k) { var b = el('button', '', '#' + (k + 1)); b.type = 'button'; b.setAttribute('aria-selected', k === i); b.onclick = function () { iter = k; drawInspector(); }; tb.appendChild(b); });
      ins.appendChild(tb);
      var pre = el('pre', '', x ? hl(tab === 'in' ? x.input : x.output) : '<span class="jb">// ' + esc(T('idle')) + '</span>'); pre.tabIndex = 0; ins.appendChild(pre);
    }

    function dotAlong(eIdx, dur) {
      var p = $('#e' + eIdx); if (!p || skip || reduced) return Promise.resolve();
      var d = el('span', 'dot'); d.style.offsetPath = 'path("' + p.getAttribute('d') + '")'; $('#cvi').appendChild(d);
      p.setAttribute('class', 'ed on');
      var a = d.animate([{ offsetDistance: '0%' }, { offsetDistance: '100%' }], { duration: dur, easing: 'ease-in-out' });
      return a.finished.then(function () { d.remove(); p.setAttribute('class', 'ed done'); }, function () { d.remove(); });
    }
    function follow(id) { var cv = $('#cv'), b = $('#n-' + id), s = +$('#cvi').dataset.s || 1; if (!cv || !b) return; var x = b.offsetLeft * s - cv.clientWidth / 2 + 80; cv.scrollTo({ left: Math.max(0, x), behavior: reduced ? 'auto' : 'smooth' }); }
    var wait = function (ms) { return skip || reduced ? Promise.resolve() : sleep(ms / speed); };

    async function run() {
      if (running) return; running = true; skip = false;
      var rb = $('#runbtn'); rb.disabled = true; execs = {}; lastResult = null; lastMeta = null; iter = null;
      document.querySelectorAll('.ed').forEach(function (p) { p.setAttribute('class', 'ed'); });
      CFG.nodes.forEach(function (n) { paintNode(n.id); });
      $('#res').innerHTML = ''; status('run', T('running'));
      var simMode = $('#sim') ? $('#sim').value : 'none', F = CFG.failure, retried = false;
      var data = JSON.parse(JSON.stringify(form)); CFG.input.fields.forEach(function (f) { if (f.type === 'number' && data[f.key] !== '') data[f.key] = Number(data[f.key]); });
      var queue = [{ id: LG.start, input: { body: data } }], cur, input, total = 0, steps = 0, failed = null, trace = [];
      ctx.sim = simMode; ctx.failedNode = null;
      while (queue.length && steps++ < 40) {
        var qi = queue.shift(); cur = qi.id; input = qi.input;
        var n = byId[cur], fn = LG.nodes[cur], x = { input: input, state: 'run' };
        (execs[cur] = execs[cur] || []).push(x); paintNode(cur); follow(cur); if (!selected || true) { selected = cur; iter = null; document.querySelectorAll('.nd').forEach(function (b) { b.setAttribute('aria-pressed', b.id === 'n-' + cur); }); drawInspector(); }
        var res, err = null, isSim = simMode !== 'none' && F && F.node === cur && !retried;
        if (isSim) {
          var tries = simMode === 'temp' ? 2 : 3;
          for (var a = 1; a <= tries; a++) {
            x.state = 'err'; x.label = T('retry') + ' ' + a + '/3'; x.output = { error: L(F.message), attempt: a }; x.ms = null; paintNode(cur); drawInspector();
            await wait(700); if (a < 3) { x.state = 'retry'; x.label = 'retry in ' + a + 's…'; paintNode(cur); await wait(600 + 300 * a); }
          }
          retried = true;
          if (simMode === 'perm') { err = new Error(L(F.message)); ctx.failedNode = cur; ctx.failedName = byId[cur].name; if (!F.continueOnFail) { failed = err; } }
        }
        await wait(260 / 1);
        if (!isSim || simMode === 'temp') { try { res = fn(input, ctx) || {}; } catch (e) { err = e; } }
        else if (!err || F.continueOnFail) { try { res = fn({ __error: L(F.message), input: input }, ctx) || {}; } catch (e) { err = e; } }
        if (err && !(isSim && F.continueOnFail && simMode === 'perm')) { x.state = 'err'; x.label = ''; x.output = { error: err.message }; x.ms = null; paintNode(cur); drawInspector(); failed = err; ctx.failedNode = cur; ctx.failedName = byId[cur].name; trace.push({ id: cur, error: err.message }); break; }
        if (isSim && simMode === 'perm') { x.state = 'err'; x.output = { error: L(F.message), continueOnFail: true, passthrough: res && res.out }; x.ms = null; x.label = ''; } else { x.state = 'ok'; x.output = res.out; x.ms = res.ms != null ? res.ms : 40; total += x.ms; x.label = ''; }
        trace.push({ id: cur, out: x.output }); paintNode(cur); drawInspector();
        input = isSim && simMode === 'perm' ? (res && res.out) || input : res.out;
        var nexts = res.next != null ? [].concat(res.next) : null, ei = -1;
        for (var k = 0; k < CFG.edges.length; k++) { var e = CFG.edges[k]; if (e.from !== cur) continue; if (nexts ? nexts.indexOf(e.to) >= 0 : (e.when ? e.when === res.branch : true)) { ei = k; break; } }
        var eis = ei >= 0 ? [ei] : [];
        if (nexts && nexts.length > 1) { eis = []; CFG.edges.forEach(function (e2, k2) { if (e2.from === cur && nexts.indexOf(e2.to) >= 0) eis.push(k2); }); } // ramos em paralelo (ex.: Switch com itens em varias saidas)
        if (res.end || !eis.length) continue;
        for (var q2 = 0; q2 < eis.length; q2++) { await dotAlong(eis[q2], 520 / speed); var to2 = CFG.edges[eis[q2]].to; if (!queue.some(function (z) { return z.id === to2; })) queue.push({ id: to2, input: input }); }
      }
      var okRun = !failed; if (failed) CFG.nodes.forEach(function (n) { /* nós não alcançados ficam idle */ });
      lastMeta = { kind: okRun ? 'ok' : 'err', txt: okRun ? T('okk') + (ctx.failedNode ? (LANG === 'pt' ? ' (erro tratado)' : ' (failure handled)') : '') : T('fail') + ': ' + failed.message, n: Object.keys(execs).length, ms: total };
      lastResult = { trace: trace, failed: failed, ctx: ctx, form: data, sim: simMode };
      status(); results(lastResult); var cv0 = $('#cv'); if (cv0) cv0.scrollTo({ left: 0, behavior: reduced ? 'auto' : 'smooth' }); running = false; rb.disabled = false; $('#rl').textContent = T('rerun');
    }

    function results(r) {
      var box = $('#res'); if (!box) return; box.innerHTML = '';
      var list = []; try { list = LG.outputs(r) || []; } catch (e) { list = [{ kind: 'error', text: e.message }]; }
      list.forEach(function (o) { box.appendChild(card(o)); });
    }
    function chartSvg(o) {
      var v = o.values, p = o.prev || [], W = 560, H = 210, pl = 8, pb = 28, pt = 22, n = v.length, max = Math.max.apply(null, v.concat(p, [1])), bw = (W - pl * 2) / n, g = o.prev ? 0.1 : 0.2, out = '';
      for (var i = 0; i < n; i++) {
        var x = pl + i * bw, h1 = (H - pb - pt) * v[i] / max, bx = bw * (o.prev ? 0.42 : 0.6);
        if (o.prev) { var h0 = (H - pb - pt) * p[i] / max; out += '<rect class="cp" x="' + (x + bw * g).toFixed(1) + '" y="' + (H - pb - h0).toFixed(1) + '" width="' + bx.toFixed(1) + '" height="' + h0.toFixed(1) + '" rx="3"/>'; }
        var cx = o.prev ? x + bw * (g + 0.46) : x + bw * 0.2;
        out += '<rect class="cc" x="' + cx.toFixed(1) + '" y="' + (H - pb - h1).toFixed(1) + '" width="' + bx.toFixed(1) + '" height="' + h1.toFixed(1) + '" rx="3"/>';
        out += '<text class="cv" x="' + (cx + bx / 2).toFixed(1) + '" y="' + (H - pb - h1 - 6).toFixed(1) + '" text-anchor="middle">' + esc(o.fmt ? o.fmt[i] : v[i]) + '</text>';
        out += '<text class="cl" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(o.labels[i]) + '</text>';
      }
      return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.alt || '') + '">' + out + '</svg><p class="lg2">' + (o.prev ? '<i class="cp"></i>' + esc(L(o.prevLabel)) + ' &nbsp; ' : '') + '<i class="cc"></i>' + esc(L(o.curLabel)) + '</p></div>';
    }

    function card(o) {
      var c = el('div', 'card rc' + (o.skipped ? ' skipped' : '') + (o.kind === 'sheet' ? ' wide' : '')); c.appendChild(el('h3', '', esc(L(o.title))));
      var b = '';
      if (o.skipped) b = '<p class="empty">' + esc(L(o.skipped)) + '</p>';
      else if (o.kind === 'telegram' || o.kind === 'whatsapp') b = '<div class="' + (o.kind === 'whatsapp' ? 'tg wa' : 'tg') + '"><div class="h"><span class="av">' + esc((L(o.from) || '?')[0]) + '</span>' + esc(L(o.from)) + '</div><div class="bub">' + esc(L(o.text)) + '<small>' + esc(o.time || '') + '</small></div></div>';
      else if (o.kind === 'email') b = '<div class="mail"><div class="mh"><b>' + esc(L(o.subject)) + '</b><br>' + esc(L(o.to)) + '</div><div class="mb">' + esc(L(o.text)) + '</div></div>';
      else if (o.kind === 'sheet') b = '<div class="sh"><table><thead><tr>' + o.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + o.rows.map(function (r, i) { return '<tr' + (i === o.rows.length - 1 && o.highlightLast ? ' class="new"' : '') + '>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      else if (o.kind === 'card') b = '<dl class="kv">' + o.rows.map(function (r) { return '<dt>' + esc(L(r[0])) + '</dt><dd>' + (r[2] ? '<span class="badge ' + esc(r[2]) + '">' + esc(L(r[1])) + '</span>' : esc(L(r[1]))) + '</dd>'; }).join('') + '</dl>';
      else if (o.kind === 'chat') b = '<div class="chat">' + o.turns.map(function (t) { return '<div class="u">' + esc(t.q) + '</div><div class="a">' + esc(t.a) + '</div>' + (t.tools ? '<p class="tl">' + esc(t.tools) + '</p>' : ''); }).join('') + '</div>';
      else if (o.kind === 'chart') b = chartSvg(o);
      else if (o.kind === 'error') b = '<div class="errc">' + esc(L(o.text)) + '</div>';
      else b = '<pre>' + hl(o.json) + '</pre>';
      c.insertAdjacentHTML('beforeend', b); return c;
    }

    ctx = LG.init(); paint();
    window.__demo = { cfg: CFG, run: run, form: form, ctx: function () { return ctx; } };
  }
})();
