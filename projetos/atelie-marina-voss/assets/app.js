(function(){
'use strict';
var D=document,R=D.documentElement,EN=R.lang==='en',$=function(s,c){return(c||D).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s))};
R.classList.remove('no-js');
/* reduzir movimento */
var rmBtn=$('.rmt');
function setRM(on){R.classList.toggle('rm',on);if(rmBtn){rmBtn.setAttribute('aria-pressed',on);rmBtn.textContent=on?(EN?'Motion reduced. Turn back on':'Movimento reduzido. Reativar'):(EN?'Reduce motion':'Reduzir movimento')}}
var saved=null;try{saved=localStorage.getItem('mv-rm')}catch(e){}
setRM(saved==='1'||(saved===null&&matchMedia('(prefers-reduced-motion: reduce)').matches));
if(rmBtn)rmBtn.addEventListener('click',function(){var on=!R.classList.contains('rm');setRM(on);try{localStorage.setItem('mv-rm',on?'1':'0')}catch(e){}});
/* topo */
var top=$('.top'),nav=$('#nav'),bg=$('.burger');
function sc(){top.classList.toggle('sc',scrollY>8)}addEventListener('scroll',sc,{passive:true});sc();
function closeNav(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false');D.body.style.overflow=''}
bg.addEventListener('click',function(){var o=!nav.classList.contains('open');if(o){R.style.setProperty('--hh',top.getBoundingClientRect().bottom+'px')}nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o);D.body.style.overflow=o?'hidden':''});
D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){closeNav();bg.focus()}});
matchMedia('(min-width:861px)').addEventListener('change',closeNav);
/* revelar ao rolar */
var rv=$$('.rv');
if('IntersectionObserver'in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});rv.forEach(function(el){io.observe(el)})}else rv.forEach(function(el){el.classList.add('in')});
/* filtros */
var fl=$('.filters');
if(fl){
var items=$$('.grid-w .work'),st={serie:'',tec:'',tam:'',disp:''},cnt=$('#fcount'),clr=$('.fclear'),emp=$('.empty');
var keys=['serie','tec','tam','disp'];
function readHash(){var p=new URLSearchParams(location.hash.slice(1));keys.forEach(function(k){st[k]=p.get(k)||''})}
function writeHash(){var p=new URLSearchParams();keys.forEach(function(k){if(st[k])p.set(k,st[k])});var h=p.toString();history.replaceState(null,'',h?'#'+h:location.pathname+location.search)}
function apply(){
var n=0;items.forEach(function(it){var ok=keys.every(function(k){return!st[k]||it.dataset[k]===st[k]});it.hidden=!ok;if(ok)n++});
$$('.chip',fl).forEach(function(c){c.setAttribute('aria-pressed',st[c.dataset.k]===c.dataset.v)});
cnt.textContent=EN?(n+(n===1?' work':' works')):(n+(n===1?' obra':' obras'));
var any=keys.some(function(k){return st[k]});clr.hidden=!any;emp.hidden=n>0}
fl.addEventListener('click',function(e){var c=e.target.closest('.chip');if(!c)return;var k=c.dataset.k;st[k]=st[k]===c.dataset.v?'':c.dataset.v;writeHash();apply()});
clr.addEventListener('click',function(){keys.forEach(function(k){st[k]=''});writeHash();apply()});
$('.empty button').addEventListener('click',function(){clr.click()});
addEventListener('hashchange',function(){readHash();apply()});
readHash();apply()}
/* zoom */
var zb=$('.zoom'),zd=$('#zd');
if(zb&&zd){var sc2=$('.sc',zd);
zb.addEventListener('click',function(){zd.showModal();sc2.classList.remove('z');sc2.scrollTo(0,0)});
$('.xbtn',zd).addEventListener('click',function(){zd.close()});
sc2.addEventListener('click',function(e){var img=$('img',sc2),on=!sc2.classList.contains('z'),rx=e.offsetX/img.clientWidth,ry=e.offsetY/img.clientHeight;
sc2.classList.toggle('z',on);if(on){sc2.scrollLeft=rx*img.clientWidth-sc2.clientWidth/2;sc2.scrollTop=ry*img.clientHeight-sc2.clientHeight/2}});
zd.addEventListener('close',function(){zb.focus()})}
/* ver na parede: cena em cm (1 unidade = 1 cm) */
var wb=$('.wall'),wd=$('#wd');
if(wb&&wd){
var w=+wb.dataset.w,h=+wb.dataset.h,src=wb.dataset.src,svg=$('svg',wd),NS='http://www.w3.org/2000/svg';
var tones={'#EFEBE3':EN?'Warm white':'Branco quente','#D9D4C8':EN?'Linen':'Linho','#B9C0B4':EN?'Sage':'Sálvia','#2F3336':EN?'Graphite':'Grafite'};
var tone='#EFEBE3',person=true;
/* sala 600x300; vista 420x280 centrada. sofa 220 x 82 */
var CX=300,CY=300-150; /* centro da obra a 150 cm do chão */
function draw(){
var dark=tone==='#2F3336',floor=dark?'#1D1F21':'#C8BBA6',sofa=dark?'#8A8F8A':'#6F7A73',sofa2=dark?'#6E736E':'#58625B';
var vw=Math.max(420,w+110),vh=Math.round(vw*.68),pw=w,ph=h,ax=CX-pw/2,ay=CY-ph/2;
if(ay+ph>198){ay=198-ph}
var y0=Math.min(300-vh*.92,ay-34),x0=CX-vw/2;
wd.querySelector('.scene').style.background=tone;svg.setAttribute('viewBox',x0+' '+y0+' '+vw+' '+vh);
var ground=300;
svg.innerHTML=
'<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".28"/></filter>'+
'<linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+
'<rect x="'+(x0-50)+'" y="'+(y0-50)+'" width="'+(vw+100)+'" height="'+(ground-y0+50)+'" fill="'+tone+'"/>'+
'<rect x="'+(x0-50)+'" y="'+(ground-6)+'" width="'+(vw+100)+'" height="6" fill="'+(dark?'#1a1c1d':'#b9ad99')+'"/>'+
'<rect x="'+(x0-50)+'" y="'+ground+'" width="'+(vw+100)+'" height="'+(vh)+'" fill="'+floor+'"/>'+
'<rect x="'+(x0-50)+'" y="'+(y0-50)+'" width="'+(vw+100)+'" height="'+(ground-y0+50)+'" fill="url(#lg)"/>'+
/* sofa */
'<g><rect x="'+(CX-110)+'" y="'+(ground-82)+'" width="220" height="40" rx="8" fill="'+sofa2+'"/>'+
'<rect x="'+(CX-124)+'" y="'+(ground-62)+'" width="24" height="52" rx="8" fill="'+sofa+'"/><rect x="'+(CX+100)+'" y="'+(ground-62)+'" width="24" height="52" rx="8" fill="'+sofa+'"/>'+
'<rect x="'+(CX-110)+'" y="'+(ground-48)+'" width="220" height="38" rx="8" fill="'+sofa+'"/>'+
'<rect x="'+(CX-104)+'" y="'+(ground-10)+'" width="6" height="10" fill="#222"/><rect x="'+(CX+98)+'" y="'+(ground-10)+'" width="6" height="10" fill="#222"/></g>'+
'<ellipse cx="'+CX+'" cy="'+(ground+2)+'" rx="150" ry="6" fill="#000" opacity=".12"/>'+
/* obra */
'<g filter="url(#sh)"><rect x="'+ax+'" y="'+ay+'" width="'+pw+'" height="'+ph+'" fill="#fff"/><image href="'+src+'" x="'+ax+'" y="'+ay+'" width="'+pw+'" height="'+ph+'" preserveAspectRatio="xMidYMid slice"/></g>'+
/* pessoa 170cm */
(person?'<g fill="'+(dark?'#c7c2b6':'#2c2c2c')+'" opacity=".92" transform="translate('+(CX+Math.max(pw/2+36,150))+' '+ground+')"><circle cx="0" cy="-160" r="10"/><path d="M-14 -146 Q0 -152 14 -146 L18 -80 L8 -80 L8 0 L-1 0 L-1 -72 L-1 0 L-8 0 L-8 -80 L-18 -80Z"/></g>':'')+
/* cota */
'<g stroke="'+(dark?'#d9d6cd':'#555')+'" stroke-width=".6" fill="'+(dark?'#d9d6cd':'#555')+'" font-family="Hanken Grotesk,sans-serif" font-size="6.5"><line x1="'+ax+'" y1="'+(ay+ph+7)+'" x2="'+(ax+pw)+'" y2="'+(ay+ph+7)+'"/><line x1="'+ax+'" y1="'+(ay+ph+4)+'" x2="'+ax+'" y2="'+(ay+ph+10)+'"/><line x1="'+(ax+pw)+'" y1="'+(ay+ph+4)+'" x2="'+(ax+pw)+'" y2="'+(ay+ph+10)+'"/><text stroke="none" x="'+CX+'" y="'+(ay+ph+17)+'" text-anchor="middle">'+w+' cm</text></g>';
$('#wlab').textContent=w+' × '+h+' cm · '+(EN?'sofa 2.2 m':'sofá 2,2 m')+(person?(EN?' · person 1.7 m':' · pessoa 1,70 m'):'')}
var sw=$('.sw',wd);
Object.keys(tones).forEach(function(c){var b=D.createElement('button');b.type='button';b.style.background=c;b.setAttribute('aria-label',tones[c]);b.setAttribute('aria-pressed',c===tone);b.dataset.c=c;sw.appendChild(b)});
sw.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;tone=b.dataset.c;$$('button',sw).forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw()});
$('#wp',wd).addEventListener('change',function(e){person=e.target.checked;draw()});
$('.xbtn',wd).addEventListener('click',function(){wd.close()});
wb.addEventListener('click',function(){draw();wd.showModal()});
wd.addEventListener('close',function(){wb.focus()})}
/* fechar dialog clicando fora */
$$('dialog.wd').forEach(function(d){d.addEventListener('click',function(e){if(e.target===d)d.close()})});
/* formulario de encomenda */
var f=$('#enc');
if(f){
var out=$('#sum'),pre=$('pre',out);
function setErr(el,msg){var e=$('.err',el.closest('div'));if(msg){el.setAttribute('aria-invalid','true');if(!e){e=D.createElement('p');e.className='err';e.id=el.id+'-e';el.after(e);el.setAttribute('aria-describedby',e.id)}e.textContent=msg}else{el.removeAttribute('aria-invalid');if(e)e.remove()}}
f.addEventListener('submit',function(ev){
ev.preventDefault();var bad=null,req=EN?'Please fill this in.':'Preencha este campo.';
['nome','email','largura','altura'].forEach(function(id){var el=$('#'+id),v=el.value.trim(),m='';
if(!v)m=req;else if(id==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))m=EN?'Check the e-mail address.':'Confira o e-mail.';
else if((id==='largura'||id==='altura')&&(+v<20||+v>400))m=EN?'Between 20 and 400 cm.':'Entre 20 e 400 cm.';
setErr(el,m);if(m&&!bad)bad=el});
var ck=$('#ok');if(!ck.checked){setErr(ck,EN?'Please accept to continue.':'Marque para continuar.');if(!bad)bad=ck}else setErr(ck,'');
if(bad){bad.focus();return}
var g=function(id){return $('#'+id).value.trim()},wa=f.dataset.wa;
var L=EN?['Commission request','Name','E-mail','Size (W × H)','Reference series','Palette','Budget','Deadline','Notes']:['Pedido de encomenda','Nome','E-mail','Medida (L × A)','Série de referência','Paleta','Orçamento','Prazo','Observações'];
var t=L[0]+'\n'+L[1]+': '+g('nome')+'\n'+L[2]+': '+g('email')+'\n'+L[3]+': '+g('largura')+' × '+g('altura')+' cm\n'+L[4]+': '+g('serie')+'\n'+L[5]+': '+g('paleta')+'\n'+L[6]+': '+g('orc')+'\n'+L[7]+': '+g('prazo')+'\n'+L[8]+': '+(g('msg')||'-');
pre.textContent=t;$('#send').href='https://wa.me/'+wa+'?text='+encodeURIComponent(t);out.classList.add('on');f.hidden=true;out.scrollIntoView({behavior:R.classList.contains('rm')?'auto':'smooth',block:'start'});$('h2',out).focus()});
$('#edit').addEventListener('click',function(){out.classList.remove('on');f.hidden=false;$('#nome').focus()});
$('#copy').addEventListener('click',function(){var b=this;if(navigator.clipboard)navigator.clipboard.writeText(pre.textContent).then(function(){b.textContent=EN?'Copied':'Copiado'})})}
var cp=$('#cprel');if(cp)cp.addEventListener('click',function(){var b=this,t=$('#relt').textContent;if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){b.textContent=EN?'Copied':'Copiado'})});
})();
