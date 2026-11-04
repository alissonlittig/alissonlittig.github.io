/* Dados sintéticos (empresa fictícia "Vetor Norte S.A."). Semente fixa: sempre os mesmos números. */
(function () {
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(5731);
  const nrm = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const sum = a => a.reduce((x, y) => x + y, 0);
  const pick = w => { let u = rnd(), c = 0; for (let i = 0; i < w.length; i++) { c += w[i]; if (u < c) return i; } return w.length - 1; };

  const REG = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste'];
  const REG_S = [.42, .24, .19, .15], REG_G = [.09, .11, .19, .15], REG_C = [.99, 1.0, 1.045, 1.01], REG_I = [0, -.004, .012, .006];
  const LIN = ['Soluções Industriais', 'Serviços Recorrentes', 'Peças e Reposição'];
  const LIN_S = [.48, .32, .20], LIN_G = [.07, .21, .05], CPV = [.585, .44, .65];
  const CC = ['Comercial', 'Operações', 'Tecnologia', 'Pessoas e Cultura', 'Administrativo', 'Marketing'];
  const CCP = [.075, .06, .04, .032, .038, .022], CC_BIAS = [.01, -.02, .06, 0, -.03, .09];
  const SEAS = [.86, .88, .97, .98, 1.0, 1.02, 1.03, 1.04, 1.02, 1.06, 1.10, 1.14];
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const NREAL = 24, NTOT = 27; // nov/24 a out/26 realizados; nov/26 a jan/27 previstos

  const meses = [];
  for (let i = 0; i < NTOT; i++) { const d = new Date(2024, 10 + i, 1); meses.push({ i, f: i >= NREAL, ano: d.getFullYear(), mes: d.getMonth(), lbl: MES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2) }); }

  const rows = [];
  for (let i = 0; i < NTOT; i++) {
    const mo = meses[i].mes;
    for (let r = 0; r < 4; r++) for (let l = 0; l < 3; l++) {
      const g = (REG_G[r] + LIN_G[l]) / 2;
      const bruta = 11.0e6 * REG_S[r] * LIN_S[l] * SEAS[mo] * Math.pow(1 + g, i / 12) * (1 + .03 * nrm());
      const ded = bruta * (.15 + .003 * nrm());
      const liq = bruta - ded;
      const squeeze = 1 + .004 * Math.max(0, i - 17) * (l === 2 ? 1.5 : 1);
      const cpv = liq * CPV[l] * REG_C[r] * squeeze * (1 + .015 * nrm());
      const base = liq / Math.pow(SEAS[mo], .6);
      const cc = CCP.map(p => base * p * (1 + .04 * nrm()));
      const opex = sum(cc);
      const ebitda = liq - cpv - opex;
      const da = liq * .022, fin = -liq * (.018 + .002 * nrm());
      const ebt = ebitda - da + fin, ir = ebt * .24, ll = ebt - ir;
      const orcLiq = liq / (1 + .015 + .04 * nrm());
      const orcCpv = cpv * (orcLiq / liq) * (1 + .012 * nrm());
      const orcCc = cc.map((c, k) => c / (1 + CC_BIAS[k] + .03 * nrm()));
      const ent = liq * (1 + .025 * nrm());
      const capex = liq * .015 * (1 + .3 * nrm());
      const sai = cpv + opex + capex - fin + ir; // saídas totais de caixa
      const prevEnt = ent * (1 + .035 * nrm()), prevSai = sai * (1 + .03 * nrm());
      const inad = liq * Math.max(.01, .032 + REG_I[r] + (i > 14 && i < 24 ? .011 * Math.sin((i - 14) / 9 * Math.PI) : 0) + .003 * nrm());
      rows.push({ i, r, l, f: i >= NREAL, bruta, ded, liq, cpv, cc, opex, ebitda, da, fin, ir, ll, orcLiq, orcCpv, orcCc, ent, sai, capex, prevEnt, prevSai, inad });
    }
  }

  // Títulos em aberto e liquidados (posição em 03/11/2026)
  const HOJE = new Date(2026, 10, 3);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const CLI = ['Metalúrgica Santa Aurora', 'Grupo Pavão Alimentos', 'Construtora Alto Vale', 'Frigorífico Boa Terra', 'Têxtil Fio Real', 'Agroindustrial Campo Largo', 'Cerâmica Monte Claro', 'Usina Rio Dourado', 'Embalagens Paraíba', 'Plásticos Litoral Sul', 'Mineração Serra Branca', 'Móveis Carvalho & Filhos', 'Transportes Rota 116', 'Laticínios Vale Verde', 'Siderúrgica Nova Era', 'Papel e Celulose Itaúna', 'Calçados Bela Passada', 'Bebidas Fonte Clara', 'Autopeças Duque', 'Química Horizonte', 'Hospital São Gabriel', 'Cooperativa Agrária do Planalto', 'Motores Brasa', 'Vidraria Cristal Sul'];
  const FOR = ['Aço Brasil Distribuidora', 'Logística Meridional', 'Energia Centro Sul', 'Componentes Eletrônicos Maia', 'Embalagens Rondon', 'Seguros Aliança Corporativa', 'Locadora de Empilhadeiras Atlas', 'Papelaria e Escritório Prisma', 'Manutenção Industrial Torres', 'Consultoria Tributária Lima & Reis', 'Software de Gestão Integra', 'Agência Nexo Comunicação', 'Química Fortaleza', 'Combustíveis Estrada Real', 'Facilities Limpa Norte', 'Ferramentas Kron', 'Serviços de TI Sintonia', 'Importadora Porto Seco'];
  const titulos = [];
  const mk = (tipo, n, nomes, med, sd, pref) => {
    for (let k = 0; k < n; k++) {
      const u = rnd(); let dias;
      if (u < .35) dias = -Math.floor(rnd() * 55); // liquidado
      else if (u < .35 + .65 * .55) dias = 1 + Math.floor(rnd() * 60);
      else if (u < .35 + .65 * .80) dias = -(1 + Math.floor(rnd() * 30));
      else if (u < .35 + .65 * .92) dias = -(31 + Math.floor(rnd() * 30));
      else if (u < .35 + .65 * .97) dias = -(61 + Math.floor(rnd() * 30));
      else dias = -(91 + Math.floor(rnd() * 60));
      const pago = u < .35;
      const venc = new Date(HOJE); venc.setDate(venc.getDate() + dias);
      const emi = new Date(venc); emi.setDate(emi.getDate() - [30, 30, 45, 60][Math.floor(rnd() * 4)]);
      const valor = Math.min(900e3, Math.round(Math.exp(Math.log(med) + sd * nrm()) / 10) * 10);
      titulos.push({ id: pref + '-' + String(2000 + titulos.length * 7 + Math.floor(rnd() * 6)).padStart(5, '0'), tipo, parte: nomes[Math.floor(rnd() * nomes.length)], r: pick(REG_S), l: pick(LIN_S), emissao: iso(emi), venc: iso(venc), dias, valor, status: pago ? 'Pago' : dias < 0 ? 'Vencido' : 'A vencer' });
    }
  };
  mk('Receber', 270, CLI, 60000, .9, 'NF');
  mk('Pagar', 170, FOR, 48000, .8, 'FP');

  window.FIN = { REG, LIN, CC, meses, rows, titulos, NREAL, HOJE: '03/11/2026', REG_S, CPV };
})();
