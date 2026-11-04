/* Dados sintéticos da Vértice Cloud (empresa fictícia). Semente fixa: mesmo resultado a cada abertura. */
(() => {
'use strict';
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry(20261103);
const NM = 24;                                   // nov/24 .. out/26
const MN = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cal = m => (10 + m) % 12, yr = m => 2024 + Math.floor((10 + m) / 12);
const mlab = m => MN[cal(m)] + '/' + String(yr(m)).slice(2);

const REGIONS = ['Sudeste','Sul','Nordeste','Centro-Norte'];
const PLANS = ['Starter','Growth','Enterprise'];
const CHN = ['Inbound','Outbound','Parceiros','Indicação'];
// nome, região, capacidade, habilidade, mês de contratação (-99 = já estava)
const REPS = [
  ['Mariana Duarte',0,1.15,1.22,-99],['Rafael Teixeira',0,1.15,1.05,-99],['Camila Brandão',0,1.15,.92,-99],['Thiago Amorim',0,1.15,1.10,-99],['Bianca Nogueira',0,1.15,.78,-99],
  ['Lucas Pereira',1,1,1.15,-99],['Fernanda Kroeger',1,1,.95,-99],['Gustavo Zanella',1,1,.84,-99],
  ['Juliana Andrade',2,.85,1.0,-99],['Marcos Vilar',2,.85,.88,-99],
  ['Patrícia Lemos',3,.8,1.08,-99],['Eduardo Sampaio',3,.8,.72,4]
].map(([n,rg,cap,sk,hire],i)=>({i,n,rg,cap,sk:1+(sk-1)*.5,hire}));
const ramp = (r, m) => m < r.hire ? 0 : Math.min(1, (m - r.hire + 1) / 4);

const norm = () => Math.sqrt(-2 * Math.log(R() + 1e-12)) * Math.cos(6.2831853 * R());
const poi = mean => Math.max(0, Math.round(mean + Math.sqrt(mean) * norm() * .8));
const pick = w => { let s = 0; for (const x of w) s += x; let r = R() * s; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; };

const P1 = ['Aurora','Horizonte','Vale','Prisma','Cedro','Granito','Faro','Marajó','Atlântica','Serra','Lótus','Pinheiral','Campina','Oásis','Rota','Estrela','Vitória','Nascente','Araguaia','Caravela','Mirante','Boreal','Terra Nova','Ipê','Bromélia','Pioneira','Safira','Montana','Alvorada','Tamoio','Jacarandá','Solaris','Veredas','Cruzeiro','Mangue','Itatiaia','Diamante','Litoral','Planalto','Ouro Fino','Tropical','Umbu','Palmares','Quartzo','Rio Claro','Sabiá','Trilha','União'];
const P2 = ['Logística','Alimentos','Saúde','Engenharia','Educação','Agro','Energia','Têxtil','Contábil','Seguros','Clínicas','Atacado','Construções','Transportes','Farma','Tecnologia','Papel','Móveis','Serviços','Varejo','Mobilidade','Químicos','Café','Cosméticos','Metalúrgica','Turismo','Imobiliária','Saneamento'];
const P3 = ['Ltda','S.A.','Brasil','& Cia','Group','Holding','Industrial','do Brasil'];
const used = new Set();
function cname(){ for (;;) { const n = P1[R()*P1.length|0] + ' ' + P2[R()*P2.length|0] + ' ' + P3[R()*P3.length|0]; if (!used.has(n)) { used.add(n); return n; } } }

// parâmetros por plano [Starter, Growth, Enterprise]
const B0 = [20, 7.6, 1.5], G = [.017, .02, .026];
const VR = [[150,690,10],[800,3600,50],[5500,26000,100]];
const SEAS = [.86,.92,1.05,.98,1,1.1,.9,1,1.08,1.04,1.1,1.25];
const MIX = [[.55,.12,.13,.20],[.38,.28,.16,.18],[.22,.46,.14,.18]];     // canal por plano
const CYC = [21, 46, 98];                                                  // dias de ciclo
const LDR = [14, 30, 5, 3.2], MQLR = [.38, .22, .6, .8];                   // leads por oportunidade; fração que vira MQL
const WR = [.24, .17, .31, .40], WRP = [1.1, 1, .82];                      // taxa de ganho por canal e plano
const CH0 = [.021, .0088, .0036], EXP = [.036, .068, .1], CON = [.007, .009, .012];
const CACU = [3400, 17000, 120000], CACM = [1, 1.5, .8, .45];
const val = p => { const [lo, hi, st] = VR[p]; return Math.round((lo + (hi - lo) * Math.pow(R(), 1.8)) / st) * st; };
const repW = m => REPS.map(r => r.cap * ramp(r, m));
const lead = ch => Math.max(1, Math.round(LDR[ch] * (.65 + .7 * R())));
const mql = (ch, ld) => Math.min(ld, Math.max(1, Math.round(ld * MQLR[ch])));

const OP = [], CU = [], E = [];
function simCust(c){
  const a = new Float32Array(NM), p = c.p, s = Math.max(c.start, 0); let cur = c.m0;
  for (let m = s; m < NM; m++) {
    if (m > s) {
      const ten = c.start < 0 ? 18 + m : m - c.start;
      const h = CH0[p] * (ten < 6 ? 1.5 : ten < 12 ? 1.25 : .9) * (cal(m) === 0 ? 1.4 : cal(m) === 6 ? 1.1 : 1) * (1 - .004 * m) * (.8 + .4 * R());
      if (R() < h) break;
      if (R() < EXP[p]) cur = Math.round(cur * (1.08 + .25 * R()));
      else if (R() < CON[p]) cur = Math.round(cur * (.78 + .14 * R()));
    }
    a[m] = cur;
  }
  c.mrr = a; return c;
}

// base antiga (clientes que já existiam em nov/24)
[900, 330, 70].forEach((n, p) => { for (let i = 0; i < n; i++) {
  const rep = pick(repW(0).map((w, j) => w * REPS[j].sk));
  CU.push(simCust({name: cname(), p, rg: REPS[rep].rg, ch: pick(MIX[p]), rep, start: -1, m0: val(p), cac: 0}));
} });

for (let m = 0; m < NM; m++) {
  E[m] = [0, 0, 0];
  for (let p = 0; p < 3; p++) {
    const mean = B0[p] * Math.pow(1 + G[p], m) * SEAS[cal(m)]; E[m][p] = mean;
    const n = poi(mean), w = repW(m).map((x, j) => x * REPS[j].sk);
    for (let i = 0; i < n; i++) {
      const rep = pick(w), r = REPS[rep], mix = MIX[p].slice(); mix[2] *= 1 + m / 40;
      const ch = pick(mix), v = val(p), ld = lead(ch);
      OP.push({m, rep, rg: r.rg, p, ch, ld, mql: mql(ch, ld), cyc: Math.round(CYC[p] * (.6 + .8 * R())), st: 'W', reach: 5, val: v});
      CU.push(simCust({name: cname(), p, rg: r.rg, ch, rep, start: m, m0: v,
        cac: Math.round(CACU[p] * CACM[ch] * (.8 + .4 * R()) * (1 + .006 * m))}));
      // perdidas: mesma origem, não viraram cliente
      const wr = Math.min(.7, WR[ch] * WRP[p] * Math.pow(r.sk, .6)), x = 1 / wr - 1;
      for (let j = Math.floor(x) + (R() < x % 1 ? 1 : 0); j > 0; j--) {
        const rp = pick(w), l = lead(ch);
        OP.push({m, rep: rp, rg: REPS[rp].rg, p, ch, ld: l, mql: mql(ch, l), cyc: Math.round(CYC[p] * (.6 + .8 * R())), st: 'L', reach: 2 + pick([.42, .33, .25]), val: val(p)});
      }
    }
  }
}
// pipeline aberto: oportunidades criadas nos últimos 4 meses ainda sem decisão
const OPEN_F = [3.4, 2.4, 1.7, 1.1], STW = [[.7,.25,.05],[.45,.38,.17],[.25,.4,.35],[.12,.38,.5]];
for (let age = 0; age < 4; age++) { const m = NM - 1 - age;
  for (let p = 0; p < 3; p++) {
    const n = poi(E[m][p] * OPEN_F[age]), w = repW(m).map((x, j) => x * REPS[j].sk);
    for (let i = 0; i < n; i++) {
      const rep = pick(w), ch = pick(MIX[p]), reach = 2 + pick(STW[age]), ld = lead(ch);
      OP.push({m, rep, rg: REPS[rep].rg, p, ch, ld, mql: mql(ch, ld), cyc: 0, st: 'O', reach, val: val(p), name: cname(), days: age * 30 + (R() * 28 | 0), close: NM + (R() * 3 | 0)});
    }
  }
}
// valor médio por plano → meta (K) e cota por vendedor (Q)
const AV = [0, 1, 2].map(p => { const w = OP.filter(o => o.st === 'W' && o.p === p); return w.reduce((a, o) => a + o.val, 0) / w.length; });
const K = E.map(e => Math.round(.92 * (e[0] * AV[0] + e[1] * AV[1] + e[2] * AV[2])));
const Q = REPS.map(() => new Array(NM).fill(0));
// cota = metade capacidade, metade desempenho real do ano (metas de equipe costumam ser calibradas assim; evita ruído de poucos contratos grandes)
const got = REPS.map(r => OP.filter(o => o.st === 'W' && o.rep === r.i).reduce((a, o) => a + o.val, 0));
const act = REPS.map(r => { let s = 0; for (let m = 0; m < NM; m++) s += ramp(r, m); return s; });
for (let m = 0; m < NM; m++) {
  const w = repW(m), s = w.reduce((a, b) => a + b, 0), rl = REPS.map((r, i) => got[i] / act[i] * ramp(r, m)), sr = rl.reduce((a, b) => a + b, 0);
  REPS.forEach((r, i) => { Q[i][m] = K[m] * (.5 * w[i] / s + .5 * rl[i] / sr); });
}

window.SAAS = {NM, MN, cal, yr, mlab, REGIONS, PLANS, CHN, REPS, CU, OP, K, Q};
})();
