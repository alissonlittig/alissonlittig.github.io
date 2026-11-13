"""Pedido com itens: totais de peso e volume e valor do frete."""
from dataclasses import dataclass, field

from .cep import regiao_do_cep
from .tarifas import calcular_frete


@dataclass
class ItemPedido:
    """Um item do pedido com peso e volume unitários."""
    nome: str
    peso_kg: float
    volume_cm3: float
    quantidade: int = 1


@dataclass
class Pedido:
    """Pedido de um cliente, com CEP de destino e lista de itens."""
    cep_destino: str
    itens: list = field(default_factory=list)
    fechado: bool = False

    def adicionar_item(self, item):
        """Adiciona um item ao pedido. Pedido já fechado não aceita itens novos."""
        if self.fechado:
            raise RuntimeError("pedido fechado não aceita itens")
        self.itens.append(item)

    def peso_total(self):
        """Soma o peso de todos os itens, considerando a quantidade de cada um."""
        return sum(i.peso_kg * i.quantidade for i in self.itens)

    def volume_total(self):
        """Soma o volume de todos os itens, considerando a quantidade de cada um."""
        return sum(i.volume_cm3 * i.quantidade for i in self.itens)

    def valor_frete(self, urgente=False):
        """Calcula o frete do pedido inteiro usando a região do CEP de destino."""
        return calcular_frete(self.peso_total(), self.volume_total(), regiao_do_cep(self.cep_destino), urgente)

    def fechar(self):
        """Fecha o pedido para novas alterações. Pedido sem itens não pode ser fechado."""
        if not self.itens:
            raise ValueError("pedido vazio")
        self.fechado = True
