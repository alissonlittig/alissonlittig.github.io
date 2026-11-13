"""Tabela de tarifas e cálculo do valor do frete."""
from .utils import arredondar_moeda

TARIFA_BASE = {"P": 12.0, "M": 18.5, "G": 29.9}
FATOR_REGIAO = {"sul": 1.0, "sudeste": 1.1, "centro-oeste": 1.3, "nordeste": 1.4, "norte": 1.6}
ADICIONAL_URGENTE = 0.40  # 40% sobre o valor base
CUPONS = {"PRIMEIRA": 0.10, "FRETE20": 0.20}


def classificar_pacote(peso_kg, volume_cm3):
    """Define o porte do pacote (P, M ou G) pelo peso e pelo volume."""
    if peso_kg <= 1 and volume_cm3 <= 4000:
        return "P"
    if peso_kg <= 5 and volume_cm3 <= 20000:
        return "M"
    return "G"


def calcular_frete(peso_kg, volume_cm3, regiao, urgente=False):
    """Calcula o valor do frete em reais pelo porte e pela região. Entrega urgente soma 40%."""
    if regiao not in FATOR_REGIAO:
        raise ValueError(f"região desconhecida: {regiao}")
    valor = TARIFA_BASE[classificar_pacote(peso_kg, volume_cm3)] * FATOR_REGIAO[regiao]
    if urgente:
        valor *= 1 + ADICIONAL_URGENTE
    return arredondar_moeda(valor)


def aplicar_cupom(valor, cupom):
    """Aplica um cupom de desconto ao frete. Cupom que não existe não altera o valor."""
    desconto = CUPONS.get(cupom.upper(), 0.0)
    return arredondar_moeda(valor * (1 - desconto))
