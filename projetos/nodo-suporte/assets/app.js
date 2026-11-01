(function(){
'use strict';
var D=document,H=D.documentElement,L=H.lang.slice(0,2),PT=L==='pt';
var $=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
var T=function(p,e){return PT?p:e};
H.classList.add('js');
var st={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var money=function(n){return 'R$ '+n.toLocaleString('pt-BR')};

/* idioma: lembra a escolha */
var pref=st.get('nodo-lang'),alt=$('.lang a:not([aria-current])');
if(pref&&pref!==L&&alt&&alt.hreflang===pref&&!/[?&]fixo=1/.test(location.search))location.replace(alt.href);
$$('.lang a').forEach(function(a){a.addEventListener('click',function(){st.set('nodo-lang',a.hreflang)})});

/* reduzir movimento */
var rm=$('#rm'),osRm=matchMedia('(prefers-reduced-motion:reduce)').matches;
function setRm(on){H.classList.toggle('noanim',on);if(rm)rm.setAttribute('aria-pressed',on)}
if(rm){setRm(osRm||st.get('nodo-rm')==='1');rm.addEventListener('click',function(){var on=!H.classList.contains('noanim');st.set('nodo-rm',on?'1':'0');setRm(on);$$('.rv').forEach(function(e){e.classList.add('in')})})}

/* menu */
var bg=$('.burger'),nav=$('#nav');
if(bg){
 var close=function(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false')};
 bg.addEventListener('click',function(){bg.setAttribute('aria-expanded',nav.classList.toggle('open'))});
 D.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){close();bg.focus()}});
 matchMedia('(min-width:981px)').addEventListener('change',close);
}

/* barra de progresso */
var pb=$('.prog'),tk=false;
if(pb)addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(function(){tk=false;var m=H.scrollHeight-innerHeight;pb.style.width=(m>0?Math.min(100,scrollY/m*100):0)+'%'})}},{passive:true});

/* aparecer ao rolar */
var rv=$$('.rv,.bar');
if('IntersectionObserver' in window&&!H.classList.contains('noanim')){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
 rv.forEach(function(e){io.observe(e)});
}else rv.forEach(function(e){e.classList.add('in')});

/* plantão: aberto agora? (horário de Brasília) */
var sp=$('#status');
if(sp){
 try{
  var f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'numeric',hour12:false}).formatToParts(new Date()),w,h;
  f.forEach(function(p){if(p.type==='weekday')w=p.value;if(p.type==='hour')h=+p.value%24});
  var on=['Mon','Tue','Wed','Thu','Fri'].indexOf(w)>-1&&h>=8&&h<18;
  sp.classList.toggle('on',on);
  sp.lastChild.textContent=on?T('Plantão aberto agora, resposta em minutos','Support open now, replies in minutes'):T('Fora do horário. Chamado urgente fica na fila do plantão das 8h','Closed now. Urgent tickets wait for the 8am shift');
 }catch(e){}
}

/* antes e depois */
$$('.ba').forEach(function(b){var i=$('input',b);i.addEventListener('input',function(){b.style.setProperty('--p',i.value+'%');i.setAttribute('aria-valuetext',i.value+'%')})});

/* abas */
$$('[role=tablist]').forEach(function(tl){
 var tabs=$$('[role=tab]',tl);
 function sel(t,fc){tabs.forEach(function(x){var o=x===t;x.setAttribute('aria-selected',o);x.tabIndex=o?0:-1;var p=D.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!o});if(fc)t.focus()}
 tabs.forEach(function(t,i){
  t.addEventListener('click',function(){sel(t)});
  t.addEventListener('keydown',function(e){var k=e.key,n=null;if(k==='ArrowRight'||k==='ArrowDown')n=tabs[(i+1)%tabs.length];else if(k==='ArrowLeft'||k==='ArrowUp')n=tabs[(i-1+tabs.length)%tabs.length];else if(k==='Home')n=tabs[0];else if(k==='End')n=tabs[tabs.length-1];if(n){e.preventDefault();sel(n,true)}});
 });
 var h=location.hash.slice(1),first=h&&tabs.filter(function(t){return t.getAttribute('aria-controls')===h})[0];
 sel(first||tabs[0]);
});

/* calculadora de plano */
var cf=$('#calc');
if(cf){
 var P={base:190,pc:42,srv:260,bk:{0:0,200:60,1000:140,5000:390},m365:14,edr:18},pcs=$('#pcs'),us=$('#us'),srv=$('#srv'),edr=$('#edr');
 var PLANS=[T('Essencial','Essential'),T('Equilibrado','Balanced'),'Total'],SLA=[['1 h','4 h'],['30 min','2 h'],['15 min','1 h']];
 var calc=function(){
  var n=+pcs.value,u=+us.value,b=+($('input[name=bk]:checked',cf).value);
  var it=[[T('Base de monitoramento','Monitoring base'),P.base],[n+' '+T('computadores','computers'),P.pc*n]];
  if(srv.checked)it.push([T('Servidor','Server'),P.srv]);
  if(b)it.push([T('Backup na nuvem','Cloud backup')+' '+(b>=1000?b/1000+' TB':b+' GB'),P.bk[b]]);
  if(u)it.push([u+' '+T('contas Microsoft 365','Microsoft 365 accounts'),P.m365*u]);
  if(edr.checked)it.push([T('Antivírus gerenciado','Managed antivirus'),P.edr*n]);
  var lo=it.reduce(function(s,x){return s+x[1]},0),hi=Math.round(lo*1.12/10)*10;
  var pl=n<=8?0:n<=20?1:2;if(srv.checked&&pl===0)pl=1;
  $('#o-pcs').textContent=n;$('#o-us').textContent=u;
  $('#r-val').innerHTML=money(lo)+' <small>'+T('a','to')+'</small> '+money(hi).replace('R$ ','')+' <small>'+T('/mês','/mo')+'</small>';
  $('#r-lines').innerHTML=it.map(function(x){return '<li><span>'+x[0]+'</span><b>'+money(x[1])+'</b></li>'}).join('');
  $('#r-plan').textContent=PLANS[pl];
  $('#r-sla').textContent=T('Chamado urgente em até ','Urgent ticket within ')+SLA[pl][0]+T(', normal em até ',', normal within ')+SLA[pl][1]+T(' úteis.',' business hours.');
  $('#r-cta').href=(PT?'../contato/':'../contact/')+'?origem=calculadora&pcs='+n+'&faixa='+lo+'-'+hi;
 };
 cf.addEventListener('input',calc);calc();
}

/* check-up de segurança */
var qz=$('#quiz');
if(qz){
 var Q=PT?[
  ['Backup','Os arquivos da empresa têm cópia fora do computador e fora do escritório?','Se o PC queimar ou for sequestrado, o que você perde?','Ative backup automático em nuvem e teste a restauração todo trimestre.'],
  ['Teste de restauração','Alguém já restaurou um backup de verdade para conferir?','Backup que nunca foi aberto é uma aposta.','Agende um teste de restauração e anote o tempo que levou.'],
  ['Verificação em 2 etapas','E-mail e sistemas usam senha mais código no celular?','Senha vazada sozinha já basta para invadir.','Ligue a verificação em 2 etapas no e-mail primeiro, depois nos demais sistemas.'],
  ['Atualizações','Windows e programas se atualizam sozinhos ou por rotina?','Quase todo ataque usa falha que já tinha correção.','Centralize as atualizações e defina um dia fixo do mês para reiniciar os PCs.'],
  ['Antivírus','Todos os computadores têm antivírus ativo e alguém vê os alertas?','Antivírus instalado e ignorado não protege.','Use proteção gerenciada, com alerta que chega a uma pessoa responsável.'],
  ['Senhas','A equipe usa um gerenciador de senhas, sem planilha ou papel?','Senha colada no monitor ou numa planilha é senha pública.','Adote um gerenciador de senhas para a equipe e troque as que foram compartilhadas.'],
  ['Saída de pessoas','Quando alguém sai, os acessos são cortados no mesmo dia?','Ex-funcionário com acesso é risco e problema na LGPD.','Faça uma lista de desligamento: e-mail, sistemas, Wi-Fi, celular e arquivos.'],
  ['Wi-Fi e rede','Visitantes usam uma rede separada da rede da empresa?','Quem conecta no Wi-Fi da empresa enxerga os computadores dela.','Crie uma rede de visitantes isolada e troque a senha da rede principal.']
 ]:[
  ['Backup','Do company files have a copy outside the computer and outside the office?','If a PC burns or gets hijacked, what do you lose?','Turn on automatic cloud backup and test a restore every quarter.'],
  ['Restore test','Has anyone actually restored a backup to check it?','A backup nobody has opened is a bet.','Schedule a restore test and write down how long it took.'],
  ['Two-step sign-in','Do email and systems need a password plus a phone code?','A leaked password alone is enough to get in.','Turn on two-step sign-in for email first, then for other systems.'],
  ['Updates','Do Windows and apps update on their own or on a routine?','Most attacks use flaws that already had a fix.','Centralize updates and set a fixed day each month to restart PCs.'],
  ['Antivirus','Is antivirus active on every computer and does someone read the alerts?','Antivirus that is installed and ignored does not protect.','Use managed protection with alerts that reach one responsible person.'],
  ['Passwords','Does the team use a password manager, with no sheets or paper?','A password on a monitor or spreadsheet is a public password.','Adopt a team password manager and change any shared passwords.'],
  ['Leavers','When someone leaves, is access cut the same day?','A former employee with access is a risk and a data-law problem.','Keep an offboarding list: email, systems, Wi-Fi, phone and files.'],
  ['Wi-Fi and network','Do visitors use a network separate from the company one?','Anyone on the company Wi-Fi can see its computers.','Create an isolated guest network and rotate the main network password.']
 ];
 var A=[[T('Sim',"Yes"),2],[T('Em parte','Partly'),1],[T('Não','No'),0],[T('Não sei','Not sure'),0]];
 var ans=[],qi=0,body=$('#qbody'),pg=$('#qprog i'),pn=$('#qpn');
 var show=function(){
  var q=Q[qi];pg.style.width=(qi/Q.length*100)+'%';
  body.innerHTML='<p class="qn">'+T('Pergunta ','Question ')+(qi+1)+' / '+Q.length+'</p><h2 class="qh" tabindex="-1">'+q[1]+'</h2><p class="qw">'+q[2]+'</p><div class="opts">'+A.map(function(a,i){return '<button type="button" data-i="'+i+'">'+a[0]+'</button>'}).join('')+'</div>'+(qi?'<p style="margin-top:18px"><button type="button" class="btn btn-line" id="qback">'+T('Voltar','Back')+'</button></p>':'');
  $('.qh',body).focus({preventScroll:true});
  $$('.opts button',body).forEach(function(b){b.addEventListener('click',function(){ans[qi]=+b.dataset.i;qi++;qi<Q.length?show():done()})});
  var bk=$('#qback');if(bk)bk.addEventListener('click',function(){qi--;show()});
 };
 var done=function(){
  pg.style.width='100%';
  var pts=ans.reduce(function(s,i){return s+A[i][1]},0),sc=Math.round(pts/(Q.length*2)*100);
  var lv=sc>=90?T('Sólido','Solid'):sc>=70?T('Bom, com ajustes','Good, with tweaks'):sc>=40?T('Atenção','Needs attention'):T('Exposto','Exposed');
  var gaps=Q.map(function(q,i){return {q:q,s:A[ans[i]][1]}}).filter(function(g){return g.s<2}).sort(function(a,b){return a.s-b.s}).slice(0,4);
  var col=sc>=70?'var(--ok)':sc>=40?'var(--warn)':'var(--bad)';
  body.innerHTML='<div class="gauge"><div class="ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="85"/><circle class="fg" cx="100" cy="100" r="85" style="stroke:'+col+'"/></svg><b><span>'+sc+'<small>/100</small></span></b></div><div><p class="eyebrow">'+T('Resultado do check-up','Check-up result')+'</p><h2 class="qh" tabindex="-1">'+lv+'</h2><p class="qw">'+(gaps.length?T('Estes são os pontos mais urgentes, do mais grave ao menos grave.','These are the most urgent gaps, worst first.'):T('Nenhum ponto crítico. Vale repetir o teste a cada 6 meses.','No critical gaps. Worth repeating every 6 months.'))+'</p></div></div>'+
  (gaps.length?'<ul class="gaps">'+gaps.map(function(g){return '<li class="'+(g.s?'':'zero')+'"><b>'+g.q[0]+'</b><span>'+g.q[3]+'</span></li>'}).join('')+'</ul>':'')+
  '<div class="cta"><a class="btn btn-cy" href="'+(PT?'../contato/':'../contact/')+'?origem=checkup&nota='+sc+'">'+T('Pedir diagnóstico com esta nota','Request an assessment with this score')+'</a><button type="button" class="btn btn-line" id="qcp">'+T('Copiar resultado','Copy result')+'</button><button type="button" class="btn btn-line" id="qrs">'+T('Refazer','Retake')+'</button></div><p class="note" id="qmsg" role="status" style="margin-top:12px"></p><p class="note" style="margin-top:6px">'+T('Nada é enviado: as respostas ficam só neste navegador.','Nothing is sent: answers stay in this browser.')+'</p>';
  $('.qh',body).focus({preventScroll:true});
  requestAnimationFrame(function(){requestAnimationFrame(function(){$('.fg',body).style.strokeDashoffset=534*(1-sc/100)})});
  $('#qrs').addEventListener('click',function(){ans=[];qi=0;show()});
  $('#qcp').addEventListener('click',function(){
   var txt='Nodo Suporte · '+T('Check-up de segurança','Security check-up')+': '+sc+'/100 ('+lv+')\n'+gaps.map(function(g){return '- '+g.q[0]+': '+g.q[3]}).join('\n');
   var m=$('#qmsg');(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){m.textContent=T('Copiado.','Copied.')},function(){m.textContent=T('Não deu para copiar. Selecione o texto e copie à mão.','Could not copy. Select the text and copy by hand.')});
  });
 };
 show();
}

/* formulário de chamado */
var fm=$('#ticket');
if(fm){
 var qs=new URLSearchParams(location.search),msg=$('#msg'),o=qs.get('origem');
 if(o==='checkup'&&qs.get('nota'))msg.value=T('Fiz o check-up de segurança e tirei ','I took the security check-up and scored ')+qs.get('nota')+'/100. '+T('Quero um diagnóstico.','I would like an assessment.');
 if(o==='calculadora'&&qs.get('pcs'))msg.value=T('Simulei ','I simulated ')+qs.get('pcs')+T(' computadores, faixa de R$ ',' computers, range R$ ')+(qs.get('faixa')||'').replace('-',' - ')+T('/mês. Quero um diagnóstico.','/mo. I would like an assessment.');
 var kind=$('#kind'),sev=$('#sevbox'),sevs=$$('input[name=sev]',fm),plan=$('#plan');
 var sync=function(){var t=kind.value==='chamado';sev.hidden=!t;plan.closest('div').hidden=!t};
 kind.addEventListener('change',sync);sync();
 var D1=T('1 dia útil','1 business day'),SL={Essencial:['1 h','4 h',D1],Equilibrado:['30 min','2 h',D1],Total:['15 min','1 h','4 h']};
 fm.addEventListener('submit',function(e){
  e.preventDefault();var bad=null;
  [$('#nome'),$('#mail'),msg].forEach(function(f){var v=f.value.trim(),ok=f.id==='mail'?/^\S+@\S+\.\S+$/.test(v):v.length>1;f.setAttribute('aria-invalid',!ok);if(!ok&&!bad)bad=f});
  if(bad){bad.focus();return}
  var ch=kind.value==='chamado',d=new Date(),n='NS-'+String(d.getFullYear()).slice(2)+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2)+'-'+(1000+Math.floor(Math.random()*9000));
  var s=+($('input[name=sev]:checked',fm)||{value:1}).value,p=plan.value,sla=SL[p]?SL[p][s]:T('retorno em 1 dia útil','reply within 1 business day');
  var r=$('#done');r.hidden=false;
  r.innerHTML='<p class="tk">'+n+'</p><p style="margin:8px 0">'+(ch?T('Chamado registrado (demonstração). Prazo do primeiro retorno no seu plano: ','Ticket logged (demo). First reply time on your plan: ')+'<b>'+sla+'</b>.':T('Pedido de diagnóstico registrado (demonstração). Um técnico responde em 1 dia útil.','Assessment request logged (demo). A technician replies within 1 business day.'))+'</p><p class="note">'+T('Este é um site de portfólio: nada foi enviado e nenhum dado foi guardado.','This is a portfolio site: nothing was sent and no data was stored.')+'</p>';
  r.setAttribute('tabindex','-1');r.focus();fm.hidden=true;
 });
}
})();
