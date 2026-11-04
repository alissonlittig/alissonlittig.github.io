const NUM = "5511900000000"; // número fictício de demonstração
const f = document.getElementById("cot"), p = document.getElementById("placa"), e = document.getElementById("err");
p.addEventListener("input", () => { p.value = p.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 7); });
// aceita placa antiga (ABC1234) e Mercosul (ABC1D23)
const ok = v => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(v);
f.addEventListener("submit", ev => {
  ev.preventDefault();
  if (!ok(p.value)) { e.textContent = "Confira a placa: 3 letras + 4 caracteres (ex.: ABC1D23)."; p.focus(); return; }
  e.textContent = "";
  const s = document.getElementById("serv").value;
  const t = `Olá! Quero um orçamento na Torque & Pista.\nPlaca: ${p.value}\nServiço: ${s}`;
  window.open(`https://wa.me/${NUM}?text=${encodeURIComponent(t)}`, "_blank", "noopener");
});
