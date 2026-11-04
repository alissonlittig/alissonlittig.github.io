const Q=[
["Complete: She ___ coffee every morning.",["drink","drinks","drinking"],1],
["Escolha a frase correta:",["I am agree with you","I agree with you","I agrees with you"],1],
["Yesterday we ___ to the beach.",["go","goed","went"],2],
["I ___ here since 2020.",["live","have lived","am living"],1],
["If I ___ more time, I would travel more.",["have","had","will have"],1],
["The report ___ by the team before the deadline.",["was finished","finished","has finish"],0],
["Qual opção é a mais natural?",["I look forward to meet you","I look forward to meeting you","I look forward meeting you"],1],
["Hardly ___ the door when the phone rang.",["I had opened","had I opened","I opened"],1]];
const L=[["A1","Iniciante","Comece do zero com a Trilha Base."],["A2","Básico","Trilha Base: ganhe confiança para conversar."],["B1","Intermediário","Trilha Conversação: fale sem travar."],["B2","Intermediário superior","Trilha Carreira: reuniões e e-mails."],["C1","Avançado","Trilha Fluência: nuances e precisão."]];
const el=document.getElementById("quiz");let i=0,s=0;
function show(){
if(i>=Q.length){
const l=L[s<=1?0:s<=3?1:s<=5?2:s<=7?3:4];
const msg=encodeURIComponent("Oi! Fiz o quiz e deu nível "+l[0]+". Quero agendar a aula experimental.");
el.innerHTML='<div class="res"><p class="eyebrow">Seu nível estimado</p><b>'+l[0]+'</b><p><strong>'+l[1]+'</strong> · '+s+' de '+Q.length+' acertos</p><p class="lead" style="margin-top:8px">'+l[2]+' Confirme na aula experimental gratuita.</p><a class="btn" href="https://wa.me/5500999990000?text='+msg+'">Agendar aula experimental</a> <button class="btn ghost" id="again" type="button" style="margin-top:16px">Refazer</button></div>';
document.getElementById("again").onclick=function(){i=0;s=0;show()};
return}
const q=Q[i];
el.innerHTML='<div class="prog" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="'+Q.length+'" aria-valuenow="'+i+'"><i style="width:'+(i/Q.length*100)+'%"></i></div><p class="q">'+(i+1)+'/'+Q.length+' — '+q[0]+'</p>';
q[1].forEach(function(t,k){const b=document.createElement("button");b.type="button";b.className="opt";b.textContent=t;b.onclick=function(){if(k===q[2])s++;i++;show()};el.appendChild(b)});
}
show();
