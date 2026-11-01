(function(){
'use strict';
var D=document,H=D.documentElement,LANG=H.lang.slice(0,2),$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
H.classList.add('js');
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* idioma: guarda a escolha e leva para a versão certa */
var pref=store.get('lume-lang'),alt=$('.lang a:not([aria-current])');
if(pref&&pref!==LANG&&alt&&alt.hreflang===pref&&!/[?&]fixo=1/.test(location.search)){location.replace(alt.href)}
$$('.lang a').forEach(function(a){a.addEventListener('click',function(){store.set('lume-lang',a.hreflang)})});

/* menu do celular */
var bg=$('.burger'),nav=$('#nav');
if(bg){
 var close=function(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false')};
 bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){close();bg.focus()}});
 $$('a',nav).forEach(function(a){a.addEventListener('click',close)});
 matchMedia('(min-width:981px)').addEventListener('change',close);
}

/* o sol anda no horizonte conforme a rolagem */
var hz=$('.horizon'),sun=hz&&$('i',hz),bar=hz&&$('b',hz),tick=false;
function prog(){tick=false;var m=H.scrollHeight-innerHeight,p=m>0?Math.min(1,scrollY/m):0;bar.style.width=(p*100)+'%';sun.style.transform='translateX('+(p*(hz.clientWidth-12))+'px)'}
if(hz){addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});prog()}

/* aparecer ao rolar */
var rv=$$('.rv');
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
 rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* abas acessíveis (setas, Home, End) */
$$('[role=tablist]').forEach(function(tl){
 var tabs=$$('[role=tab]',tl);
 function sel(t,focus){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=D.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});if(focus)t.focus()}
 tabs.forEach(function(t,i){
  t.addEventListener('click',function(){sel(t)});
  t.addEventListener('keydown',function(e){var k=e.key,n=null;
   if(k==='ArrowRight'||k==='ArrowDown')n=tabs[(i+1)%tabs.length];
   else if(k==='ArrowLeft'||k==='ArrowUp')n=tabs[(i-1+tabs.length)%tabs.length];
   else if(k==='Home')n=tabs[0];else if(k==='End')n=tabs[tabs.length-1];
   if(n){e.preventDefault();sel(n,true)}});
 });
 var h=location.hash&&tabs.filter(function(t){return t.getAttribute('aria-controls')===location.hash.slice(1)})[0];
 sel(h||tabs.filter(function(t){return t.getAttribute('aria-selected')==='true'})[0]||tabs[0]);
});

/* formatação */
var loc=LANG==='en'?'en-US':'pt-BR';
var brl=function(n,d){return new Intl.NumberFormat(loc,{style:'currency',currency:'BRL',minimumFractionDigits:d==null?0:d,maximumFractionDigits:d==null?0:d}).format(n)};
var pct=function(n){return new Intl.NumberFormat(loc,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+'%'};

/* seletor de plano + mensal/anual */
var plan=$('#plan');
if(plan){
 var cur=$('.opt[aria-pressed=true]'),annual=false,pn=$('#pn'),pp=$('#pp'),pi=$('#pi'),pb=$('#pb'),pfn=$('#pfn');
 var show=function(){
  var m=+cur.dataset.p,v=annual?Math.round(m*10/12):m;
  pn.textContent=cur.dataset.n;pp.textContent=v;
  pi.innerHTML=cur.dataset.i.split('|').map(function(t){var l=D.createElement('li');l.textContent=t;return l.outerHTML}).join('');
  pb.textContent=annual?pb.dataset.a.replace('{t}',brl(m*10)):pb.dataset.m;
  var c=$('#pcta');if(c)c.href=c.getAttribute('href').split('?')[0]+'?tipo='+cur.dataset.k;
 };
 $$('.opt').forEach(function(b){b.addEventListener('click',function(){$$('.opt').forEach(function(o){o.setAttribute('aria-pressed',o===b)});cur=b;show()})});
 $$('.bill button').forEach(function(b){b.addEventListener('click',function(){annual=b.dataset.v==='a';$$('.bill button').forEach(function(o){o.setAttribute('aria-pressed',o===b)});show()})});
 show();
}

/* simulador do Simples Nacional (Anexo I comércio, Anexo III serviços) */
var calc=$('#calc');
if(calc){
 var T={c:[[180e3,.04,0],[360e3,.073,5940],[720e3,.095,13860],[1800e3,.107,22500],[3600e3,.143,87300],[4800e3,.19,378000]],
        s:[[180e3,.06,0],[360e3,.112,9360],[720e3,.135,17640],[1800e3,.16,35640],[3600e3,.21,125640],[4800e3,.33,648000]]};
 var rg=$('#c-rg'),nm=$('#c-nm'),ac=$('#c-ac'),o=$('#c-out');
 var run=function(){
  var m=Math.max(0,+nm.value||0),rbt=m*12,tab=T[ac.value],f=null;
  rg.value=Math.min(m,200000);
  for(var i=0;i<tab.length;i++){if(rbt<=tab[i][0]){f=tab[i];break}}
  var w=[];
  if(!m){o.innerHTML='';return}
  if(!f){o.innerHTML='<p class="big">—</p><p>'+calc.dataset.over+'</p>';return}
  var ef=(rbt*f[1]-f[2])/rbt,tax=m*ef,pl=ac.value==='c'?489:349;
  if(rbt<=81000)w.push(calc.dataset.mei);
  if(ac.value==='s')w.push(calc.dataset.fator);
  o.innerHTML='<p class="fine">'+calc.dataset.l1+'</p><p class="big">'+brl(tax,2)+'</p><dl><dt>'+calc.dataset.l2+'</dt><dd>'+pct(ef*100)+'</dd><dt>'+calc.dataset.l3+'</dt><dd>'+brl(rbt)+'</dd><dt>'+calc.dataset.l4+'</dt><dd>'+brl(pl)+'</dd><dt>'+calc.dataset.l5+'</dt><dd>'+brl(tax+pl,2)+'</dd></dl>'+w.map(function(t){return '<p class="warn">'+t+'</p>'}).join('');
 };
 rg.addEventListener('input',function(){nm.value=rg.value;run()});nm.addEventListener('input',run);ac.addEventListener('change',run);run();
}

/* lista de documentos (guarda no aparelho) */
var ck=$$('.check input');
if(ck.length){
 var key='lume-docs',saved=[];try{saved=JSON.parse(store.get(key)||'[]')}catch(e){}
 var cnt=$('#cnt'),mt=$('#meter i');
 var upd=function(){var n=ck.filter(function(c){return c.checked}).length;cnt.textContent=cnt.dataset.t.replace('{n}',n).replace('{t}',ck.length);mt.style.width=(n/ck.length*100)+'%';store.set(key,JSON.stringify(ck.map(function(c){return c.checked?1:0})))};
 ck.forEach(function(c,i){c.checked=!!saved[i];c.addEventListener('change',upd)});upd();
}

/* formulário (demonstração: nada é enviado) */
var form=$('#contato-form');
if(form){
 var q=/[?&]tipo=(\w+)/.exec(location.search),sl=$('#f-tipo');if(q&&sl&&$('option[value='+q[1]+']',sl))sl.value=q[1];
 var msg=function(el,t){var e=$('.err',el.closest('.fld'));e.textContent=t||'';if(t)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')};
 var chk=function(el){
  var v=el.value.trim(),t='';
  if(el.required&&!v)t=form.dataset.req;
  else if(el.type==='email'&&v&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))t=form.dataset.mail;
  msg(el,t);return !t};
 $$('input[required],textarea[required],input[type=email]',form).forEach(function(el){el.addEventListener('blur',function(){chk(el)});el.addEventListener('input',function(){if(el.getAttribute('aria-invalid'))chk(el)})});
 form.addEventListener('submit',function(e){
  e.preventDefault();
  var bad=$$('input[required],textarea[required],input[type=email]',form).filter(function(el){return !chk(el)});
  var lg=$('#f-lgpd'),le=$('.err',lg.closest('.fld'));
  if(!lg.checked){le.textContent=form.dataset.req;bad.push(lg)}else le.textContent='';
  if(bad.length){bad[0].focus();return}
  form.hidden=true;var ok=$('#ok');ok.classList.add('show');ok.focus();
 });
}

/* foco do menu ativo e ano */
$$('[data-ano]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
