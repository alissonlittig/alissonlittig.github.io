(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const brl=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

/* menu */
const burger=$(".burger"),nav=$("#nav");
const setMenu=o=>{nav.classList.toggle("open",o);burger.setAttribute("aria-expanded",o);burger.setAttribute("aria-label",o?"Fechar menu":"Abrir menu")};
burger.addEventListener("click",()=>setMenu(!nav.classList.contains("open")));
nav.addEventListener("click",e=>{if(e.target.closest("a"))setMenu(false)});
addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){setMenu(false);burger.focus()}});

/* revelar ao rolar */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.15,rootMargin:"0px 0px -6% 0px"});
$$(".rv,.topo").forEach(el=>io.observe(el));

/* altitude no topo: desce a serra conforme a pagina rola */
const alt=$("#alt");
const upd=()=>{
 const max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(1,scrollY/max):0;
 const m=Math.round(1120*(1-p)/10)*10;
 alt.textContent=p>.985?"0 m":m.toLocaleString("pt-BR")+" m";
 const mb=$("#mbar"),pl=$("#planos").getBoundingClientRect(),hero=$(".hero").getBoundingClientRect();
 const over=pl.top<innerHeight&&pl.bottom>0||$("#assine").getBoundingClientRect().top<innerHeight;
 mb.classList.toggle("show",hero.bottom<0&&!over);
};
let tk=0;addEventListener("scroll",()=>{if(!tk){tk=requestAnimationFrame(()=>{tk=0;upd()})}},{passive:true});upd();

/* contagem para fechar a lista (domingo 23h59 local) */
const cut=()=>{const n=new Date(),d=new Date(n);d.setHours(23,59,59,0);d.setDate(n.getDate()+((7-n.getDay())%7));if(d<n)d.setDate(d.getDate()+7);return d};
const tick=()=>{
 const ms=cut()-new Date(),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);
 const t=(d?d+" d ":"")+h+" h "+String(m).padStart(2,"0")+" min";
 $("#cd1").textContent="Faltam "+t;
 $("#cd2").innerHTML="A lista da próxima torra fecha em <b>"+t+"</b>.";
};
tick();setInterval(tick,30000);

/* abas de sabor (setas, Home e End) */
const tabs=$$("[role=tab]");
const pick=t=>{tabs.forEach(x=>{const on=x===t;x.setAttribute("aria-selected",on);x.tabIndex=on?0:-1;$("#"+x.getAttribute("aria-controls")).hidden=!on})};
tabs.forEach((t,i)=>{
 t.addEventListener("click",()=>pick(t));
 t.addEventListener("keydown",e=>{
  const k={ArrowRight:1,ArrowLeft:-1}[e.key];let n;
  if(k)n=tabs[(i+k+tabs.length)%tabs.length];else if(e.key==="Home")n=tabs[0];else if(e.key==="End")n=tabs.at(-1);
  if(n){e.preventDefault();pick(n);n.focus()}
 });
});

/* configurador */
const F=$("#plan"),val=n=>F.elements[n].value;
const PRECO={1:49.9,2:94,4:180},AVULSO=58;
let frete=null; // null = ainda nao calculado
const freteBase=q=>q>=2?0:null;
const render=()=>{
 const q=+val("qtd"),tot=PRECO[q],free=q>=2;
 $("#s-perfil").textContent=val("perfil");$("#s-moagem").textContent=val("moagem");
 $("#s-qtd").textContent=q+" × 250 g";$("#s-freq").textContent=val("freq")==="mensal"?"Todo mês":"A cada 2 semanas";
 const f=free?0:frete;
 $("#s-frete").textContent=free?"Grátis":(f==null?"Informe o CEP":brl(f));
 $("#s-total").textContent=brl(tot+(f||0));
 const eco=AVULSO*q-tot;
 $("#s-save").innerHTML="Você economiza <strong>"+brl(eco)+"</strong> por entrega comparado à compra avulsa (R$ 58,00 o pacote).";
 $("#done").hidden=true;
};
F.addEventListener("change",render);F.addEventListener("submit",e=>e.preventDefault());
$("#cep").addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,8);if(v.length>5)v=v.slice(0,5)+"-"+v.slice(5);e.target.value=v});
const calc=()=>{
 const v=$("#cep").value.replace(/\D/g,""),m=$("#cepmsg");
 if(v.length!==8){m.className="cepmsg err";m.textContent="Digite os 8 números do CEP.";frete=null;render();return}
 const r=+v[0],fv=r===3?12:r<=2?16:24,dias=r===3?"2 a 4":r<=2?"3 a 5":"5 a 9";
 frete=fv;m.className="cepmsg ok";
 m.textContent=(+val("qtd")>=2?"Frete grátis para o seu CEP. ":"Frete de "+brl(fv)+". ")+"Chega em "+dias+" dias úteis (estimativa de exemplo).";
 render();
};
$("#cepbtn").addEventListener("click",calc);
$("#cep").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();calc()}});
$("#assinar").addEventListener("click",()=>{
 const q=+val("qtd"),d=$("#done"),f=q>=2?0:frete;
 d.innerHTML="<b>Demonstração:</b> nenhum pedido foi feito. Assim ficaria o resumo enviado ao cliente:<pre>"+
  `Perfil: ${val("perfil")}\nMoagem: ${val("moagem")}\nPacotes: ${q} × 250 g, ${val("freq")}\nFrete: ${q>=2?"grátis":f==null?"a calcular":brl(f)}\nTotal por entrega: ${brl(PRECO[q]+(f||0))}\nPrimeira torra: próxima segunda`+"</pre>";
 d.hidden=false;d.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"});
});
render();

/* kit presente: cartao ao vivo */
const gt=$("#g-to"),gm=$("#g-msg");
const card=()=>{
 $("#c-to").textContent=gt.value.trim()?"Para "+gt.value.trim():"Para alguém especial";
 $("#c-msg").textContent="“"+(gm.value.trim()||"Para os seus domingos mais lentos.")+"”";
 $("#g-cnt").textContent=gm.value.length+"/120";
};
gt.addEventListener("input",card);gm.addEventListener("input",card);
$("#presentear").addEventListener("click",()=>{
 const m=$("input[name=gm]:checked").value,p=m==="3"?139:269,d=$("#gdone");
 d.innerHTML="<b>Demonstração:</b> nenhum pedido foi feito. Presente de "+m+" meses, "+brl(p)+(gt.value.trim()?", para "+gt.value.trim():"")+".";
 d.hidden=false;
});
})();
