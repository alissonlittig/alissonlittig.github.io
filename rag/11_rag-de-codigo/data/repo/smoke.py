"""Teste de fumaça do repositório de exemplo (rodado pelo teste do projeto 11)."""
from datetime import date
from frete.pedido import ItemPedido, Pedido
from frete.tarifas import calcular_frete
from frete.prazos import estimar_data_entrega
from frete.utils import formatar_real

p = Pedido("80050-580"); p.adicionar_item(ItemPedido("livro", 0.5, 2000, 2)); p.fechar()
assert p.valor_frete() == calcular_frete(1.0, 4000, "sul") == 12.0
assert calcular_frete(1, 1000, "norte", urgente=True) == 26.88
assert estimar_data_entrega(date(2026, 11, 13), "sudeste") == date(2026, 11, 17)
assert formatar_real(1234.5) == "R$ 1.234,50"
print("repo ok")
