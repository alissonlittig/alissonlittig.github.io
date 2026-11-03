(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const NS='http://www.w3.org/2000/svg';
const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.append(e);return e};

// [x,y,w,h,nome,m2,varanda?]
const left=[[0,0,64,12,'Varanda','5,5',1],[0,12,64,34,'Sala e jantar','18,5'],[0,46,34,34,'Cozinha','7,5']];
const T=[
{id:'a',nome:'2 quartos',m2:58,preco:489000,vagas:'1 vaga',livres:14,total:40,rooms:[...left,
 [34,46,30,16,'Lavanderia','3,5'],[34,62,30,18,'Hall','4'],
 [64,0,56,32,'Quarto 1','11'],[64,32,26,16,'Banheiro','4'],[90,32,30,16,'Closet','2'],[64,48,56,32,'Quarto 2','9,5']]},
{id:'b',nome:'2 quartos com suíte',m2:67,preco:559000,vagas:'1 vaga',livres:9,total:32,rooms:[...left,
 [34,46,30,16,'Lavanderia','3,5'],[34,62,30,18,'Banheiro social','4'],
 [64,0,56,32,'Suíte','12'],[64,32,26,16,'Banho da suíte','4,5'],[90,32,30,16,'Closet','3'],[64,48,56,32,'Quarto 2','10']]},
{id:'c',nome:'3 quartos',m2:84,preco:689000,vagas:'2 vagas',livres:5,total:24,rooms:[...left,
 [34,46,30,16,'Lavanderia','4'],[34,62,30,18,'Banheiro social','4,5'],
 [64,0,56,30,'Suíte','13'],[64,30,26,14,'Banho da suíte','5'],[90,30,30,14,'Closet','3,5'],[64,44,28,36,'Quarto 2','10'],[92,44,28,36,'Quarto 3 / escritório','9,5']]}
];
const tab=$('#tabs');let cur=0;
const fill=()=>T.map((t,i)=>`<option value="${i}">${t.nome} · ${t.m2} m²</option>`).join('');
$('#s-tip').innerHTML=fill();$('#f-tip').innerHTML=fill();

function draw(i,focus){
 cur=i;const t=T[i];
 $$('button',tab).forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1});
 $('#painel').setAttribute('aria-labelledby','t'+t.id);
 $('#p-nome').textContent=t.nome;
 $('#p-preco').innerHTML=`${brl(t.preco)} <small>a partir de, exemplo</small>`;
 $('#p-fatos').innerHTML=[`${t.m2} m² privativos`,t.vagas,'Varanda com churrasqueira'].map(x=>`<li>${x}</li>`).join('');
 const sv=$('#planta');sv.setAttribute('aria-label',`Planta ilustrativa do apartamento de ${t.nome}, ${t.m2} metros quadrados`);sv.textContent='';
 const ul=$('#p-rooms');ul.textContent='';
 t.rooms.forEach(([x,y,w,h,n,a,v],k)=>{
  const g=el('g',{},sv),r=el('rect',{x,y,width:w,height:h,class:'rm'+(v?' v':''),'data-k':k},g);
  const tx=el('text',{x:x+w/2,y:y+h/2-.4,class:'rl'},g);tx.textContent=n;
  const s=el('text',{x:x+w/2,y:y+h/2+3.6,class:'rs'},g);s.textContent=a+' m²';
  const li=document.createElement('li');li.dataset.k=k;li.innerHTML=`<span>${n}</span><b>${a} m²${v?' (à parte)':''}</b>`;ul.append(li);
 });
 $('#p-units').textContent=`${t.livres} de ${t.total} unidades disponíveis na tabela de lançamento (exemplo)`;
 const bar=$('#p-bar');bar.style.width='0';requestAnimationFrame(()=>requestAnimationFrame(()=>bar.style.width=(100-t.livres/t.total*100)+'%'));
 if(focus)$$('button',tab)[i].focus();
}
T.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.id='t'+t.id;b.setAttribute('role','tab');b.textContent=`${t.nome} · ${t.m2} m²`;b.onclick=()=>draw(i);tab.append(b)});
tab.addEventListener('keydown',e=>{const d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();draw((cur+d+T.length)%T.length,1)}});
const hl=(k,on)=>$$(`[data-k="${k}"]`,$('#painel')).forEach(n=>n.classList.toggle('on',on));
$('#painel').addEventListener('mouseover',e=>{const n=e.target.closest('[data-k]');$$('.on',$('#painel')).forEach(x=>x.classList.remove('on'));n&&hl(n.dataset.k,1)});
$('#painel').addEventListener('click',e=>{const n=e.target.closest('[data-k]');if(n){$$('.on',$('#painel')).forEach(x=>x.classList.remove('on'));hl(n.dataset.k,1)}});
draw(0);
$('[data-sim]').onclick=()=>{$('#s-tip').value=cur;calc()};
$('[data-tip]').onclick=()=>{$('#f-tip').value=cur};

// simulador
const PCT=.0085;
function calc(){
 const t=T[+$('#s-tip').value],ep=+$('#s-ent').value,n=+$('#s-pz').value;
 const ent=t.preco*ep/100,fin=t.preco-ent,par=fin*PCT/(1-Math.pow(1+PCT,-n));
 $('#o-entp').textContent=ep+'%';$('#o-val').textContent=brl(t.preco);$('#o-ent').textContent=brl(ent);
 $('#o-fin').textContent=brl(fin);$('#o-par').textContent=brl(par);$('#o-ren').textContent=brl(par/.3);
 $('#s-ent').setAttribute('aria-valuetext',ep+' por cento');
}
$('#calc').addEventListener('input',calc);calc();

// mapa
const P=[['Ponto de ônibus',3,200],['Mercado',5,300],['Praça',6,20],['Escola',8,110],['Farmácia',9,245],['Clínica',12,155],['Shopping',14,345]];
const mp=$('#mapa');
[[0,130,400,150],[0,255,400,235],[110,0,160,400],[260,0,330,400],[0,40,400,30]].forEach(([a,b,c,d])=>el('path',{d:`M${a} ${b}L${c} ${d}`,class:a===0&&b===130?'st':'st2'},mp));
el('path',{d:'M-10 150L410 245',class:'st'},mp);el('path',{d:'M150 -10L240 410',class:'st'},mp);
[[5,60],[10,120],[15,180]].forEach(([m,r])=>{el('circle',{cx:200,cy:200,r,class:'ring'},mp);const t=el('text',{x:206,y:200-r-3,class:'rt'},mp);t.textContent=m+' min'});
const pl=$('#pts');
P.forEach(([n,m,a],k)=>{
 const r=m*12,x=200+r*Math.cos(a*Math.PI/180),y=200+r*Math.sin(a*Math.PI/180);
 const g=el('g',{class:'pin','data-k':k,tabindex:0,role:'img','aria-label':`${n}, ${m} minutos a pé`},mp);
 el('circle',{cx:x,cy:y,r:6},g);const t=el('text',{x:x+(x>290||(x<200&&x>110)?-10:10),y:y+4,'text-anchor':x>290||(x<200&&x>110)?'end':'start'},g);t.textContent=n;
 const li=document.createElement('li');li.dataset.k=k;li.innerHTML=`<span>${n}</span><b>${m} min a pé</b>`;pl.append(li);
});
const home=el('g',{},mp);el('circle',{cx:200,cy:200,r:14,fill:'#E2692A'},home);const ht=el('text',{x:200,y:204,'text-anchor':'middle',fill:'#1B1208','font-size':11,'font-weight':700},home);ht.textContent='A';
const mk=on=>e=>{const n=e.target.closest('[data-k]');if(!n)return;$$('#local .on').forEach(x=>x.classList.remove('on'));if(on)$$(`#local [data-k="${n.dataset.k}"]`).forEach(x=>x.classList.add('on'))};
$('#local').addEventListener('mouseover',mk(1));$('#local').addEventListener('mouseleave',mk(0));
$('#local').addEventListener('focusin',mk(1));$('#local').addEventListener('click',mk(1));

// reveal + cronograma
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rv').forEach((n,i)=>{n.style.transitionDelay=(i%3)*90+'ms';io?io.observe(n):n.classList.add('in')});
const tl=$('#tl');
const prog=()=>{const r=tl.getBoundingClientRect(),h=innerHeight;tl.style.setProperty('--p',Math.max(0,Math.min(1,(h*.6-r.top)/r.height)).toFixed(3))};
addEventListener('scroll',prog,{passive:true});prog();

// galeria
const lb=$('#lb');
$$('.g').forEach(b=>b.onclick=()=>{const i=$('img',b);lb.querySelector('img').src=(i.srcset.split(', ').pop().split(' ')[0]);lb.querySelector('img').alt=i.alt;lb.querySelector('p').textContent=$('span',b).textContent+'. Imagem ilustrativa.';lb.showModal()});
lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});

// formulário
const msg=(n,t)=>`Olá! Sou ${n} e quero a tabela do Residencial Alvorada, planta de ${t}.`;
$('#form').addEventListener('submit',e=>{
 e.preventDefault();const f=e.target,n=f.nome.value.trim(),d=f.tel.value.replace(/\D/g,'');
 const bn=!n,bt=d.length<10||d.length>11;
 [['nome',bn],['tel',bt]].forEach(([k,b])=>{f[k].setAttribute('aria-invalid',b);$('#e-'+k).hidden=!b;f[k].setAttribute('aria-describedby',b?'e-'+k:'')});
 if(bn||bt){f[bn?'nome':'tel'].focus();return}
 const m=msg(n,T[+f.tip.value].nome);$('#ok-m').textContent='“'+m+'”';$('#ok').hidden=false;
});

// barra fixa no celular
const st=$('.stick'),hero=$('.hero'),fin=$('#interesse');
const so=new IntersectionObserver(()=>{const a=hero.getBoundingClientRect().bottom<0,b=fin.getBoundingClientRect().top<innerHeight*.8;st.classList.toggle('show',a&&!b)});
so.observe(hero);so.observe(fin);

// reduzir movimento
const cb=$('.calmo');cb.onclick=()=>{const on=cb.getAttribute('aria-pressed')!=='true';cb.setAttribute('aria-pressed',on);document.documentElement.classList.toggle('calmo-on',on)};
})();
