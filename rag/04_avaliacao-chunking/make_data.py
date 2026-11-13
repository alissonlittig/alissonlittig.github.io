"""Gera data/docs.json (5 documentos fictícios longos, parágrafos separados por linha em branco) e data/questions.json (pergunta + frase-ouro que precisa aparecer inteira no trecho recuperado)."""
import json, pathlib

DOCS = {
"regulamento_parque_aurora": """Regulamento do Parque Aurora

O Parque Aurora abre todos os dias das 6h às 20h, exceto na primeira segunda-feira de cada mês, quando fecha para manutenção. A entrada é gratuita para moradores da cidade que apresentarem comprovante de residência. Visitantes de outras cidades pagam ingresso de R$ 8, e crianças até 7 anos não pagam.

Cães são bem-vindos desde que usem guia curta de no máximo dois metros. O tutor deve recolher os dejetos do animal e descartá-los nas lixeiras marcadas com a cor verde. Cães de grande porte precisam de focinheira na área do playground, por segurança das crianças.

As churrasqueiras ficam no setor leste e funcionam por reserva. A reserva custa R$ 40 por período de quatro horas e deve ser feita com cinco dias de antecedência pelo telefone da administração. É proibido usar caixas de som com volume alto e acender fogueiras fora das churrasqueiras.

Bicicletas circulam apenas na ciclovia de piso vermelho, com velocidade máxima de 15 quilômetros por hora. Patins e skates são permitidos na pista oval, mas não nas trilhas de caminhada. Em caso de emergência, procure um dos guardas de colete laranja ou ligue para o ramal 190 instalado nos postes amarelos.""",
"biblioteca_municipal": """Guia da Biblioteca Municipal Cecília Meireles

Para se associar, apresente um documento com foto e um comprovante de endereço no balcão de atendimento. A carteirinha é emitida na hora e vale por dois anos. Menores de 14 anos precisam de um responsável presente no primeiro cadastro.

Cada sócio pode levar até cinco livros por vez, pelo prazo de 21 dias. A renovação pode ser feita duas vezes, pelo aplicativo ou no balcão, desde que ninguém tenha reservado o título. Obras de referência, como dicionários e enciclopédias, são apenas para consulta no local.

O atraso na devolução gera multa de R$ 0,50 por dia e por livro, limitada ao valor do exemplar. Quem acumular mais de 30 dias de atraso fica sem poder emprestar até quitar o débito. Livros danificados ou perdidos devem ser repostos por um exemplar igual ou pelo pagamento do valor de mercado.

A sala de estudos tem 40 lugares e funciona das 9h às 21h, com silêncio obrigatório. Os computadores podem ser usados por uma hora, prorrogável se não houver fila. A biblioteca realiza contação de histórias aos sábados, às 10h, para crianças de 3 a 8 anos.""",
"manual_compostagem": """Manual de Compostagem Doméstica

A compostagem transforma restos de comida em adubo em cerca de 90 dias. Para começar, são necessárias três caixas plásticas empilhadas: duas com furos para a minhoca e o composto, e uma sem furos embaixo para coletar o chorume. O local deve ser coberto e arejado, longe do sol direto.

Podem ir para a composteira cascas de frutas e legumes, borra de café, filtros de papel, cascas de ovos trituradas e folhas secas. Carnes, laticínios, óleo, fezes de animais e alimentos cozidos com muito tempero devem ficar de fora, porque atraem moscas e geram mau cheiro. Corte os restos em pedaços pequenos para acelerar a decomposição.

Mantenha a proporção de duas partes de material seco para uma parte de resto de comida. Se o composto estiver encharcado e com cheiro forte, acrescente folhas secas ou serragem e misture bem. Se estiver seco demais, borrife um pouco de água. A temperatura ideal fica entre 20 e 35 graus.

O chorume deve ser diluído em dez partes de água antes de ser usado como adubo líquido nas plantas. O composto está pronto quando tem cor escura, cheiro de terra molhada e não deixa mais ver os restos originais.""",
"torneio_xadrez_escolar": """Regulamento do Torneio Escolar de Xadrez

Podem participar alunos do 6º ao 9º ano matriculados na rede pública, em equipes de quatro jogadores titulares e um reserva. A inscrição é feita pelo professor responsável até o dia 15 de março, pelo formulário da secretaria de educação. Não há taxa de inscrição.

O torneio segue o sistema suíço em cinco rodadas, com tempo de 15 minutos para cada jogador, sem acréscimo por lance. Vitória vale um ponto, empate meio ponto e derrota zero. Em caso de empate na classificação, vale primeiro o confronto direto, depois a soma dos pontos dos adversários enfrentados.

Os tabuleiros devem ser trazidos pelas escolas, assim como os relógios. É proibido o uso de celulares na sala de jogo, e quem for flagrado consultando aparelhos perde a partida. Os pais podem acompanhar apenas da arquibancada, sem comentar as jogadas em voz alta.

As três melhores equipes recebem troféu e medalhas, e a campeã representa a cidade na etapa estadual em maio. Cada jogador do time campeão ganha também um kit com livro de aberturas e um tabuleiro oficial.""",
"bicicletas_compartilhadas": """Guia do Sistema de Bicicletas Compartilhadas

Para usar o sistema, baixe o aplicativo, faça o cadastro com CPF e cadastre um cartão de crédito. O plano diário custa R$ 12 e permite viagens ilimitadas de até 45 minutos cada. O plano mensal custa R$ 49 e tem viagens de até 60 minutos.

Para retirar uma bicicleta, escaneie o código QR do guidão e aguarde o aviso de destravamento. A devolução só termina quando a bicicleta é encaixada em uma estação e o aplicativo confirma o travamento. Deixar a bicicleta fora de estação gera multa de R$ 30.

Antes de sair, confira os freios, os pneus e a campainha. Se encontrar defeito, use o botão Reportar problema no aplicativo e escolha outra bicicleta; a viagem não é cobrada se o defeito for registrado em até dois minutos. Capacetes não são fornecidos, mas seu uso é fortemente recomendado.

As estações funcionam 24 horas, mas a manutenção reabastece as bicicletas entre as 5h e as 7h. Em dias de chuva forte, o sistema pode suspender novas retiradas por segurança. Roubos ou acidentes devem ser comunicados pelo telefone de suporte, disponível no aplicativo.""",
}
Q = [
("regulamento_parque_aurora", "qual o horário de funcionamento do parque", "abre todos os dias das 6h às 20h"), ("regulamento_parque_aurora", "quanto custa o ingresso de quem mora em outra cidade", "Visitantes de outras cidades pagam ingresso de R$ 8"),
("regulamento_parque_aurora", "de que tamanho pode ser a guia do cachorro", "guia curta de no máximo dois metros"), ("regulamento_parque_aurora", "quanto custa reservar a churrasqueira e com quanta antecedência", "A reserva custa R$ 40 por período de quatro horas e deve ser feita com cinco dias de antecedência"),
("regulamento_parque_aurora", "qual a velocidade máxima da bicicleta na ciclovia", "velocidade máxima de 15 quilômetros por hora"),
("biblioteca_municipal", "quanto tempo vale a carteirinha da biblioteca", "A carteirinha é emitida na hora e vale por dois anos"), ("biblioteca_municipal", "quantos livros posso levar de uma vez e por quantos dias", "até cinco livros por vez, pelo prazo de 21 dias"),
("biblioteca_municipal", "quanto é a multa por atraso", "multa de R$ 0,50 por dia e por livro"), ("biblioteca_municipal", "que horas a sala de estudos funciona", "funciona das 9h às 21h"),
("biblioteca_municipal", "quando tem contação de histórias", "contação de histórias aos sábados, às 10h"),
("manual_compostagem", "em quanto tempo o composto fica pronto", "transforma restos de comida em adubo em cerca de 90 dias"), ("manual_compostagem", "o que não pode colocar na composteira", "Carnes, laticínios, óleo, fezes de animais e alimentos cozidos com muito tempero devem ficar de fora"),
("manual_compostagem", "qual a proporção de material seco e resto de comida", "duas partes de material seco para uma parte de resto de comida"), ("manual_compostagem", "como usar o chorume nas plantas", "O chorume deve ser diluído em dez partes de água"),
("torneio_xadrez_escolar", "quantos jogadores tem cada equipe do torneio", "equipes de quatro jogadores titulares e um reserva"), ("torneio_xadrez_escolar", "qual o tempo de cada jogador na partida", "tempo de 15 minutos para cada jogador"),
("torneio_xadrez_escolar", "quanto vale um empate", "empate meio ponto"), ("torneio_xadrez_escolar", "quem vai para a etapa estadual", "a campeã representa a cidade na etapa estadual em maio"),
("bicicletas_compartilhadas", "quanto custa o plano mensal da bicicleta", "O plano mensal custa R$ 49 e tem viagens de até 60 minutos"), ("bicicletas_compartilhadas", "qual a multa por deixar a bicicleta fora da estação", "Deixar a bicicleta fora de estação gera multa de R$ 30"),
("bicicletas_compartilhadas", "não pagam viagem se a bicicleta estiver com defeito", "a viagem não é cobrada se o defeito for registrado em até dois minutos"), ("bicicletas_compartilhadas", "a manutenção repõe as bicicletas em que horário", "a manutenção reabastece as bicicletas entre as 5h e as 7h"),
]
if __name__ == "__main__":
    d = pathlib.Path(__file__).parent / "data"
    flat = {k: " ".join(v.split()) for k, v in DOCS.items()}
    for doc, q, gold in Q: assert gold in flat[doc], (doc, gold)  # ouro precisa existir no texto
    (d / "docs.json").write_text(json.dumps(DOCS, ensure_ascii=False, indent=1), "utf-8")
    (d / "questions.json").write_text(json.dumps([{"doc": a, "q": b, "gold": c} for a, b, c in Q], ensure_ascii=False, indent=1), "utf-8")
    print(len(DOCS), "documentos,", sum(len(v.split()) for v in DOCS.values()), "palavras,", len(Q), "perguntas")
