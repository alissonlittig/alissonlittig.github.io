(()=>{
const D=document,H=D.documentElement,EN=H.lang.startsWith('en'),L=EN?'en':'pt',F=window.FV||{};
const $=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
const T={pt:{add:'Adicionar ao pedido',added:'Adicionado ao pedido',copied:'Mensagem copiada',copyfail:'Copie o texto manualmente',empty:'Seu pedido está vazio. Escolha uma pizza no cardápio.',rm:'Remover',min:'Pedido mínimo para entrega: ',half:'Meio a meio',open:'Aberto agora',closed:'Fechado agora',until:'até',opens:'abre',today:'hoje',days:['dom','seg','ter','qua','qui','sex','sáb'],none:'Sem borda',hi:'Olá, Forno Vivo! Quero fazer um pedido (demonstração).',sub:'Subtotal',fee:'Entrega',pick:'Retirada na loja',tot:'Total',name:'Nome',addr:'Endereço',pay:'Pagamento',obs:'Obs.',and:'e',ing:'ingredientes',max:'Máximo de 5 ingredientes',of:'meio',sent:'Demonstração: nada foi enviado.',sizeM:'Média',sizeG:'Grande',build:'Pizza montada',pizza:'Pizza',free:'Retirada',min2:'mín.'},
en:{add:'Add to order',added:'Added to order',copied:'Message copied',copyfail:'Copy the text by hand',empty:'Your order is empty. Pick a pizza from the menu.',rm:'Remove',min:'Minimum order for delivery: ',half:'Half and half',open:'Open now',closed:'Closed now',until:'until',opens:'opens',today:'today',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],none:'No crust filling',hi:'Hi, Forno Vivo! I would like to place an order (demo).',sub:'Subtotal',fee:'Delivery',pick:'Store pickup',tot:'Total',name:'Name',addr:'Address',pay:'Payment',obs:'Notes',and:'and',ing:'toppings',max:'Up to 5 toppings',of:'half',sent:'Demo: nothing was sent.',sizeM:'Medium',sizeG:'Large',build:'Custom pizza',pizza:'Pizza',free:'Pickup',min2:'min.'}}[L];
const money=v=>'R$ '+v.toLocaleString(EN?'en-US':'pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const nm=o=>o.n[L],P={};(F.pizzas||[]).forEach(p=>P[p.id]=p);
H.classList.add('js');H.classList.remove('no-js');

/* menu móvel */
const bg=$('.burger'),nav=$('#nav');
if(bg)bg.addEventListener('click',()=>{const o=bg.getAttribute('aria-expanded')!=='true';bg.setAttribute('aria-expanded',o);nav.classList.toggle('open',o)});
D.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav&&nav.classList.contains('open')){bg.click();bg.focus()}});

/* revelar */
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12}):null;
$$('.rv').forEach(e=>io?io.observe(e):e.classList.add('in'));

/* aberto agora (horário de Curitiba) */
const sp=()=>{const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t).value;return{d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),m:+g('hour')*60+ +g('minute')}};
const HRS=F.hours||[];
function openNow(){const{d,m}=sp(),h=HRS[d];if(h&&m>=h[0]*60&&m<h[1]*60)return{o:1,t:`${T.open} · ${T.until} ${fh(h[1])}`};
 for(let i=0;i<7;i++){const k=(d+i)%7,x=HRS[k];if(x&&(i>0||m<x[0]*60))return{o:0,t:`${T.closed} · ${T.opens} ${i?T.days[k]:T.today} ${fh(x[0])}`}}return{o:0,t:T.closed}}
const fh=h=>h===24?(EN?'12 am':'0h'):EN?(h>12?h-12:h)+(h>=12?' pm':' am'):h+'h';
$$('.status').forEach(e=>{const r=openNow();e.dataset.open=r.o;e.textContent=r.t});
const tr=$(`tr[data-d="${sp().d}"]`);if(tr)tr.classList.add('today');

/* pedido */
const KEY='fv-cart',OK='fv-opt';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let cart=get(KEY,[]),opt=get(OK,{mode:'delivery',b:0,pay:'Pix'});
const toast=m=>{let t=$('.toast');if(!t){t=D.createElement('div');t.className='toast';t.setAttribute('role','status');D.body.append(t)}t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)};
const count=()=>cart.reduce((a,l)=>a+l.q,0);
const badge=()=>$$('.cartbtn .n').forEach(n=>{n.dataset.n=count();n.textContent=count()});
function addLine(label,detail,unit,q=1){const k=label+'|'+detail,f=cart.find(l=>l.k===k);f?f.q+=q:cart.push({k,label,detail,unit,q});set(KEY,cart);badge();toast(T.added)}
const fee=()=>opt.mode==='pickup'?0:(F.bairros[opt.b]||{f:0}).f;
const sub=()=>cart.reduce((a,l)=>a+l.unit*l.q,0);
function message(f){const b=F.bairros[opt.b];let s=T.hi+'\n\n';cart.forEach(l=>{s+=`${l.q}x ${l.label}${l.detail?' ('+l.detail+')':''} - ${money(l.unit*l.q)}\n`});
 s+=`\n${T.sub}: ${money(sub())}\n`+(opt.mode==='pickup'?T.pick:`${T.fee} (${b.n}): ${money(b.f)}`)+`\n${T.tot}: ${money(sub()+fee())}\n\n`;
 s+=`${T.name}: ${f.nome||'-'}\n`+(opt.mode==='pickup'?'':`${T.addr}: ${f.end||'-'}\n`)+`${T.pay}: ${opt.pay}\n`+(f.obs?`${T.obs}: ${f.obs}\n`:'');return s}
const dlg=D.createElement('dialog');dlg.className='cart';dlg.setAttribute('aria-labelledby','cart-h');D.body.append(dlg);
function drawCart(){const v=k=>(dlg.querySelector('[name='+k+']')||{}).value||'';const f={nome:v('nome'),end:v('end'),obs:v('obs')};
 const b=F.bairros;dlg.innerHTML=`<div class="dlg"><button class="x" aria-label="${EN?'Close':'Fechar'}" data-x>×</button><h2 id="cart-h">${EN?'Your order':'Seu pedido'}</h2>`+
 (cart.length?cart.map((l,i)=>`<div class="cline"><b>${l.q}x ${l.label}</b><span>${money(l.unit*l.q)}</span><small>${l.detail||''}</small><button class="rm" data-rm="${i}">${T.rm}</button></div>`).join(''):`<p class="empty">${T.empty}</p>`)+
 (cart.length?`<fieldset><legend>${EN?'How to receive':'Como receber'}</legend><div class="opts"><label class="opt"><input type="radio" name="mode" value="delivery" ${opt.mode==='delivery'?'checked':''}><span>${EN?'Delivery':'Entrega'}</span></label><label class="opt"><input type="radio" name="mode" value="pickup" ${opt.mode==='pickup'?'checked':''}><span>${EN?'Pickup':'Retirada'}</span></label></div></fieldset>
 ${opt.mode==='delivery'?`<label class="f">${EN?'Neighborhood':'Bairro'}<select name="b">${b.map((x,i)=>`<option value="${i}" ${i===opt.b?'selected':''}>${x.n} · ${money(x.f)}</option>`).join('')}</select></label>`:''}
 <label class="f">${T.name}<input type="text" name="nome" autocomplete="name" value="${f.nome}"></label>${opt.mode==='delivery'?`<label class="f">${T.addr}<input type="text" name="end" autocomplete="street-address" value="${f.end}"></label>`:''}
 <label class="f">${T.pay}<select name="pay">${['Pix',EN?'Card on delivery':'Cartão na entrega',EN?'Cash':'Dinheiro'].map(x=>`<option ${x===opt.pay?'selected':''}>${x}</option>`).join('')}</select></label>
 <label class="f">${T.obs}<input type="text" name="obs" value="${f.obs}"></label>
 <div class="sum"><div><span>${T.sub}</span><span>${money(sub())}</span></div><div><span>${T.fee}</span><span>${opt.mode==='pickup'?T.free:money(fee())}</span></div><div class="t"><span>${T.tot}</span><span>${money(sub()+fee())}</span></div></div>
 ${opt.mode==='delivery'&&sub()<F.min?`<p class="warn" role="alert">${T.min}${money(F.min)}</p>`:''}
 <pre class="msg" tabindex="0" aria-label="${EN?'Message preview':'Prévia da mensagem'}"></pre>
 <div class="dfoot"><button class="btn btn-line btn-sm" data-copy>${EN?'Copy message':'Copiar mensagem'}</button><a class="btn btn-fire btn-sm" data-wa target="_blank" rel="noopener">${EN?'Open WhatsApp':'Abrir no WhatsApp'}</a></div>
 <p class="warn">${EN?'Demo: the WhatsApp link opens a blank chat, no number. Nothing is sent to anyone.':'Demonstração: o link abre o WhatsApp sem número. Nada é enviado a ninguém.'}</p><button class="btn btn-line btn-sm" data-clear style="justify-self:start">${EN?'Clear order':'Esvaziar pedido'}</button>`:'')+`</div>`;
 const up=()=>{const m=message({nome:v('nome'),end:v('end'),obs:v('obs')});const pre=$('.msg',dlg);if(pre){pre.textContent=m;$('[data-wa]',dlg).href='https://wa.me/?text='+encodeURIComponent(m)}};up();
 dlg.oninput=up;}
dlg.addEventListener('click',e=>{const t=e.target;if(t===dlg||t.closest('[data-x]'))return dlg.close();
 const rm=t.closest('[data-rm]');if(rm){cart.splice(+rm.dataset.rm,1);set(KEY,cart);badge();drawCart()}
 if(t.closest('[data-clear]')){cart=[];set(KEY,cart);badge();drawCart()}
 if(t.closest('[data-copy]')){const m=$('.msg',dlg).textContent;(navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).then(()=>toast(T.copied),()=>toast(T.copyfail))}});
dlg.addEventListener('change',e=>{const n=e.target.name;if(n==='mode'){opt.mode=e.target.value}else if(n==='b'){opt.b=+e.target.value}else if(n==='pay'){opt.pay=e.target.value}else return;set(OK,opt);drawCart()});
const openCart=()=>{drawCart();dlg.showModal()};
$$('[data-cart]').forEach(b=>b.addEventListener('click',openCart));badge();

/* cardápio: configurar pizza */
const cfg=D.createElement('dialog');cfg.setAttribute('aria-labelledby','cfg-h');D.body.append(cfg);
function openCfg(id){const p=P[id];let sz='g',bd=0,half='',q=1;
 const others=F.pizzas.filter(x=>x.id!==id&&x.sweet===p.sweet);
 const price=()=>{const h=half?P[half]:null;return(h?Math.max(p[sz],h[sz]):p[sz])+F.borda[bd].p};
 const draw=()=>{cfg.innerHTML=`<form method="dialog" class="dlg"><button class="x" aria-label="${EN?'Close':'Fechar'}" value="x">×</button><h2 id="cfg-h">${nm(p)}</h2>
 <fieldset><legend>${EN?'Size':'Tamanho'}</legend><div class="opts">${['m','g'].map(s=>`<label class="opt"><input type="radio" name="sz" value="${s}" ${s===sz?'checked':''}><span>${s==='m'?T.sizeM:T.sizeG} <small>${s==='m'?'6':'8'} ${EN?'slices':'fatias'}</small></span></label>`).join('')}</div></fieldset>
 <fieldset><legend>${EN?'Crust filling':'Borda recheada'}</legend><div class="opts">${F.borda.map((b,i)=>`<label class="opt"><input type="radio" name="bd" value="${i}" ${i===bd?'checked':''}><span>${i?nm(b):T.none} ${i?`<small>+${money(b.p)}</small>`:''}</span></label>`).join('')}</div></fieldset>
 <label class="f">${T.half}<select name="half"><option value="">${EN?'No, whole pizza':'Não, pizza inteira'}</option>${others.map(o=>`<option value="${o.id}" ${o.id===half?'selected':''}>${nm(o)}</option>`).join('')}</select><span class="warn">${EN?'Half and half is charged at the higher price of the two.':'Meio a meio cobra o preço do sabor mais caro.'}</span></label>
 <div class="dfoot"><div class="qty"><button type="button" data-q="-1" aria-label="${EN?'Less':'Menos'}">−</button><output aria-live="polite">${q}</output><button type="button" data-q="1" aria-label="${EN?'More':'Mais'}">+</button></div><span class="tot">${money(price()*q)}</span></div>
 <button class="btn btn-fire" type="button" data-ok>${T.add}</button></form>`};
 draw();cfg.onchange=e=>{const n=e.target.name;if(n==='sz')sz=e.target.value;if(n==='bd')bd=+e.target.value;if(n==='half')half=e.target.value;draw();const el=cfg.querySelector(`[name=${n}]:checked`)||cfg.querySelector(`[name=${n}]`);el&&el.focus()};
 cfg.onclick=e=>{if(e.target===cfg)return cfg.close();const qb=e.target.closest('[data-q]');if(qb){q=Math.max(1,Math.min(20,q+ +qb.dataset.q));draw();cfg.querySelector(`[data-q="${qb.dataset.q}"]`).focus()}
  if(e.target.closest('[data-ok]')){const h=half?P[half]:null;const lab=`${sz==='m'?T.sizeM:T.sizeG} ${h?T.half.toLowerCase()+': '+nm(p)+' '+T.and+' '+nm(h):nm(p)}`;addLine(lab,bd?nm(F.borda[bd]):'',price(),q);cfg.close()}};
 cfg.showModal()}
$$('[data-add]').forEach(b=>b.addEventListener('click',()=>openCfg(b.dataset.add)));
$$('[data-extra]').forEach(b=>b.addEventListener('click',()=>{const x=F.extras.find(e=>e.id===b.dataset.extra);addLine(nm(x),'',x.p)}));

/* monte sua pizza */
const bd=$('#builder');if(bd){
 const svg=$('#pz',bd),st={sz:'g',sauce:'tomato',on:new Set()};
 const rnd=s=>()=>(s=(s*16807)%2147483647)/2147483647;
 const sh={pepperoni:(x,y)=>`<circle cx="${x}" cy="${y}" r="7.5" fill="#a5271b"/><circle cx="${x-2}" cy="${y-2}" r="1.2" fill="#d9573f"/><circle cx="${x+2.5}" cy="${y+1.5}" r="1" fill="#d9573f"/>`,
 calabresa:(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="#c25a3c"/><circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="#8d3a24" stroke-width="1"/>`,
 presunto:(x,y)=>`<rect x="${x-7}" y="${y-5}" width="14" height="10" rx="4" fill="#eba3a0" transform="rotate(${(x*7)%60-30} ${x} ${y})"/>`,
 bacon:(x,y)=>`<rect x="${x-9}" y="${y-2.6}" width="18" height="5.2" rx="2" fill="#b4472f" transform="rotate(${(y*11)%140-70} ${x} ${y})"/>`,
 frango:(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#ecd9b3" transform="rotate(${(x*13)%160} ${x} ${y})"/>`,
 cogumelos:(x,y)=>`<path d="M${x-7} ${y+2}a7 6 0 0 1 14 0z" fill="#cfb895"/><rect x="${x-2}" y="${y+2}" width="4" height="4.5" rx="1.5" fill="#efe3cc"/>`,
 cebola:(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#a24a8e" stroke-width="2"/>`,
 tomate:(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="#e0452b"/><circle cx="${x}" cy="${y}" r="3" fill="#f26e50"/>`,
 azeitona:(x,y)=>`<circle cx="${x}" cy="${y}" r="4" fill="#2a2a24"/><circle cx="${x}" cy="${y}" r="1.5" fill="#8a8a70"/>`,
 manjericao:(x,y)=>`<path d="M${x-8} ${y}Q${x} ${y-9} ${x+8} ${y}Q${x} ${y+8} ${x-8} ${y}z" fill="#2f7d32" transform="rotate(${(x*17)%180} ${x} ${y})"/>`,
 rucula:(x,y)=>`<path d="M${x-9} ${y}Q${x-3} ${y-6} ${x+2} ${y-2}Q${x+6} ${y-5} ${x+9} ${y+1}Q${x} ${y+4} ${x-9} ${y}z" fill="#4e9a3a" transform="rotate(${(y*19)%180} ${x} ${y})"/>`,
 milho:(x,y)=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#f2c230"/>`,
 catupiry:(x,y)=>`<circle cx="${x}" cy="${y}" r="6.5" fill="#fffaf0"/>`,
 parmesao:(x,y)=>`<path d="M${x-6} ${y}l12 -2l-3 5z" fill="#f1dd9e"/>`};
 let g=`<circle cx="100" cy="100" r="98" fill="#d8a158"/><circle cx="100" cy="100" r="96" fill="none" stroke="#b9783a" stroke-width="2"/>`;
 const r0=rnd(7);for(let i=0;i<22;i++){const a=r0()*6.28,r=88+r0()*7;g+=`<circle cx="${100+Math.cos(a)*r}" cy="${100+Math.sin(a)*r}" r="${1.5+r0()*3}" fill="#7a3f1c" opacity=".5"/>`}
 g+=`<circle id="sauce" cx="100" cy="100" r="84" fill="#c8321a"/><g id="cheese">`;
 const r1=rnd(11);for(let i=0;i<26;i++){const a=r1()*6.28,r=Math.sqrt(r1())*76;g+=`<ellipse cx="${100+Math.cos(a)*r}" cy="${100+Math.sin(a)*r}" rx="${7+r1()*8}" ry="${5+r1()*6}" fill="#f6e7b5" opacity=".9" transform="rotate(${r1()*180} ${100+Math.cos(a)*r} ${100+Math.sin(a)*r})"/>`}g+='</g>';
 F.tops.forEach((t,ti)=>{const r=rnd(31+ti*97),pts=[],n=t.id==='milho'?26:t.id==='cebola'||t.id==='parmesao'?14:11;let guard=0;
  while(pts.length<n&&guard++<400){const a=r()*6.28,rr=Math.sqrt(r())*76,x=+(100+Math.cos(a)*rr).toFixed(1),y=+(100+Math.sin(a)*rr).toFixed(1);if(pts.every(p=>(p[0]-x)**2+(p[1]-y)**2>(t.id==='milho'?30:150)))pts.push([x,y])}
  g+=`<g class="tp off" data-t="${t.id}">${pts.map(p=>sh[t.id](p[0],p[1])).join('')}</g>`});
 svg.innerHTML=g;
 const price=()=>(st.sz==='g'?38:30)+[...st.on].reduce((a,id)=>a+F.tops.find(t=>t.id===id)[st.sz],0);
 const names=()=>[...st.on].map(id=>nm(F.tops.find(t=>t.id===id)));
 const draw=()=>{$('#sauce',svg).setAttribute('fill',st.sauce==='tomato'?'#c8321a':'#efe3c8');$$('.tp',svg).forEach(e=>e.classList.toggle('off',!st.on.has(e.dataset.t)));
  $('#total').textContent=money(price());$('#cnt').textContent=`${st.on.size}/5 ${T.ing}`;
  $$('input[data-top]',bd).forEach(i=>{i.disabled=!i.checked&&st.on.size>=5;i.closest('.opt').title=i.disabled?T.max:''});
  $$('input[data-top]',bd).forEach(i=>{const t=F.tops.find(x=>x.id===i.dataset.top);i.nextElementSibling.querySelector('small').textContent='+'+money(t[st.sz]).replace('R$ ','')})};
 bd.addEventListener('change',e=>{const i=e.target;if(i.name==='sz')st.sz=i.value;if(i.name==='sauce')st.sauce=i.value;if(i.dataset.top){i.checked?st.on.add(i.dataset.top):st.on.delete(i.dataset.top)}draw()});
 $('#addb',bd).addEventListener('click',()=>{addLine(`${T.build} ${st.sz==='g'?T.sizeG:T.sizeM}`,(st.sauce==='tomato'?(EN?'tomato sauce':'molho de tomate'):(EN?'garlic cream sauce':'molho branco'))+(st.on.size?', '+names().join(', '):''),price())});
 draw()}

/* massa */
const dg=$('#dough');if(dg){const r=$('input[type=range]',dg),S=F.steps;
 const bub=[[-18,-6],[10,-14],[22,6],[-4,12],[-26,10],[4,0],[18,-22],[-12,-20],[28,-6],[-20,22],[8,24],[-30,-8]];
 const draw=()=>{const h=+r.value,s=[...S].reverse().find(x=>h>=x.at)||S[0],k=1-Math.exp(-h/16),sc=.62+.38*Math.min(1,k*1.25);
  $('.hnum',dg).innerHTML=h+'<small>h</small>';$('.stepbox h3',dg).textContent=s.t[L];$('.stepbox p',dg).textContent=s.d[L];
  const cold=h>=2&&h<46;$('[data-s=temp]',dg).textContent=cold?'4 °C':(h<2?'22 °C':'20 °C');$('[data-s=loc]',dg).textContent=cold?(EN?'Fridge':'Geladeira'):(EN?'Counter':'Bancada');$('[data-s=vol]',dg).textContent='×'+(1+1.3*Math.min(1,k*1.2)).toFixed(1);$('[data-s=bake]',dg).textContent=h>=48?'420 °C · 90 s':(EN?'not yet':'ainda não');
  $('.b',dg).style.transform=`scale(${sc})`;$$('.bb',dg).forEach((c,i)=>c.style.opacity=i<Math.floor(h/4)?1:0);r.setAttribute('aria-valuetext',h+' h: '+s.t[L])};
 r.addEventListener('input',draw);draw()}

/* entrega */
const q=$('#quote');if(q){const s=$('select',q),o=$('.res',q),go=()=>{const b=F.bairros[+s.value];o.innerHTML=`${money(b.f)} <small>${b.t[L]} · ${T.min.replace(/:\s*$/,'')}: ${money(F.min)}</small>`;opt.b=+s.value;opt.mode='delivery';set(OK,opt)};s.value=opt.b;s.addEventListener('change',go);go()}

/* contato (demonstração) */
const fm=$('#contact-form');if(fm)fm.addEventListener('submit',e=>{e.preventDefault();toast(T.sent);fm.reset()});
})();
