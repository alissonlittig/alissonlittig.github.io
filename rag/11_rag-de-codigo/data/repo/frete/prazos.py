"""Prazo de entrega e datas úteis."""
from datetime import date, timedelta

PRAZO_DIAS = {"sul": 3, "sudeste": 2, "centro-oeste": 5, "nordeste": 7, "norte": 9}


def prazo_entrega_dias(regiao, urgente=False):
    """Devolve o prazo em dias úteis para a região. Entrega urgente reduz o prazo pela metade, no mínimo 1 dia."""
    dias = PRAZO_DIAS[regiao]
    return max(1, dias // 2) if urgente else dias


def proximo_dia_util(data):
    """Se a data cair no sábado ou domingo, avança para a segunda-feira."""
    while data.weekday() >= 5:
        data += timedelta(days=1)
    return data


def estimar_data_entrega(saida, regiao, urgente=False):
    """Estima a data de entrega somando os dias úteis do prazo à data de saída, pulando fins de semana."""
    restante, atual = prazo_entrega_dias(regiao, urgente), proximo_dia_util(saida)
    while restante > 0:
        atual = proximo_dia_util(atual + timedelta(days=1))
        restante -= 1
    return atual
