(function(){
'use strict';
var L=document.documentElement.lang==='pt'?'pt':'en';
var D={
 en:{cur:'$',loc:'en-US',low:'low',sold:'Sold 1: ',run:' is running low.',out:' is out. Time to reorder.',intro:'Try it: tap + on a product, or scan a random sale.',noRe:'Nothing to reorder yet.',buy:'buy ',reset:'Reset',
  re:'Reorder list',day:'Today',diffOk:'Drawer matches.',diffOver:'Drawer is over by ',diffUnder:'Drawer is short by ',
  req:'Required.',mail:'Enter a valid email, like name@shop.com.',consent:'Please accept to continue.',
  sent:'Thanks. This is a demo form, so nothing was sent and nothing was stored.',perm:'/month',perStore:'per month, total',
  one:' store',many:' stores',annual:'billed yearly, 2 months free',monthly:'billed monthly'},
 pt:{cur:'R$ ',loc:'pt-BR',low:'baixo',sold:'Vendeu 1: ',run:' está acabando.',out:' acabou. Hora de repor.',intro:'Teste: toque em + num produto ou simule uma venda.',noRe:'Nada para repor ainda.',buy:'comprar ',reset:'Zerar',
  re:'Lista de reposição',day:'Hoje',diffOk:'O caixa bate.',diffOver:'Sobrou no caixa: ',diffUnder:'Faltou no caixa: ',
  req:'Campo obrigatório.',mail:'Digite um e-mail válido, como nome@loja.com.',consent:'Aceite para continuar.',
  sent:'Obrigado. Este formulário é uma demonstração: nada foi enviado nem guardado.',perm:'/mês',perStore:'por mês, no total',
  one:' loja',many:' lojas',annual:'cobrado por ano, 2 meses grátis',monthly:'cobrado por mês'}
}[L];
function money(v,dec){return D.cur+v.toLocaleString(D.loc,{minimumFractionDigits:dec?2:0,maximumFractionDigits:dec?2:0})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
/* tally svg: groups of five, last stroke is the diagonal */
function tally(n,cls){
 var g=Math.floor(n/5),r=n%5,w=g*40+(r?r*8+4:0)||4,p='',x=3,i,j;
 for(i=0;i<g;i++){for(j=0;j<4;j++){p+='M'+(x+j*8)+' 3V21'}p+='M'+(x-3)+' 20L'+(x+27)+' 5';x+=40}
 for(j=0;j<r;j++){p+='M'+(x+j*8)+' 3V21'}
 return '<svg class="tally '+(cls||'')+'" viewBox="0 0 '+w+' 24" width="'+w+'" height="24" aria-hidden="true" focusable="false"><path d="'+p+'"/></svg>';
}
/* mobile menu */
var mb=$('.menu'),nav=$('.nav');
if(mb&&nav){
 mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.focus()}});
 $$('a',nav).forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open')})});
}
/* language memory */
$$('.lang a').forEach(function(a){a.addEventListener('click',function(){try{localStorage.setItem('tr-lang',a.getAttribute('hreflang'))}catch(e){}})});
/* reveal */
var rv=$$('.rv,.ledger');
if('IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});
 rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});
$$('[data-tally]').forEach(function(el){el.innerHTML=tally(+el.dataset.tally,'draw')});
/* till demo */
var till=$('#till');
if(till){
 var P=L==='pt'?[['Café em grão 250 g',14,18,4,38],['Caderno A5',9,12,3,24],['Cabo USB-C 1 m',3,10,3,29],['Azeite 500 ml',11,12,3,46],['Pilha AA, 4 un.',7,16,4,19]]:
  [['Coffee beans 250 g',14,18,4,12],['Notebook A5',9,12,3,8],['USB-C cable 1 m',3,10,3,9],['Olive oil 500 ml',11,12,3,15],['AA batteries, 4 pack',7,16,4,6]];
 var st,sales,tix;
 var list=$('#stock'),msg=$('#msg'),re=$('#reorder');
 function reset(){st=P.map(function(p){return{n:p[0],q:p[1],mx:p[2],mn:p[3],pr:p[4]}});sales=L==='pt'?1284:412;tix=47;draw();msg.textContent=D.intro}
 function draw(){
  var lowN=0,ro=[];
  list.innerHTML=st.map(function(it,i){
   var low=it.q<=it.mn;if(low){lowN++;ro.push(it)}
   return '<li class="'+(low?'low':'')+'"><span class="nm" data-low="'+D.low+'">'+it.n+'<span class="sku">'+(L==='pt'?'min. ':'min ')+it.mn+'</span></span><span class="tm">'+tally(it.q)+'</span><span><span class="ct">'+it.q+'</span> <button class="sell" data-i="'+i+'" aria-label="'+(L==='pt'?'Vender 1: ':'Sell 1: ')+it.n+'"'+(it.q?'':' disabled')+'>+</button></span></li>';
  }).join('');
  $('#k-sales').textContent=money(sales);$('#k-tix').textContent=tix;$('#k-low').textContent=lowN;
  re.className='reorder'+(ro.length?' on':'');
  re.innerHTML=ro.length?'<h3>'+D.re+'</h3><ul>'+ro.map(function(it){return '<li>'+it.n+': '+D.buy+(it.mx-it.q)+'</li>'}).join('')+'</ul>':'';
 }
 function sell(i){
  var it=st[i];if(!it.q){msg.textContent=it.n+D.out;return}
  it.q--;sales+=it.pr;tix++;draw();
  msg.textContent=D.sold+it.n+(it.q<=it.mn?(' '+(it.q?D.run.trim():D.out.trim())):'');
  var b=$('.sell[data-i="'+i+'"]',list);if(b&&!b.disabled)b.focus();
 }
 list.addEventListener('click',function(e){var b=e.target.closest('.sell');if(b)sell(+b.dataset.i)});
 $('#scan').addEventListener('click',function(){var ok=st.map(function(x,i){return x.q?i:-1}).filter(function(i){return i>=0});if(ok.length)sell(ok[Math.floor(Math.random()*ok.length)]);else msg.textContent=D.out});
 $('#reset').addEventListener('click',reset);
 reset();
}
/* tabs */
$$('[role=tablist]').forEach(function(tl){
 var tabs=$$('[role=tab]',tl);
 function pick(t,f){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=document.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});if(f)t.focus()}
 tabs.forEach(function(t,i){
  t.addEventListener('click',function(){pick(t)});
  t.addEventListener('keydown',function(e){var k=e.key,n=-1;if(k==='ArrowDown'||k==='ArrowRight')n=(i+1)%tabs.length;else if(k==='ArrowUp'||k==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(k==='Home')n=0;else if(k==='End')n=tabs.length-1;if(n>-1){e.preventDefault();pick(tabs[n],true)}});
 });
});
/* pricing */
var pc=$('#plancalc');
if(pc){
 var base=+pc.dataset.base,multi=+pc.dataset.multi,yr=false,rng=$('#stores'),out=$('#total'),sub=$('#totalsub');
 function calc(){
  var n=+rng.value,m=n===1?base:multi*n;if(yr)m=m*10/12;
  out.textContent=money(Math.round(m));
  sub.textContent=n+(n===1?D.one:D.many)+', '+(yr?D.annual:D.monthly);
  $('#nlabel').textContent=n;
  rng.setAttribute('aria-valuetext',n+(n===1?D.one:D.many));
  $$('[data-m]').forEach(function(el){var v=+el.dataset.m;el.textContent=money(yr?Math.round(v*10/12):v)});
  $$('[data-bill]').forEach(function(el){el.textContent=yr?el.dataset.yr:el.dataset.mo});
 }
 rng.addEventListener('input',calc);
 $$('.bill button').forEach(function(b){b.addEventListener('click',function(){yr=b.dataset.v==='y';$$('.bill button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});calc()})});
 calc();
}
/* close the day */
var cd=$('#closeday');
if(cd){
 var f=function(id){return parseFloat(String($('#'+id).value).replace(',','.'))||0};
 function upd(){var d=f('c-count')-(f('c-open')+f('c-cash')-f('c-out')),b=$('#c-diff'),m=$('#c-msg');
  var a=Math.abs(Math.round(d*100)/100);b.textContent=(d<0?'-':d>0?'+':'')+money(a,true);b.className=d<0?'neg':d>0?'pos':'';
  m.textContent=a===0?D.diffOk:(d>0?D.diffOver:D.diffUnder)+money(a,true)}
 $$('input',cd).forEach(function(i){i.addEventListener('input',upd)});upd();
}
/* contact form: validation only, nothing is sent */
var fm=$('#contactform');
if(fm){
 fm.addEventListener('submit',function(e){
  e.preventDefault();var bad=null;
  $$('[data-req]',fm).forEach(function(inp){
   var v=inp.type==='checkbox'?inp.checked:inp.value.trim(),er=document.getElementById(inp.id+'-e'),msg='';
   if(!v)msg=inp.type==='checkbox'?D.consent:D.req;
   else if(inp.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))msg=D.mail;
   inp.setAttribute('aria-invalid',msg?'true':'false');er.textContent=msg;if(msg&&!bad)bad=inp;
  });
  var ok=$('#okmsg');
  if(bad){bad.focus();ok.classList.remove('on')}
  else{ok.textContent=D.sent;ok.classList.add('on');ok.setAttribute('tabindex','-1');ok.focus();fm.reset()}
 });
}
})();
