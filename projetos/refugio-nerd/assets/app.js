(function(){
"use strict";
var D=window.RN,B=document.body,R=B.dataset.root,PG=B.dataset.page,$=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return[].slice.call((c||document).querySelectorAll(s))};
var brl=function(v){return "R$ "+v.toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g,".")};
var norm=function(s){return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")};
var byId={};D.produtos.forEach(function(p){byId[p.id]=p});
var imgOf=function(id){return R+"assets/img/p/"+id+"-f.svg"};
function lsGet(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
/* sacola */
var cart=lsGet("rn-sacola",[]).filter(function(i){return byId[i.id]});
function save(){lsSet("rn-sacola",cart);badge()}
function count(){return cart.reduce(function(a,i){return a+i.q},0)}
function badge(){var n=count(),b=$("[data-bag]");if(!b)return;var s=$(".n",b);s.textContent=n||"";s.dataset.n=n;b.setAttribute("aria-label","Sacola, "+n+(n==1?" item":" itens"))}
function add(id,q){q=q||1;var i=cart.filter(function(x){return x.id==id})[0];if(i)i.q=Math.min(20,i.q+q);else cart.push({id:id,q:q});save();toast(byId[id].titulo+" na sacola",R+"sacola/","Ver sacola")}
var tt;function toast(m,href,l){var t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");B.appendChild(t)}
t.innerHTML="";var s=document.createElement("span");s.textContent=m;t.appendChild(s);if(href){var a=document.createElement("a");a.href=href;a.textContent=l;t.appendChild(a)}
requestAnimationFrame(function(){t.classList.add("on")});clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},3800)}
document.addEventListener("click",function(e){var b=e.target.closest("[data-add]");if(!b)return;var q=1;if(b.hasAttribute("data-qty")){var o=$("#qv");q=o?+o.textContent:1}add(b.dataset.add,q)});
badge();
/* menu, busca, veu */
var nav=$("#nav"),bur=$(".burger"),veil=$("[data-veil]");
function menu(o){nav.classList.toggle("open",o);bur.setAttribute("aria-expanded",o);veil.classList.toggle("on",o);bur.setAttribute("aria-label",o?"Fechar menu":"Abrir menu")}
bur.addEventListener("click",function(){menu(!nav.classList.contains("open"))});
veil.addEventListener("click",function(){menu(false);var f=$("#filtros");if(f)fil(false)});
document.addEventListener("keydown",function(e){if(e.key=="Escape"){menu(false);var f=$("#filtros");if(f)fil(false);sug.hidden=true}});
var sf=$(".sform"),sb=$(".sbtn"),q=$("#q"),sug=$("#sug");
sb.addEventListener("click",function(){var o=!sf.classList.contains("open");sf.classList.toggle("open",o);sb.setAttribute("aria-expanded",o);if(o)q.focus()});
function match(t){t=norm(t).trim();if(!t)return[];return D.produtos.filter(function(p){return norm(p.titulo+" "+p.uni+" "+D.cats[p.cat]).indexOf(t)>-1})}
var act=-1;
q.addEventListener("input",function(){var r=match(q.value).slice(0,6);act=-1;if(!q.value.trim()){sug.hidden=true;return}
sug.innerHTML=r.length?r.map(function(p,i){return '<li role="presentation"><a role="option" href="'+R+'produto/'+p.id+'/"><img src="'+imgOf(p.id)+'" alt="" width="34" height="45"><span>'+p.titulo+'<small>'+brl(p.preco)+" · "+D.cats[p.cat]+"</small></span></a></li>"}).join(""):'<li class="none">Nada encontrado. Tente "mangá" ou "dado".</li>';sug.hidden=false});
q.addEventListener("keydown",function(e){var l=$$("a",sug);if(!l.length||sug.hidden)return;if(e.key=="ArrowDown"||e.key=="ArrowUp"){e.preventDefault();act=(act+(e.key=="ArrowDown"?1:-1)+l.length)%l.length;l.forEach(function(a,i){a.setAttribute("aria-selected",i==act)});}
else if(e.key=="Enter"&&act>-1){e.preventDefault();location.href=l[act].href}});
document.addEventListener("click",function(e){if(!e.target.closest(".sform"))sug.hidden=true});
/* reduzir movimento */
var cb=$(".calmo-b"),H=document.documentElement;cb.setAttribute("aria-pressed",H.classList.contains("calmo"));
cb.addEventListener("click",function(){var o=!H.classList.contains("calmo");H.classList.toggle("calmo",o);cb.setAttribute("aria-pressed",o);try{localStorage.setItem("rn-calmo",o?"1":"0")}catch(e){}});
/* reveal */
if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{threshold:.12});$$(".reveal").forEach(function(x){io.observe(x)})}else $$(".reveal").forEach(function(x){x.classList.add("in")});
/* ics */
function ics(d,h,t){var p=function(n){return String(n).padStart(2,"0")},s=d.replace(/-/g,"")+"T"+h.replace(":","")+"00",hh=+h.slice(0,2)+2,e=d.replace(/-/g,"")+"T"+p(hh)+h.slice(3)+"00";
var c=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Refugio Nerd//PT","BEGIN:VEVENT","UID:"+s+"@refugionerd.example","DTSTAMP:20261101T000000Z","DTSTART:"+s,"DTEND:"+e,"SUMMARY:"+t.replace(/[,;]/g," "),"LOCATION:Refúgio Nerd, Rua do Gibi 42 (fictício)","END:VEVENT","END:VCALENDAR"].join("\r\n");
var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([c],{type:"text/calendar"}));a.download="evento-refugio-nerd.ics";a.click()}
document.addEventListener("click",function(e){var b=e.target.closest("[data-ics]");if(!b)return;var v=b.dataset.ics.split("|");ics(v[0],v[1],v[2])});
/* eventos: passados */
var today=new Date().toISOString().slice(0,10);
$$(".ev[data-date]").forEach(function(x){if(x.dataset.date<today){x.classList.add("past");var c=$(".chip",x);c.textContent+=" · encerrado";var a=$(".acts a",x);if(a)a.remove()}});
$$("[data-ef]").forEach(function(b){b.addEventListener("click",function(){$$("[data-ef]").forEach(function(o){o.setAttribute("aria-pressed",o==b)});$$("#evs .ev").forEach(function(x){x.hidden=b.dataset.ef!="Todos"&&x.dataset.cat!=b.dataset.ef})})});
/* pagina de produto */
$$("[data-g]").forEach(function(b){b.addEventListener("click",function(){$("#gm").src=b.dataset.g;$$("[data-g]").forEach(function(o){o.setAttribute("aria-current",o==b)})})});
$$("[data-q]").forEach(function(b){b.addEventListener("click",function(){var o=$("#qv"),v=Math.max(1,Math.min(20,+o.textContent+ +b.dataset.q));o.textContent=v})});
$$("[data-avise]").forEach(function(f){f.addEventListener("submit",function(e){e.preventDefault();var i=$("input",f),v=i.value.trim();
if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){i.setCustomValidity("Digite um e-mail válido");i.reportValidity();i.addEventListener("input",function(){i.setCustomValidity("")},{once:true});return}
var l=lsGet("rn-avise",[]);l.push({id:f.dataset.avise,email:v});lsSet("rn-avise",l);var ok=document.createElement("p");ok.className="ok";ok.setAttribute("role","status");ok.textContent="Combinado. Avisamos neste e-mail quando chegar.";f.replaceWith(ok)})});
/* loja */
if($("#lista")){
var L=$("#lista"),cards=$$(".pc",L),st={cat:[],uni:[],max:350,novo:0,pre:0,estq:0,q:"",ord:"rel"},sp=new URLSearchParams(location.search);
if(sp.get("cat"))st.cat=sp.get("cat").split(",");if(sp.get("uni"))st.uni=sp.get("uni").split(",");if(sp.get("q"))st.q=sp.get("q");st.novo=+sp.get("novo")||0;st.pre=+sp.get("pre")||0;if(sp.get("max"))st.max=+sp.get("max");st.estq=+sp.get("estq")||0;st.ord=sp.get("ord")||"rel";
var order=D.produtos.map(function(p){return p.id});
function ui(){$$("[name=cat]").forEach(function(c){c.checked=st.cat.indexOf(c.value)>-1});$$("[name=uni]").forEach(function(c){c.checked=st.uni.indexOf(c.value)>-1});$("#pmax").value=st.max;$("#fnovo").checked=!!st.novo;$("#fpre").checked=!!st.pre;$("#festq").checked=!!st.estq;$("#fq").value=st.q;$("#ord").value=st.ord}
function ok(p,skip){var t=norm(p.titulo+" "+p.uni+" "+D.cats[p.cat]);
return(skip=="cat"||!st.cat.length||st.cat.indexOf(p.cat)>-1)&&(skip=="uni"||!st.uni.length||st.uni.indexOf(p.uni)>-1)&&p.preco<=st.max&&(!st.novo||p.novo)&&(!st.pre||p.status=="prevenda")&&(!st.estq||p.status=="estoque")&&(!st.q||t.indexOf(norm(st.q))>-1)}
function run(){var vis=D.produtos.filter(function(p){return ok(p)});
var ord={rel:function(a,b){return order.indexOf(a.id)-order.indexOf(b.id)},menor:function(a,b){return a.preco-b.preco},maior:function(a,b){return b.preco-a.preco},az:function(a,b){return a.titulo.localeCompare(b.titulo,"pt")}}[st.ord];vis.sort(ord);
var ids=vis.map(function(p){return p.id}),m={};cards.forEach(function(c){var id=c.querySelector("a[href]").getAttribute("href").split("/").filter(Boolean).slice(-1)[0];m[id]=c;c.hidden=ids.indexOf(id)<0});
vis.forEach(function(p){L.appendChild(m[p.id])});
$$("[data-total]").forEach(function(x){x.textContent=vis.length});$("#vazio").hidden=vis.length>0;L.hidden=!vis.length;$("#pv").textContent="R$ "+st.max+(st.max>=350?"+":"");
$$("[data-c]").forEach(function(s){var k=s.dataset.c.split(":"),n=D.produtos.filter(function(p){return ok(p,k[0])&&(k[0]=="cat"?p.cat==k[1]:p.uni==k[1])}).length;s.textContent=n});
var ch=[];st.cat.forEach(function(c){ch.push(["cat",c,D.cats[c]])});st.uni.forEach(function(c){ch.push(["uni",c,c])});if(st.novo)ch.push(["novo",0,"Lançamentos"]);if(st.pre)ch.push(["pre",0,"Pré-venda"]);if(st.estq)ch.push(["estq",0,"Em estoque"]);if(st.max<350)ch.push(["max",0,"Até R$ "+st.max]);if(st.q)ch.push(["q",0,"“"+st.q+"”"]);
var A=$("#act");A.innerHTML="";ch.forEach(function(c){var b=document.createElement("button");b.type="button";b.textContent=c[2];b.setAttribute("aria-label","Remover filtro "+c[2]);b.onclick=function(){if(c[0]=="cat"||c[0]=="uni")st[c[0]].splice(st[c[0]].indexOf(c[1]),1);else if(c[0]=="max")st.max=350;else if(c[0]=="q")st.q="";else st[c[0]]=0;ui();sync()};A.appendChild(b)});
var u=new URLSearchParams();if(st.cat.length)u.set("cat",st.cat.join(","));if(st.uni.length)u.set("uni",st.uni.join(","));if(st.novo)u.set("novo",1);if(st.pre)u.set("pre",1);if(st.estq)u.set("estq",1);if(st.max<350)u.set("max",st.max);if(st.q)u.set("q",st.q);if(st.ord!="rel")u.set("ord",st.ord);
history.replaceState(null,"",location.pathname+(u.toString()?"?"+u:""))}
function sync(){run()}
$$("[name=cat],[name=uni]").forEach(function(c){c.addEventListener("change",function(){var k=c.name;st[k]=$$("[name="+k+"]:checked").map(function(x){return x.value});run()})});
$("#pmax").addEventListener("input",function(e){st.max=+e.target.value;run()});
[["#fnovo","novo"],["#fpre","pre"],["#festq","estq"]].forEach(function(a){$(a[0]).addEventListener("change",function(e){st[a[1]]=e.target.checked?1:0;run()})});
$("#fq").addEventListener("input",function(e){st.q=e.target.value;run()});$("#ord").addEventListener("change",function(e){st.ord=e.target.value;run()});
$$("[data-limpar]").forEach(function(b){b.addEventListener("click",function(){st={cat:[],uni:[],max:350,novo:0,pre:0,estq:0,q:"",ord:"rel"};ui();run()})});
function fil(o){var f=$("#filtros");f.classList.toggle("open",o);veil.classList.toggle("on",o);var b=$("[data-fopen]");b.setAttribute("aria-expanded",o)}
$("[data-fopen]").addEventListener("click",function(){fil(true)});$$("[data-fclose]").forEach(function(b){b.addEventListener("click",function(){fil(false)})});
window.fil=fil;ui();run()}
/* sacola */
if($("#itens")){
var Z={"0":["Sudeste",18.9,5,32.9,2],"1":["Sudeste",18.9,5,32.9,2],"2":["Sudeste",18.9,5,32.9,2],"3":["Sudeste",22.9,6,36.9,3],"4":["Nordeste",29.9,8,48.9,4],"5":["Nordeste",29.9,8,48.9,4],"6":["Norte",39.9,11,62.9,6],"7":["Centro-Oeste",27.9,6,44.9,3],"8":["Sul",24.9,6,39.9,3],"9":["Sul",24.9,6,39.9,3]};
var FREE=250,ship=null,pick="eco",cepv="";
function sub(){return cart.reduce(function(a,i){return a+byId[i.id].preco*i.q},0)}
function draw(){var el=$("#itens");el.innerHTML="";
if(!cart.length){el.innerHTML='<div class="empty"><h3>A sacola está vazia</h3><p>Escolha um gibi, uma figura ou um jogo e ele aparece aqui.</p><a class="btn" href="'+R+'loja/">Ver a loja</a></div>';$("#resumo").hidden=true;return}
$("#resumo").hidden=false;
cart.forEach(function(i){var p=byId[i.id],d=document.createElement("div");d.className="line";
d.innerHTML='<a href="'+R+'produto/'+p.id+'/"><img src="'+imgOf(p.id)+'" alt="" width="84" height="112"></a><div><span class="u">'+D.cats[p.cat]+(p.status=="prevenda"?" · pré-venda":"")+'</span><h3><a href="'+R+'produto/'+p.id+'/" style="text-decoration:none">'+p.titulo+'</a></h3><div class="qty" role="group" aria-label="Quantidade de '+p.titulo+'"><button type="button" aria-label="Menos um">−</button><output>'+i.q+'</output><button type="button" aria-label="Mais um">+</button></div> <button class="rm" type="button">Remover</button></div><div class="lt">'+brl(p.preco*i.q)+'</div>';
var b=$$("button",d);b[0].onclick=function(){i.q=Math.max(1,i.q-1);save();draw();tot()};b[1].onclick=function(){i.q=Math.min(20,i.q+1);save();draw();tot()};b[2].onclick=function(){cart.splice(cart.indexOf(i),1);save();draw();tot()};el.appendChild(d)});tot()}
function opts(){var o=$("#opts");o.innerHTML="";if(!ship){return}var s=sub(),g=s>=FREE,L=[["eco","Econômico",g?0:ship[1],ship[2]+" dias úteis"],["exp","Expresso",ship[3],ship[4]+" dias úteis"],["ret","Retirar na loja",0,"Pronto em 1 dia útil"]];
L.forEach(function(x){var l=document.createElement("label");l.className="opt";l.innerHTML='<input type="radio" name="fr" value="'+x[0]+'"'+(pick==x[0]?" checked":"")+'><div>'+x[1]+"<small>"+x[3]+"</small></div><span>"+(x[2]?brl(x[2]):"Grátis")+"</span>";l.querySelector("input").onchange=function(){pick=x[0];tot()};o.appendChild(l)})}
function fv(){if(!ship)return null;var g=sub()>=FREE;return pick=="eco"?(g?0:ship[1]):pick=="exp"?ship[3]:0}
function tot(){var s=sub(),pix=$("[name=pg]:checked").value=="pix",d=pix?s*.05:0,f=fv(),t=s-d+(f||0);
var fr=$("#free"),pct=Math.min(100,s/FREE*100);fr.innerHTML=(s>=FREE?"Você ganhou frete econômico grátis.":"Faltam "+brl(FREE-s)+" para o frete econômico grátis.")+'<i><b style="width:'+pct+'%"></b></i>';
opts();
$("#tot").innerHTML="<dt>Itens ("+count()+")</dt><dd>"+brl(s)+"</dd>"+(pix?"<dt>Desconto Pix (5%)</dt><dd>− "+brl(d)+"</dd>":"")+"<dt>Frete</dt><dd>"+(f==null?"informe o CEP":(f?brl(f):"Grátis"))+'</dd><dt class="tot">Total</dt><dd class="tot">'+brl(t)+"</dd>";
var nm=$("#nome").value.trim(),L=["Oi, Refúgio Nerd! Quero fechar este pedido:",""];cart.forEach(function(i){var p=byId[i.id];L.push(i.q+"x "+p.titulo+" - "+brl(p.preco*i.q)+(p.status=="prevenda"?" (pré-venda)":""))});
L.push("","Subtotal: "+brl(s));if(pix)L.push("Pix (-5%): -"+brl(d));L.push("Frete: "+(f==null?"a calcular":(pick=="ret"?"retirada na loja":(pick=="eco"?"econômico":"expresso")+" (CEP "+cepv+") "+(f?brl(f):"grátis"))),"Pagamento: "+(pix?"Pix":"cartão em até 3x"),"Total: "+brl(t));if(nm)L.push("","Nome: "+nm);
$("#zap").href="https://wa.me/"+D.wa+"?text="+encodeURIComponent(L.join("\n"))}
function calc(){var v=$("#cep").value.replace(/\D/g,""),e=$("#cepe");if(v.length!=8){e.textContent="Digite um CEP com 8 números.";ship=null;opts();tot();return}e.textContent="";cepv=v.slice(0,5)+"-"+v.slice(5);ship=Z[v[0]];lsSet("rn-cep",cepv);tot()}
$("#cepb").onclick=calc;$("#cep").addEventListener("keydown",function(e){if(e.key=="Enter")calc()});$("#cep").addEventListener("input",function(e){var v=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=v.length>5?v.slice(0,5)+"-"+v.slice(5):v});
$$("[name=pg]").forEach(function(r){r.onchange=tot});$("#nome").addEventListener("input",tot);
var c0=lsGet("rn-cep","");if(c0){$("#cep").value=c0;calc()}draw()}
/* clube */
if($$("[data-plano]").length){
var per=1;$$("[data-per]").forEach(function(b){b.addEventListener("click",function(){per=+b.dataset.per;$$("[data-per]").forEach(function(o){o.setAttribute("aria-pressed",o==b)});
$$("[data-pm]").forEach(function(s){s.textContent=brl(+s.dataset.pm*per)});$$("[data-pn]").forEach(function(s){s.textContent=per<1?"cobrado uma vez ao ano, com 2 meses grátis":"cobrado todo mês"})})});
$$("[data-plano]").forEach(function(b){b.addEventListener("click",function(){var t=$$("#tastes input:checked").map(function(x){return x.value}),pr=+b.dataset.preco*per;
var m="Oi, Refúgio Nerd! Quero assinar o plano "+b.dataset.plano+" do Clube ("+(per<1?"anual":"mensal")+", "+brl(pr)+"/mês). Gostos: "+(t.length?t.join(", "):"ainda não escolhi")+".";window.open("https://wa.me/"+D.wa+"?text="+encodeURIComponent(m),"_blank","noopener")})})}
})();
