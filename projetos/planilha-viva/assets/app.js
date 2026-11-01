(function(){
'use strict';
var D=document,H=D.documentElement;
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}
var store={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function lang(){return H.getAttribute('data-lang')==='en'?'en':'pt'}
function loc(){return lang()==='en'?'en-US':'pt-BR'}
function fm(n,d){return new Intl.NumberFormat(loc(),{minimumFractionDigits:d||0,maximumFractionDigits:d||0}).format(n)}
function money(n,d){return 'R$ '+fm(n,d||0)}
function pct(n){return fm(n,1)+'%'}
function T(pt,en){return lang()==='en'?en:pt}

/* idioma */
var attrs=['aria-label','placeholder','alt','title','content'];
function setLang(l,save){
  H.setAttribute('data-lang',l);H.lang=l==='en'?'en':'pt-BR';
  if(save)store.set('pv-lang',l);
  $$('*').forEach(function(el){
    attrs.forEach(function(a){
      var k='data-en-'+a;
      if(el.hasAttribute(k)){
        if(!el.hasAttribute('data-pt-'+a))el.setAttribute('data-pt-'+a,el.getAttribute(a)||'');
        el.setAttribute(a,l==='en'?el.getAttribute(k):el.getAttribute('data-pt-'+a));
      }
    });
    if(el.hasAttribute('data-en-text')){
      if(!el.hasAttribute('data-pt-text'))el.setAttribute('data-pt-text',el.textContent);
      el.textContent=l==='en'?el.getAttribute('data-en-text'):el.getAttribute('data-pt-text');
    }
  });
  var tt=$('title');if(tt&&tt.getAttribute('data-en'))D.title=l==='en'?tt.getAttribute('data-en'):tt.getAttribute('data-pt');
  $$('.lang button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-l')===l)});
  D.dispatchEvent(new Event('langchange'));
}
$$('.lang button').forEach(function(b){b.addEventListener('click',function(){setLang(b.getAttribute('data-l'),true)})});

/* menu */
var mb=$('.menu-btn'),nav=$('.tabs');
if(mb){mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
 D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.focus()}})}

/* entrada suave */
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else{$$('.rv').forEach(function(el){el.classList.add('in')})}

function num(el){var v=String(el.value).replace(/[^\d.,\-]/g,'');if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,'');else v=v.replace(',','.');return Number(v)||0}
function val(id){return num(D.getElementById(id))}
function set(id,t){var e=D.getElementById(id);if(e)e.textContent=t}

/* planilha do herói */
if($('#hv')){
  var calcH=function(){
    var v=val('hv'),c=val('hc'),f=val('hf'),l=v-c-f;
    set('hl',money(l));set('hm',v?pct(l/v*100):'-');
    $('#hrow').classList.toggle('neg',l<0);
    var pc=v?c/v*100:0,pf=v?f/v*100:0,pl=Math.max(0,100-pc-pf);
    if(pc+pf>100){var s=100/(pc+pf);pc*=s;pf*=s}
    $('#sa').style.width=pc+'%';$('#sb').style.width=pf+'%';$('#sc').style.width=pl+'%';
    $('#stack').classList.toggle('neg',l<0);
    set('hsum',l<0?T('Faltaram '+money(-l)+' para fechar o mês.','The month closed '+money(-l)+' short.'):T('De cada R$ 100 que entram, R$ '+fm(Math.max(0,l/(v||1)*100),0)+' ficam.','Of every R$ 100 in, R$ '+fm(Math.max(0,l/(v||1)*100),0)+' stays.'));
  };
  ['hv','hc','hf'].forEach(function(i){D.getElementById(i).addEventListener('input',calcH)});
  D.addEventListener('langchange',calcH);calcH();
}

/* ferramenta */
var tool=$('#ferramenta');
if(tool){
  var PRE={
    padaria:{v:48000,c:19200,f:15500,t:6,pc:3.2,pd:18,pt:6,pm:20,s:6000,e1:11800,e2:12400,e3:11500,e4:13200,x1:12900,x2:11700,x3:14100,x4:12300},
    feira:{v:21000,c:12600,f:2400,t:0,pc:4.5,pd:8,pt:0,pm:25,s:800,e1:5200,e2:5400,e3:4900,e4:5500,x1:3600,x2:3900,x3:3300,x4:3800},
    cafe:{v:36000,c:10800,f:17200,t:6,pc:2.1,pd:30,pt:6,pm:15,s:3000,e1:8400,e2:8800,e3:9300,e4:9500,x1:10200,x2:9800,x3:8900,x4:10600}
  };
  var ids=['v','c','f','t','pc','pd','pt','pm','s','e1','e2','e3','e4','x1','x2','x3','x4'];
  function fill(o){ids.forEach(function(i){var e=D.getElementById('i-'+i);if(e)e.value=String(o[i]).replace('.',lang()==='en'?'.':',')})}
  function read(){var o={};ids.forEach(function(i){o[i]=val('i-'+i)});return o}
  var q=new URLSearchParams(location.search).get('cenario');
  var saved=store.get('pv-state');
  if(q&&PRE[q]){fill(PRE[q]);store.set('pv-state',PRE[q]);$$('.chip[data-pre]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-pre')===q)})}
  else if(saved)fill(saved);else fill(PRE.padaria);
  var res={};
  function calc(){
    var o=read();
    // resultado
    var imp=o.v*o.t/100,l=o.v-o.c-imp-o.f,mb=o.v?(o.v-o.c-imp)/o.v:0;
    res={lucro:l,margem:o.v?l/o.v*100:0,eq:mb>0?o.f/mb:0,imp:imp};
    set('o-imp',money(imp));set('o-bruto',money(o.v-o.c));set('o-l',money(l));
    set('o-m',o.v?pct(res.margem):'-');set('o-eq',mb>0?money(res.eq):'-');
    $('#o-l').classList.toggle('bad',l<0);
    var m=$('#o-msg');
    if(!o.v){m.className='msg';m.textContent=T('Digite as vendas do mês para ver o resultado.','Type the month\'s sales to see the result.')}
    else if(l<0){m.className='msg warn';m.textContent=T('Mês no vermelho. Para empatar, as vendas precisariam chegar a '+money(res.eq)+', ou as despesas fixas cair '+money(-l)+'.','In the red. To break even, sales would need to reach '+money(res.eq)+', or fixed costs fall by '+money(-l)+'.')}
    else{m.className='msg ok';m.textContent=T('Mês no azul. Você passou do ponto de equilíbrio em '+money(o.v-res.eq)+'.','In the black. You passed break-even by '+money(o.v-res.eq)+'.')}
    // preço
    var soma=o.pd+o.pt+o.pm,pm=$('#p-msg'),preco=0;
    if(soma>=100||o.pc<=0){set('p-preco','-');set('p-d','-');set('p-t','-');set('p-m','-');pm.className='msg warn';
      pm.textContent=soma>=100?T('As porcentagens somam 100% ou mais. Reduza alguma.','The percentages add up to 100% or more. Lower one of them.'):T('Digite o custo do produto.','Type the product cost.')}
    else{preco=o.pc/(1-soma/100);
      set('p-preco',money(preco,2));set('p-d',money(preco*o.pd/100,2));set('p-t',money(preco*o.pt/100,2));set('p-m',money(preco*o.pm/100,2));
      pm.className='msg ok';pm.textContent=T('Cada R$ 100 vendidos: R$ '+fm(100*o.pc/preco,0)+' pagam o produto, R$ '+fm(o.pd+o.pt,0)+' pagam despesas e impostos, R$ '+fm(o.pm,0)+' ficam de lucro.','Of every R$ 100 sold: R$ '+fm(100*o.pc/preco,0)+' pays for the product, R$ '+fm(o.pd+o.pt,0)+' covers costs and taxes, R$ '+fm(o.pm,0)+' is profit.')}
    // caixa
    var s=o.s,sal=[],min=Infinity,mw=0;
    for(var k=1;k<=4;k++){s=s+o['e'+k]-o['x'+k];sal.push(s);if(s<min){min=s;mw=k}}
    var mx=Math.max.apply(null,sal.map(Math.abs).concat([o.s,1]));
    var h='';sal.forEach(function(x,i){h+='<div><span>'+fm(x/1000,1)+'k</span><i class="'+(x<0?'neg':'')+'" style="height:'+Math.max(2,Math.abs(x)/mx*100)+'px"></i>'+T('Sem ','Wk ')+(i+1)+'</div>'});
    $('#c-bars').innerHTML='<div><span>'+fm(o.s/1000,1)+'k</span><i style="height:'+Math.max(2,o.s/mx*100)+'px;background:#8FA79A"></i>'+T('Hoje','Now')+'</div>'+h;
    set('c-fim',money(sal[3]));$('#c-fim').classList.toggle('bad',sal[3]<0);set('c-min',money(min));
    var cm=$('#c-msg');
    if(min<0){cm.className='msg warn';cm.textContent=T('O caixa fica negativo na semana '+mw+' (mínimo de '+money(min)+'). Antecipe recebimentos ou empurre pagamentos antes disso.','Cash goes negative in week '+mw+' (low of '+money(min)+'). Pull receipts forward or push payments back before then.')}
    else{cm.className='msg ok';cm.textContent=T('O caixa não fecha negativo nas próximas 4 semanas. O ponto mais baixo é '+money(min)+'.','Cash stays positive for the next 4 weeks. The low point is '+money(min)+'.')}
    store.set('pv-state',o);
  }
  tool.addEventListener('input',calc);D.addEventListener('langchange',calc);calc();
  // abas
  var tabs=$$('[role=tab]',tool),panes=$$('.tool',tool);
  function show(id,foc){tabs.forEach(function(t){var on=t.getAttribute('data-p')===id;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;if(on&&foc)t.focus()});panes.forEach(function(p){p.hidden=p.id!=='panel-'+id})}
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){show(t.getAttribute('data-p'));history.replaceState(null,'','#'+t.getAttribute('data-p'))});
    t.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;if(n<0)return;e.preventDefault();n=(n+tabs.length)%tabs.length;show(tabs[n].getAttribute('data-p'),true)});
  });
  var hh=location.hash.slice(1);show(['resultado','preco','caixa'].indexOf(hh)>=0?hh:'resultado');
  $$('.chip[data-pre]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-pre');fill(PRE[k]);$$('.chip[data-pre]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});calc()})});
  var st=$('#status');function say(m){st.textContent=m;setTimeout(function(){st.textContent=''},3500)}
  $('#b-clear').addEventListener('click',function(){fill(PRE.padaria);$$('.chip[data-pre]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-pre')==='padaria')});calc();say(T('Valores de exemplo restaurados.','Example values restored.'))});
  function txt(){var o=read();return T('Resultado do mês\nVendas: '+money(o.v)+'\nLucro: '+money(res.lucro)+'\nMargem: '+pct(res.margem)+'\nPonto de equilíbrio: '+money(res.eq),'Month result\nSales: '+money(o.v)+'\nProfit: '+money(res.lucro)+'\nMargin: '+pct(res.margem)+'\nBreak-even: '+money(res.eq))}
  $('#b-copy').addEventListener('click',function(){var t=txt();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){say(T('Copiado.','Copied.'))},function(){say(T('Seu navegador não permitiu copiar.','Your browser blocked copying.'))})});
  $('#b-csv').addEventListener('click',function(){var o=read(),r=[['linha','valor'],['vendas',o.v],['custo_mercadorias',o.c],['impostos',res.imp],['despesas_fixas',o.f],['lucro',res.lucro],['margem_pct',res.margem.toFixed(1)],['ponto_equilibrio',Math.round(res.eq)]].map(function(x){return x.join(';')}).join('\n');
    var a=D.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+r],{type:'text/csv'}));a.download='resultado.csv';D.body.appendChild(a);a.click();a.remove();say(T('Arquivo resultado.csv baixado.','resultado.csv downloaded.'))});
}

/* curso: linha dos 21 dias */
var dr=$('#dayrange');
if(dr){
  var lessons=$$('.wk li[data-day]'),btns=$$('.days button');
  var info=lessons.map(function(li){return {m:Number(li.getAttribute('data-m')),t:$('.tt',li),d:$('.d',li)}});
  function day(n){
    n=Number(n);dr.value=n;
    btns.forEach(function(b,i){b.classList.toggle('on',i+1<=n);b.classList.toggle('cur',i+1===n);b.setAttribute('aria-pressed',i+1===n)});
    lessons.forEach(function(li,i){li.classList.toggle('done',i+1<=n)});
    var cur=lessons[n-1];
    $('#td-n').innerHTML='<span lang="pt">Dia '+n+' de 21</span><span lang="en">Day '+n+' of 21</span>';
    $('#td-t').innerHTML=$('.tt',cur).innerHTML;
    $('#td-d').innerHTML=$('.d',cur).innerHTML;
    var mins=0;info.forEach(function(x,i){if(i<n)mins+=x.m});
    set('td-min',mins+' min');
    $('#td-built').innerHTML=lessons.slice(Math.max(0,n-3),n).reverse().map(function(li){return '<li><b>'+li.getAttribute('data-ref')+'</b><span>'+$('.d',li).innerHTML+'</span></li>'}).join('');
    dr.setAttribute('aria-valuetext',T('Dia '+n+' de 21','Day '+n+' of 21'));
  }
  dr.addEventListener('input',function(){day(dr.value)});
  btns.forEach(function(b,i){b.addEventListener('click',function(){day(i+1)})});
  day(1);
}

/* FAQ */
$$('.faqbar .chip').forEach(function(c){c.addEventListener('click',function(){
  var k=c.getAttribute('data-f');$$('.faqbar .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
  $$('details.q').forEach(function(d){d.hidden=!(k==='all'||d.getAttribute('data-k')===k)})})});

/* contato */
var form=$('#form');
if(form){
  var pl=new URLSearchParams(location.search).get('plano');
  if(pl&&$('#f-assunto'))$('#f-assunto').value=pl;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.checkValidity()){form.reportValidity();return}
    var s=$('#sent');s.classList.add('show');s.focus();form.reset();
  });
}
setLang(H.getAttribute('data-lang')==='en'?'en':'pt',false);
})();
