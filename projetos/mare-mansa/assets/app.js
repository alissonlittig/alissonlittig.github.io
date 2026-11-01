(function(){
'use strict';
var D=document,H=D.documentElement,LANG=H.lang.slice(0,2),EN=LANG==='en';
var $=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
var T=function(pt,en){return EN?en:pt};
H.classList.add('js');
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var loc=EN?'en-US':'pt-BR';
var brl=function(n){return new Intl.NumberFormat(loc,{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n)};
var pad=function(n){return n<10?'0'+n:''+n};

/* idioma: guarda a escolha e leva para a versão certa */
var pref=store.get('mare-lang'),alt=$('.lang a:not([aria-current])');
if(pref&&pref!==LANG&&alt&&alt.hreflang===pref&&!/[?&]fixo=1/.test(location.search)){location.replace(alt.href+location.search+location.hash)}
$$('.lang a').forEach(function(a){a.addEventListener('click',function(){store.set('mare-lang',a.hreflang)})});

/* reduzir movimento */
var mot=$('#mot');
function calm(on){H.classList.toggle('calm',on);if(mot){mot.setAttribute('aria-pressed',on)}}
calm(store.get('mare-calm')==='1'||matchMedia('(prefers-reduced-motion:reduce)').matches);
if(mot)mot.addEventListener('click',function(){var on=!H.classList.contains('calm');store.set('mare-calm',on?'1':'0');calm(on)});

/* menu do celular */
var bg=$('.burger'),nav=$('#nav');
if(bg){
 var close=function(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false')};
 bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?T('Fechar menu','Close menu'):T('Abrir menu','Open menu'))});
 D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){close();bg.focus()}});
 $$('a',nav).forEach(function(a){a.addEventListener('click',close)});
 matchMedia('(min-width:981px)').addEventListener('change',close);
}

/* cabeçalho: sólido depois do herói */
var top=$('.top.over');
if(top){var f=function(){top.classList.toggle('solid',scrollY>40||nav&&nav.classList.contains('open'))};addEventListener('scroll',f,{passive:true});f();if(bg)bg.addEventListener('click',f)}

/* aparecer ao rolar */
var rv=$$('.rv');
if('IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px'});
 rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ---------- um sábado na Maré Mansa ---------- */
var dia=$('#dia');
if(dia){
 var EV=[
  [6,T('Antes do café','Before breakfast'),T('A praia é toda sua. Maré e luz mudam a cada dia, então a recepção deixa a tábua da maré na porta.','The beach is all yours. Tide and light change daily, so reception pins the tide table by the door.')],
  [7.5,T('Café na varanda','Breakfast on the porch'),T('Pães, frutas, ovos, tapioca e café coado. Servido até as 10h e incluso na diária.','Bread, fruit, eggs, tapioca and filter coffee. Served until 10 a.m. and included in the rate.')],
  [9.5,T('Caminhada pela cala','Walk along the cove'),T('Com a maré baixa dá para ir até as poças das pedras. Leve sapatilha de borracha.','At low tide you can walk out to the rock pools. Bring rubber shoes.')],
  [11,T('Stand-up paddle','Stand-up paddle'),T('Aula de 1h30 com instrutor e colete, na parte calma da enseada.','A 1h30 lesson with instructor and vest, in the calm part of the cove.')],
  [13,T('Almoço na vila','Lunch in the village'),T('Seis restaurantes a 6 minutos a pé. A recepção reserva mesa se você pedir.','Six restaurants a 6-minute walk away. Reception books a table if you ask.')],
  [15.5,T('Trilha da ponta','Headland trail'),T('3 km ida e volta, nível moderado, com mirante no meio. Saia antes das 16h.','3 km round trip, moderate, with a lookout halfway. Set out before 4 p.m.')],
  [18,T('Pôr do sol no deck','Sunset on the deck'),T('O deck abre às 17h. O pôr do sol cai entre 17h30 e 19h30, conforme a estação.','The deck opens at 5 p.m. Sunset falls between 5:30 and 7:30 p.m., depending on the season.')],
  [20,T('Fogueira na areia','Beach bonfire'),T('Duas noites por semana, com lenha e cadeiras. Depois, silêncio a partir das 22h.','Two nights a week, with firewood and chairs. Quiet hours start at 10 p.m.')]
 ];
 var SK=[[6,[244,201,160],[94,143,176]],[9,[191,224,236],[62,134,173]],[12,[142,201,230],[44,116,166]],[15.5,[156,203,224],[44,110,155]],[17.5,[246,178,107],[201,103,74]],[18.7,[228,111,60],[27,58,87]],[20,[20,48,74],[11,42,63]],[22,[9,28,43],[6,18,28]]];
 var rg=$('#hora'),ck=$('#relogio'),tt=$('#evt-t'),tp=$('#evt-p'),sun=$('#sol'),moon=$('#lua'),sky=$('#scene'),sA=$('#sk-a'),sB=$('#sk-b');
 var mix=function(a,b,t){return a.map(function(v,i){return Math.round(v+(b[i]-v)*t)})};
 var upd=function(){
  var h=parseFloat(rg.value),i=0;
  for(;i<SK.length-2&&h>=SK[i+1][0];i++);
  var a=SK[i],b=SK[i+1],t=Math.max(0,Math.min(1,(h-a[0])/(b[0]-a[0])));
  var c1='rgb('+mix(a[1],b[1],t)+')',c2='rgb('+mix(a[2],b[2],t)+')';
  sA.setAttribute('stop-color',c1);sB.setAttribute('stop-color',c2);
  dia.style.setProperty('--sky',c2);
  var p=Math.max(0,Math.min(1,(h-6)/(19.2-6)));
  sun.setAttribute('transform','translate('+(60+p*480)+' '+(210-Math.sin(p*Math.PI)*170)+')');
  sun.style.opacity=h>19.3?0:1;
  moon.style.opacity=h>=19.3?Math.min(1,(h-19.3)/1.2):0;
  var hh=Math.floor(h),mm=Math.round((h-hh)*60);
  ck.textContent=EN?((hh%12||12)+':'+pad(mm)+(hh<12?' a.m.':' p.m.')):(hh+'h'+(mm?pad(mm):''));
  var e=EV[0];EV.forEach(function(x){if(h>=x[0])e=x});
  tt.textContent=e[1];tp.textContent=e[2];
  rg.setAttribute('aria-valuetext',ck.textContent+', '+e[1]);
 };
 rg.addEventListener('input',upd);upd();
}

/* ---------- filtro de quartos ---------- */
var fr=$('#filtro');
if(fr){
 var rooms=$$('.room'),out=$('#fr-n'),btns=$$('button',fr);
 var run=function(g){var n=0;rooms.forEach(function(r){var ok=g<=+r.dataset.cap;r.hidden=!ok;if(ok)n++});out.textContent=n+' '+(n===1?T('quarto','room'):T('quartos','rooms'))};
 btns.forEach(function(b){b.addEventListener('click',function(){btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});run(+b.dataset.g)})});
 run(1);
}

/* ---------- roteiro ---------- */
var rot=$('#rot');
if(rot){
 var ACT={
  cala:[T('Caminhada pela cala','Walk along the cove'),T('Com a maré baixa, até as poças das pedras. Leve sapatilha.','At low tide, out to the rock pools. Bring rubber shoes.'),60],
  sup:[T('Stand-up paddle','Stand-up paddle'),T('Aula com instrutor e colete, na parte calma da enseada.','Lesson with instructor and vest, in the calm part of the cove.'),90],
  barco:[T('Passeio de barco','Boat ride'),T('Saída do cais da vila, com parada para nadar.','Leaves from the village pier, with a swim stop.'),120],
  trilha:[T('Trilha da ponta','Headland trail'),T('3 km ida e volta, nível moderado, mirante no meio.','3 km round trip, moderate, lookout halfway.'),105],
  snorkel:[T('Mergulho livre','Snorkeling'),T('Máscara e snorkel emprestados, na cala de águas rasas.','Mask and snorkel provided, in the shallow cove.'),90],
  deck:[T('Pôr do sol no deck','Sunset on the deck'),T('O deck abre às 17h. Bebida e petisco à parte.','The deck opens at 5 p.m. Drinks and snacks extra.'),90],
  jantar:[T('Jantar na vila','Dinner in the village'),T('Restaurantes a 6 minutos a pé. A recepção reserva a mesa.','Restaurants a 6-minute walk away. Reception books the table.'),120],
  fogueira:[T('Fogueira na areia','Beach bonfire'),T('Duas noites por semana. Marshmallow para as crianças.','Two nights a week. Marshmallows for the kids.'),90],
  praia:[T('Tarde de praia','Beach afternoon'),T('Sombrinha e cadeira da pousada, a 4 minutos a pé.','Umbrella and chairs from the inn, a 4-minute walk.'),180],
  castelo:[T('Castelo de areia com monitor','Sandcastle with a monitor'),T('Para crianças a partir de 4 anos.','For children from age 4.'),60],
  yoga:[T('Yoga no deck','Yoga on the deck'),T('Aula suave, tapete incluso.','Gentle class, mat included.'),60],
  massagem:[T('Massagem para dois','Couples massage'),T('Sala interna. Reserve na chegada.','Indoor room. Book on arrival.'),60],
  cozinha:[T('Oficina de moqueca','Moqueca workshop'),T('Na cozinha da pousada, com almoço no fim.','In the inn kitchen, with lunch at the end.'),150],
  jogos:[T('Sala de jogos e cinema','Game room and movie'),T('Jogos de tabuleiro e um filme, tudo coberto.','Board games and a movie, all indoors.'),120],
  vinho:[T('Vinho e queijos na sala','Wine and cheese in the lounge'),T('Lareira a gás e música baixa. Cobrado à parte.','Gas fireplace and soft music. Charged separately.'),90],
  oficina:[T('Oficina de barquinhos','Wooden boat workshop'),T('Madeira, tinta e monitor, para crianças.','Wood, paint and a monitor, for kids.'),90],
  leitura:[T('Manhã lenta na varanda coberta','Slow morning on the covered porch'),T('Café estendido e livros emprestados na recepção.','Extended breakfast and books from reception.'),120]
 };
 var PLAN={
  casal:[['cala','praia','deck'],['yoga','barco','jantar'],['sup','massagem','vinho']],
  familia:[['cala','praia','fogueira'],['castelo','barco','jantar'],['snorkel','praia','deck']],
  aventura:[['trilha','snorkel','deck'],['sup','barco','fogueira'],['cala','snorkel','jantar']]
 };
 var IN={jantar:1,massagem:1,cozinha:1,jogos:1,vinho:1,oficina:1,leitura:1};
 var RM=['cozinha','leitura','massagem'],RT={casal:'massagem',familia:'oficina',aventura:'jogos'},RN={casal:'vinho',familia:'jogos',aventura:'vinho'};
 var st={p:'casal',d:2,r:false},outp=$('#rot-out'),SL=[T('Manhã','Morning'),T('Tarde','Afternoon'),T('Noite','Evening')];
 var fmt=function(m){return m<60?m+' min':Math.floor(m/60)+'h'+(m%60?pad(m%60):'')};
 var build=function(){
  var days=PLAN[st.p].slice(0,st.d),txt=[];
  outp.innerHTML='';
  days.forEach(function(day,di){
   var s=D.createElement('section');s.className='pday';s.style.padding='18px 20px';
   var h=D.createElement('h3');h.textContent=T('Dia ','Day ')+(di+1);s.appendChild(h);
   var ol=D.createElement('ol');txt.push(h.textContent);
   day.forEach(function(k,si){
    if(st.r&&!IN[k])k=si===0?(st.p==='familia'&&RM[di]==='massagem'?'oficina':RM[di]):si===1?RT[st.p]:RN[st.p];
    var a=ACT[k],li=D.createElement('li');
    li.innerHTML='<b></b><div><strong></strong><span></span></div>';
    li.firstChild.textContent=SL[si];li.querySelector('strong').textContent=a[0];li.querySelector('span').textContent=a[1]+' ('+fmt(a[2])+')';
    ol.appendChild(li);txt.push('- '+SL[si]+': '+a[0]+' ('+fmt(a[2])+')');
   });
   s.appendChild(ol);outp.appendChild(s);txt.push('');
  });
  outp.dataset.txt=T('Roteiro Maré Mansa (exemplo)\n','Maré Mansa itinerary (sample)\n')+txt.join('\n');
 };
 $$('[data-p]',rot).forEach(function(b){b.addEventListener('click',function(){st.p=b.dataset.p;$$('[data-p]',rot).forEach(function(x){x.setAttribute('aria-pressed',x===b)});build()})});
 $$('[data-d]',rot).forEach(function(b){b.addEventListener('click',function(){st.d=+b.dataset.d;$$('[data-d]',rot).forEach(function(x){x.setAttribute('aria-pressed',x===b)});build()})});
 $('#chuva').addEventListener('click',function(){st.r=!st.r;this.setAttribute('aria-pressed',st.r);build()});
 $('#copiar-rot').addEventListener('click',function(){var b=this,o=b.textContent;copy(outp.dataset.txt,function(){b.textContent=T('Copiado','Copied');setTimeout(function(){b.textContent=o},1800)})});
 build();
}
function copy(t,ok){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){})}else{var a=D.createElement('textarea');a.value=t;D.body.appendChild(a);a.select();try{D.execCommand('copy');ok()}catch(e){}a.remove()}}

/* ---------- reserva ---------- */
var bk=$('#book');
if(bk){
 var RMS=[
  {n:T('Chalé Maré','Maré Chalet'),cap:2,p:420},
  {n:T('Suíte Enseada','Cove Suite'),cap:3,p:560},
  {n:T('Família Cala','Family Cala'),cap:4,p:690},
  {n:T('Loft Pôr do Sol','Sunset Loft'),cap:2,p:880}
 ];
 var q=new URLSearchParams(location.search);
 var S={room:-1,g:Math.min(4,Math.max(1,parseInt(q.get('h'))||2)),a:null,z:null,hint:Math.min(7,Math.max(0,parseInt(q.get('n'))||0)),mo:0};
 var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 var start=new Date(today.getTime()+864e5);
 var dn=function(d){return Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)};
 var add=function(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)};
 // disponibilidade de exemplo: determinística, mais ocupada em sexta e sábado
 var busy=function(r,d){var x=Math.sin(dn(d)*12.9898+(r+1)*78.233)*43758.5453;x-=Math.floor(x);var w=d.getDay();return x<(w===5||w===6?.42:.16)};
 var hs=function(d){var m=d.getMonth(),dd=d.getDate();return m===11&&dd>=20||m===0||m===1};
 var night=function(r,d){var w=d.getDay(),p=RMS[r].p*(w===5||w===6?1.15:1)*(hs(d)?1.25:1);return Math.round(p)};
 var fd=function(d){return new Intl.DateTimeFormat(loc,{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(d)};
 var fm=new Intl.DateTimeFormat(loc,{month:'long',year:'numeric'}),fw=new Intl.DateTimeFormat(loc,{weekday:'narrow'});
 var cal=$('#cal'),sum=$('#sum'),rsel=$('#rsel'),gsel=$('#hosp');
 rsel.innerHTML='';
 RMS.forEach(function(r,i){var b=D.createElement('button');b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.dataset.i=i;
  b.innerHTML='<b></b><span></span>';b.firstChild.textContent=r.n;b.lastChild.textContent=T('até ','up to ')+r.cap+T(' hóspedes · ',' guests · ')+brl(r.p)+T(' a diária',' per night');
  b.addEventListener('click',function(){S.room=i;S.a=S.z=null;pick();render()});rsel.appendChild(b)});
 gsel.value=S.g;
 var pick=function(){$$('button',rsel).forEach(function(b,i){b.setAttribute('aria-checked',i===S.room);b.disabled=RMS[i].cap<S.g;b.setAttribute('aria-disabled',b.disabled)});};
 if(!S.hint)S.hint=0;
 gsel.addEventListener('change',function(){S.g=+gsel.value;if(S.room>=0&&RMS[S.room].cap<S.g){S.room=-1;S.a=S.z=null}pick();render()});
 var free=function(a,z){for(var d=a;d<z;d=add(d,1))if(busy(S.room,d))return false;return true};
 var click=function(d){
  if(!S.a||S.z||d<=S.a){S.a=d;S.z=null;
   if(S.hint){var z=add(d,S.hint);if(free(d,z)&&dn(z)-dn(start)<366){S.z=z}}
  }else if(free(S.a,d)&&dn(d)-dn(S.a)<=7){S.z=d}
  else{S.a=d;S.z=null}
  S.hint=0;render();
 };
 var render=function(){
  cal.innerHTML='';var nm=matchMedia('(min-width:641px)').matches?2:1;
  var mm=new Date(start.getFullYear(),start.getMonth()+S.mo,1);
  for(var k=0;k<nm;k++){
   var m=new Date(mm.getFullYear(),mm.getMonth()+k,1),box=D.createElement('div');
   var hd=D.createElement('div');hd.className='cal-h';
   var title=D.createElement('b');title.textContent=fm.format(m);title.setAttribute('role','heading');title.setAttribute('aria-level','3');
   if(k===0){var p=D.createElement('button');p.type='button';p.className='nb';p.setAttribute('aria-label',T('Mês anterior','Previous month'));p.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3 5 9l6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';p.disabled=S.mo<=0;p.onclick=function(){S.mo--;render();$('.nb',cal).focus()};hd.appendChild(p)}
   else if(nm===2){var sp=D.createElement('span');sp.style.width='44px';hd.appendChild(sp)}
   hd.appendChild(title);
   if(k===nm-1){var nx=D.createElement('button');nx.type='button';nx.className='nb';nx.setAttribute('aria-label',T('Próximo mês','Next month'));nx.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m7 3 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';nx.disabled=S.mo>=10;nx.onclick=function(){S.mo++;render();$$('.nb',cal).pop().focus()};hd.appendChild(nx)}
   else if(nm===2){var sp2=D.createElement('span');sp2.style.width='44px';hd.appendChild(sp2)}
   box.appendChild(hd);
   var dw=D.createElement('div');dw.className='dow';dw.setAttribute('aria-hidden','true');
   for(var i=0;i<7;i++)dw.innerHTML+='<span>'+fw.format(new Date(2024,0,7+i))+'</span>';box.appendChild(dw);
   var g=D.createElement('div');g.className='days';g.setAttribute('role','group');g.setAttribute('aria-label',fm.format(m));
   for(var p0=0;p0<m.getDay();p0++){var e=D.createElement('span');e.className='d pad';g.appendChild(e)}
   var last=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
   for(var n=1;n<=last;n++){
    var d=new Date(m.getFullYear(),m.getMonth(),n),b=D.createElement('button');b.type='button';b.className='d';b.textContent=n;
    var past=d<start,bz=S.room<0||past?false:busy(S.room,d),lab=fd(d);
    var asOut=S.a&&!S.z&&d>S.a&&S.room>=0&&free(S.a,d)&&dn(d)-dn(S.a)<=7;
    if(S.room<0){b.disabled=true;b.setAttribute('aria-label',lab+', '+T('escolha um quarto antes','pick a room first'))}
    else if(past){b.disabled=true;b.setAttribute('aria-label',lab+', '+T('data passada','past date'))}
    else if(bz&&!asOut){b.disabled=true;b.classList.add('busy');b.setAttribute('aria-label',lab+', '+T('ocupado','booked'))}
    else{b.setAttribute('aria-label',lab+(bz?', '+T('só como saída','check-out only'):'')+(S.a&&!S.z&&asOut?', '+T('escolher como saída','choose as check-out'):''));if(bz)b.classList.add('out')}
    if(S.a&&dn(d)===dn(S.a)){b.classList.add('a');b.setAttribute('aria-pressed','true')}
    if(S.z&&dn(d)===dn(S.z)){b.classList.add('z');b.setAttribute('aria-pressed','true')}
    if(S.a&&S.z&&d>S.a&&d<S.z)b.classList.add('in');
    (function(dd){b.onclick=function(){click(dd)}})(d);
    g.appendChild(b);
   }
   box.appendChild(g);cal.appendChild(box);
  }
  summary();
 };
 var summary=function(){
  var al=$('#alerta'),tot=$('#tot'),dl=$('#sdl'),msg=$('#smsg'),go=$('#go'),cp=$('#cp');
  var ok=false,al_t='';
  var set=function(id,v){$('#'+id).textContent=v};
  set('s-q',S.room>=0?RMS[S.room].n:'—');set('s-g',S.g);
  set('s-a',S.a?fd(S.a):'—');set('s-z',S.z?fd(S.z):'—');
  var nights=0,total=0,base=0;
  if(S.room<0)al_t=T('Escolha o quarto para ver as datas livres.','Pick a room to see free dates.');
  else if(!S.a)al_t=T('Toque na data de entrada.','Tap the check-in date.');
  else if(!S.z)al_t=T('Agora toque na data de saída (até 7 noites).','Now tap the check-out date (up to 7 nights).');
  else{
   nights=dn(S.z)-dn(S.a);var wk=false;
   for(var d=S.a;d<S.z;d=add(d,1)){total+=night(S.room,d);base+=RMS[S.room].p;var w=d.getDay();if(w===5||w===6)wk=true}
   if(wk&&nights<2)al_t=T('Sexta e sábado pedem no mínimo 2 noites.','Friday and Saturday need at least 2 nights.');
   else ok=true;
  }
  set('s-n',nights||'—');
  set('s-b',nights?brl(base):'—');set('s-e',nights?brl(total-base):'—');
  tot.textContent=ok?brl(total):'—';
  $('#alerta').textContent=al_t;
  var m=ok?T('Olá! Quero reservar na Maré Mansa (pousada de exemplo): ','Hello! I would like to book at Maré Mansa (sample inn): ')+RMS[S.room].n+', '+S.g+T(' hóspede(s), entrada ',' guest(s), check-in ')+fd(S.a)+T(', saída ',', check-out ')+fd(S.z)+' ('+nights+T(' noite(s)). Total de exemplo: ',' night(s)). Sample total: ')+brl(total)+T('. Podem confirmar?','. Can you confirm?'):T('A mensagem aparece aqui quando as datas estiverem certas.','The message shows up here once the dates are valid.');
  msg.textContent=m;
  go.setAttribute('aria-disabled',!ok);go.href='https://wa.me/'+(ok?'?text='+encodeURIComponent(m):'');go.onclick=function(e){if(!ok)e.preventDefault()};
  cp.disabled=!ok;cp.onclick=function(){var o=cp.textContent;copy(m,function(){cp.textContent=T('Copiado','Copied');setTimeout(function(){cp.textContent=o},1800)})};
 };
 pick();render();
 matchMedia('(min-width:641px)').addEventListener('change',render);
}

/* ---------- galeria ---------- */
var lb=$('#lb');
if(lb){
 var th=$$('.gal button'),ix=0,im=$('img',lb),cp2=$('#lb-cap'),lk=$('#lb-lk');
 var show=function(i){ix=(i+th.length)%th.length;var b=th[ix];im.src=b.dataset.full;im.alt=b.dataset.alt;cp2.textContent=b.dataset.cap;lk.href=b.dataset.src};
 th.forEach(function(b,i){b.addEventListener('click',function(){show(i);if(lb.showModal)lb.showModal();else lb.setAttribute('open','')})});
 $('#lb-n').onclick=function(){show(ix+1)};$('#lb-p').onclick=function(){show(ix-1)};$('#lb-x').onclick=function(){lb.close()};
 lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight')show(ix+1);if(e.key==='ArrowLeft')show(ix-1)});
 lb.addEventListener('click',function(e){if(e.target===lb)lb.close()});
}
})();
