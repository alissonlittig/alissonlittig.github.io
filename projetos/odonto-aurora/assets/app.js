(function(){
'use strict';
var D=document,H=D.documentElement,LANG=H.lang.slice(0,2),EN=LANG==='en';
var $=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
H.classList.add('js');
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var T={
 pt:{today:'Hoje',tom:'Amanhã',wd:['dom','seg','ter','qua','qui','sex','sáb'],none:'Sem horário nos próximos dias. Fale com a recepção.',
  open:'Aberto agora, até as {h}',closed:'Fechado agora. Abre {d} às {h}',tomorrow:'amanhã',
  req:'Preencha este campo.',tel:'Informe um telefone com DDD.',lg:'Marque para continuar.',
  pick:'Escolha um tratamento.',pickd:'Escolha um dia e um horário.',
  msg:'Olá, Odonto Aurora. Quero confirmar: {t}, {d} às {h}. Nome: {n}. Telefone: {p}.',
  copied:'Mensagem copiada',copy:'Copiar mensagem',fin:'Valor financiado',par:'Parcela',jur:'Juros',tot:'Total pago',ent:'Entrada',
  sem:'sem juros',am:'ao mês',x:'x de',
  tonal:'Tom {n} de 5'},
 en:{today:'Today',tom:'Tomorrow',wd:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],none:'No openings in the next days. Please call reception.',
  open:'Open now, until {h}',closed:'Closed now. Opens {d} at {h}',tomorrow:'tomorrow',
  req:'Please fill in this field.',tel:'Enter a phone number with area code.',lg:'Tick to continue.',
  pick:'Choose a treatment.',pickd:'Choose a day and a time.',
  msg:'Hello, Odonto Aurora. I would like to confirm: {t}, {d} at {h}. Name: {n}. Phone: {p}.',
  copied:'Message copied',copy:'Copy message',fin:'Financed amount',par:'Installment',jur:'Interest',tot:'Total paid',ent:'Down payment',
  sem:'interest free',am:'per month',x:'x of',
  tonal:'Shade {n} of 5'}
}[EN?'en':'pt'];
var fmt=function(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})};
var loc=EN?'en-US':'pt-BR';
var brl=function(n){return new Intl.NumberFormat(loc,{style:'currency',currency:'BRL'}).format(n)};
var p2=function(n){return (n<10?'0':'')+n};

/* idioma: guarda a escolha */
var pref=store.get('aurora-lang'),alt=$('.lang a:not([aria-current])');
if(pref&&pref!==LANG&&alt&&alt.hreflang===pref&&!/[?&]fixo=1/.test(location.search)){location.replace(alt.href+location.search+location.hash)}
$$('.lang a').forEach(function(a){a.addEventListener('click',function(){store.set('aurora-lang',a.hreflang)})});

/* menu do celular */
var bg=$('.burger'),nav=$('#nav');
if(bg){
 var close=function(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false')};
 bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){close();bg.focus()}});
 $$('a',nav).forEach(function(a){a.addEventListener('click',close)});
 matchMedia('(min-width:981px)').addEventListener('change',close);
}

/* faixa do amanhecer na rolagem */
var dawn=$('.dawn b'),tick=false;
function prog(){tick=false;var m=H.scrollHeight-innerHeight;dawn.style.width=(m>0?Math.min(100,scrollY/m*100):0)+'%'}
if(dawn){addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});prog()}

/* aparecer ao rolar */
var rv=$$('.rv');
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
 rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ---------- agenda da clinica (dados de exemplo) ---------- */
function spNow(){
 var f=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),o={};
 f.forEach(function(p){o[p.type]=+p.value});
 return {y:o.year,m:o.month,d:o.day,min:o.hour*60+o.minute};
}
var NOW=spNow();
function dayAt(n){var d=new Date(Date.UTC(NOW.y,NOW.m-1,NOW.d+n,12));return {iso:d.getUTCFullYear()+'-'+p2(d.getUTCMonth()+1)+'-'+p2(d.getUTCDate()),dow:d.getUTCDay(),dd:d.getUTCDate(),mm:d.getUTCMonth()+1,n:n}}
function times(dow){
 var a=[],i;
 if(dow===0)return a;
 for(i=480;i<720;i+=30)a.push(i);
 if(dow!==6)for(i=810;i<1080;i+=30)a.push(i);
 return a;
}
function hh(m){return p2(Math.floor(m/60))+':'+p2(m%60)}
function taken(iso,m){var s=iso+m,h=0,i;for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%100<38}
function free(d,m){return !taken(d.iso,m)&&!(d.n===0&&m<NOW.min+60)}
function label(d){return d.n===0?T.today:d.n===1?T.tom:T.wd[d.dow]+' '+d.dd+'/'+p2(d.mm)}
function nextFree(k){
 var out=[],n,d,ts,i;
 for(n=0;n<21&&out.length<k;n++){d=dayAt(n);ts=times(d.dow);
  for(i=0;i<ts.length&&out.length<k;i+=3){ /* um a cada 90 min, para variar o dia */
   var j=i;while(j<ts.length&&!free(d,ts[j]))j++;
   if(j<ts.length){out.push({d:d,m:ts[j]});i=j-(j%3)}
  }}
 return out;
}

/* horarios livres no hero */
var chips=$('#chips');
if(chips){
 var base=chips.dataset.href,ns=nextFree(3);
 chips.innerHTML=ns.length?ns.map(function(s){return '<a class="chip" href="'+base+'?d='+s.d.iso+'&h='+hh(s.m)+'">'+label(s.d)+', '+hh(s.m)+'</a>'}).join(''):'<span class="fine">'+T.none+'</span>';
}

/* aberto agora */
var op=$('#open');
if(op){
 var dn=dayAt(0),ts=times(dn.dow),st='',closed=true,nx;
 var inH=ts.some(function(m){return NOW.min>=m&&NOW.min<m+30});
 if(inH||(dn.dow>0&&NOW.min>=ts[0]&&NOW.min<ts[ts.length-1]+30&&!(NOW.min>=720&&NOW.min<810))){closed=false;st=fmt(T.open,{h:dn.dow===6?'12:00':'18:00'})}
 else{
  var k,dd;
  for(k=(NOW.min<(ts[0]||0)&&dn.dow>0)?0:1;k<8;k++){dd=dayAt(k);if(times(dd.dow).length)break}
  var when=k===0?T.today.toLowerCase():k===1?T.tomorrow:T.wd[dd.dow];
  if(dn.dow>0&&NOW.min>=720&&NOW.min<810&&dn.dow!==6){when=T.today.toLowerCase();dd={dow:dn.dow};st=fmt(T.closed,{d:when,h:'13:30'})}
  else st=fmt(T.closed,{d:when,h:'08:00'});
 }
 op.className='open'+(closed?' closed':'');op.innerHTML='<i></i><span>'+st+'</span>';
 var tr=$('.hrs tr[data-dow~="'+dn.dow+'"]');if(tr)tr.className='today';
}

/* abas acessiveis (setas, Home, End) */
$$('[role=tablist]').forEach(function(tl){
 var tabs=$$('[role=tab]',tl);
 function sel(t,focus){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=D.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});if(focus)t.focus()}
 tabs.forEach(function(t,i){
  t.addEventListener('click',function(){sel(t);history.replaceState(null,'','#'+t.getAttribute('aria-controls'))});
  t.addEventListener('keydown',function(e){var k=e.key,n=null;
   if(k==='ArrowRight'||k==='ArrowDown')n=tabs[(i+1)%tabs.length];
   else if(k==='ArrowLeft'||k==='ArrowUp')n=tabs[(i-1+tabs.length)%tabs.length];
   else if(k==='Home')n=tabs[0];else if(k==='End')n=tabs[tabs.length-1];
   if(n){e.preventDefault();sel(n,true)}});
 });
 var h=location.hash&&tabs.filter(function(t){return t.getAttribute('aria-controls')===location.hash.slice(1)})[0];
 sel(h||tabs[0]);
});

/* simulador de parcelas (juros de exemplo: 0% ate 3x, 1,99% ao mes depois) */
var sim=$('#sim');
if(sim){
 var st_=$('#s-t'),se=$('#s-e'),sn=$('#s-n'),sev=$('#s-ev'),snv=$('#s-nv'),so=$('#s-out');
 var RATE=.0199;
 var run=function(){
  var price=+st_.options[st_.selectedIndex].dataset.p,n=+sn.value,max=price*.6;
  se.max=Math.round(max/10)*10;if(+se.value>+se.max)se.value=se.max;
  var e=+se.value,pv=price-e,i=n<=3?0:RATE,pm=i?pv*i/(1-Math.pow(1+i,-n)):pv/n;
  pm=Math.round(pm*100)/100;var tot=Math.round((e+pm*n)*100)/100;
  sev.textContent=brl(e);snv.textContent=n+'x';
  so.innerHTML='<p class="fine" style="margin:0">'+T.par+'</p><p class="big">'+n+T.x+' '+brl(pm).replace(/ /g,' ')+'</p><p class="fine" style="margin:0">'+(i?((RATE*100).toFixed(2).replace('.',EN?'.':','))+'% '+T.am:T.sem)+'</p><dl><dt>'+T.ent+'</dt><dd>'+brl(e)+'</dd><dt>'+T.fin+'</dt><dd>'+brl(pv)+'</dd><dt>'+T.jur+'</dt><dd>'+(i?brl(tot-price):brl(0))+'</dd><dt>'+T.tot+'</dt><dd><b>'+brl(tot)+'</b></dd></dl>';
 };
 [st_,se,sn].forEach(function(el){el.addEventListener('input',run)});run();
}

/* slider de tom (ilustracao) */
var sh=$('#shade');
if(sh){
 var A=[227,207,152],B=[250,248,238],ft=$$('.tooth',D),lab=$('#shade-v');
 var go=function(){var v=+sh.value/100,c='rgb('+A.map(function(a,i){return Math.round(a+(B[i]-a)*v)}).join(',')+')';ft.forEach(function(t){t.style.fill=c});lab.textContent=fmt(T.tonal,{n:5-Math.round(v*4)})};
 sh.addEventListener('input',go);go();
}

/* agendamento em 3 passos */
var wz=$('#wiz');
if(wz){
 var step=1,panels=$$('.wp',wz),marks=$$('#wsteps li'),sel={t:'',d:null,h:''};
 var dayBox=$('#days'),hrBox=$('#hrs'),next=$('#w-next'),back=$('#w-back'),okb=$('#ok');
 var cd=[];for(var n=0;cd.length<10&&n<21;n++){var d0=dayAt(n);if(times(d0.dow).length&&(n>0||times(d0.dow).some(function(m){return free(d0,m)})))cd.push(d0)}
 dayBox.innerHTML=cd.map(function(d,i){return '<label><input type="radio" name="dia" value="'+d.iso+'"><span><small>'+T.wd[d.dow]+'</small><b>'+d.dd+'</b><small>'+p2(d.mm)+'</small></span></label>'}).join('');
 var showHours=function(iso){
  var d=cd.filter(function(x){return x.iso===iso})[0];sel.d=d;sel.h='';
  hrBox.innerHTML=times(d.dow).map(function(m){var f=free(d,m);return '<label><input type="radio" name="hora" value="'+hh(m)+'"'+(f?'':' disabled')+'><span>'+hh(m)+'</span></label>'}).join('');
  $$('input',hrBox).forEach(function(r){r.addEventListener('change',function(){sel.h=r.value;$('#e2').textContent=''})});
 };
 $$('input',dayBox).forEach(function(r){r.addEventListener('change',function(){showHours(r.value);$('#e2').textContent=''})});
 $$('input[name=trat]',wz).forEach(function(r){r.addEventListener('change',function(){sel.t=r.value;sel.tl=r.parentNode.querySelector('b').textContent;$('#e1').textContent=''})});
 var q=/[?&]d=([\d-]+)&h=([\d:]+)/.exec(location.search),qt=/[?&]t=(\w+)/.exec(location.search);
 if(qt){var rt=$('input[name=trat][value='+qt[1]+']',wz);if(rt){rt.checked=true;sel.t=rt.value;sel.tl=rt.parentNode.querySelector('b').textContent}}
 var go2=function(n){
  step=n;panels.forEach(function(p,i){p.hidden=i+1!==n});
  marks.forEach(function(m,i){m.className=i+1<n?'done':'';if(i+1===n)m.setAttribute('aria-current','step');else m.removeAttribute('aria-current')});
  back.hidden=n===1;next.hidden=false;next.textContent=n===3?next.dataset.send:next.dataset.next;
  var h=$('h2',panels[n-1]);if(h){h.tabIndex=-1;h.focus({preventScroll:true})}
  wz.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
 };
 if(q){var dd=$('input[name=dia][value="'+q[1]+'"]',dayBox);if(dd){dd.checked=true;showHours(q[1]);var hh_=$('input[name=hora][value="'+q[2]+'"]',hrBox);if(hh_&&!hh_.disabled){hh_.checked=true;sel.h=q[2]}}}
 var tel=$('#w-tel'),nm=$('#w-nome'),lg=$('#w-lgpd');
 var bad=function(el,id,t){$('#'+id).textContent=t||'';if(t)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');return !!t};
 next.addEventListener('click',function(){
  if(step===1){if(!sel.t){$('#e1').textContent=T.pick;return}go2(2)}
  else if(step===2){if(!sel.d||!sel.h){$('#e2').textContent=T.pickd;return}
   $('#w-res').innerHTML='<b>'+sel.tl+'</b>'+label(sel.d)+', '+sel.d.dd+'/'+p2(sel.d.mm)+' · '+sel.h;go2(3)}
  else{
   var b1=bad(nm,'e3',nm.value.trim()?'':T.req),b2=bad(tel,'e4',/\d{10,}/.test(tel.value.replace(/\D/g,''))?'':T.tel),b3=!lg.checked;
   $('#e5').textContent=b3?T.lg:'';
   if(b1||b2||b3){(b1?nm:b2?tel:lg).focus();return}
   var m=fmt(T.msg,{t:sel.tl,d:label(sel.d)+(sel.d.n<2?' ('+sel.d.dd+'/'+p2(sel.d.mm)+')':''),h:sel.h,n:nm.value.trim(),p:tel.value.trim()});
   $('#chat-t').textContent=m;
   panels.forEach(function(p){p.hidden=true});$('.wiz-nav',wz).hidden=true;$('#wsteps').hidden=true;
   okb.classList.add('show');okb.focus();wz.scrollIntoView({block:'start'});
  }
 });
 back.addEventListener('click',function(){go2(step-1)});
 var cp=$('#copy');cp&&cp.addEventListener('click',function(){var t=$('#chat-t').textContent;try{navigator.clipboard.writeText(t).then(function(){cp.textContent=T.copied})}catch(e){}});
 go2(q&&sel.h&&sel.t?3:q&&sel.t?2:1);
 if(!q)window.scrollTo(0,0);
}

/* formulario de contato (demonstracao: nada e enviado) */
var form=$('#contato-form');
if(form){
 var chk=function(el){var v=el.value.trim(),t='';if(el.required&&!v)t=T.req;var e=$('.err',el.closest('.fld'));e.textContent=t;if(t)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');return !t};
 $$('input[required],textarea[required]',form).forEach(function(el){el.addEventListener('blur',function(){chk(el)});el.addEventListener('input',function(){if(el.getAttribute('aria-invalid'))chk(el)})});
 form.addEventListener('submit',function(e){
  e.preventDefault();
  var b=$$('input[required],textarea[required]',form).filter(function(el){return !chk(el)});
  var lg2=$('#f-lgpd'),le=$('.err',lg2.closest('.fld'));
  if(!lg2.checked){le.textContent=T.lg;b.push(lg2)}else le.textContent='';
  if(b.length){b[0].focus();return}
  form.hidden=true;var ok=$('#cok');ok.classList.add('show');ok.focus();
 });
}
$$('[data-ano]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
