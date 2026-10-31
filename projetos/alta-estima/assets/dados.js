// Dados de conteúdo da loja: como usar, necessidades e rotinas. Edite aqui.

var COMO_USAR = {
  'base': 'Aplique com pincel, esponja ou os dedos, espalhando do centro para as bordas. Misture bem na linha do maxilar. Use pouco e vá aumentando se precisar.',
  'corretivo': 'Aplique só nas áreas que quer disfarçar, com toques leves. Espalhe com a ponta do dedo ou com um pincel pequeno.',
  'batom': 'Contorne os lábios se quiser mais precisão e preencha com o batom. Aplique uma camada fina e espere secar antes de uma segunda.',
  'gloss': 'Aplique no centro dos lábios e espalhe até as bordas. Pode usar sozinho ou por cima do batom.',
  'mascara-cilios': 'Aplique da raiz às pontas dos cílios, em movimentos suaves. Deixe secar e, ao final do dia, retire com demaquilante.',
  'delineador': 'Desenhe a linha perto da raiz dos cílios, em traços curtos e firmes. Se errar, corrija com cotonete e demaquilante.',
  'paleta': 'Aplique com pincel ou dedo, do tom mais claro ao mais escuro. Esfumace as bordas com um pincel limpo.',
  'po': 'Passe o pó com pincel ou esponja, em toques leves sobre a base. Use sem pressionar para um acabamento mais natural.',
  'blush': 'Aplique nas maçãs do rosto com pincel ou dedo, em pouca quantidade. Para iluminador, use nas partes altas do rosto, onde a luz bate.',
  'pinceis': 'Lave com sabonete neutro e água morna, depois deixe secar ao ar. Use cada pincel para o tipo de produto indicado.',
  'limpeza': 'Aplique no rosto molhado, massageie por alguns instantes e enxágue bem. Use de manhã e à noite, ou como preferir.',
  'agua-micelar': 'Umedeça um algodão com a água, passe sobre o rosto e os olhos sem esfregar. Se a embalagem indicar, não precisa enxaguar.',
  'hidratante-facial': 'Aplique uma quantidade pequena no rosto limpo, com toques suaves. Use de manhã ou à noite.',
  'serum': 'Aplique algumas gotas no rosto limpo, antes do hidratante. Espalhe com as pontas dos dedos.',
  'protetor': 'Aplique no rosto como último passo da rotina da manhã, antes da maquiagem. Reaplique conforme a embalagem orienta.',
  'mascara-facial': 'Aplique uma camada uniforme no rosto limpo, evitando os olhos. Deixe agir pelo tempo indicado na embalagem e retire com água.',
  'shampoo': 'Aplique no cabelo molhado, massageie o couro cabeludo e enxágue bem. Repita se precisar.',
  'condicionador': 'Aplique do meio às pontas, depois de tirar o excesso de shampoo. Deixe agir um pouco e enxágue.',
  'mascara-capilar': 'Aplique no cabelo úmido, do meio às pontas, e deixe agir pelo tempo da embalagem. Enxágue bem.',
  'creme-pentear': 'Aplique no cabelo úmido, dividindo em mechas. Penteie com os dedos ou com um pente largo.',
  'finalizador': 'Aplique uma pequena quantidade nas pontas ou no cabelo, conforme a embalagem. Comece sempre com pouco.',
  'coloracao': 'Faça o teste de mecha e o teste de sensibilidade antes, conforme a embalagem. Siga o passo a passo e enxágue bem.',
  'escova': 'Use em cabelo limpo e, se for escova com calor, use protetor térmico. Limpe a escova de tempos em tempos.',
  'perfume-f': 'Borrife a alguns centímetros da pele, em pulsos ou pescoço. Não esfregue os pulsos depois.',
  'perfume-m': 'Borrife a alguns centímetros da pele, em pulsos ou pescoço. Não esfregue os pulsos depois.',
  'body-splash': 'Borrife no corpo depois do banho, em braços, pescoço ou colo. Use com moderação.',
  'desodorante': 'Aplique na pele limpa e seca, debaixo dos braços. Espere secar antes de vestir a roupa.',
  'hidratante-corpo': 'Aplique no corpo limpo, massageando até absorver. Use depois do banho.',
  'sabonete': 'Ensaboe o corpo com as mãos ou com uma esponja e enxágue bem. Use no banho.',
  'oleo-corpo': 'Aplique em pequena quantidade, massageando a pele. Pode usar depois do banho.',
  'esfoliante': 'Aplique no corpo molhado, massageie com movimentos suaves e enxágue bem. Não use em pele irritada.',
  'depilacao': 'Faça o teste numa pequena área antes de usar. Siga o passo a passo da embalagem e cuide da pele depois.',
  'esmalte': 'Passe duas camadas finas, esperando secar entre elas. Use um protetor, se tiver.',
  'base-unha': 'Passe uma camada fina na unha limpa e seca, antes do esmalte. Espere secar antes da próxima etapa.',
  'removedor': 'Passe com algodão na unha até sair a cor. Use com cuidado e feche bem o frasco.',
  'alicate': 'Use para cortar ou acertar a unha, com cuidado. Lixe sempre no mesmo sentido.',
  'kit-pronto': 'Siga o uso de cada item do kit. Se tiver dúvida, a equipe ajuda a escolher.',
  'kit-montado': 'Você escolhe os itens e a equipe monta o presente. Peça ajuda para escolher.'
};

var NECESSIDADES = [
  { id: 'pele-oleosa', nome: 'Pele oleosa', sub: 'Limpeza, hidratação leve e protetor', foto: 'limpeza--garnier', produtos: ['limpeza', 'agua-micelar', 'hidratante-facial', 'serum', 'protetor', 'mascara-facial'] },
  { id: 'cachos', nome: 'Cabelo cacheado', sub: 'Definição, hidratação e menos frizz', foto: 'creme-pentear--skala', produtos: ['shampoo', 'condicionador', 'mascara-capilar', 'creme-pentear', 'finalizador'] },
  { id: 'make-dia', nome: 'Maquiagem do dia a dia', sub: 'Pele, olhos e boca sem complicar', foto: 'base--maybelline', produtos: ['base', 'corretivo', 'po', 'mascara-cilios', 'batom', 'blush'] },
  { id: 'unhas', nome: 'Unhas em casa', sub: 'Base, cor e cuidado', foto: 'esmalte--colorama', produtos: ['removedor', 'base-unha', 'esmalte', 'alicate'] },
  { id: 'corpo', nome: 'Pele do corpo macia', sub: 'Banho, esfoliação e hidratação', foto: 'hidratante-corpo--dove', produtos: ['sabonete', 'esfoliante', 'hidratante-corpo', 'oleo-corpo'] },
  { id: 'presente', nome: 'Presente pronto', sub: 'Kits e perfumes para dar de presente', foto: 'kit-pronto', produtos: ['kit-pronto', 'kit-montado', 'perfume-f', 'perfume-m', 'body-splash'] }
];

var ROTINAS = [
  { id: 'cachos', nome: 'Rotina de cachos', sub: 'Lavar, condicionar e definir', passos: ['shampoo', 'condicionador', 'creme-pentear'] },
  { id: 'pele', nome: 'Rotina de pele da manhã', sub: 'Limpar, hidratar e proteger', passos: ['limpeza', 'hidratante-facial', 'protetor'] },
  { id: 'make', nome: 'Make do dia a dia', sub: 'Base, cílios e boca', passos: ['base', 'mascara-cilios', 'batom'] },
  { id: 'unhas', nome: 'Unhas em casa', sub: 'Tirar, preparar e pintar', passos: ['removedor', 'base-unha', 'esmalte'] }
];
