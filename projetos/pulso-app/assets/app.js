(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
// cabeçalho + menu
const top=$("#top"),burger=$(".burger"),nav=$("#nav");
addEventListener("scroll",()=>top.classList.toggle("s",scrollY>8),{passive:true});
burger.addEventListener("click",()=>{const o=burger.getAttribute("aria-expanded")!=="true";burger.setAttribute("aria-expanded",o);burger.setAttribute("aria-label",o?"Fechar menu":"Abrir menu");nav.classList.toggle("open",o)});
nav.addEventListener("click",e=>{if(e.target.closest("a")){nav.classList.remove("open");burger.setAttribute("aria-expanded","false")}});
// revelar ao rolar
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12,rootMargin:"0px 0px -40px 0px"});
$$(".rv").forEach(el=>io.observe(el));
// barra de CTA no celular: aparece depois do hero, some no formulário
const mbar=$("#mbar"),hero=$(".hero"),teste=$("#teste");let vis={h:true,t:false};
const upd=()=>mbar.classList.toggle("show",!vis.h&&!vis.t);
new IntersectionObserver(es=>{vis.h=es[0].isIntersecting;upd()}).observe(hero);
new IntersectionObserver(es=>{vis.t=es[0].isIntersecting;upd()}).observe(teste);
// mockup: lembrete -> resposta -> confirmado
const live=$("#live"),lst=$("#lst"),reply=$("#reply"),tn=$("#tn"),tally=$("#tally");
const set=ok=>{live.classList.toggle("w",!ok);live.classList.toggle("ok",ok);reply.classList.toggle("show",ok);lst.textContent=ok?"10:30 · Confirmado":"10:30 · Aguardando";tn.textContent=ok?9:8;tally.classList.toggle("up",ok)};
if(reduce)set(true);else{let st=false;const t=()=>{st=!st;set(st);setTimeout(t,st?4200:2600)};setTimeout(t,2400)}
// calculadora
const c=[1,2,3].map(n=>$("#c"+n)),brl=n=>"R$ "+Math.round(n).toLocaleString("pt-BR");
const calc=()=>{const[a,b,p]=c.map(i=>+i.value);
 c.forEach(i=>i.style.setProperty("--p",(i.value-i.min)/(i.max-i.min)*100+"%"));
 $("#o1").textContent=a;$("#o2").textContent=brl(b);$("#o3").textContent=p+"%";
 const f=a*4.33*p/100,perda=f*b;
 $("#perda").textContent=brl(perda);$("#faltas").textContent="cerca de "+Math.round(f)+" horários vazios";$("#rec").textContent=brl(perda*.4)+" de volta ao caixa"};
c.forEach(i=>i.addEventListener("input",calc));calc();
// planos mensal/anual
const btns=$$(".tg button"),pill=$(".tg .pill");
const place=()=>{const b=btns.find(x=>x.getAttribute("aria-pressed")==="true");pill.style.width=b.offsetWidth+"px";pill.style.transform=`translateX(${b.offsetLeft-5}px)`};
const plans=k=>{$$(".pv").forEach(e=>e.textContent=e.dataset[k]);$$(".bill").forEach(e=>e.textContent=e.dataset[k])};
btns.forEach(b=>b.addEventListener("click",()=>{btns.forEach(x=>x.setAttribute("aria-pressed",x===b));plans(b.dataset.p);place()}));
place();addEventListener("resize",place);document.fonts&&document.fonts.ready.then(place);
// formulário (demonstração, nada é enviado)
const form=$("#form"),nome=$("#nome"),zap=$("#zap");
zap.addEventListener("input",()=>{let d=zap.value.replace(/\D/g,"").slice(0,11);zap.value=d.length>6?`(${d.slice(0,2)}) ${d.slice(2,d.length>10?7:6)}-${d.slice(d.length>10?7:6)}`:d.length>2?`(${d.slice(0,2)}) ${d.slice(2)}`:d});
form.addEventListener("submit",e=>{e.preventDefault();
 const bad=[[nome,nome.value.trim().length<2],[zap,zap.value.replace(/\D/g,"").length<10]];
 bad.forEach(([i,b])=>i.setAttribute("aria-invalid",b));
 const first=bad.find(x=>x[1]);if(first){first[0].focus();return}
 $("#nm").textContent=nome.value.trim().split(" ")[0];$("#fields").style.display="none";const ok=$("#ok");ok.classList.add("show");ok.focus()});
[nome,zap].forEach(i=>i.addEventListener("input",()=>i.removeAttribute("aria-invalid")));
})();
