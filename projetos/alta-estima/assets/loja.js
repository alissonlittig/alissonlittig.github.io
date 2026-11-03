/* Alta Estima: loja online. Catálogo por produto (/catalogo.json), sacola, checkout, pagamento e acompanhamento do pedido.
   Serve às páginas loja/ e pedido/ (e conta a sacola nas demais). Dinheiro SEMPRE em centavos inteiros.
   O preço e o estoque que aparecem aqui são só vitrine: o servidor refaz as contas ao criar o pedido. */
(function(){
'use strict';
var CFG=window.AE_CONFIG||{},EMP=CFG.empresa||{};
var API=String(CFG.api||'').replace(/\/$/,'');
var ROOT=document.documentElement.dataset.root||'./';
var PAGINA=document.documentElement.dataset.page||'';
var WA='5533988137703';
var MAXQ=20;
var LOJAS=[
  {id:'quintino',nome:'Loja Quintino',curto:'Quintino',end:'Rua Quintino Bocaiúva, 676',hora:'seg. a sex. 7h30 às 18h, sáb. até 13h'},
  {id:'israel',nome:'Loja Israel Pinheiro',curto:'Israel Pinheiro',end:'Rua Israel Pinheiro, 3381',hora:'seg. a sex. 8h às 18h, sáb. até 13h'}
];
var FILIAL_ENTREGA=CFG.filialEntrega||'israel';
var CORES={'Maquiagem':'maquiagem','Skincare':'skincare','Cabelos':'cabelos','Perfumaria':'perfumaria','Corpo e banho':'corpo','Unhas':'unhas','Presentes':'presentes'};
var SHELVES=['Maquiagem','Skincare','Cabelos','Perfumaria','Corpo e banho','Unhas','Presentes'];
var PRAT=window.AE_PRATELEIRAS||{};

/* ---------- utilidades ---------- */
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return [].slice.call((c||document).querySelectorAll(s))}
function el(tag,attrs,kids){var e=document.createElement(tag);for(var k in attrs||{}){if(k==='text')e.textContent=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k])}(kids||[]).forEach(function(c){c&&e.appendChild(c)});return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(c){return (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function norm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/-/g,' ')}
function wa(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)}
var store={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function reduced(){return document.documentElement.dataset.motion==='reduce'||matchMedia('(prefers-reduced-motion: reduce)').matches}
function loja(id){for(var i=0;i<LOJAS.length;i++)if(LOJAS[i].id===id)return LOJAS[i]}
function trap(box,e,fechar){
  if(e.key==='Escape'){e.stopPropagation();fechar();return}
  if(e.key!=='Tab')return;
  var f=$$('button,a[href],input,select,textarea',box).filter(function(x){return !x.disabled&&x.offsetParent!==null});
  if(!f.length)return;
  if(e.shiftKey&&(document.activeElement===f[0]||document.activeElement===box)){e.preventDefault();f[f.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}
}
function get(path,ms){
  var ac=window.AbortController?new AbortController():null,t=setTimeout(function(){ac&&ac.abort()},ms||8000);
  return fetch(API+path,{signal:ac?ac.signal:undefined,cache:'no-store'}).then(function(r){clearTimeout(t);return r.json().then(function(j){return {st:r.status,j:j}})},function(e){clearTimeout(t);throw e});
}
function post(path,corpo,metodo){
  var ac=window.AbortController?new AbortController():null,t=setTimeout(function(){ac&&ac.abort()},20000);
  return fetch(API+path,{method:metodo||'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo||{}),signal:ac?ac.signal:undefined}).then(function(r){clearTimeout(t);return r.json().catch(function(){return {}}).then(function(j){return {st:r.status,j:j}})},function(e){clearTimeout(t);throw e});
}

/* ---------- dados da empresa (um só arquivo: assets/config.js) ---------- */
function vazio(v){return !v||/^\s*\[/.test(v)}
var FALTAM=['razao','cnpj','email','telefone'].filter(function(k){return vazio(EMP[k])});
var EMPRESA_OK=!FALTAM.length;
$$('[data-empresa]').forEach(function(n){
  var v=EMP[n.dataset.empresa];
  if(vazio(v)){n.textContent=n.dataset.vazio||'A PREENCHER';n.classList.add('pendente')}
  else{n.textContent=v;if(n.tagName==='A'){var k=n.dataset.empresa;n.href=(k==='email'?'mailto:':k==='telefone'?'tel:+55'+String(v).replace(/\D/g,''):n.href)||n.href}}
});
if(CFG.modoTeste&&PAGINA){
  var bt=el('div',{class:'banner-teste',role:'status'},[]);
  bt.innerHTML='<b>Modo de teste.</b> Nenhum pagamento é real e nenhum pedido será entregue.';
  document.body.insertBefore(bt,document.body.firstChild);
}

/* ---------- catálogo ---------- */
var CAT={ok:false,pronto:false,prods:[],grupos:[],filiais:['quintino','israel'],porSku:{}};
function basename(u){return String(u||'').split('?')[0].split('/').pop()}
function montaCatalogo(j,ok){
  CAT.ok=ok;CAT.pronto=true;
  CAT.filiais=(j.filiais&&j.filiais.length?j.filiais:['quintino','israel']);
  CAT.prods=(j.produtos||[]).filter(function(p){return p&&p.sku&&p.preco>0});
  CAT.porSku={};var g={},ordem=[];
  CAT.prods.forEach(function(p){
    CAT.porSku[p.sku]=p;
    var k=p.grupo||p.sku;
    if(!g[k]){g[k]={key:k,nome:p.nome,marca:p.marca||'',categoria:p.categoria||'',descricao:p.descricao||'',vars:[]};ordem.push(k)}
    g[k].vars.push(p);
    if(!g[k].descricao&&p.descricao)g[k].descricao=p.descricao;
  });
  CAT.grupos=ordem.map(function(k){var x=g[k];x.prateleira=PRAT[x.categoria]||'';return x});
}
function carregarCatalogo(forcar){
  var q=forcar?'?v='+Date.now():'';
  var local=function(){return fetch(ROOT+'assets/catalogo-fallback.json').then(function(r){return r.json()}).then(function(j){montaCatalogo(j,false)},function(){montaCatalogo({produtos:[]},false);CAT.falhou=true})};
  if(!API)return local();
  return get('/catalogo.json'+q,8000).then(function(r){
    if(r.st!==200||!r.j||!r.j.produtos)throw new Error('catalogo '+r.st);
    montaCatalogo(r.j,true);
  }).catch(local);
}
function livre(p,f){return !!(p.disponivel&&p.disponivel[f])}
function lojasCom(p){return LOJAS.filter(function(l){return livre(p,l.id)})}
function esgotado(p){return !lojasCom(p).length}
function grupoEsgotado(g){return g.vars.every(esgotado)}
function soEmUma(g){
  var s={};g.vars.forEach(function(p){lojasCom(p).forEach(function(l){s[l.id]=l})});
  var k=Object.keys(s);return k.length===1&&LOJAS.length>1?s[k[0]]:null;
}
function precoGrupo(g){
  var v=g.vars.filter(function(p){return !esgotado(p)});if(!v.length)v=g.vars;
  var mn=Math.min.apply(null,v.map(function(p){return p.preco})),mx=Math.max.apply(null,v.map(function(p){return p.preco}));
  return {min:mn,var:mn!==mx};
}
/* foto com plano B: a do catálogo, depois a do site, depois some */
function foto(p,alt,largura){
  var f0=/^https?:/.test(p.foto||'')?p.foto:p.foto?ROOT+p.foto:'';
  var cand=[f0,ROOT+'assets/produtos/'+basename(p.foto),ROOT+'assets/produtos/'+(p.categoria||'x')+'.webp'].filter(Boolean),i=0;
  var im=el('img',{width:largura||480,height:largura||480,alt:alt||'',loading:'lazy'});
  im.onerror=function(){i++;if(i<cand.length)im.src=cand[i];else{im.onerror=null;im.classList.add('sem-foto');im.removeAttribute('src')}};
  im.src=cand[0];
  return im;
}

/* ---------- sacola ---------- */
var KEY='ae-sacola-v2';
var bag=(store.get(KEY)||[]).filter(function(i){return i&&i.sku&&i.q>0});
function item(sku){for(var i=0;i<bag.length;i++)if(bag[i].sku===sku)return bag[i]}
function qty(sku){var i=item(sku);return i?i.q:0}
function totalItems(){return bag.reduce(function(s,i){return s+i.q},0)}
function subtotal(){return bag.reduce(function(s,i){return s+i.preco*i.q},0)}
function guardaDe(p){return {sku:p.sku,nome:p.nome,variacao:p.variacao||'',preco:p.preco,foto:p.foto,categoria:p.categoria||''}}
function setQty(p,q){
  var i=item(p.sku);
  if(q<=0){if(i)bag.splice(bag.indexOf(i),1)}
  else if(i){i.q=Math.min(q,MAXQ);Object.assign(i,guardaDe(p),{q:i.q})}
  else{bag.push(Object.assign(guardaDe(p),{q:Math.min(q,MAXQ)}));justAdded=p.sku}
  save();
}
var justAdded=null;
function save(){store.set(KEY,bag);paint()}
/* o preço e a disponibilidade da sacola seguem o catálogo mais recente */
function atualizaSacola(){
  if(!CAT.pronto||!CAT.ok)return;
  bag.forEach(function(i){
    var p=CAT.porSku[i.sku];
    if(!p){i.sumiu=true;return}
    i.sumiu=false;
    if(p.preco!==i.preco){i.antes=i.preco;i.preco=p.preco}
    i.nome=p.nome;i.variacao=p.variacao||'';i.foto=p.foto;
  });
  store.set(KEY,bag);
}
function falta(i){var p=CAT.porSku[i.sku];return !CAT.ok||!p?null:(esgotado(p)?'esgotado':null)}

/* contador + animação da sacola: o número só sobe quando a foto chega nela */
var flying=0,shownN=0,prevN=0;
function setCount(n){shownN=n;$$('[data-open-bag] .n').forEach(function(c){c.textContent=n;if(n)c.removeAttribute('data-zero');else c.setAttribute('data-zero','')})}
function pulse(){$$('.bag-btn,.barra-fixa [data-open-bag]').forEach(function(b){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')})}
function pop(){$$('[data-open-bag] .n').forEach(function(c){c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')})}
function paint(){
  var n=totalItems();
  if(!flying){prevN=shownN;setCount(n)}
  $$('.bag-btn').forEach(function(b){b.setAttribute('aria-label','Sacola, '+n+(n===1?' item':' itens'))});
  $$('.item[data-key]').forEach(paintCard);
  if(fichaSync)fichaSync();
  renderBag();
}
function bump(src){
  var tg=$('.barra-fixa [data-open-bag] svg');if(!tg||!tg.getClientRects().length)tg=$('.head .bag-btn svg');
  var imgs=[].concat(src||[]).slice(0,6).map(function(s){return s.matches&&s.matches('img')?s:s.querySelector('img.on')||s.querySelector('img')}).filter(function(i){return i&&i.getClientRects().length&&i.getAttribute('src')});
  if(reduced()||!tg||!imgs.length||!tg.getClientRects().length){setCount(totalItems());pulse();pop();return}
  var t=tg.getBoundingClientRect(),ex=t.left+t.width/2,ey=Math.max(24,Math.min(innerHeight-24,t.top+t.height/2));
  if(!flying)setCount(prevN);
  var DUR=1100,GAP=240;
  imgs.forEach(function(im,k){
    flying++;
    var r=im.getBoundingClientRect(),k0=Math.min(1,220/Math.max(r.width,r.height)),w=Math.max(64,r.width*k0),h=Math.max(64,r.height*k0),
        sx=r.left+r.width/2,sy=r.top+r.height/2,dist=Math.hypot(ex-sx,ey-sy),dir=(k%2?-1:1)*(ex>=sx?1:-1),
        cx=(sx+ex)/2-dir*Math.min(90,dist*.12),cy=Math.min(sy,ey)-Math.min(260,Math.max(120,dist*.35)),end=26/Math.max(w,h);
    function mk(ghost,delay){
      var c=document.createElement('div');c.className='voa'+(ghost?' fantasma':'');c.setAttribute('aria-hidden','true');c.style.width=w+'px';c.style.height=h+'px';
      var g=document.createElement('img');g.alt='';g.src=im.currentSrc||im.src;c.appendChild(g);document.body.appendChild(c);
      var kf=[],N=48,L=.14;
      for(var i=0;i<=N;i++){
        var u=i/N,m,e,sc,rot,lift=0;
        if(u<L){m=0;e=0;var q=Math.sin(u/L*Math.PI/2);sc=1+.1*q;lift=-16*q;rot=-dir*3*q}
        else{var v=(u-L)/(1-L);e=v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;m=e;sc=(1.1)+(end-1.1)*e;rot=dir*(-3+(22+3)*e)}
        var a=1-m,x=a*a*sx+2*a*m*cx+m*m*ex,y=a*a*sy+2*a*m*cy+m*m*ey+lift,s=Math.sin(Math.PI*m);
        kf.push({offset:u,transform:'translate('+(x-w/2)+'px,'+(y-h/2)+'px) rotate('+rot+'deg) scale('+sc+')',
          opacity:(ghost?.28:1)*(u>.93?1-(u-.93)/.07:1),
          boxShadow:ghost?'none':'0 '+(10+26*s)+'px '+(20+36*s)+'px -10px rgba(8,68,39,'+(.45-.1*s)+')'});
      }
      var an=c.animate(kf,{duration:DUR,delay:delay,easing:'linear',fill:'both'});
      if(ghost)an.onfinish=function(){c.remove()};
      return an;
    }
    mk(1,k*GAP+70);mk(1,k*GAP+140);
    mk(0,k*GAP).onfinish=function(){
      this.effect.target.remove();flying--;
      setCount(flying?Math.min(shownN+1,totalItems()):totalItems());pulse();pop();
    };
  });
}

/* ---------- gaveta da sacola e checkout ---------- */
var drawer,scrim,lastFocus,view='list',askClear=false,busy=false;
// taxa por bairro: lista do Worker (/entrega.json: [{nome,taxa_cent}]); bairros.js e a copia local usada se o Worker nao responder
var ENTREGA={ok:false,lista:(window.AE_BAIRROS||[]).map(function(b){return {nome:b[0],taxa_cent:b[1]}})};
function acharBairro(txt){var n=norm(txt).replace(/\s+/g,' ').trim();if(!n)return null;for(var i=0;i<ENTREGA.lista.length;i++)if(norm(ENTREGA.lista[i].nome)===n)return ENTREGA.lista[i];return null}
function buscarBairros(txt){var n=norm(txt).trim();return ENTREGA.lista.filter(function(b){return !n||norm(b.nome).indexOf(n)>-1}).sort(function(a,b){return (norm(a.nome).indexOf(n)===0?0:1)-(norm(b.nome).indexOf(n)===0?0:1)||a.nome.localeCompare(b.nome,'pt-BR')})}
/* CEP: ViaCEP; se falhar ou passar de 4 s, BrasilAPI. Devolve {rua,bairro,cidade} ou null (CEP nao existe); rejeita se os dois falharem */
function comTempo(url,ms){var ac=window.AbortController?new AbortController():null,t=setTimeout(function(){ac&&ac.abort()},ms);
  return Promise.race([fetch(url,{signal:ac?ac.signal:undefined}),new Promise(function(_,no){setTimeout(function(){no(new Error('tempo'))},ms)})]).then(function(r){clearTimeout(t);if(r.status===404||r.status===400)return {nao:true};if(!r.ok)throw new Error('http');return r.json()},function(e){clearTimeout(t);throw e})}
function buscarCep(cep){
  return comTempo('https://viacep.com.br/ws/'+cep+'/json/',4000).then(function(j){
    if(j.erro||j.nao)return null;
    return {rua:j.logradouro||'',bairro:j.bairro||'',cidade:j.localidade||''};
  }).catch(function(){
    return comTempo('https://brasilapi.com.br/api/cep/v1/'+cep,6000).then(function(j){
      if(j.nao||!j.city)return null;
      return {rua:j.street||'',bairro:j.neighborhood||'',cidade:j.city||''};
    });
  });
}
function emGV(c){var n=norm(c).replace(/\./g,'').replace(/\s+/g,' ').trim();return n==='governador valadares'||n==='gov valadares'||n==='gv'}
/* bairro do CEP -> nome da tabela: "Centro A/B" vira Centro; ignora acento, maiuscula, "(parte ...)" e letra solta no fim */
function bairroDaTabela(txt){
  var a=acharBairro(txt);if(a)return a;
  var n=norm(txt).replace(/\s+/g,' ').trim();if(!n)return null;
  var base=n.replace(/\([^)]*\)/g,'').replace(/\s+[a-d]$/,'').replace(/^(bairro|b)\s+/,'').trim();
  for(var i=0;i<ENTREGA.lista.length;i++){var t=norm(ENTREGA.lista[i].nome).replace(/\([^)]*\)/g,'').replace(/\s+/g,' ').trim();if(t===base)return ENTREGA.lista[i]}
  return null;
}
var DADOS=Object.assign({modo:'',filial:'',cep:'',rua:'',numero:'',cidade:'Governador Valadares',bairro:'',endereco:'',ref:'',nome:'',whatsapp:'',email:'',meio:'pix'},store.get('ae-dados2')||{});
var ACEITE=false,ERRO='',ARMADILHA='';
function saveDados(){var d=Object.assign({},DADOS);store.set('ae-dados2',d)}
function buildDrawer(){
  scrim=el('div',{class:'scrim',hidden:''});
  drawer=el('aside',{class:'bag',id:'sacola',role:'dialog','aria-modal':'true','aria-labelledby':'bag-title',hidden:''});
  drawer.innerHTML='<div class="bag-grip" aria-hidden="true"></div><div class="bag-head"><h2 id="bag-title">Sua sacola</h2><button class="x" type="button" aria-label="Fechar sacola">×</button></div><div class="bag-body"></div><div class="bag-foot"></div>';
  document.body.appendChild(scrim);document.body.appendChild(drawer);
  scrim.addEventListener('click',closeBag);
  $('.x',drawer).addEventListener('click',closeBag);
  drawer.addEventListener('keydown',function(e){trap(drawer,e,closeBag)});
}
function openBag(v){
  if(!drawer)buildDrawer();
  view=v||'list';lastFocus=document.activeElement;ERRO='';
  scrim.hidden=false;drawer.hidden=false;renderBag();
  requestAnimationFrame(function(){scrim.classList.add('show');drawer.classList.add('show')});
  document.body.style.overflow='hidden';
  setTimeout(function(){$('.x',drawer).focus()},50);
  if(API){carregarCatalogo(true).then(function(){atualizaSacola();paint()});}
}
function closeBag(){
  if(!drawer||drawer.hidden)return;
  askClear=false;
  scrim.classList.remove('show');drawer.classList.remove('show','tear');
  document.body.style.overflow='';
  setTimeout(function(){scrim.hidden=true;drawer.hidden=true},reduced()?0:300);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
$$('[data-open-bag]').forEach(function(b){b.addEventListener('click',function(){if(PAGINA==='home')location.href=ROOT+'loja/#sacola';else openBag()})});

function titulo(){return {list:'Sua sacola',receber:'Como receber',dados:'Seus dados',pagar:'Revisar e pagar'}[view]||'Sua sacola'}
function passos(n){
  return '<ol class="passos" aria-label="Etapas da compra">'+['Receber','Seus dados','Pagar'].map(function(t,i){
    return '<li'+(i+1===n?' aria-current="step"':'')+(i+1<n?' class="feito"':'')+'><b>'+(i+1)+'</b><span>'+t+'</span></li>'}).join('')+'</ol>';
}
function frete(){
  var b=DADOS.modo==='entrega'&&emGV(DADOS.cidade)&&bairroDaTabela(DADOS.bairro);return b?b.taxa_cent:0;
}
function total(){return subtotal()+frete()}
function renderBag(){
  if(!drawer||drawer.hidden)return;
  var body=$('.bag-body',drawer),foot=$('.bag-foot',drawer);
  $('#bag-title').textContent=titulo();
  if(!bag.length){
    body.innerHTML='<div class="empty"><b>A sacola está vazia.</b>Escolha os produtos na loja online e eles aparecem aqui, como num cupom.<br><a class="btn" href="'+ROOT+'loja/">Ir para a loja online</a></div>';
    foot.innerHTML='';askClear=false;return;
  }
  if(view==='receber')return passoReceber(body,foot);
  if(view==='dados')return passoDados(body,foot);
  if(view==='pagar')return passoPagar(body,foot);
  lista(body,foot);
}
function receiptHead(){
  return '<div class="r-head"><img src="'+ROOT+'assets/logo.svg" alt="Alta Estima" width="120" height="80"><small>Seu pedido<br>'+new Date().toLocaleDateString('pt-BR')+'</small></div>';
}
function problemas(){
  var p=[];bag.forEach(function(i){if(i.sumiu)p.push(i);else if(falta(i))p.push(i)});return p;
}
function lista(body,foot){
  var r=el('div',{class:'receipt'});r.innerHTML=receiptHead();
  var ul=el('ul',{class:'r-list'});
  bag.forEach(function(it){
    var p=CAT.porSku[it.sku];
    var li=el('li',{class:'r-item'});
    if(it.sku!==justAdded)li.style.animation='none';
    var nm=it.nome+(it.variacao?' · '+it.variacao:'');
    li.innerHTML='<div class="r-row"><span class="r-img"></span><span class="r-txt"><span class="r-name"></span><br><span class="r-cat"></span></span><span class="r-q"></span></div>'+
      '<div class="r-ctrl"><span class="step"><button type="button" aria-label="Tirar um">−</button><output aria-live="polite"></output><button type="button" aria-label="Pôr mais um">+</button></span><button type="button" class="r-del">Remover</button></div>';
    $('.r-name',li).textContent=nm;
    $('.r-cat',li).textContent=money(it.preco)+(it.q>1?' cada':'');
    if(it.foto){$('.r-img',li).appendChild(foto(p||it,'',160)).classList.add('on')}else $('.r-img',li).hidden=true;
    $('.r-q',li).textContent=money(it.preco*it.q);
    $('output',li).textContent=it.q;
    var aviso=it.sumiu?'Este produto saiu da loja online.':falta(it)?'Esgotado agora. Tire da sacola para continuar.':it.antes?'O preço mudou de '+money(it.antes)+' para '+money(it.preco)+'.':'';
    if(aviso)li.insertBefore(el('p',{class:'r-aviso',role:'alert',text:aviso}),$('.r-ctrl',li));
    var bs=$$('.step button',li);
    bs[0].onclick=function(){setQty(p||it,it.q-1);focusAfter(it.sku,0)};
    bs[1].onclick=function(){setQty(p||it,it.q+1);focusAfter(it.sku,1)};
    $('.r-del',li).onclick=function(){setQty(p||it,0);var f=$('.r-del',drawer)||$('.x',drawer);f.focus()};
    ul.appendChild(li);
  });
  justAdded=null;
  r.appendChild(ul);
  var n=totalItems();
  var tot=el('div',{class:'r-total'});
  tot.innerHTML='<span>'+n+(n===1?' item':' itens')+'</span><span>'+money(subtotal())+'</span>';
  r.appendChild(tot);
  r.appendChild(el('p',{class:'r-foot',html:'Frete e total aparecem no passo seguinte.<br>O preço final é o do dia em que você paga.'}));
  var lim=el('div',{class:'r-limpar'});
  if(askClear){
    lim.innerHTML='<span role="alertdialog" aria-label="Esvaziar sacola">Tirar todos os itens?</span>';
    var sim=lim.appendChild(el('button',{type:'button',class:'r-sim',text:'Sim'})),nao=lim.appendChild(el('button',{type:'button',class:'r-nao',text:'Cancelar'}));
    sim.onclick=function(){
      var fim=function(){askClear=false;bag=[];save()};
      if(reduced()){fim();return}
      r.classList.add('limpando');setTimeout(fim,350);
    };
    nao.onclick=function(){askClear=false;renderBag();var b=$('.r-esvaziar',drawer);b&&b.focus()};
  }else{
    lim.appendChild(el('button',{type:'button',class:'r-esvaziar',text:'Esvaziar sacola'})).onclick=function(){askClear=true;renderBag();var b=$('.r-sim',drawer);b&&b.focus()};
  }
  r.appendChild(lim);
  body.innerHTML='';
  if(ERRO)body.appendChild(el('p',{class:'r-erro',role:'alert',text:ERRO}));
  body.appendChild(r);
  foot.innerHTML='';
  var pb=problemas();
  var go=foot.appendChild(el('button',{class:'btn block',type:'button',text:'Finalizar compra'}));
  go.disabled=!!pb.length;
  go.onclick=function(){view='receber';ERRO='';renderBag();var f=$('input,select',drawer);f&&f.focus()};
  if(pb.length)foot.appendChild(el('p',{class:'note erro',text:'Resolva os avisos acima para continuar.'}));
  foot.appendChild(el('a',{class:'btn line block',href:ROOT+'loja/',text:'Escolher mais produtos'}));
  foot.appendChild(el('a',{class:'link-zap',href:wa(msgZap()),target:'_blank',rel:'noopener',text:'Prefiro pedir pelo WhatsApp'}));
}
function msgZap(){
  var l=['Olá! Quero fazer um pedido pelo site da Alta Estima:',''];
  bag.forEach(function(i){l.push('• '+i.q+'x '+i.nome+(i.variacao?' ('+i.variacao+')':''))});
  l.push('','Pode confirmar preço e estoque?');return l.join('\n');
}
function focusAfter(sku,i){var f=$$('.r-item',drawer);var b;f.forEach(function(li){if(li._sku===sku)b=li});var s=$$('.step button',drawer)[i];s&&s.focus()}

/* -- passo 1: como receber -- */
function carregarEntrega(){
  if(ENTREGA.ok||!API)return Promise.resolve();
  return get('/entrega.json',6000).then(function(r){if(r.st===200&&r.j.bairros&&r.j.bairros.length){ENTREGA.lista=r.j.bairros;ENTREGA.ok=true}}).catch(function(){});
}
function faltantesEm(filial){
  return bag.filter(function(i){var p=CAT.porSku[i.sku];return p&&CAT.ok&&!livre(p,filial)}).map(function(i){return i.nome+(i.variacao?' '+i.variacao:'')});
}
function passoReceber(body,foot){
  carregarEntrega().then(function(){if(view==='receber'&&ENTREGA.ok&&!ENTREGA.rendered){ENTREGA.rendered=true;renderBag()}});
  var f=el('form',{class:'form',novalidate:''});
  var opts=LOJAS.map(function(l){
    var fal=faltantesEm(l.id),dis=fal.length>0;
    return '<label class="opt"><input type="radio" name="modo" value="r:'+l.id+'"'+(dis?' disabled':'')+'><span>Retirar na '+esc(l.nome)+'<small>'+esc(l.end)+' · '+esc(l.hora)+'</small>'+
      (dis?'<small class="falta">Sem estoque aqui: '+esc(fal.join(', '))+'</small>':'<small class="ok">Todos os itens disponíveis</small>')+'</span></label>';
  }).join('');
  var falE=faltantesEm(FILIAL_ENTREGA);
    opts+='<label class="opt"><input type="radio" name="modo" value="entrega"'+(falE.length?' disabled':'')+'><span>Entrega em Governador Valadares<small>'+
    (falE.length?'Sem estoque para entrega: '+esc(falE.join(', ')):'Taxa por bairro, mostrada ao escolher o bairro')+'</small></span></label>';
  f.innerHTML=passos(1)+'<fieldset><legend>Como quer receber</legend><div class="opts">'+opts+'</div></fieldset>'+
    '<div id="f-ender" class="form" hidden>'+
    '<div class="field"><label for="f-cep">CEP</label><input id="f-cep" name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" aria-describedby="i-cep"><span class="cep-info" id="i-cep" role="status" aria-live="polite"></span></div>'+
    '<div class="field"><label for="f-rua">Rua</label><input id="f-rua" name="rua" autocomplete="address-line1" maxlength="120"><span class="err" id="e-rua" hidden>Escreva a rua.</span></div>'+
    '<div class="duas"><div class="field"><label for="f-num">Número</label><input id="f-num" name="numero" autocomplete="address-line2" maxlength="12"><span class="err" id="e-numero" hidden>Informe o número.</span></div>'+
    '<div class="field"><label for="f-ref">Complemento <span class="opc">(opcional)</span></label><input id="f-ref" name="ref" maxlength="70"></div></div>'+
    '<div class="field combo"><label for="f-bairro">Bairro</label><input id="f-bairro" name="bairro" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="l-bairro" autocomplete="off" maxlength="60" required placeholder="Comece a digitar o bairro"><ul id="l-bairro" class="combo-lista" role="listbox" hidden></ul>'+
    '<span class="taxa-info" id="i-bairro" role="status" aria-live="polite"></span><span class="err" id="e-bairro" hidden>Informe o bairro.</span></div>'+
    '<div class="field"><label for="f-cid">Cidade</label><input id="f-cid" name="cidade" autocomplete="address-level2" maxlength="60"><span class="taxa-info fora" id="i-cidade" role="status" aria-live="polite"></span></div></div>'+
    '<p class="err" id="e-modo" hidden>Escolha retirada ou entrega.</p>'+(ERRO?'<p class="err" role="alert">'+esc(ERRO)+'</p>':'');
  body.innerHTML='';body.appendChild(f);
  // repõe a escolha anterior
  var v=DADOS.modo==='retirada'?'r:'+DADOS.filial:DADOS.modo==='entrega'?'entrega':'';
  var r0=v&&$('input[name="modo"][value="'+v+'"]',f);if(r0&&!r0.disabled)r0.checked=true;
  if(DADOS.bairro)f.elements.bairro.value=DADOS.bairro;
  f.elements.cep.value=DADOS.cep||'';f.elements.rua.value=DADOS.rua||'';f.elements.numero.value=DADOS.numero||'';f.elements.cidade.value=DADOS.cidade||'';f.elements.ref.value=DADOS.ref||'';
  var inB=f.elements.bairro,lst=$('#l-bairro',f),info=$('#i-bairro',f),ativo=-1;
  function fecha(){lst.hidden=true;inB.setAttribute('aria-expanded','false');inB.removeAttribute('aria-activedescendant');ativo=-1}
  function abre(){
    var r=buscarBairros(inB.value).slice(0,8);
    if(!emGV(f.elements.cidade.value))r=[];
    lst.innerHTML=r.map(function(b,i){return '<li role="option" id="o-b'+i+'" data-n="'+esc(b.nome)+'"><span>'+esc(b.nome)+'</span><b>'+money(b.taxa_cent)+'</b></li>'}).join('');
    lst.hidden=!r.length;inB.setAttribute('aria-expanded',String(!!r.length));ativo=-1;
  }
  function marca(i){var o=$$('li',lst);if(!o.length)return;ativo=(i+o.length)%o.length;o.forEach(function(x,k){x.setAttribute('aria-selected',String(k===ativo))});inB.setAttribute('aria-activedescendant',o[ativo].id);o[ativo].scrollIntoView({block:'nearest'})}
  function escolhe(nome){inB.value=nome;fecha();sync();inB.focus()}
  function mostraTaxa(){
    var b=emGV(f.elements.cidade.value)&&bairroDaTabela(inB.value),t=inB.value.trim();
    var ci=$('#i-cidade',f);
    if(emGV(f.elements.cidade.value))ci.textContent='';
    else if(!f.elements.cidade.value.trim())ci.textContent='Informe a cidade.';
    else ci.innerHTML='Entregamos só em Governador Valadares. Escolha retirada na loja ou <a href="'+esc(wa('Olá! Quero receber um pedido em '+f.elements.cidade.value.trim()+'. Podemos combinar a entrega?'))+'" target="_blank" rel="noopener">fale no WhatsApp</a>.';
    if(!emGV(f.elements.cidade.value)){info.textContent='';info.className='taxa-info';return}
    if(b)info.innerHTML='Taxa de entrega: <b>'+money(b.taxa_cent)+'</b>';
    else if(t.length>1&&!b&&!buscarBairros(t).length)info.innerHTML='Bairro fora da tabela: a entrega fica <b>a combinar pelo WhatsApp</b> e você pode finalizar o pedido. <a href="'+esc(wa('Olá! Quero receber um pedido em casa, bairro '+t+'. Podemos combinar a entrega?'))+'" target="_blank" rel="noopener">Falar agora</a>. A retirada na loja continua grátis.';
    else info.textContent='';
    info.className='taxa-info'+(b?' ok':t.length>1&&!buscarBairros(t).length?' fora':'');
  }
  inB.addEventListener('input',function(){abre();mostraTaxa()});
  inB.addEventListener('focus',function(){if(inB.value.trim()&&!bairroDaTabela(inB.value))abre()});
  inB.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();if(lst.hidden)abre();marca(ativo+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();marca(ativo-1)}
    else if(e.key==='Enter'&&!lst.hidden&&ativo>-1){e.preventDefault();e.stopPropagation();escolhe($$('li',lst)[ativo].dataset.n)}
    else if(e.key==='Escape'&&!lst.hidden){e.stopPropagation();fecha()}
  });
  inB.addEventListener('blur',function(){setTimeout(function(){fecha();var b=bairroDaTabela(inB.value);if(b&&inB.value!==b.nome){inB.value=b.nome;sync()}},150)});
  lst.addEventListener('mousedown',function(e){e.preventDefault()});
  lst.addEventListener('click',function(e){var li=e.target.closest('li');if(li)escolhe(li.dataset.n)});
  var inC=f.elements.cep,infC=$('#i-cep',f),cepVez=0;
  function cepTxt(){var d=inC.value.replace(/\D/g,'').slice(0,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d}
  function cepMsg(t,c){infC.textContent=t;infC.className='cep-info'+(c?' '+c:'')}
  inC.addEventListener('input',function(){
    inC.value=cepTxt();var d=inC.value.replace(/\D/g,'');cepVez++;
    if(d.length<8){cepMsg('');return}
    var vez=cepVez;cepMsg('Buscando endereço…','busca');
    buscarCep(d).then(function(r){
      if(vez!==cepVez)return;
      if(!r){cepMsg('CEP não encontrado, preencha manualmente.','erro');return}
      if(r.rua)f.elements.rua.value=r.rua;
      f.elements.cidade.value=r.cidade||f.elements.cidade.value;
      var b=emGV(r.cidade)?bairroDaTabela(r.bairro):null;
      if(b||r.bairro)f.elements.bairro.value=b?b.nome:r.bairro;
      cepMsg(emGV(r.cidade)&&!b&&r.bairro?'Endereço preenchido. Confira o bairro na lista.':f.elements.numero.value?'Endereço preenchido.':'Endereço preenchido. Falta o número.','ok');
      sync();
      if(emGV(r.cidade))(f.elements.numero.value?f.elements.bairro:f.elements.numero).focus();
      else $('#i-cidade',f).scrollIntoView({block:'center',behavior:'smooth'});
    }).catch(function(){if(vez===cepVez)cepMsg('Não consegui buscar o CEP agora, preencha manualmente.','erro')});
  });
  function sync(){
    var m=f.elements.modo.value;
    $('#f-ender',f).hidden=m!=='entrega';
    DADOS.modo=m==='entrega'?'entrega':m?'retirada':'';DADOS.filial=m.indexOf('r:')===0?m.slice(2):'';
    DADOS.bairro=f.elements.bairro.value;DADOS.cep=f.elements.cep.value;DADOS.rua=f.elements.rua.value.trim();DADOS.numero=f.elements.numero.value.trim();DADOS.cidade=f.elements.cidade.value.trim();
    DADOS.endereco=DADOS.rua+(DADOS.numero?', '+DADOS.numero:'');DADOS.ref=f.elements.ref.value.trim();
    if(emGV(DADOS.cidade))f.elements.cidade.setAttribute('aria-invalid','false');
    saveDados();mostraTaxa();totais();
  }
  function totais(){
    var t=$('.foot-total',foot);if(!t)return;
    t.innerHTML='<span>Subtotal</span><b>'+money(subtotal())+'</b>'+(DADOS.modo==='entrega'?'<span>Entrega</span><b>'+(!emGV(DADOS.cidade)?'só em Governador Valadares':bairroDaTabela(DADOS.bairro)?money(frete()):DADOS.bairro.trim().length>1?'a combinar':'escolha o bairro')+'</b>':'');
  }
  function rodape(){ // monta uma vez: refazer o rodapé a cada digitação engole o toque no botão
    foot.innerHTML='';
    foot.appendChild(el('div',{class:'foot-total'}));
    foot.appendChild(el('button',{class:'btn block',type:'button',text:'Continuar'})).onclick=avancar;
    foot.appendChild(el('button',{class:'btn line block',type:'button',text:'Voltar para a sacola'})).onclick=function(){view='list';renderBag()};
    totais();
  }
  function avancar(){
    sync();var bad=null;
    $('#e-modo',f).hidden=!!DADOS.modo;if(!DADOS.modo)bad=$('input[name="modo"]',f);
    if(DADOS.modo==='entrega'){
      var bOk=!!bairroDaTabela(DADOS.bairro);if(bOk)DADOS.bairro=bairroDaTabela(DADOS.bairro).nome;else DADOS.bairro=DADOS.bairro.trim().slice(0,60);var bTxt=DADOS.bairro.length>=2;
      $('#e-bairro',f).hidden=bTxt;f.elements.bairro.setAttribute('aria-invalid',bTxt?'false':'true');if(!bTxt&&!bad)bad=f.elements.bairro;
      var okR=DADOS.rua.length>=3,okN=DADOS.numero.length>=1,okC=emGV(DADOS.cidade);
      $('#e-rua',f).hidden=okR;f.elements.rua.setAttribute('aria-invalid',okR?'false':'true');if(!okR&&!bad)bad=f.elements.rua;
      $('#e-numero',f).hidden=okN;f.elements.numero.setAttribute('aria-invalid',okN?'false':'true');if(!okN&&!bad)bad=f.elements.numero;
      f.elements.cidade.setAttribute('aria-invalid',okC?'false':'true');if(!okC&&!bad)bad=f.elements.cidade;if(!okC)setTimeout(function(){$('#i-cidade',f).scrollIntoView({block:'center',behavior:'smooth'})},50);
    }
    if(bad){bad.focus();return}
    view='dados';ERRO='';renderBag();var n=$('input',drawer);n&&n.focus();
  }
  f.addEventListener('change',sync);f.addEventListener('input',sync);
  f.addEventListener('submit',function(e){e.preventDefault();avancar()});
  rodape();  mostraTaxa();
}

/* -- passo 2: seus dados -- */
function soDigitos(s){return String(s).replace(/\D/g,'')}
function passoDados(body,foot){
  var f=el('form',{class:'form',novalidate:''});
  f.innerHTML=passos(2)+
    '<div class="field"><label for="f-nome">Seu nome</label><input id="f-nome" name="nome" autocomplete="name" required maxlength="100"><span class="err" id="e-nome" hidden>Escreva o seu nome.</span></div>'+
    '<div class="field"><label for="f-zap">WhatsApp com DDD</label><input id="f-zap" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" placeholder="(33) 99999-9999"><span class="dica">Avisamos por aqui quando o pedido estiver pronto.</span><span class="err" id="e-whatsapp" hidden>Confira o número, com DDD.</span></div>'+
    '<div class="field"><label for="f-mail">E-mail <span class="opc">(opcional)</span></label><input id="f-mail" name="email" type="email" inputmode="email" autocomplete="email" maxlength="120"><span class="err" id="e-email" hidden>Esse e-mail parece incompleto.</span></div>'+
    '<div class="field hp" aria-hidden="true"><label for="f-site">Não preencha</label><input id="f-site" name="site" tabindex="-1" autocomplete="off"></div>'+
    '<label class="aceite"><input type="checkbox" name="aceite" required><span>Li e aceito os <a href="'+ROOT+'termos/" target="_blank" rel="noopener">Termos de compra</a> e a <a href="'+ROOT+'privacidade/" target="_blank" rel="noopener">Política de privacidade</a>.</span></label>'+
    '<span class="err" id="e-aceite" hidden>Para continuar, aceite os termos.</span>'+
    '<p class="lgpd">Usamos seus dados só para preparar e entregar este pedido. Pagamento é feito no Mercado Pago, não guardamos dados de cartão.</p>';
  body.innerHTML='';body.appendChild(f);
  ['nome','whatsapp','email'].forEach(function(k){if(DADOS[k])f.elements[k].value=DADOS[k]});
  f.elements.aceite.checked=ACEITE;
  function ler(){['nome','whatsapp','email'].forEach(function(k){DADOS[k]=f.elements[k].value.trim()});ACEITE=f.elements.aceite.checked;ARMADILHA=f.elements.site.value;saveDados()}
  f.addEventListener('input',ler);f.addEventListener('change',ler);
  function avancar(){
    ler();var bad=null;
    function chk(nome,ok){var m=$('#e-'+nome,f);m.hidden=ok;var i=f.elements[nome];if(i.setAttribute)i.setAttribute('aria-invalid',ok?'false':'true');if(!ok&&!bad)bad=i}
    chk('nome',DADOS.nome.length>=2);
    var d=soDigitos(DADOS.whatsapp);if(d.indexOf('55')===0&&d.length>11)d=d.slice(2);
    chk('whatsapp',d.length===10||d.length===11);
    chk('email',!DADOS.email||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(DADOS.email));
    $('#e-aceite',f).hidden=ACEITE;if(!ACEITE&&!bad)bad=f.elements.aceite;
    if(bad){bad.focus();return}
    view='pagar';ERRO='';renderBag();var b=$('.bag-foot .btn',drawer);b&&b.focus();
  }
  f.addEventListener('submit',function(e){e.preventDefault();avancar()});
  foot.innerHTML='';
  foot.appendChild(el('button',{class:'btn block',type:'button',text:'Continuar'})).onclick=avancar;
  foot.appendChild(el('button',{class:'btn line block',type:'button',text:'Voltar'})).onclick=function(){view='receber';renderBag()};
}

/* -- passo 3: revisar e pagar -- */
function motivoBloqueio(){
  if(!API)return 'A loja online ainda não está aberta para pagamento. Peça pelo WhatsApp.';
  if(!EMPRESA_OK)return 'Pagamento bloqueado: faltam os dados da empresa (razão social, CNPJ, e-mail e telefone) em assets/config.js.';
  if(!CAT.ok)return 'A loja online está indisponível agora. Tente de novo em instantes ou peça pelo WhatsApp.';
  return '';
}
function passoPagar(body,foot){
  var f=el('div',{class:'form'});
  var l=DADOS.modo==='retirada'?loja(DADOS.filial):null;
  var linhas=bag.map(function(i){return '<li><span>'+i.q+'× '+esc(i.nome)+(i.variacao?' · '+esc(i.variacao):'')+'</span><b>'+money(i.preco*i.q)+'</b></li>'}).join('');
  f.innerHTML=passos(3)+
    '<section class="resumo" aria-labelledby="t-res"><h3 id="t-res">Resumo da compra</h3><ul class="res-itens">'+linhas+'</ul>'+
    '<dl class="res-tot"><div><dt>Subtotal</dt><dd>'+money(subtotal())+'</dd></div>'+(DADOS.modo==='entrega'?'<div><dt>Entrega em Governador Valadares</dt><dd>'+(bairroDaTabela(DADOS.bairro)?money(frete()):'a combinar pelo WhatsApp')+'</dd></div>':'')+
    '<div class="forte"><dt>Total</dt><dd>'+money(total())+'</dd></div></dl>'+
    '<p class="res-rec"><b>'+(l?'Retirada na '+esc(l.nome):'Entrega em casa')+'</b><br>'+(l?esc(l.end)+' · '+esc(l.hora):esc(DADOS.endereco)+(DADOS.ref?' ('+esc(DADOS.ref)+')':'')+', '+esc(DADOS.bairro))+'</p>'+
    '<p class="res-cl"><b>Desistência:</b> você pode desistir da compra em até <b>7 dias</b> depois de receber, pela página do pedido, e o valor é devolvido. <a href="'+ROOT+'trocas/" target="_blank" rel="noopener">Trocas e arrependimento</a>.</p></section>'+
    '<fieldset><legend>Como quer pagar</legend><div class="opts">'+
    [['pix','Pix','Aprovação na hora. O código vale 30 minutos.'],['credito','Cartão de crédito','Até 3x. Você tem 15 minutos para concluir.'],['debito','Cartão de débito','Precisa estar liberado para compras na internet; o banco pede confirmação no app. 15 minutos.']].map(function(o){
      return '<label class="opt"><input type="radio" name="meio" value="'+o[0]+'"'+(DADOS.meio===o[0]?' checked':'')+'><span>'+o[1]+'<small>'+o[2]+'</small></span></label>'}).join('')+
    '</div></fieldset>'+
    '<p class="dica">Ao tocar em pagar, reservamos os itens e abrimos o Mercado Pago, em ambiente seguro, para você concluir.</p>'+
    '<div id="pg-erro" class="err forte" role="alert"'+(ERRO?'':' hidden')+'>'+esc(ERRO)+'</div>';
  body.innerHTML='';body.appendChild(f);
  f.addEventListener('change',function(e){if(e.target.name==='meio'){DADOS.meio=e.target.value;saveDados()}});
  foot.innerHTML='';
  var bloq=motivoBloqueio();
  var pagar=el('button',{class:'btn block pagar',type:'button',text:'Pagar '+money(total())});
  pagar.disabled=!!bloq||busy;
  pagar.onclick=function(){criarPedido(pagar)};
  foot.appendChild(pagar);
  if(bloq)foot.appendChild(el('p',{class:'note erro',text:bloq}));
  foot.appendChild(el('button',{class:'btn line block',type:'button',text:'Voltar'})).onclick=function(){view='dados';renderBag()};
}
function erroPagar(msg){ERRO=msg;busy=false;var e=$('#pg-erro',drawer);if(e){e.textContent=msg;e.hidden=false}var b=$('.pagar',drawer);if(b){b.disabled=false;b.textContent='Pagar '+money(total())}}
function criarPedido(btn){
  if(busy||motivoBloqueio())return;
  if(ARMADILHA)return; // campo-isca preenchido por robô
  busy=true;btn.disabled=true;btn.textContent='Reservando seus itens…';ERRO='';
  var corpo={itens:bag.map(function(i){return {sku:i.sku,qtd:i.q}}),modo:DADOS.modo,meio:DADOS.meio==='pix'?'pix':'cartao',
    cliente:{nome:DADOS.nome,whatsapp:soDigitos(DADOS.whatsapp).replace(/^55(\d{10,11})$/,'$1')}};
  if(DADOS.email)corpo.cliente.email=DADOS.email;
  if(DADOS.modo==='retirada')corpo.filial=DADOS.filial;
  else{corpo.bairro=DADOS.bairro;corpo.endereco=DADOS.endereco+(DADOS.ref?' ('+DADOS.ref+')':'')+(DADOS.cep?' - CEP '+DADOS.cep:'')}
  post('/pedidos',corpo).then(function(r){
    var j=r.j||{};
    if(r.st===200&&j.init_point&&j.token){
      var lista=store.get('ae-pedidos')||[];
      lista.unshift({token:j.token,id:j.pedido_id,total:j.total_cent,criado:new Date().toISOString()});
      store.set('ae-pedidos',lista.slice(0,20));
      bag=[];store.set(KEY,bag);
      drawer.classList.add('tear');
      setTimeout(function(){location.href=j.init_point},reduced()?0:450);
      return;
    }
    if(r.st===409){
      carregarCatalogo(true).then(function(){
        atualizaSacola();
        var sem=(j.itens_sem_estoque||[]).map(function(s){var i=item(s);return i?(i.q>1?'não temos '+i.q+' de '+i.nome+(i.variacao?' ('+i.variacao+')':'')+' agora, diminua a quantidade':i.nome+(i.variacao?' ('+i.variacao+')':'')+' acabou'):''}).filter(Boolean);
        ERRO='Ajuste a sacola: '+(sem.join('; ')||'algum item ficou indisponível')+'.';
        busy=false;view='list';renderBag();
      });
      return;
    }
    if(r.st===400)return erroPagar(j.erro==='informe nome e WhatsApp'?'Confira seu nome e WhatsApp.':j.erro==='bairro fora da tabela'?'Bairro fora da tabela: combine a entrega pelo WhatsApp.':j.erro==='bairro ou endereco invalido'?'Confira o bairro e o endereço.':'Confira os dados e tente de novo.');
    erroPagar(r.st===502||r.st===503?'O pagamento está indisponível agora. Tente em alguns minutos ou peça pelo WhatsApp.':'Não foi possível criar o pedido. Tente de novo.');
  }).catch(function(){erroPagar('Sem conexão com a loja. Confira a internet e tente de novo, ou peça pelo WhatsApp.')});
}

/* ---------- ficha do produto (painel de baixo no celular, janela no PC) ---------- */
var fScrim,fBox,fG,fV,fN=1,fLast,fOpen=false,fichaSync=null;
function buildFicha(){
  fScrim=el('div',{class:'ficha-scrim',hidden:''});
  fBox=el('div',{class:'ficha',role:'dialog','aria-modal':'true','aria-labelledby':'ficha-titulo',hidden:'',tabindex:'-1'});
  document.body.appendChild(fScrim);document.body.appendChild(fBox);
  fScrim.addEventListener('click',closeFicha);
  fBox.addEventListener('keydown',function(e){trap(fBox,e,closeFicha)});
}
function disponibilidadeTxt(p){
  var l=lojasCom(p);
  if(!l.length)return 'Esgotado nas duas lojas';
  if(l.length===LOJAS.length)return 'Disponível nas duas lojas';
  return 'Disponível só na '+l[0].nome;
}
function renderFicha(g){
  fBox.style.setProperty('--tc','var(--cat-'+(CORES[g.prateleira]||'skincare')+')');
  fBox.innerHTML='<div class="ficha-grip" aria-hidden="true"></div>'+
    '<div class="ficha-head"><span class="ficha-kick"></span><button class="x" type="button" aria-label="Fechar">×</button></div>'+
    '<div class="ficha-body"><div class="ficha-galeria"><div class="ficha-foto"></div><p class="ficha-leg">Foto ilustrativa.</p></div>'+
    '<div class="ficha-info"><h2 id="ficha-titulo"></h2><p class="ficha-marca"></p><div class="ficha-vars" hidden><h3 id="t-var">Escolha a opção</h3><div class="ficha-chips" role="radiogroup" aria-labelledby="t-var"></div></div>'+
    '<p class="ficha-desc"></p><p class="ficha-preco"></p><p class="ficha-disp"></p>'+
    '<section class="ficha-como"><h3>Como usar</h3><p class="ficha-como-t"></p><p class="ficha-aviso">Orientação geral. Siga sempre a embalagem.</p></section>'+
    '<a class="btn line block ficha-wa" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Tirar dúvida pelo WhatsApp</a></div></div>'+
    '<div class="ficha-foot"><span class="step"><button type="button" aria-label="Tirar um">−</button><output aria-live="polite">1</output><button type="button" aria-label="Pôr mais um">+</button></span><button class="btn block ficha-add" type="button">Adicionar à sacola</button></div>';
  $('.x',fBox).onclick=closeFicha;
  $('#ficha-titulo',fBox).textContent=g.nome;
  $('.ficha-marca',fBox).textContent=g.marca;$('.ficha-marca',fBox).hidden=!g.marca;
  $('.ficha-desc',fBox).textContent=g.descricao;$('.ficha-desc',fBox).hidden=!g.descricao;
  $('.ficha-kick',fBox).textContent=g.prateleira||'Produto';
  var cu=window.COMO_USAR&&window.COMO_USAR[g.categoria];
  if(cu)$('.ficha-como-t',fBox).textContent=cu;else $('.ficha-como',fBox).hidden=true;
  var chips=$('.ficha-chips',fBox),btns=[];
  if(g.vars.length>1){
    $('.ficha-vars',fBox).hidden=false;
    g.vars.forEach(function(p){
      var b=el('button',{type:'button',class:'mk-chip',role:'radio','aria-checked':'false',text:p.variacao||p.nome});
      if(esgotado(p)){b.classList.add('esg');b.textContent+=' (esgotado)';b.setAttribute('aria-label',(p.variacao||p.nome)+', esgotado')}
      b.onclick=function(){escolhe(p)};btns.push(b);chips.appendChild(b);
    });
  }
  var sb=$$('.ficha-foot .step button',fBox),out=$('output',fBox);
  fN=1;
  sb[0].onclick=function(){fN=Math.max(1,fN-1);out.textContent=fN};
  sb[1].onclick=function(){fN=Math.min(MAXQ,fN+1);out.textContent=fN};
  $('.ficha-add',fBox).onclick=fichaAdd;
  function escolhe(p){
    fV=p;
    btns.forEach(function(b,j){var on=g.vars[j]===p;b.setAttribute('aria-checked',on);b.setAttribute('aria-pressed',on);b.tabIndex=0});
    var fotoBox=$('.ficha-foto',fBox);fotoBox.innerHTML='';fotoBox.appendChild(foto(p,g.nome+(p.variacao?' '+p.variacao:''),480)).classList.add('on');
    var pr=$('.ficha-preco',fBox);pr.innerHTML='<b>'+money(p.preco)+'</b> <span class="avista">'+(CFG.parcelas?'em até '+CFG.parcelas+'x':'no Pix ou cartão')+'</span>';
    if(p.ultimas_unidades&&!esgotado(p))pr.appendChild(el('span',{class:'selo-ult',text:'Últimas unidades'}));
    if(esgotado(p))pr.appendChild(el('span',{class:'selo-esg',text:'Esgotado'}));
    $('.ficha-disp',fBox).textContent=disponibilidadeTxt(p);
    $('.ficha-wa',fBox).href=wa('Olá! Tenho uma dúvida sobre '+g.nome+(p.variacao?' ('+p.variacao+')':'')+'.');
    var fa=$('.ficha-add',fBox),dis=esgotado(p),off=!CAT.ok;
    fa.disabled=dis||off;sb[0].disabled=sb[1].disabled=dis||off;
    fa.textContent=dis?'Esgotado':off?'Indisponível agora':'Adicionar à sacola';
    var n=qty(p.sku);
    $('.ficha-leg',fBox).textContent=n?'Você já tem '+n+' na sacola.':'Foto ilustrativa.';
  }
  fichaSync=function(){if(fV){var n=qty(fV.sku);$('.ficha-leg',fBox).textContent=n?'Você já tem '+n+' na sacola.':'Foto ilustrativa.'}};
  escolhe(g.vars.filter(function(p){return !esgotado(p)})[0]||g.vars[0]);
}
function fichaAdd(){
  if(!fV||esgotado(fV)||!CAT.ok)return;
  var n=Math.min(MAXQ,qty(fV.sku)+fN);
  var fotoEl=$('.ficha-foto',fBox);
  setQty(fV,n);bump(fotoEl);closeFicha();
}
function abrirFicha(key){
  var g=null;CAT.grupos.forEach(function(x){if(x.key===key)g=x});
  if(!g||fOpen)return;
  if(!fBox)buildFicha();
  fLast=document.activeElement;fG=g;
  renderFicha(g);
  fScrim.hidden=false;fBox.hidden=false;fOpen=true;
  fBox.scrollTop=0;$('.ficha-body',fBox).scrollTop=0;
  requestAnimationFrame(function(){requestAnimationFrame(function(){if(fOpen){fScrim.classList.add('show');fBox.classList.add('show')}})});
  document.body.style.overflow='hidden';
  setTimeout(function(){if(fOpen)$('.x',fBox).focus()},30);
}
function closeFicha(){
  if(!fOpen)return;fOpen=false;fichaSync=null;
  fScrim.classList.remove('show');fBox.classList.remove('show');
  document.body.style.overflow='';
  setTimeout(function(){if(!fOpen){fScrim.hidden=true;fBox.hidden=true}},reduced()?0:280);
  if(fLast&&fLast.focus)fLast.focus();
}

/* ---------- cartões do catálogo ---------- */
function card(g){
  var c=CORES[g.prateleira]||'skincare';
  var a=el('article',{class:'item','data-key':g.key,style:'--tc:var(--cat-'+c+')'});
  a.innerHTML='<button type="button" class="item-foto" aria-label=""></button>'+
    '<div class="item-info"><span class="item-marca"></span><button type="button" class="item-nome"></button><div class="item-vars"></div></div>'+
    '<div class="item-acao"><span class="item-preco"></span><span class="act"></span></div>';
  var nome=$('.item-nome',a);nome.textContent=g.nome;
  $('.item-foto',a).setAttribute('aria-label','Ver detalhes de '+g.nome);
  var mk=$('.item-marca',a);mk.textContent=g.marca;mk.hidden=!g.marca;
  nome.onclick=$('.item-foto',a).onclick=function(){abrirFicha(g.key)};
  var p0=g.vars.filter(function(p){return !esgotado(p)})[0]||g.vars[0];
  var im=foto(p0,'',480);im.classList.add('on');$('.item-foto',a).appendChild(im);
  var vv=$('.item-vars',a);
  if(g.vars.length>1){vv.textContent=g.vars.length+' opções: '+g.vars.slice(0,3).map(function(p){return p.variacao}).join(', ')+(g.vars.length>3?'…':'')}
  else if(g.vars[0].variacao){vv.textContent=g.vars[0].variacao}else vv.hidden=true;
  var pr=precoGrupo(g);
  $('.item-preco',a).innerHTML=(pr.var?'a partir de ':'')+'<b>'+money(pr.min)+'</b>';
  a._g=g;paintCard(a);
  return a;
}
function paintCard(a){
  var g=a._g,act=$('.act',a);if(!g)return;
  var had=act.contains(document.activeElement)?document.activeElement:null,wasStep=had&&had.closest('.step');
  act.innerHTML='';
  if(grupoEsgotado(g)){act.appendChild(el('span',{class:'selo-esg',text:'Esgotado'}));return}
  var so=soEmUma(g);
  if(so)act.appendChild(el('span',{class:'selo-so',text:'Só na '+so.curto}));
  else if(g.vars.some(function(p){return p.ultimas_unidades&&!esgotado(p)})&&g.vars.length===1)act.appendChild(el('span',{class:'selo-ult',text:'Últimas'}));
  if(g.vars.length>1){
    var n=g.vars.reduce(function(s,p){return s+qty(p.sku)},0);
    var b=el('button',{class:'btn line peq',type:'button',text:n?n+' na sacola · Escolher':'Escolher opção'});
    b.onclick=function(){abrirFicha(g.key)};act.appendChild(b);
    if(had)b.focus();
    return;
  }
  var p=g.vars[0],q=qty(p.sku);
  if(!CAT.ok){act.appendChild(el('span',{class:'selo-esg',text:'Indisponível agora'}));return}
  if(!q){
    var m=el('button',{class:'item-mais',type:'button','aria-label':'Adicionar '+g.nome+' à sacola'});
    m.onclick=function(){setQty(p,1);bump(a);var s=$('.step button:last-child',a);s&&s.focus()};
    act.appendChild(m);if(had)m.focus();
  }else{
    var s=el('span',{class:'step'});
    s.innerHTML='<button type="button" aria-label="Tirar um '+esc(g.nome)+'">−</button><output aria-live="polite"></output><button type="button" aria-label="Pôr mais um '+esc(g.nome)+'">+</button>';
    $('output',s).textContent=q;
    var bs=$$('button',s);
    bs[0].onclick=function(){setQty(p,q-1);var n=$('.act button',a);n&&n.focus()};
    bs[1].onclick=function(){setQty(p,q+1);bump(a);var n=$('.step button:last-child',a);n&&n.focus()};
    act.appendChild(s);
    if(had&&!wasStep)bs[1].focus();
  }
}

/* ---------- página da loja ---------- */
function paginaLoja(){
  var grid=$('#grade');if(!grid)return;
  var chips=$('#chips'),q=$('#busca'),count=$('#contagem'),none=$('#nada'),selMarca=$('#marca-filtro'),necChips=$('#nec-chips'),topo=$('#busca-topo');
  var params=new URLSearchParams(location.search);
  if(params.get('pedido')){location.replace(ROOT+'pedido/?t='+encodeURIComponent(params.get('pedido')));return}
  var NEC=window.NECESSIDADES||[];
  var fCat=params.get('cat')||'',fMarca=params.get('marca')||'',fNec=params.get('nec')||'',fTipos=(params.get('tipos')||'').split(',').filter(Boolean);
  if(fCat&&SHELVES.indexOf(fCat)<0)fCat='';
  if(!NEC.some(function(n){return n.id===fNec}))fNec='';
  function setPressed(box,b){$$('.chip',box).forEach(function(c){c.setAttribute('aria-pressed',c===b)})}
  [''].concat(SHELVES).forEach(function(n){
    var b=el('button',{type:'button',class:'chip','aria-pressed':String(n===fCat),text:n||'Tudo'});
    b.onclick=function(){fCat=n;setPressed(chips,b);run(true)};chips.appendChild(b);
  });
  if(necChips)[{id:'',nome:'Todas'}].concat(NEC).forEach(function(n){
    var b=el('button',{type:'button',class:'chip','aria-pressed':String(n.id===fNec),text:n.nome});
    b.onclick=function(){fNec=n.id;setPressed(necChips,b);run(true)};necChips.appendChild(b);
  });
  if(params.get('q'))q.value=params.get('q');
  grid.setAttribute('aria-busy','true');
  grid.innerHTML='<div class="esqueleto" aria-hidden="true"></div>'.repeat(6);
  var cards={};
  function run(push){
    var t=norm(q.value.trim()),n=0,nec=NEC.filter(function(x){return x.id===fNec})[0];
    CAT.grupos.forEach(function(g){
      var ok=(!fCat||g.prateleira===fCat)&&(!fMarca||norm(g.marca)===norm(fMarca))&&(!nec||nec.produtos.indexOf(g.categoria)>-1)&&(!fTipos.length||fTipos.indexOf(g.categoria)>-1)&&
        (!t||norm(g.nome+' '+g.marca+' '+g.prateleira+' '+g.descricao+' '+g.vars.map(function(p){return p.variacao}).join(' ')).indexOf(t)>-1);
      var a=cards[g.key];if(a){a.hidden=!ok;if(ok)n++}
    });
    count.textContent=n+(n===1?' produto':' produtos')+(fCat?' em '+fCat:'')+(fMarca?' da marca '+fMarca:'')+(nec?' para '+nec.nome.toLowerCase():'')+(t?' com "'+q.value.trim()+'"':'');
    none.hidden=n>0||!CAT.pronto;
    var lt=$('#limpa-tipos');if(lt)lt.hidden=!fTipos.length;
    if(topo&&topo!==document.activeElement)topo.value=q.value;
    if(push){
      var u=new URL(location.href);
      [['cat',fCat],['marca',fMarca],['nec',fNec],['tipos',fTipos.join(',')],['q',t?q.value.trim():'']].forEach(function(kv){kv[1]?u.searchParams.set(kv[0],kv[1]):u.searchParams.delete(kv[0])});
      history.replaceState(null,'',u);
    }
    var w=$('#nada-wa');if(w)w.href=wa('Olá! Procurei no site e não achei: '+(q.value.trim()||fMarca||(nec&&nec.nome)||fCat||'um produto')+'. Vocês têm?');
  }
  q.addEventListener('input',function(){run(true)});
  if(fTipos.length){var lt=el('button',{type:'button',class:'chip',id:'limpa-tipos',text:'Mostrando uma seleção · ver tudo'});lt.onclick=function(){fTipos=[];run(true)};chips.parentNode.insertBefore(lt,chips)}
  carregarCatalogo(false).then(function(){
    grid.innerHTML='';grid.removeAttribute('aria-busy');
    atualizaSacola();
    var marcas={};CAT.grupos.forEach(function(g){if(g.marca)marcas[g.marca]=1});
    if(selMarca){
      selMarca.innerHTML='';selMarca.appendChild(el('option',{value:'',text:'Todas as marcas'}));
      Object.keys(marcas).sort(function(a,b){return a.localeCompare(b,'pt-BR')}).forEach(function(m){selMarca.appendChild(el('option',{value:m,text:m}))});
      var m0=Object.keys(marcas).filter(function(m){return norm(m)===norm(fMarca)})[0];fMarca=m0||'';selMarca.value=fMarca;
      selMarca.addEventListener('change',function(){fMarca=selMarca.value;run(true)});
    }
    if(CAT.falhou){grid.innerHTML='<div class="vazio-erro"><b>Não conseguimos carregar a vitrine.</b><p>Confira a internet e tente de novo. Se preferir, peça pelo WhatsApp.</p><button class="btn" type="button" onclick="location.reload()">Tentar de novo</button></div>';count.textContent='';return}
    CAT.grupos.forEach(function(g){cards[g.key]=card(g);grid.appendChild(cards[g.key])});
    if(!CAT.ok){
      var av=el('div',{class:'aviso-offline',role:'status'});
      av.innerHTML='<b>A compra online está indisponível agora.</b> Você pode ver os produtos, mas preço e estoque podem estar desatualizados. <a class="link" href="'+wa('Olá! Quero fazer um pedido pelo site da Alta Estima.')+'">Pedir pelo WhatsApp</a>';
      grid.parentNode.insertBefore(av,grid);
    }
    run(false);paint();
    if(location.hash==='#sacola')openBag();
    var ab=params.get('produto');if(ab)abrirFicha(ab);
  });
  if(topo)topo.closest('form').addEventListener('submit',function(e){e.preventDefault();q.value=topo.value;run(true);q.scrollIntoView&&q.scrollIntoView({block:'center'})});
  $$('[data-buscar]').forEach(function(b){b.addEventListener('click',function(){q.focus();q.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'})})});
}

/* ---------- página do pedido ---------- */
var STATUS={
  aguardando_pagamento:['Aguardando o pagamento','Assim que o pagamento for confirmado avisamos aqui.'],
  pago:['Pagamento confirmado','Recebemos o seu pagamento. A loja já vai separar o pedido.'],
  separando:['Separando seu pedido','A equipe está separando os itens.'],
  pronto_retirada:['Pronto para retirar','Seu pedido está esperando na loja. Leve um documento com foto.'],
  saiu_entrega:['Saiu para entrega','O pedido está a caminho do endereço informado.'],
  entregue:['Pedido concluído','Obrigada por comprar na Alta Estima!'],
  expirado:['Tempo esgotado','O prazo para pagar acabou e os itens voltaram para a prateleira.'],
  recusado:['Pagamento recusado','O pagamento não foi aprovado. Nenhum valor foi cobrado.'],
  cancelado:['Pedido cancelado','Este pedido foi cancelado.'],
  arrependimento:['Desistência recebida','Recebemos o seu pedido de desistência. A loja vai combinar a devolução e o valor volta para você.'],
  reembolsado:['Valor devolvido','O valor foi devolvido pelo mesmo meio de pagamento.']
};
function paginaPedido(){
  var raiz=$('#pedido');if(!raiz)return;
  var params=new URLSearchParams(location.search),token=params.get('t')||params.get('pedido')||'';
  if(!/^[0-9a-f]{32}$/.test(token)){
    var salvos=store.get('ae-pedidos')||[];
    if(!salvos.length){raiz.innerHTML='<div class="empty"><b>Nenhum pedido por aqui.</b>Os pedidos que você fizer neste aparelho aparecem nesta página.<br><a class="btn" href="'+ROOT+'loja/">Ir para a loja online</a></div>';return}
    raiz.innerHTML='<h2 class="ped-t">Seus pedidos neste aparelho</h2><ul class="ped-lista">'+salvos.map(function(s){return '<li><a href="?t='+esc(s.token)+'"><b>Pedido '+esc(codigo(s.id))+'</b><span>'+esc(new Date(s.criado).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}))+' · '+money(s.total)+'</span></a></li>'}).join('')+'</ul>';
    return;
  }
  var ultimo=null,timer=null,conf=false,tick=null;
  var salvo=(store.get('ae-pedidos')||[]).filter(function(s){return s.token===token})[0];
  function codigo(id){return id?'AE-'+String(id).replace(/^W/,''):''}
  function passoIdx(s,modo){return {aguardando_pagamento:-1,pago:0,separando:1,pronto_retirada:2,saiu_entrega:2,entregue:3}[s]}
  function render(p){
    var info=STATUS[p.status]||[p.status,''],pend=p.status==='aguardando_pagamento';
    var linhas=(p.itens||[]).map(function(i){return '<li><span>'+i.qtd+'× '+esc(i.nome)+'</span><b>'+money(i.preco_cent*i.qtd)+'</b></li>'}).join('');
    var idx=passoIdx(p.status),l=loja(p.filial);
    var tl=['Pagamento','Separando',p.modo==='entrega'?'Saiu para entrega':'Pronto para retirar','Concluído'];
    var linha=idx===undefined?'':'<ol class="linha" aria-label="Andamento do pedido">'+tl.map(function(t,i){return '<li class="'+(i<idx?'feito':i===idx?'atual':'')+'"'+(i===idx?' aria-current="step"':'')+'><b>'+(i<idx?'✓':i+1)+'</b><span>'+t+'</span></li>'}).join('')+'</ol>';
    var podeDesistir=['pago','separando','pronto_retirada','saiu_entrega','entregue'].indexOf(p.status)>-1;
    raiz.innerHTML=
      '<div class="ped-topo"><span class="kicker">Pedido'+(salvo&&salvo.id?' '+esc(codigo(salvo.id)):'')+'</span><h1 class="display">'+esc(info[0])+'</h1><p class="lead">'+esc(info[1])+'</p></div>'+
      (pend?'<div class="ped-pend" role="status"><b>Tempo para pagar: <span id="cron">--:--</span></b><p>Seus itens estão reservados até lá. Se fechou a janela de pagamento, você pode voltar.</p><a class="btn" href="'+esc(p.init_point||'#')+'"'+(p.init_point?'':' aria-disabled="true"')+'>Pagar de novo</a></div>':'')+
      linha+
      '<section class="resumo" aria-labelledby="t-r"><h2 id="t-r">Resumo</h2><ul class="res-itens">'+linhas+'</ul><dl class="res-tot"><div class="forte"><dt>Total</dt><dd>'+money(p.total_cent)+'</dd></div></dl>'+
      '<p class="res-rec"><b>'+(p.modo==='entrega'?'Entrega em casa':'Retirada na '+esc(l?l.nome:p.filial))+'</b>'+(p.modo==='retirada'&&l?'<br>'+esc(l.end)+' · '+esc(l.hora):'')+'</p>'+
      '<p class="res-cl">Você pode desistir da compra em até <b>7 dias</b> depois de receber. <a href="'+ROOT+'trocas/">Trocas e arrependimento</a>.</p></section>'+
      '<div class="ped-acoes"><button class="btn line" type="button" id="b-imp">Imprimir resumo</button>'+
      '<a class="btn line" target="_blank" rel="noopener" href="'+wa('Olá! Quero falar sobre o meu pedido'+(salvo&&salvo.id?' '+codigo(salvo.id):'')+' (acompanhamento: '+location.href+').')+'">Falar sobre este pedido</a>'+
      (podeDesistir?'<button class="btn line desistir" type="button" id="b-des">Me arrependi (7 dias)</button>':'')+'</div>'+
      '<div id="conf" class="conf" hidden></div>';
    $('#b-imp').onclick=function(){window.print()};
    var d=$('#b-des');if(d)d.onclick=function(){
      var c=$('#conf');c.hidden=false;c.innerHTML='<p role="alertdialog" aria-label="Confirmar desistência"><b>Quer mesmo desistir desta compra?</b> A loja vai combinar a devolução do produto e o valor volta para você.</p>';
      c.appendChild(el('button',{class:'btn',type:'button',text:'Sim, desistir'})).onclick=desistir;
      c.appendChild(el('button',{class:'btn line',type:'button',text:'Voltar'})).onclick=function(){c.hidden=true;d.focus()};
      c.querySelector('button').focus();
    };
    if(pend)relogio(p.expira_em);
  }
  function relogio(ate){
    clearInterval(tick);
    function t(){var s=Math.max(0,Math.round((new Date(ate)-Date.now())/1000)),n=$('#cron');if(!n)return clearInterval(tick);n.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(!s){clearInterval(tick);atualiza()}}
    t();tick=setInterval(t,1000);
  }
  function desistir(){
    post('/pedidos/'+token+'/arrependimento',{}).then(function(r){
      if(r.st===200&&r.j.ok){atualiza();return}
      var c=$('#conf');c.hidden=false;c.innerHTML='<p class="err" role="alert">'+esc(r.j.erro||'Não foi possível registrar agora. Fale com a loja pelo WhatsApp.')+'</p>';
    }).catch(function(){var c=$('#conf');c.hidden=false;c.innerHTML='<p class="err" role="alert">Sem conexão. Tente de novo.</p>'});
  }
  var FIM=['entregue','expirado','recusado','cancelado','reembolsado'];
  function atualiza(){
    clearTimeout(timer);
    return get('/pedidos/'+token,8000).then(function(r){
      if(r.st===404){raiz.innerHTML='<div class="empty"><b>Não achamos esse pedido.</b>Confira o link que você recebeu.<br><a class="btn" href="'+ROOT+'loja/">Voltar à loja</a></div>';return}
      if(r.st!==200)throw new Error('st');
      var ant=ultimo&&JSON.stringify([ultimo.status,ultimo.init_point]);
      if(!ultimo||ant!==JSON.stringify([r.j.status,r.j.init_point])){
        var foco=document.activeElement&&document.activeElement.id;
        ultimo=r.j;render(r.j);
        if(foco&&$('#'+foco))$('#'+foco).focus();
      }
      $('#conexao') && ($('#conexao').hidden=true);
      if(FIM.indexOf(r.j.status)<0)timer=setTimeout(atualiza,5000);
    }).catch(function(){
      if(!ultimo)raiz.innerHTML='<div class="empty"><b>Não conseguimos carregar o pedido.</b>Confira a internet.<br><button class="btn" type="button" onclick="location.reload()">Tentar de novo</button></div>';
      else{var c=$('#conexao');if(c)c.hidden=false}
      timer=setTimeout(atualiza,8000);
    });
  }
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&ultimo&&FIM.indexOf(ultimo.status)<0)atualiza()});
  atualiza();
}

/* ---------- botão flutuante do WhatsApp (secundário) ---------- */
(function(){
  if(!PAGINA)return;
  var a=el('a',{class:'wa-flutuante',href:wa('Olá! Tenho uma dúvida sobre a loja online da Alta Estima.'),target:'_blank',rel:'noopener'});
  a.innerHTML='<svg aria-hidden="true"><use href="#i-wa"/></svg><span>Tirar dúvida</span>';
  document.body.appendChild(a);
})();

/* ---------- movimento, links de WhatsApp, menu do celular, rascunhos legais ---------- */
if(store.get('ae-motion')==='reduce')document.documentElement.dataset.motion='reduce';
$$('.motion-toggle').forEach(function(b){
  function sync(){b.setAttribute('aria-pressed',document.documentElement.dataset.motion==='reduce')}
  sync();
  b.addEventListener('click',function(){
    var on=document.documentElement.dataset.motion!=='reduce';
    if(on)document.documentElement.dataset.motion='reduce';else delete document.documentElement.dataset.motion;
    store.set('ae-motion',on?'reduce':null);sync();
  });
});
$$('[data-wa]').forEach(function(a){a.href=wa(a.dataset.wa||'Olá! Vim pelo site da Alta Estima.');a.target='_blank';a.rel='noopener'});
var mb=$('.menu-btn'),nav=$('#nav');
if(mb&&nav){
  mb.addEventListener('click',function(){var o=mb.getAttribute('aria-expanded')!=='true';mb.setAttribute('aria-expanded',o);nav.classList.toggle('open',o)});
  nav.addEventListener('click',function(e){if(e.target.closest('a')){mb.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){mb.setAttribute('aria-expanded','false');nav.classList.remove('open');mb.focus()}});
}
if(CFG.textosRevisados)$$('[data-rascunho]').forEach(function(n){n.hidden=true});
/* página Entrega e retirada: tabela de taxas por bairro (Worker; assets/bairros.js se o Worker não responder) */
(function(){
  var box=$('#bairros-lista');if(!box)return;
  function mostra(l){
    l=l.slice().sort(function(a,b){return a.nome.localeCompare(b.nome,'pt-BR')});
    box.innerHTML='<table><thead><tr><th scope="col">Bairro</th><th scope="col">Taxa</th></tr></thead><tbody>'+l.map(function(b){return '<tr><td>'+esc(b.nome)+'</td><td>'+money(b.taxa_cent)+'</td></tr>'}).join('')+'</tbody></table>';
  }
  var local=(window.AE_BAIRROS||[]).map(function(b){return {nome:b[0],taxa_cent:b[1]}});
  if(!API)return mostra(local);
  get('/entrega.json',6000).then(function(r){mostra(r.st===200&&r.j.bairros&&r.j.bairros.length?r.j.bairros:local)}).catch(function(){mostra(local)});
})();

paint();
paginaLoja();
paginaPedido();
window.AELoja={abrirSacola:openBag,_estado:function(){return {bag:bag,CAT:CAT,DADOS:DADOS}}};
})();
