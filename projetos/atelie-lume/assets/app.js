(()=>{
const L=window.LUME,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0'),key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromKey=k=>{const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c)};
const brl=n=>'R$ '+n.toLocaleString('pt-BR');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const longDate=d=>d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
const svc=id=>L.services.find(s=>s.id===id),pro=id=>L.pros.find(p=>p.id===id);

/* ---- agenda simulada (determinística) + reservas do localStorage ---- */
const hash=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}x^=x>>>13;x=Math.imul(x,1274126177);return(x^x>>>16)>>>0};
const store={get(){try{return JSON.parse(localStorage.getItem('lume.ag')||'[]')}catch{return[]}},set(v){try{localStorage.setItem('lume.ag',JSON.stringify(v))}catch{}}};
const hoursOf=d=>L.hours[d.getDay()];
const works=(p,d)=>p.dias.includes(d.getDay());
const blocks=(t,min)=>{const[h,m]=t.split(':').map(Number),b=(h*60+m)/30;return Array.from({length:Math.ceil(min/30)},(_,i)=>b+i)};
function proFree(p,d,t,min,bookings){
  const k=key(d),bl=blocks(t,min),busyRate=d.getDay()>=5?46:34;
  return bl.every(b=>hash(k+p.id+b)%100>=busyRate)&&!bookings.some(x=>x.date===k&&x.pro===p.id&&blocks(x.time,x.min).some(y=>bl.includes(y)));
}
function slotsFor(d,sv,proId){
  const hr=hoursOf(d);if(!hr)return[];
  const cands=(proId==='any'?sv.pros:[proId]).map(pro).filter(p=>works(p,d)),bk=store.get(),now=Date.now()+60*60000,out=[];
  for(let m=hr[0]*60;m+sv.min<=hr[1]*60;m+=30){
    const t=`${pad(m/60|0)}:${pad(m%60)}`,at=new Date(d);at.setHours(m/60|0,m%60,0,0);
    const who=at.getTime()<now?null:cands.find(p=>proFree(p,d,t,sv.min,bk));
    out.push({t,free:!!who,pro:who&&who.id});
  }
  return out;
}
const hasFree=(d,sv,p)=>slotsFor(d,sv,p).some(s=>s.free);

/* ---- UI geral ---- */
document.documentElement.classList.remove('nojs');
const top=$('.top');addEventListener('scroll',()=>top.classList.toggle('scrolled',scrollY>8),{passive:true});
const bg=$('.burger'),nav=$('#nav');
if(bg){const set=o=>{bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?'Fechar menu':'Abrir menu');nav.classList.toggle('open',o)};
bg.onclick=()=>set(bg.getAttribute('aria-expanded')!=='true');addEventListener('keydown',e=>e.key==='Escape'&&set(false));$$('a',nav).forEach(a=>a.onclick=()=>set(false))}
if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});$$('.rv').forEach(el=>io.observe(el))}else $$('.rv').forEach(el=>el.classList.add('in'));
$$('.cmp').forEach(c=>{const i=$('input',c);i.oninput=()=>c.style.setProperty('--p',i.value+'%')});
const hd=$('.hours');if(hd){const r=$(`tr[data-d="${new Date().getDay()}"]`,hd);r&&r.classList.add('today')}
const toast=m=>{let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.append(t)}t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2800)};

/* ---- chips de horários na home ---- */
const chips=$('#chips');
if(chips){const sv=svc('corte'),base=new Date(),out=[];
  for(let i=0;i<8&&out.length<4;i++){const d=new Date(base);d.setDate(base.getDate()+i);d.setHours(0,0,0,0);
    const f=slotsFor(d,sv,'any').filter(s=>s.free);if(f.length)out.push([d,f[Math.min(1,f.length-1)]])}
  if(out.length)chips.innerHTML=out.map(([d,s])=>`<a class="chip" href="${chips.dataset.href}?s=corte&d=${key(d)}&t=${s.t}">${d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')} ${pad(d.getDate())}/${pad(d.getMonth()+1)} · ${s.t}</a>`).join('');
}

/* ---- agendamento ---- */
const root=$('#book');if(!root)return;
const S={step:1,svc:null,pro:null,date:null,time:null,who:null,name:'',phone:'',note:'',cm:null,done:null};
const today=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})(),maxD=new Date(today);maxD.setDate(maxD.getDate()+60);
S.cm=new Date(today.getFullYear(),today.getMonth(),1);
const q=new URLSearchParams(location.search);
{const sv=svc(q.get('s'));if(sv){S.svc=sv.id;S.step=2;S.pro='any';
  const d=q.get('d')&&/^\d{4}-\d\d-\d\d$/.test(q.get('d'))?fromKey(q.get('d')):null,t=q.get('t');
  if(d&&t){const s=slotsFor(d,sv,'any').find(x=>x.t===t&&x.free);if(s&&d>=today&&d<=maxD){S.date=key(d);S.time=t;S.who=s.pro;S.cm=new Date(d.getFullYear(),d.getMonth(),1);S.step=4}}}}
const names=['Serviço','Profissional','Data e hora','Seus dados','Confirmar'];
const cur=()=>S.svc&&svc(S.svc);
const proName=()=>S.pro==='any'?(S.who?pro(S.who).nome+' (sem preferência)':'Sem preferência'):S.pro?pro(S.pro).nome:null;

function go(n,focus=true){S.step=n;render();if(focus){const h=$('.step:not([hidden]) h2',root);h&&(h.tabIndex=-1,h.focus({preventScroll:true}));const b=$('.prog',root).getBoundingClientRect().top+scrollY-110;scrollTo({top:Math.min(b,scrollY>b?b:scrollY),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}}
const stepHead=(n,t,l)=>`<h2>${t}</h2><p class="lede">${l}</p>`;
function render(){
  if(S.done)return renderDone();
  const sv=cur();
  const prog=`<ol class="prog" aria-label="Etapas">${names.map((n,i)=>`<li class="${i+1===S.step?'on':i+1<S.step?'done':''}"${i+1===S.step?' aria-current="step"':''}><span>${n}</span></li>`).join('')}</ol>`;
  let body='';
  if(S.step===1)body=`<section class="step">${stepHead(1,'O que vamos fazer?','Escolha o serviço. O valor é “a partir de” e fecha na cadeira, depois de ver o seu cabelo.')}<div class="opts">${L.services.map(s=>`<button type="button" class="opt" data-svc="${s.id}" aria-pressed="${S.svc===s.id}"><b>${s.nome}</b><small>${s.curto}</small><span class="v">${brl(s.preco)}<small>${s.min} min</small></span></button>`).join('')}</div></section>`;
  if(S.step===2){const ps=sv.pros.map(pro);body=`<section class="step">${stepHead(2,'Com quem?','Quem faz '+sv.nome.toLowerCase()+' aqui. Sem preferência, a gente encaixa quem estiver livre no horário.')}<div class="opts"><button type="button" class="opt pp" data-pro="any" aria-pressed="${S.pro==='any'}"><span class="mono" style="--c1:#EADFCF;--c2:#5B4B41" aria-hidden="true">·</span><b>Sem preferência</b><small>Mais horários disponíveis</small></button>${ps.map(p=>`<button type="button" class="opt pp" data-pro="${p.id}" aria-pressed="${S.pro===p.id}"><span class="mono" style="--c1:${p.c1};--c2:${p.c2}" aria-hidden="true">${p.nome[0]}</span><b>${p.nome}</b><small>${p.papel} · ${p.diasTxt}</small></button>`).join('')}</div><div class="nav2"><button class="back" type="button" data-back>← Voltar</button></div></section>`}
  if(S.step===3)body=`<section class="step">${stepHead(3,'Quando?','Dias riscados estão lotados ou fechados. Horários riscados já foram reservados (agenda de exemplo).')}<div class="dt"><div class="cal" id="cal"></div><div class="slots" id="slots" aria-live="polite"></div></div><div class="nav2"><button class="back" type="button" data-back>← Voltar</button><button class="btn btn-sm" type="button" data-next ${S.time?'':'disabled'}>Continuar <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button></div></section>`;
  if(S.step===4)body=`<section class="step">${stepHead(4,'Seus dados','Só o necessário para a profissional te reconhecer. Nada sai deste navegador.')}<form id="f" novalidate><div class="fld"><label for="nm">Nome</label><input id="nm" name="nm" autocomplete="name" value="${esc(S.name)}" required><span class="err" id="e1" aria-live="polite"></span></div><div class="fld"><label for="tel">WhatsApp</label><input id="tel" name="tel" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(41) 90000-0000" value="${esc(S.phone)}" required><span class="err" id="e2" aria-live="polite"></span></div><div class="fld"><label for="ob">Observação <span class="fine">(opcional)</span></label><textarea id="ob" name="ob" placeholder="Ex.: cabelo com química, alergia a algum produto, foto de referência que vou levar">${esc(S.note)}</textarea></div><div class="nav2"><button class="back" type="button" data-back>← Voltar</button><button class="btn btn-sm" type="submit">Revisar <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button></div></form></section>`;
  if(S.step===5)body=`<section class="step">${stepHead(5,'Tudo certo?','Confira o resumo. Ao confirmar, a reserva fica salva aqui e a mensagem abre pronta no WhatsApp.')}<p class="fine">${esc(S.name)} · ${esc(S.phone)}${S.note?'<br>“'+esc(S.note)+'”':''}</p><div class="nav2"><button class="back" type="button" data-back>← Voltar</button><button class="btn btn-wa" type="button" id="wa">Confirmar pelo WhatsApp <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button></div></section>`;
  root.innerHTML=`<div class="main">${prog}${body}${mine()}</div>${summary()}`;
  if(S.step===3){drawCal();drawSlots()}
  bind();
}
function summary(){
  const sv=cur(),d=S.date?fromKey(S.date):null,r=(k,v)=>`<div class="row"><dt>${k}</dt>${v?`<dd>${v}</dd>`:'<dd class="pend">a escolher</dd>'}</div>`;
  return `<aside class="sum" aria-label="Resumo do agendamento"><h2>Seu horário</h2><dl>${r('Serviço',sv&&sv.nome)}${r('Profissional',S.pro&&esc(proName()))}${r('Data',d&&longDate(d))}${r('Hora',S.time&&S.time+(sv?' · '+sv.min+' min':''))}</dl><div class="tot"><span>${sv?'A partir de':'Valor'}</span><b>${sv?brl(sv.preco):'—'}</b></div><p class="note">Valor final confirmado no atendimento. Reserva sem cobrança: cancele pelo WhatsApp até 4 h antes.</p></aside>`;
}
function mine(){
  const list=store.get().filter(x=>fromKey(x.date)>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(!list.length)return'';
  return`<div class="mine"><h3>Seus agendamentos neste navegador</h3><ul>${list.map(x=>`<li><span>${esc(svc(x.svc).nome)} · ${longDate(fromKey(x.date))} às ${x.time}<br><span class="fine">${esc(pro(x.pro).nome)} · ${x.code}</span></span><button type="button" data-cancel="${x.code}">Cancelar</button></li>`).join('')}</ul></div>`;
}
function bind(){
  $$('[data-svc]',root).forEach(b=>b.onclick=()=>{if(S.svc!==b.dataset.svc){S.svc=b.dataset.svc;S.pro=null;S.date=S.time=S.who=null}go(2)});
  $$('[data-pro]',root).forEach(b=>b.onclick=()=>{if(S.pro!==b.dataset.pro){S.pro=b.dataset.pro;S.date=S.time=S.who=null}go(3)});
  $$('[data-back]',root).forEach(b=>b.onclick=()=>go(S.step-1));
  const nx=$('[data-next]',root);if(nx)nx.onclick=()=>go(4);
  $$('[data-cancel]',root).forEach(b=>b.onclick=()=>{store.set(store.get().filter(x=>x.code!==b.dataset.cancel));toast('Agendamento cancelado.');render()});
  const f=$('#f',root);if(f){const tel=$('#tel',f);tel.oninput=()=>{const d=tel.value.replace(/\D/g,'').slice(0,11);tel.value=d.length>10?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length>6?`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`:d.length>2?`(${d.slice(0,2)}) ${d.slice(2)}`:d};
    f.onsubmit=e=>{e.preventDefault();const nm=f.nm.value.trim(),dg=f.tel.value.replace(/\D/g,'');let bad=null;
      const set=(i,el,m)=>{$('#e'+i,f).textContent=m;el.setAttribute('aria-invalid',!!m);if(m&&!bad)bad=el};
      set(1,f.nm,nm.length<2?'Informe seu nome.':'');set(2,f.tel,dg.length<10?'Informe o DDD e o número, com 10 ou 11 dígitos.':'');
      if(bad)return bad.focus();S.name=nm;S.phone=f.tel.value;S.note=f.ob.value.trim();go(5)}}
  const wa=$('#wa',root);if(wa)wa.onclick=confirm;
}
function drawCal(){
  const c=$('#cal',root),sv=cur(),m=S.cm,first=new Date(m.getFullYear(),m.getMonth(),1),lead=(first.getDay()+6)%7,days=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
  const prevOk=new Date(m.getFullYear(),m.getMonth(),0)>=today,nextOk=new Date(m.getFullYear(),m.getMonth()+1,1)<=maxD;
  let h=`<div class="hd"><button type="button" id="pm" aria-label="Mês anterior" ${prevOk?'':'disabled'}>←</button><b aria-live="polite">${m.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button type="button" id="nm2" aria-label="Próximo mês" ${nextOk?'':'disabled'}>→</button></div><div class="grid7" role="group" aria-label="Dias">`+['seg','ter','qua','qui','sex','sáb','dom'].map(d=>`<span class="wd" aria-hidden="true">${d}</span>`).join('');
  for(let i=0;i<lead;i++)h+='<span class="day void"></span>';
  for(let d=1;d<=days;d++){const dt=new Date(m.getFullYear(),m.getMonth(),d),k=key(dt),ok=dt>=today&&dt<=maxD&&hasFree(dt,sv,S.pro);
    h+=`<button type="button" class="day${k===key(today)?' today':''}" data-d="${k}" aria-pressed="${S.date===k}" aria-label="${longDate(dt)}${ok?'':', indisponível'}" ${ok?'':'disabled'}>${d}</button>`}
  c.innerHTML=h+'</div>';
  $('#pm',c).onclick=()=>{S.cm=new Date(m.getFullYear(),m.getMonth()-1,1);drawCal()};$('#nm2',c).onclick=()=>{S.cm=new Date(m.getFullYear(),m.getMonth()+1,1);drawCal()};
  $$('.day[data-d]',c).forEach(b=>b.onclick=()=>{S.date=b.dataset.d;S.time=S.who=null;drawCal();drawSlots();const n=$('[data-next]',root);n&&(n.disabled=true)});
}
function drawSlots(){
  const el=$('#slots',root);
  if(!S.date){el.innerHTML='<div class="empty">Escolha um dia no calendário para ver os horários.</div>';return}
  const d=fromKey(S.date),sv=cur(),ss=slotsFor(d,sv,S.pro),free=ss.filter(s=>s.free).length;
  el.innerHTML=`<h3>${longDate(d)}</h3><div class="sg" role="group" aria-label="Horários">${ss.map(s=>`<button type="button" class="sl" data-t="${s.t}" data-w="${s.pro||''}" aria-pressed="${S.time===s.t}" ${s.free?'':'disabled'}>${s.t}</button>`).join('')}</div><p class="legend">${free} horário${free===1?'':'s'} livre${free===1?'':'s'} para ${sv.min} min de atendimento.</p>`;
  $$('.sl',el).forEach(b=>b.onclick=()=>{S.time=b.dataset.t;S.who=b.dataset.w;drawSlots();const n=$('[data-next]',root);n&&(n.disabled=false);summaryRefresh()});
}
function summaryRefresh(){const a=$('.sum',root);a&&a.replaceWith(Object.assign(document.createElement('div'),{innerHTML:summary()}).firstChild)}
const code=()=>'LUME-'+Math.random().toString(36).slice(2,6).toUpperCase();
function waText(b){const sv=svc(b.svc);return`Olá, Ateliê Lume! Quero confirmar meu agendamento:\n\n• Serviço: ${sv.nome} (${sv.min} min)\n• Profissional: ${pro(b.pro).nome}\n• Data: ${longDate(fromKey(b.date))}, às ${b.time}\n• Valor: a partir de ${brl(sv.preco)}\n• Nome: ${b.name}\n• Telefone: ${b.phone}${b.note?'\n• Observação: '+b.note:''}\n\nCódigo: ${b.code}`}
function confirm(){
  const sv=cur(),d=fromKey(S.date);
  // revalida: o horário pode ter sido ocupado por outra reserva neste navegador
  const sl=slotsFor(d,sv,S.pro==='any'?'any':S.pro).find(s=>s.t===S.time&&s.free);
  if(!sl){toast('Esse horário acabou de ser ocupado. Escolha outro.');S.time=null;return go(3)}
  const b={code:code(),svc:sv.id,pro:S.pro==='any'?sl.pro:S.pro,date:S.date,time:S.time,min:sv.min,name:S.name,phone:S.phone,note:S.note};
  store.set([...store.get(),b]);S.done=b;
  window.open(`https://wa.me/${L.wa}?text=${encodeURIComponent(waText(b))}`,'_blank','noopener');
  render();window.scrollTo({top:0});
}
function renderDone(){
  const b=S.done,sv=svc(b.svc),href=`https://wa.me/${L.wa}?text=${encodeURIComponent(waText(b))}`;
  root.innerHTML=`<div class="main"><section class="step fin"><div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2 tabindex="-1" id="okh">Horário reservado, ${esc(b.name.split(' ')[0])}.</h2><p class="lede">${sv.nome} com ${pro(b.pro).nome}, ${longDate(fromKey(b.date))} às ${b.time}. Se o WhatsApp não abriu, use o botão abaixo para enviar a mensagem.</p><p><span class="code">${b.code}</span></p><div class="cta"><a class="btn btn-wa" href="${href}" target="_blank" rel="noopener">Abrir WhatsApp</a><button class="btn btn-line" type="button" id="again">Fazer outro agendamento</button></div><p class="fine">Projeto conceito: nenhuma mensagem é enviada de verdade e o número do WhatsApp é de exemplo. A reserva fica só neste navegador.</p>${mine()}</section></div>${summary()}`;
  $('#again').onclick=()=>{Object.assign(S,{step:1,svc:null,pro:null,date:null,time:null,who:null,done:null,note:''});render()};
  $$('[data-cancel]',root).forEach(x=>x.onclick=()=>{store.set(store.get().filter(y=>y.code!==x.dataset.cancel));toast('Agendamento cancelado.');if(x.dataset.cancel===b.code){S.done=null;S.step=1;S.svc=S.pro=S.date=S.time=null}render()});
  $('#okh').focus({preventScroll:true});
}
render();
})();
