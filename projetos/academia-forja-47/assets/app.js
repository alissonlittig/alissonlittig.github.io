const AGENDA={
 "Seg a Sex":[["06:00","Força","Bia","6 vagas"],["07:15","Funcional","Rafa","3 vagas"],["12:10","Express 40 min","Rafa","8 vagas"],["18:30","Funcional","Caio","2 vagas"],["19:45","Força","Bia","5 vagas"]],
 "Sábado":[["08:00","Funcional","Caio","7 vagas"],["09:15","Mobilidade","Bia","10 vagas"],["10:30","Força","Rafa","4 vagas"]],
 "Domingo":[["09:00","Aula aberta","Caio","12 vagas"]]};
const WA="https://wa.me/5541900000000?text=";
const box=document.getElementById("slots"),tabs=document.getElementById("tabs");
function show(d){
 box.innerHTML=AGENDA[d].map(([h,a,p,v])=>`<a class="slot" href="${WA}${encodeURIComponent(`Oi! Quero agendar minha aula experimental: ${d}, ${h} (${a}).`)}"><b>${h}</b><span>${a} · ${p}<i>${v}</i></span></a>`).join("");
 tabs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-selected",b.textContent===d));
}
tabs.innerHTML=Object.keys(AGENDA).map(d=>`<button type="button" role="tab">${d}</button>`).join("");
tabs.addEventListener("click",e=>e.target.matches("button")&&show(e.target.textContent));
show("Seg a Sex");
