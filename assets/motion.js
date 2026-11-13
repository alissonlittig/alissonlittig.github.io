/* Motion do portfólio (S-1058). Só roda com html.mo (posto no <head> quando
   não há prefers-reduced-motion). Não mexe em abas, filtro nem idioma. */
(function(){
  var root=document.documentElement;
  if(!root.classList.contains('mo')||!('IntersectionObserver' in window))return;
  var $=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* 1. aparecer ao rolar, em cascata dentro do mesmo lote */
  var io=new IntersectionObserver(function(es){
    var i=0;
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target;io.unobserve(el);
      el.style.setProperty('--d',Math.min(i++,6)*70+'ms');
      el.classList.add('in');
      var dd=el.parentNode.classList.contains('nums')&&el.querySelector('dd');if(dd)count(dd);
      setTimeout(function(){el.classList.add('done')},1300);
    });
  },{rootMargin:'0px 0px -6% 0px',threshold:.08});
  $('.cl,.tile,.nums>div,.about>*,.steps li,.pkg,.sec-head,.faq,.filt,.contact .links,.clients .fict').forEach(function(el){
    /* o que já está na primeira tela não some para reaparecer */
    if(el.getBoundingClientRect().top<innerHeight&&!el.closest('[hidden]'))return;
    el.classList.add('rv');io.observe(el);
  });

  /* 2. contadores: anima o primeiro número de cada texto, mantém o resto ("R$ 8 mi+") */
  function count(box){
    var w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT),n,list=[];
    while((n=w.nextNode())){var m=/\d+/.exec(n.nodeValue);if(m)list.push({n:n,to:+m[0],a:n.nodeValue.slice(0,m.index),b:n.nodeValue.slice(m.index+m[0].length)})}
    var t0=performance.now(),dur=1400;
    (function step(t){
      var p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);
      list.forEach(function(x){x.n.nodeValue=x.a+Math.round(x.to*e)+x.b});
      if(p<1)requestAnimationFrame(step);
    })(t0);
  }
  var tabsBox=document.querySelector('.tabs');
  if(tabsBox){
    var tio=new IntersectionObserver(function(es){if(es[0].isIntersecting){tio.disconnect();$('small',tabsBox).forEach(count)}},{threshold:.5});
    tio.observe(tabsBox);
  }

  /* 3. troca de aba: os cards do painel aberto entram em cascata */
  $('.panel').forEach(function(p){
    new MutationObserver(function(){
      if(p.hidden)return;
      $('.tile',p).slice(0,9).forEach(function(t,i){
        /* card que ainda não apareceu entra pelo reveal do item 1 */
        if(t.getBoundingClientRect().top>innerHeight||(t.classList.contains('rv')&&!t.classList.contains('in')))return;
        t.animate([{opacity:0,transform:'translate3d(0,22px,0)'},{opacity:1,transform:'none'}],{duration:520,delay:i*55,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
      });
    }).observe(p,{attributes:true,attributeFilter:['hidden']});
  });

  /* 4. barra de progresso da rolagem */
  var bar=document.createElement('div');bar.className='mo-bar';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
  var tick=false;
  function prog(){tick=false;var h=root.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(scrollY/h,1):0)+')'}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});

  /* 5. partículas discretas atrás do topo; param fora da tela ou com a aba oculta */
  var hero=document.querySelector('.hero');
  if(hero){
    var cv=document.createElement('canvas');cv.className='mo-dots';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
    var cx=cv.getContext('2d'),W,H,dots=[],run=false,seen=true,dpr=Math.min(devicePixelRatio||1,2);
    function size(){
      W=root.clientWidth;H=hero.offsetTop+hero.offsetHeight;
      cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';cx.setTransform(dpr,0,0,dpr,0,0);
      var n=Math.round(Math.min(W*H/26000,60));
      dots=[];for(var i=0;i<n;i++)dots.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.5,vx:(Math.random()-.5)*.22,vy:-Math.random()*.25-.05,a:Math.random()*.5+.15,o:i%5===0});
    }
    function draw(){
      if(!run)return;
      cx.clearRect(0,0,W,H);
      for(var i=0;i<dots.length;i++){
        var d=dots[i];d.x+=d.vx;d.y+=d.vy;
        if(d.y<-4){d.y=H+4;d.x=Math.random()*W}
        if(d.x<-4)d.x=W+4;else if(d.x>W+4)d.x=-4;
        cx.globalAlpha=d.a*Math.min(1,(H-d.y)/160);
        cx.fillStyle=d.o?'#ff7a2f':'#f2f1ec';
        cx.beginPath();cx.arc(d.x,d.y,d.r,0,6.283);cx.fill();
      }
      requestAnimationFrame(draw);
    }
    function sync(){var on=seen&&!document.hidden;if(on&&!run){run=true;requestAnimationFrame(draw)}else if(!on)run=false}
    size();cv.classList.add('on');
    new IntersectionObserver(function(es){seen=es[0].isIntersecting;sync()}).observe(cv);
    document.addEventListener('visibilitychange',sync);
    var lastW=W;addEventListener('resize',function(){if(root.clientWidth!==lastW){lastW=root.clientWidth;size()}});
    sync();
  }

  if(!fine)return;

  /* 6. luz que segue o cursor + inclinação dos cards (um listener, um rAF) */
  var glow=document.createElement('div');glow.className='mo-glow';glow.setAttribute('aria-hidden','true');document.body.appendChild(glow);
  var mx=0,my=0,gx=0,gy=0,moving=false,cur=null,ev=null;
  function frame(){
    gx+=(mx-gx)*.14;gy+=(my-gy)*.14;
    glow.style.transform='translate3d('+gx+'px,'+gy+'px,0)';
    if(ev){
      var t=ev.target.closest&&ev.target.closest('.pic,.cl,.pkg,.steps li,.nums div');
      if(cur&&cur!==t)leave();
      if(t){
        var r=t.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width,py=(ev.clientY-r.top)/r.height;
        t.style.setProperty('--mx',px*100+'%');t.style.setProperty('--my',py*100+'%');
        if(t.classList.contains('pic')){t.classList.add('tilt');t.style.setProperty('--ry',(px-.5)*7+'deg');t.style.setProperty('--rx',(.5-py)*6+'deg')}
        cur=t;
      }
      ev=null;
    }
    if(Math.abs(mx-gx)+Math.abs(my-gy)>.5)requestAnimationFrame(frame);else moving=false;
  }
  function leave(){if(!cur)return;cur.classList.remove('tilt');cur.style.removeProperty('--rx');cur.style.removeProperty('--ry');cur=null}
  document.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    mx=e.clientX;my=e.clientY;ev=e;glow.classList.add('on');
    if(!moving){moving=true;requestAnimationFrame(frame)}
  },{passive:true});
  root.addEventListener('mouseleave',function(){glow.classList.remove('on');leave()});
})();
