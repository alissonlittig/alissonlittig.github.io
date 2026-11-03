(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* contagem regressiva (8h30 de 5/12/2026, horário de Brasília) */
var alvo=new Date("2026-12-05T08:30:00-03:00").getTime();
var el={d:$("#c-d"),h:$("#c-h"),m:$("#c-m"),s:$("#c-s")};
function p(n){return n<10?"0"+n:""+n}
function tick(){
  var t=alvo-Date.now();
  if(t<=0){$("#count").hidden=true;$("#count-note").innerHTML="O evento (de exemplo) já aconteceu.";clearInterval(iv);return}
  var s=Math.floor(t/1000);
  el.d.textContent=p(Math.floor(s/86400));el.h.textContent=p(Math.floor(s%86400/3600));
  el.m.textContent=p(Math.floor(s%3600/60));el.s.textContent=p(s%60);
}
var iv=setInterval(tick,1000);tick();

/* revelar ao rolar */
var rv=$$(".rv");
if("IntersectionObserver" in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});
  rv.forEach(function(n,i){n.style.transitionDelay=(i%3)*70+"ms";io.observe(n)});
}else rv.forEach(function(n){n.classList.add("in")});

/* barra de calor + CTA fixa */
var heat=$("#heat"),stick=$("#stick"),hero=$("#topo"),fin=$("#inscricao"),raf=0;
function onScroll(){
  raf=0;
  var h=document.documentElement,max=h.scrollHeight-innerHeight;
  heat.style.transform="scaleX("+(max>0?Math.min(1,scrollY/max):0)+")";
  var passou=scrollY>hero.offsetHeight-100,fim=fin.getBoundingClientRect().top<innerHeight*.6;
  stick.classList.toggle("on",passou&&!fim);
}
addEventListener("scroll",function(){if(!raf)raf=requestAnimationFrame(onScroll)},{passive:true});
addEventListener("resize",onScroll);onScroll();

/* filtro da programação */
var fb=$("#filters");fb.hidden=false;
fb.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var f=b.dataset.f,n=0;
  $$("button",fb).forEach(function(x){var on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on)});
  $$(".slot").forEach(function(s){
    var ok=f==="todas"||(s.dataset.t.split(" ").indexOf(f)>-1);
    s.hidden=!ok;if(ok&&!s.classList.contains("pause"))n++;
  });
  $("#empty").hidden=n>0;
});

/* inscrição simulada */
var preco={individual:129,time:297,meia:65},nomes={individual:"Individual",time:"Time de 3",meia:"Meia"};
var form=$("#f"),stub=$("#stub");
function tipo(){return form.elements.tipo.value}
function total(){$("#tot").textContent="· R$ "+preco[tipo()]}
form.addEventListener("change",function(e){if(e.target.name==="tipo")total()});
$$("[data-t]").forEach(function(a){if(a.tagName==="A")a.addEventListener("click",function(){
  var r=$('input[name="tipo"][value="'+a.dataset.t+'"]');if(r){r.checked=true;total()}
})});

var campos=[
  ["nome",function(v){return v.trim().length>=3},"Escreva seu nome completo."],
  ["email",function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())},"Escreva um e-mail válido, como nome@empresa.com."],
  ["neg",function(v){return !!v},"Escolha o tipo de negócio."],
  ["ok",function(v,i){return i.checked},"Marque a caixa para continuar."]
];
function valida(){
  var primeiro=null;
  campos.forEach(function(c){
    var i=form.elements[c[0]],e=$("#e-"+c[0]),ok=c[1](i.value,i);
    e.textContent=ok?"":c[2];
    if(i.type!=="checkbox"){i.setAttribute("aria-invalid",!ok);i.setAttribute("aria-describedby",ok?"":"e-"+c[0])}
    if(!ok&&!primeiro)primeiro=i;
  });
  return primeiro;
}
form.addEventListener("input",function(e){var c=campos.filter(function(x){return x[0]===e.target.name})[0];if(c&&$("#e-"+c[0]).textContent&&c[1](e.target.value,e.target)){$("#e-"+c[0]).textContent="";e.target.setAttribute("aria-invalid","false")}});

function qr(seed){
  var s=0;for(var i=0;i<seed.length;i++)s=(s*31+seed.charCodeAt(i))>>>0;
  var o="",N=25;
  function rnd(){s=(s*1664525+1013904223)>>>0;return s/4294967296}
  function fin(x,y){return (x<7&&y<7)||(x>17&&y<7)||(x<7&&y>17)}
  for(var y=0;y<N;y++)for(var x=0;x<N;x++){
    var on;
    if(fin(x,y)){var a=x>17?x-18:x,b=y>17?y-18:y;on=a===0||a===6||b===0||b===6||(a>1&&a<5&&b>1&&b<5)}
    else on=rnd()>.5;
    if(on)o+='<rect x="'+x+'" y="'+y+'" width="1.02" height="1.02"/>';
  }
  $("#qr").innerHTML=o;$("#qr").setAttribute("fill","#131110");
}
form.addEventListener("submit",function(e){
  e.preventDefault();
  var bad=valida();if(bad){bad.focus();return}
  var cod="FTD-"+Math.random().toString(36).slice(2,8).toUpperCase();
  $("#s-nome").textContent=form.elements.nome.value.trim();
  $("#s-tipo").textContent="Ingresso "+nomes[tipo()]+" · R$ "+preco[tipo()];
  $("#s-cod").textContent=cod;qr(cod);
  form.hidden=true;stub.hidden=false;stub.focus();
});
$("#again").addEventListener("click",function(){form.reset();total();stub.hidden=true;form.hidden=false;form.elements.nome.focus()});

/* link "Como usamos seus dados" abre o detalhe do rodapé */
function abrePriv(){if(location.hash==="#privacidade")$("#privacidade").open=true}
addEventListener("hashchange",abrePriv);abrePriv();
})();
