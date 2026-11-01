/* Dados ficticios de demonstracao. Precos, racas e produtos nao sao reais. */
window.BM = {
  porte: { P: 'P', M: 'M', G: 'G', GG: 'GG', gato: 'gato' },
  banho: { P: 55, M: 75, G: 95, GG: 125, gato: 70 },
  higienica: { P: 25, M: 30, G: 40, GG: 50, gato: 30 },
  completa: { P: 35, M: 45, G: 60, GG: 80, gato: 60 },
  pelo: { curto: 0, longo: 15, duplo: 20 },
  hidrata: 20,
  /* id, especie, porte, pelo, nome pt, nome en */
  racas: [
    ['srd-p', 'cao', 'P', 'curto', 'SRD pequeno', 'Mixed breed, small'],
    ['srd-m', 'cao', 'M', 'curto', 'SRD médio', 'Mixed breed, medium'],
    ['srd-g', 'cao', 'G', 'curto', 'SRD grande', 'Mixed breed, large'],
    ['shihtzu', 'cao', 'P', 'longo', 'Shih tzu', 'Shih tzu'],
    ['yorkshire', 'cao', 'P', 'longo', 'Yorkshire', 'Yorkshire terrier'],
    ['maltes', 'cao', 'P', 'longo', 'Maltês', 'Maltese'],
    ['lhasa', 'cao', 'P', 'longo', 'Lhasa apso', 'Lhasa apso'],
    ['pinscher', 'cao', 'P', 'curto', 'Pinscher', 'Miniature pinscher'],
    ['spitz', 'cao', 'P', 'duplo', 'Spitz alemão', 'German spitz'],
    ['beagle', 'cao', 'M', 'curto', 'Beagle', 'Beagle'],
    ['cocker', 'cao', 'M', 'longo', 'Cocker spaniel', 'Cocker spaniel'],
    ['bordercollie', 'cao', 'M', 'duplo', 'Border collie', 'Border collie'],
    ['golden', 'cao', 'G', 'duplo', 'Golden retriever', 'Golden retriever'],
    ['labrador', 'cao', 'G', 'curto', 'Labrador', 'Labrador'],
    ['pastor', 'cao', 'G', 'duplo', 'Pastor alemão', 'German shepherd'],
    ['husky', 'cao', 'G', 'duplo', 'Husky siberiano', 'Siberian husky'],
    ['saobernardo', 'cao', 'GG', 'duplo', 'São Bernardo', 'Saint Bernard'],
    ['gato-srd', 'gato', 'gato', 'curto', 'Gato SRD', 'Domestic shorthair'],
    ['persa', 'gato', 'gato', 'longo', 'Persa', 'Persian'],
    ['angora', 'gato', 'gato', 'longo', 'Angorá', 'Angora']
  ],
  /* id, especie, fase, tipo, preco, nome pt, nome en, cor */
  prods: [
    ['r1', 'cao', 'adulto', 'racao', 189.9, 'Ração seca adulto, raças pequenas, 10 kg', 'Dry food, adult, small breeds, 10 kg', '#FFE59A'],
    ['r2', 'cao', 'filhote', 'racao', 164.9, 'Ração seca filhote, todos os portes, 10 kg', 'Dry food, puppy, all sizes, 10 kg', '#CFE9E8'],
    ['r3', 'cao', 'senior', 'racao', 199.9, 'Ração seca sênior, porte médio e grande, 10 kg', 'Dry food, senior, medium and large, 10 kg', '#FFE59A'],
    ['r4', 'gato', 'adulto', 'racao', 139.9, 'Ração seca gato adulto castrado, 7 kg', 'Dry food, neutered adult cat, 7 kg', '#CFE9E8'],
    ['r5', 'gato', 'filhote', 'racao', 92.9, 'Ração seca gatinho, 3 kg', 'Dry food, kitten, 3 kg', '#FFE59A'],
    ['p1', 'cao', 'todas', 'petisco', 18.9, 'Bifinho de frango, 65 g', 'Chicken strips, 65 g', '#FF7A66'],
    ['p2', 'gato', 'todas', 'petisco', 12.5, 'Sachê de atum para gatos, 70 g', 'Tuna pouch for cats, 70 g', '#FF7A66'],
    ['h1', 'cao', 'todas', 'higiene', 34.9, 'Shampoo neutro para cães, 500 ml', 'Neutral dog shampoo, 500 ml', '#CFE9E8'],
    ['h2', 'gato', 'todas', 'higiene', 29.9, 'Areia sanitária de sílica, 1,6 kg', 'Silica cat litter, 1.6 kg', '#CFE9E8'],
    ['b1', 'cao', 'todas', 'brinquedo', 24.9, 'Bola de borracha maciça, tamanho M', 'Solid rubber ball, size M', '#FF7A66'],
    ['b2', 'gato', 'todas', 'brinquedo', 21.9, 'Varinha com penas e guizo', 'Feather wand with bell', '#FF7A66'],
    ['a1', 'cao', 'todas', 'acessorio', 49.9, 'Peitoral ajustável, tamanho M', 'Adjustable harness, size M', '#FFE59A']
  ],
  /* id, dias de intervalo, especies, nome pt, nome en */
  vacinas: [
    ['v10', 365, 'cao', 'V10 (múltipla)', 'V10 (core vaccine)'],
    ['v5', 365, 'gato', 'V4 ou V5 felina', 'Feline V4 or V5'],
    ['raiva', 365, 'ambos', 'Antirrábica', 'Rabies'],
    ['gripe', 365, 'cao', 'Gripe canina', 'Canine cough'],
    ['verm', 90, 'ambos', 'Vermífugo', 'Dewormer'],
    ['pulga', 30, 'ambos', 'Antipulgas', 'Flea control']
  ],
  bairros: [
    ['Jardim Alvorada', 'Jardim Alvorada', 15],
    ['Vila das Flores', 'Vila das Flores', 15],
    ['Centro Velho', 'Old Town', 15],
    ['Parque do Sol', 'Sun Park', 25],
    ['Bela Vista', 'Bela Vista', 25],
    ['Morada Verde', 'Morada Verde', null]
  ]
};
