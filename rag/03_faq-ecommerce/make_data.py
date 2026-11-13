"""Gera data/faq.json (28 respostas de uma loja fictícia, 'Loja Brisa') e data/tests.json (perguntas de teste: parafraseadas com a FAQ certa, e fora do escopo)."""
import json, pathlib

FAQ = [
    ("Qual o prazo de entrega?", "Para capitais, a entrega leva de 2 a 5 dias úteis. Para o interior, de 5 a 10 dias úteis, sempre contados a partir da confirmação do pagamento.", "Entrega"),
    ("Tem frete grátis?", "Sim. Compras acima de R$ 199 têm frete grátis para Sul e Sudeste. Para as demais regiões, o frete grátis vale a partir de R$ 299.", "Entrega"),
    ("Como rastrear meu pedido?", "O código de rastreio chega por e-mail em até 24 horas depois do envio. Você também acompanha tudo na página Meus pedidos, dentro da sua conta.", "Entrega"),
    ("Posso mudar o endereço depois de comprar?", "Só antes do envio. Chame o chat em até 2 horas depois da compra informando o número do pedido e o novo endereço.", "Entrega"),
    ("Quais são as formas de pagamento?", "Aceitamos cartão de crédito em até 10 vezes sem juros, Pix e boleto bancário. Não aceitamos cheque nem pagamento na entrega.", "Pagamento"),
    ("Tem desconto pagando no Pix?", "Sim. Pagando com Pix, você recebe 5% de desconto automático sobre o valor dos produtos, sem precisar de cupom.", "Pagamento"),
    ("Por quanto tempo o boleto fica válido?", "O boleto vence em 3 dias corridos. Se não for pago até o vencimento, o pedido é cancelado e o estoque volta para o site.", "Pagamento"),
    ("Qual o valor mínimo da parcela no cartão?", "Cada parcela precisa ter no mínimo R$ 30. Por isso, o número de parcelas disponíveis depende do valor total da compra.", "Pagamento"),
    ("Como uso um cupom de desconto?", "No carrinho, digite o código no campo Cupom e toque em aplicar. Só é possível usar um cupom por pedido, e ele não vale para produtos já em promoção.", "Pagamento"),
    ("Como faço uma troca?", "Você tem 30 dias depois do recebimento para pedir a troca, com o produto sem uso e com etiqueta. Solicite em Meus pedidos e enviaremos um código de postagem gratuito.", "Trocas e devoluções"),
    ("Posso devolver se me arrependi da compra?", "Pode, em até 7 dias corridos depois de receber o pedido. O reembolso é integral, incluindo o valor do frete pago.", "Trocas e devoluções"),
    ("Em quanto tempo recebo o reembolso?", "No cartão de crédito, o estorno aparece em até duas faturas. No Pix, o dinheiro volta em até 5 dias úteis depois que recebermos o produto de volta.", "Trocas e devoluções"),
    ("Recebi um produto com defeito, o que faço?", "Temos 90 dias de garantia contra defeito. Envie fotos pelo chat com o número do pedido e faremos a troca ou o reembolso, sem custo de envio.", "Trocas e devoluções"),
    ("Recebi o produto errado.", "Avise em até 7 dias depois do recebimento. Buscamos o item errado sem custo e enviamos o correto com prioridade.", "Trocas e devoluções"),
    ("Meu pedido está atrasado.", "Se o prazo de entrega passou, fale com um atendente informando o número do pedido. Verificamos com a transportadora e, no atraso confirmado, damos um cupom de R$ 20.", "Entrega"),
    ("Como cancelo um pedido?", "Antes do envio, cancele em Meus pedidos, em Cancelar pedido. Depois do envio, recuse a entrega ou devolva o produto dentro do prazo de arrependimento.", "Pedidos"),
    ("Onde encontro a nota fiscal?", "A nota fiscal é enviada por e-mail e fica disponível em Meus pedidos em até 48 horas depois do faturamento.", "Pedidos"),
    ("Como descubro meu tamanho?", "Cada página de produto tem uma tabela de medidas. Se ficar em dúvida entre dois tamanhos, escolha o maior. A primeira troca de tamanho é gratuita.", "Produtos"),
    ("O produto esgotado voltará ao estoque?", "Em produtos esgotados, use o botão Avise-me. Enviamos um e-mail assim que o item voltar, mas não há garantia de reposição.", "Produtos"),
    ("Posso retirar o pedido em uma loja?", "A retirada é gratuita nas lojas de Curitiba e Joinville, em até 2 dias úteis depois da aprovação do pagamento. Leve um documento com foto.", "Entrega"),
    ("Esqueci minha senha.", "Na tela de entrada, toque em Esqueci minha senha. Mandamos um e-mail com um link que vale por 30 minutos para criar uma nova.", "Conta"),
    ("Como excluo meus dados da loja?", "Peça a exclusão pelo formulário Privacidade, no rodapé do site. O pedido é atendido em até 15 dias, exceto dados que a lei obriga a guardar, como notas fiscais.", "Conta"),
    ("Qual o horário de atendimento?", "O chat atende de segunda a sexta, das 9h às 18h, e aos sábados, das 9h às 13h. Fora desse horário, deixe sua mensagem que respondemos no próximo dia útil.", "Atendimento"),
    ("Vocês embalam para presente?", "Sim. No carrinho, marque Embalagem para presente por R$ 9,90 e escreva uma mensagem para o cartão que vai junto. A nota fiscal não vai na embalagem.", "Produtos"),
    ("Vocês vendem para empresas?", "Vendemos. Informe o CNPJ no cadastro para a nota sair em nome da empresa. Para compras acima de 20 unidades, peça um orçamento com preço especial pelo chat.", "Pedidos"),
    ("Como funciona o programa de pontos?", "Você ganha 1 ponto a cada R$ 1 gasto. A cada 100 pontos, recebe R$ 5 de desconto na próxima compra. Os pontos valem por 12 meses.", "Conta"),
    ("Meus dados de cartão estão seguros?", "Não guardamos o número do seu cartão. O pagamento é processado por uma operadora certificada, e o site usa conexão criptografada.", "Pagamento"),
    ("Vocês enviam para fora do Brasil?", "Não. Por enquanto, entregamos somente dentro do território brasileiro.", "Entrega"),
]
# parafraseadas (id da FAQ certa) e fora do escopo (None); as 'difíceis' são perto do assunto, mas a FAQ não cobre
T = [
    ("em quantos dias chega a encomenda", 0), ("a partir de que valor o frete sai de graça", 1), ("onde vejo por onde anda meu pacote", 2), ("errei o endereço, dá para trocar depois que comprei", 3),
    ("dá para pagar com cartão ou só pix", 4), ("pagando no pix tem abatimento", 5), ("o boleto expira em quantos dias", 6), ("parcela mínima do cartão", 7),
    ("onde coloco o código do cupom", 8), ("quero trocar o que comprei", 9), ("me arrependi, posso devolver", 10), ("quando o dinheiro volta pra minha conta depois da devolução", 11),
    ("o produto chegou quebrado", 12), ("mandaram o item trocado", 13), ("passou do prazo e nada de chegar", 14), ("quero desistir da compra antes de enviar", 15),
    ("preciso da nota fiscal da minha compra", 16), ("não sei qual numeração escolher", 17), ("quando o produto esgotado volta", 18), ("posso buscar na loja física", 19),
    ("não lembro a senha do meu login", 20), ("quero apagar meu cadastro e dados pessoais", 21), ("até que horas o chat funciona", 22), ("tem caixinha de presente", 23),
    ("compro como pessoa jurídica com CNPJ", 24), ("como juntar pontos de fidelidade", 25), ("é seguro colocar meu cartão no site", 26), ("entregam em Portugal", 27),
    ("vocês vendem iphone?", None), ("qual a previsão do tempo em Curitiba", None), ("quanto custa a camiseta preta?", None), ("como faço para vender meus produtos na loja", None),
    ("qual o CNPJ da loja", None), ("vocês têm loja física em São Paulo?", None), ("posso pagar com criptomoeda?", None), ("quem é o dono da loja", None),
    ("como fazer um currículo", None), ("vocês têm aplicativo para celular?", None), ("aceitam vale-refeição?", None), ("tem garantia estendida de dois anos?", None),
    ("qual o melhor tênis para corrida", None), ("receita de bolo de cenoura", None),
]
if __name__ == "__main__":
    d = pathlib.Path(__file__).parent / "data"
    (d / "faq.json").write_text(json.dumps([{"id": i, "q": q, "a": a, "cat": c} for i, (q, a, c) in enumerate(FAQ)], ensure_ascii=False, indent=1), "utf-8")
    (d / "tests.json").write_text(json.dumps([{"q": q, "faq": f} for q, f in T], ensure_ascii=False, indent=1), "utf-8")
    print(len(FAQ), "FAQs,", len(T), "perguntas de teste,", sum(1 for _, f in T if f is None), "fora do escopo")
