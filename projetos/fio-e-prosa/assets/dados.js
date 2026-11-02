/* Catálogo de exemplo da Fio & Prosa (marca fictícia). Preços e medidas são exemplos. */
window.CORES = {
  cru: { nome: "Cru", hex: "#E6DAC3" },
  oliva: { nome: "Oliva", hex: "#6B7248" },
  indigo: { nome: "Índigo", hex: "#2F3F63" },
  ferrugem: { nome: "Ferrugem", hex: "#A24E2D" },
  preto: { nome: "Preto", hex: "#26231F" },
  branco: { nome: "Branco", hex: "#F4F1E9" }
};

/* busto = medida da peça no tamanho M, em cm; comp = comprimento */
window.PRODUTOS = [
  { id: "camisa-serena", nome: "Camisa Serena", cat: "Camisas", tecido: "Linho puro", caimento: "Solto, manga longa", preco: 289, cores: ["cru", "oliva", "indigo"], tams: ["P", "M", "G", "GG"], novo: true, busto: 108, comp: 72 },
  { id: "camisa-bento", nome: "Camisa Bento", cat: "Camisas", tecido: "Algodão com fio 40", caimento: "Reto, gola clássica", preco: 259, cores: ["branco", "ferrugem"], tams: ["P", "M", "G", "GG"], busto: 104, comp: 70 },
  { id: "camisa-nina", nome: "Camisa Nina", cat: "Camisas", tecido: "Linho com algodão", caimento: "Reto, manga 3/4", preco: 269, cores: ["preto", "cru"], tams: ["M", "G", "GG"], busto: 106, comp: 68 },
  { id: "vestido-aurelia", nome: "Vestido Aurélia", cat: "Vestidos", tecido: "Linho com viscose", caimento: "Evasê, abaixo do joelho", preco: 399, cores: ["ferrugem", "cru", "preto"], tams: ["P", "M", "G"], novo: true, busto: 98, comp: 112 },
  { id: "vestido-dalia", nome: "Vestido Dália", cat: "Vestidos", tecido: "Algodão pesado", caimento: "Reto, cintura marcada", preco: 349, cores: ["oliva", "indigo"], tams: ["P", "M", "G", "GG"], busto: 96, comp: 108 },
  { id: "vestido-iris", nome: "Vestido Íris", cat: "Vestidos", tecido: "Linho puro", caimento: "Evasê, midi", preco: 379, cores: ["indigo", "cru"], tams: ["P", "M", "G"], busto: 100, comp: 116 },
  { id: "calca-tome", nome: "Calça Tomé", cat: "Calças", tecido: "Linho de alfaiataria", caimento: "Pantalona, cintura alta", preco: 359, cores: ["cru", "oliva", "preto"], tams: ["P", "M", "G", "GG"], novo: false, busto: 92, comp: 104 },
  { id: "calca-lorena", nome: "Calça Lorena", cat: "Calças", tecido: "Sarja de algodão", caimento: "Reta, cintura alta", preco: 329, cores: ["indigo", "ferrugem"], tams: ["M", "G", "GG"], novo: true, busto: 90, comp: 102 },
  { id: "saia-petala", nome: "Saia Pétala", cat: "Saias", tecido: "Linho com pregas", caimento: "Midi, cintura alta", preco: 279, cores: ["cru", "ferrugem"], tams: ["P", "M", "G"], busto: 88, comp: 78 },
  { id: "saia-manoela", nome: "Saia Manoela", cat: "Saias", tecido: "Algodão leve", caimento: "Midi, com bolsos", preco: 259, cores: ["indigo", "preto"], tams: ["P", "M", "G", "GG"], novo: true, busto: 90, comp: 82 },
  { id: "sueter-candido", nome: "Suéter Cândido", cat: "Tricô", tecido: "Tricô de algodão", caimento: "Solto, gola careca", preco: 319, cores: ["cru", "oliva", "indigo"], tams: ["P", "M", "G", "GG"], busto: 112, comp: 66 },
  { id: "sueter-dora", nome: "Suéter Dora", cat: "Tricô", tecido: "Tricô de algodão", caimento: "Curto, gola alta", preco: 249, cores: ["ferrugem", "cru"], tams: ["P", "M", "G"], busto: 100, comp: 58 }
];

/* Tabela do provador: medidas do corpo em cm (máximas de cada tamanho) */
window.TABELA = [
  { t: "P", busto: 88, cintura: 70, quadril: 96 },
  { t: "M", busto: 94, cintura: 76, quadril: 102 },
  { t: "G", busto: 100, cintura: 82, quadril: 108 },
  { t: "GG", busto: 108, cintura: 90, quadril: 116 }
];

window.LOJA = { whatsapp: "5500000000000", nome: "Fio & Prosa" };
