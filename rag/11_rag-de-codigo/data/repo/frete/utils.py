"""Funções de apoio: arredondamento e formatação de moeda."""
from decimal import Decimal, ROUND_HALF_UP


def arredondar_moeda(valor):
    """Arredonda um valor para 2 casas decimais, metade para cima."""
    return float(Decimal(str(valor)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def formatar_real(valor):
    """Formata um número como moeda brasileira, por exemplo R$ 1.234,50."""
    texto = f"{arredondar_moeda(valor):,.2f}"
    return "R$ " + texto.replace(",", "X").replace(".", ",").replace("X", ".")
