(()=>{
'use strict';
const WA='5541900000000'; // número de exemplo, não é real
const PIX_KEY='7d3c9e52-1b4a-4f6e-9a21-5c0d8e3f7a10'; // chave fictícia
const SVC=[
 {id:'aval',n:'Avaliação facial',d:'Mapeamento da pele e plano de cuidado, sem compromisso. O valor é abatido do procedimento.',min:30,p:90,pros:['h','c','b'],tag:'Comece aqui'},
 {id:'limp',n:'Limpeza de pele profunda',d:'Extração, esfoliação suave e máscara calmante. Indicada a cada 30 a 45 dias.',min:60,p:180,pros:['b'],tag:'Pele'},
 {id:'peel',n:'Peeling de diamante + LED',d:'Renova a textura sem descamar. Volta ao trabalho no mesmo dia.',min:60,p:260,pros:['b'],tag:'Pele'},
 {id:'toxi',n:'Toxina botulínica',d:'Três áreas à sua escolha, com resultado natural. Revisão gratuita em 15 dias.',min:30,p:1250,pros:['c','h'],tag:'Harmonização'},
 {id:'labi',n:'Preenchimento labial',d:'Contorno e hidratação com ácido hialurônico, na quantidade que faz sentido para o seu rosto.',min:60,p:980,pros:['h'],tag:'Harmonização'},
 {id:'bio',n:'Bioestimulador de colágeno',d:'Firmeza gradual, com resultado que aparece em 30 a 60 dias.',min:60,p:890,pros:['c','h'],tag:'Firmeza'}];
const PRO={h:{n:'Helena Prado',r:'Biomédica esteta',d:[1,3,5],c:'#a4604d',b:'Harmonização facial há 9 anos. Gosta de mexer pouco e explicar muito.'},
 c:{n:'Camila Rocha',r:'Dermatologista',d:[2,4,6],c:'#3b5446',b:'Avalia a pele antes de qualquer procedimento e acompanha o resultado.'},
 b:{n:'Bianca Moreira',r:'Esteticista',d:[1,2,3,4,5,6],c:'#8a6a2f',b:'Cuida das limpezas e peelings. Sessões calmas, sem pressa.'}};
const $=s=>document.querySelector(s),brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const DIAS=['dom','seg','ter','qua','qui','sex','sáb'],MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== QR Code: modo byte, correção L, versões 1 a 10 ===== */
function qrMatrix(text){
 const data=[...new TextEncoder().encode(text)],ECC=[7,10,15,20,26,18,20,24,30,18],NB=[1,1,1,1,1,2,2,2,2,4];
 const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r};
 const capOf=v=>Math.floor(raw(v)/8)-ECC[v-1]*NB[v-1];
 let v=1;while(4+(v<=9?8:16)+8*data.length>8*capOf(v)){v++;if(v>10)throw new Error('texto longo demais')}
 const cap=capOf(v),bits=[],put=(x,n)=>{for(let i=n-1;i>=0;i--)bits.push((x>>>i)&1)};
 put(4,4);put(data.length,v<=9?8:16);data.forEach(b=>put(b,8));put(0,Math.min(4,cap*8-bits.length));while(bits.length%8)bits.push(0);
 const cw=[];for(let i=0;i<bits.length;i+=8)cw.push(parseInt(bits.slice(i,i+8).join(''),2));for(let p=0xEC;cw.length<cap;p^=0xEC^0x11)cw.push(p);
 const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z};
 const nb=NB[v-1],el=ECC[v-1],rc=Math.floor(raw(v)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb);
 const div=(()=>{const r=Array(el).fill(0);r[el-1]=1;let root=1;for(let i=0;i<el;i++){for(let j=0;j<el;j++){r[j]=mul(r[j],root);if(j+1<el)r[j]^=r[j+1]}root=mul(root,2)}return r})();
 const blocks=[];for(let i=0,k=0;i<nb;i++){const dl=sl-el+(i<ns?0:1),d=cw.slice(k,k+dl);k+=dl;const r=Array(el).fill(0);for(const b of d){const f=b^r.shift();r.push(0);div.forEach((c,x)=>r[x]^=mul(c,f))}if(i<ns)d.push(0);blocks.push(d.concat(r))}
 const all=[];for(let i=0;i<blocks[nb-1].length;i++)blocks.forEach((b,j)=>{if(i!==sl-el||j>=ns)all.push(b[i])});
 const N=v*4+17,M=Array.from({length:N},()=>Array(N).fill(false)),F=Array.from({length:N},()=>Array(N).fill(false));
 const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
 for(let i=0;i<N;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
 for(const [cx,cy] of [[3,3],[N-4,3],[3,N-4]])for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<N&&y>=0&&y<N)set(x,y,d!==2&&d!==4)}
 const AP=[[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]][v],n=AP.length;
 AP.forEach((ay,i)=>AP.forEach((ax,j)=>{if((i===0&&j===0)||(i===0&&j===n-1)||(i===n-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
 const fmt=m=>{const d=(1<<3)|m;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412,g=i=>((b>>>i)&1)===1;
  for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
  for(let i=0;i<8;i++)set(N-1-i,8,g(i));for(let i=8;i<15;i++)set(8,N-15+i,g(i));set(8,N-8,true)};
 fmt(0);
 if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(v<<12)|r;for(let i=0;i<18;i++){const x=((b>>>i)&1)===1,a=N-11+i%3,c=Math.floor(i/3);set(a,c,x);set(c,a,x)}}
 let i=0;for(let right=N-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<N;vert++)for(let j=0;j<2;j++){const x=right-j,y=((right+1)&2)===0?N-1-vert:vert;if(!F[y][x]&&i<all.length*8){M[y][x]=((all[i>>>3]>>>(7-(i&7)))&1)===1;i++}}}
 const mk=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
 const apply=m=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!F[y][x]&&mk[m](x,y))M[y][x]=!M[y][x]};
 const pen=()=>{let p=0;for(let a=0;a<2;a++)for(let y=0;y<N;y++){let run=1;for(let x=1;x<N;x++){const c=a?M[x][y]:M[y][x],q=a?M[x-1][y]:M[y][x-1];if(c===q){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}return p};
 let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const p=pen();if(p<bp){bp=p;best=m}apply(m)}
 apply(best);fmt(best);return M;
}
function qrSvg(text){const M=qrMatrix(text),n=M.length,q=3;let d='';M.forEach((r,y)=>{let x=0;while(x<n){if(r[x]){let e=x;while(e<n&&r[e])e++;d+=`M${x+q} ${y+q}h${e-x}v1h-${e-x}z`;x=e}else x++}});
 return `<svg viewBox="0 0 ${n+2*q} ${n+2*q}" shape-rendering="crispEdges" role="img" aria-label="QR Code Pix"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`}

/* ===== Pix copia e cola (BR Code) ===== */
const tlv=(id,v)=>id+pad(v.length)+v;
function crc16(s){let c=0xFFFF;for(const ch of s){c^=ch.charCodeAt(0)<<8;for(let i=0;i<8;i++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,'0')}
function pixPayload(valor,txid){const p=tlv('00','01')+tlv('01','12')+tlv('26',tlv('00','br.gov.bcb.pix')+tlv('01',PIX_KEY))+tlv('52','0000')+tlv('53','986')+tlv('54',valor.toFixed(2))+tlv('58','BR')+tlv('59','SERENA ESTETICA')+tlv('60','CURITIBA')+tlv('62',tlv('05',txid))+'6304';return p+crc16(p)}

/* ===== Agenda ===== */
const KEY='serena.bookings.v1',load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}},save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a))}catch{}};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>15;return h>>>0};
const hm=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
function slotsFor(pro,date,min){const dow=date.getDay();if(dow===0||!PRO[pro].d.includes(dow))return[];const end=dow===6?13*60:18*60,out=[],bk=load().filter(b=>b.st!=='cancelado'),day=iso(date),now=new Date();
 for(let t=9*60;t+min<=end;t+=30){if(hash(`${pro}|${day}|${t}`)%100<30)continue;if(bk.some(b=>b.pro===pro&&b.date===day&&t<b.t+b.min&&b.t<t+min))continue;
  const dt=new Date(date);dt.setHours(0,t,0,0);if(dt-now<2*3600e3)continue;out.push(t)}return out}
function nextFree(){const d=new Date();d.setHours(0,0,0,0);for(let i=0;i<14;i++){const x=new Date(d);x.setDate(d.getDate()+i);for(const p of Object.keys(PRO)){const sl=slotsFor(p,x,30);if(sl.length)return{day:i,date:x,t:sl[0]}}}return null}

/* ===== Estado e telas ===== */
const S={step:1,svc:null,pro:null,date:null,t:null,name:'',phone:'',pay:'pix',done:null,pix:null,left:600};
const flow=$('#flow');let tick=null;
const svc=()=>SVC.find(s=>s.id===S.svc),sinal=()=>Math.round(svc().p*30)/100;
function fmtDate(s){const [y,m,d]=s.split('-').map(Number);return `${DIAS[new Date(y,m-1,d).getDay()]}, ${d} de ${MESES[m-1]}`}
function renderSum(){const s=S.svc&&svc(),rows=[['Procedimento',s?s.n:'—'],['Profissional',S.pro?PRO[S.pro].n:'—'],['Quando',S.date&&S.t!=null?`${fmtDate(S.date)} · ${hm(S.t)}`:'—'],['Duração',s?s.min+' min':'—']];
 $('#sum').innerHTML=rows.map(r=>`<div class="row"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')+(s?`<div class="row"><span>Valor</span><b>${brl(s.p)}</b></div><div class="row tot"><span>Sinal (30%)</span><b>${brl(sinal())}</b></div>`:'');
 const bk=load().filter(b=>b.st!=='cancelado');$('#mine').innerHTML=bk.length?`<h5>Seus agendamentos</h5><ul>${bk.map(b=>`<li><span>${esc(fmtDate(b.date))} · ${hm(b.t)}<br><small>${esc(SVC.find(s=>s.id===b.svc).n)}</small></span><button data-cancel="${b.id}">Cancelar</button></li>`).join('')}</ul>`:''}
function go(n){S.step=n;clearInterval(tick);render();const r=$('#agendar').getBoundingClientRect();if(r.top<-20||r.top>innerHeight*.6)$('#agendar').scrollIntoView({behavior:'smooth'})}
function prog(){return `<ol class="prog">${['Procedimento','Horário','Seus dados','Pagamento'].map((t,i)=>`<li class="${i+1===S.step?'on':i+1<S.step?'done':''}"><span>${i+1}. ${t}</span></li>`).join('')}</ol>`}
function render(){renderSum();
 if(S.done){flow.innerHTML=doneView();return}
 let h=prog();
 if(S.step===1){h+=`<h3>O que você quer fazer?</h3><p class="sub">Escolha o procedimento. A profissional vem no próximo passo.</p><div class="opts">${SVC.map(s=>`<button class="opt" aria-pressed="${S.svc===s.id}" data-svc="${s.id}"><span><b>${s.n}</b><small>${s.min} min</small></span><span class="pr">${brl(s.p)}</span></button>`).join('')}</div><div class="nav"><span></span><button class="btn" data-go="2" ${S.svc?'':'disabled'}>Continuar</button></div>`}
 if(S.step===2){const s=svc(),days=[...Array(14)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d});
  h+=`<h3>Profissional e horário</h3><p class="sub">${s.n}, ${s.min} min.</p><div class="opts" role="radiogroup" aria-label="Profissional">${s.pros.map(p=>`<button class="opt" role="radio" aria-checked="${S.pro===p}" data-pro="${p}"><span><b>${PRO[p].n}</b><small>${PRO[p].r}</small></span></button>`).join('')}</div>`;
  if(S.pro){h+=`<p class="sub" style="margin:22px 0 8px">Dia</p><div class="days">${days.map(d=>{const ok=slotsFor(S.pro,d,s.min).length>0;return `<button class="day" data-date="${iso(d)}" aria-pressed="${S.date===iso(d)}" ${ok?'':'disabled'} aria-label="${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}${ok?'':', sem horários'}"><small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MESES[d.getMonth()]}</small></button>`}).join('')}</div>`;
   if(S.date){const [y,m,d]=S.date.split('-').map(Number),sl=slotsFor(S.pro,new Date(y,m-1,d),s.min);h+=`<p class="sub" style="margin:10px 0 8px">Horários livres</p>${sl.length?`<div class="slots">${sl.map(t=>`<button class="slot" data-t="${t}" aria-pressed="${S.t===t}">${hm(t)}</button>`).join('')}</div>`:'<p class="empty">Sem horários neste dia. Escolha outro.</p>'}`}}
  h+=`<div class="nav"><button class="btn ghost" data-go="1">Voltar</button><button class="btn" data-go="3" ${S.t!=null?'':'disabled'}>Continuar</button></div>`}
 if(S.step===3){h+=`<h3>Seus dados</h3><p class="sub">Usamos só para confirmar a reserva e mandar o lembrete.</p><form id="frm" novalidate><div class="f"><label for="nm">Nome completo</label><input id="nm" type="text" autocomplete="name" value="${esc(S.name)}"><p class="err" id="e1"></p></div><div class="f"><label for="ph">WhatsApp com DDD</label><input id="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 90000-0000" value="${esc(S.phone)}"><p class="err" id="e2"></p></div>
  <label>Pagamento</label><div class="opts" role="radiogroup" aria-label="Forma de pagamento"><button type="button" class="opt" role="radio" aria-checked="${S.pay==='pix'}" data-pay="pix"><span><b>Sinal de 30% por Pix</b><small>Horário garantido na hora</small></span><span class="pr">${brl(sinal())}</span></button><button type="button" class="opt" role="radio" aria-checked="${S.pay==='clin'}" data-pay="clin"><span><b>Pagar tudo na clínica</b><small>Reserva por 2 horas, depois libera</small></span><span class="pr">R$ 0,00</span></button></div>
  <div class="nav"><button type="button" class="btn ghost" data-go="2">Voltar</button><button class="btn" type="submit">${S.pay==='pix'?'Gerar Pix':'Confirmar reserva'}</button></div></form>`}
 if(S.step===4){const code=S.pix;h+=`<h3>Pague o sinal</h3><p class="sub">Abra o app do seu banco, escolha Pix e leia o QR Code ou cole o código.</p><div class="pay"><div class="qr" id="qr">${qrSvg(code)}</div><div><p class="timer">Expira em <b id="tm">10:00</b></p><p style="margin:6px 0 0"><b style="font:500 30px Georgia,serif">${brl(sinal())}</b></p><div class="copy"><code id="cd">${code}</code><button class="btn ghost" data-copy style="min-height:42px;padding:0 16px">Copiar</button></div></div></div>
  <p class="demo"><b>Demonstração.</b> O QR Code segue o formato do Pix, com a chave fictícia da clínica. Não existe cobrança por trás, então use o botão abaixo para simular o pagamento recebido.</p>
  <div class="nav"><button class="btn ghost" data-go="3">Voltar</button><button class="btn rose" data-paid>Simular pagamento recebido</button></div>`;
  flow.innerHTML=h;countdown();return}
 flow.innerHTML=h}
function countdown(){S.left=600;tick=setInterval(()=>{S.left--;const el=$('#tm');if(!el){clearInterval(tick);return}el.textContent=`${pad(Math.floor(S.left/60))}:${pad(S.left%60)}`;if(S.left<=0){clearInterval(tick);toast('O Pix expirou. Gere outro.');go(3)}},1000)}
function confirmBooking(paid){const s=svc(),clash=!slotsFor(S.pro,new Date(S.date+'T00:00'),s.min).includes(S.t);if(clash){toast('Esse horário acabou de ser ocupado. Escolha outro.');go(2);return}
 const b={id:'S'+Date.now().toString(36).toUpperCase(),svc:s.id,pro:S.pro,date:S.date,t:S.t,min:s.min,name:S.name,st:paid?'pago':'reservado'};const a=load();a.push(b);save(a);S.done=b;clearInterval(tick);render();$('#agendar').scrollIntoView({behavior:'smooth'})}
const waLink=t=>`https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
function waText(b){const s=SVC.find(x=>x.id===b.svc);return `Olá, aqui é ${b.name}. Agendei ${s.n} com ${PRO[b.pro].n} em ${fmtDate(b.date)} às ${hm(b.t)} (código ${b.id}).${b.st==='pago'?' Já paguei o sinal por Pix.':' Vou pagar na clínica.'}`}
function doneView(){const b=S.done,s=SVC.find(x=>x.id===b.svc);return `<div class="ok"><div class="tick"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>Horário reservado</h3><p class="sub" style="margin-bottom:0">${b.st==='pago'?'Sinal recebido (simulado). ':'Reserva mantida por 2 horas. '}Falta só avisar a clínica.</p></div>
 <div class="sum"><div><span>Procedimento</span><b>${s.n}</b></div><div><span>Profissional</span><b>${PRO[b.pro].n}</b></div><div><span>Quando</span><b>${fmtDate(b.date)} · ${hm(b.t)}</b></div><div><span>Código</span><b>${b.id}</b></div></div>
 <div class="cta" style="justify-content:center"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(waText(b))}">Confirmar no WhatsApp</a><button class="btn ghost" data-ics>Adicionar ao calendário</button><button class="btn ghost" data-new>Novo agendamento</button></div>
 <p class="demo" style="text-align:center">O WhatsApp abre com a mensagem pronta, para um número de exemplo.</p>`}
function ics(b){const s=SVC.find(x=>x.id===b.svc),d=b.date.replace(/-/g,''),f=t=>`${d}T${pad(Math.floor(t/60))}${pad(t%60)}00`;
 const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Serena Estetica//Demo//PT','BEGIN:VEVENT',`UID:${b.id}@serena.demo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g,'')}`,`DTSTART:${f(b.t)}`,`DTEND:${f(b.t+b.min)}`,`SUMMARY:${s.n} · Serena Estética`,`DESCRIPTION:Com ${PRO[b.pro].n}. Código ${b.id}.`,'LOCATION:Rua das Hortênsias\\, 482\\, Batel\\, Curitiba','BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY','DESCRIPTION:Consulta em 2 horas','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));a.download=`serena-${b.id}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const validPhone=v=>{const d=v.replace(/\D/g,'');return d.length===11&&d[2]==='9'&&+d.slice(0,2)>=11}
flow.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const D=t.dataset;
 if(D.svc){if(S.svc!==D.svc){S.svc=D.svc;S.pro=S.date=S.t=null}render()}
 else if(D.pro){S.pro=D.pro;S.date=S.t=null;render()}
 else if(D.date){S.date=D.date;S.t=null;render()}
 else if(D.t){S.t=+D.t;render()}
 else if(D.pay){S.name=$('#nm').value;S.phone=$('#ph').value;S.pay=D.pay;render()}
 else if(D.go){go(+D.go)}
 else if('copy' in D){navigator.clipboard?.writeText(S.pix).then(()=>toast('Código Pix copiado'),()=>toast('Selecione e copie o código'))}
 else if('paid' in D){confirmBooking(true)}
 else if('ics' in D){ics(S.done)}
 else if('new' in D){Object.assign(S,{step:1,svc:null,pro:null,date:null,t:null,done:null,pix:null});render()}});
flow.addEventListener('submit',e=>{e.preventDefault();const nm=$('#nm'),ph=$('#ph');S.name=nm.value.trim();S.phone=ph.value;let bad=0;
 const chk=(el,er,ok,msg)=>{el.setAttribute('aria-invalid',!ok);$(er).textContent=ok?'':msg;if(!ok&&!bad)el.focus();bad+=!ok};
 chk(nm,'#e1',S.name.split(/\s+/).filter(Boolean).length>=2,'Informe nome e sobrenome.');chk(ph,'#e2',validPhone(S.phone),'Use DDD e número com 9 dígitos, ex.: (41) 90000-0000.');if(bad)return;
 if(S.pay==='clin'){confirmBooking(false);return}
 S.pix=pixPayload(sinal(),'SRN'+Date.now().toString(36).toUpperCase().slice(-8));go(4)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-cancel]');if(!b)return;save(load().map(x=>x.id===b.dataset.cancel?{...x,st:'cancelado'}:x));if(S.done&&S.done.id===b.dataset.cancel)S.done=null;toast('Agendamento cancelado');render()});

/* ===== Páginas estáticas ===== */
$('#svcGrid').innerHTML=SVC.map(s=>`<article class="card"><span class="tag">${s.tag}</span><h3 class="t">${s.n}</h3><p>${s.d}</p><div class="meta"><span>${s.min} min</span><b>${brl(s.p)}</b></div><button class="btn ghost" data-pick="${s.id}">Agendar este</button></article>`).join('');
$('#svcGrid').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b)return;S.svc=b.dataset.pick;S.pro=S.date=S.t=null;S.done=null;clearInterval(tick);S.step=2;render();$('#agendar').scrollIntoView({behavior:'smooth'})});
$('#team').innerHTML=Object.values(PRO).map(p=>`<div class="pro"><div class="av" style="background:${p.c}" aria-hidden="true">${p.n[0]}</div><div><b>${p.n}</b><small>${p.r}</small><p>${p.b}</p></div></div>`).join('');
const nf=nextFree();if(nf)$('#nextSlot').textContent=`${nf.day===0?'hoje':nf.day===1?'amanhã':DIAS[nf.date.getDay()]}, ${hm(nf.t)}`;
const w0=waLink('Olá! Vi o site da Serena Estética e queria tirar uma dúvida.');$('#fab').href=w0;$('#waFoot').href=w0;
render();
window.__serena={qrMatrix,pixPayload,crc16,slotsFor};
})();
