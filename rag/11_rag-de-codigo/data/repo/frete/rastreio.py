"""Código de rastreio e eventos de entrega."""
import re
from dataclasses import dataclass

PADRAO_CODIGO = re.compile(r"^FR\d{8}BR$")


def gerar_codigo_rastreio(pedido_id):
    """Gera o código de rastreio no formato FR + 8 dígitos + BR a partir do número do pedido."""
    return f"FR{pedido_id:08d}BR"


def validar_codigo_rastreio(codigo):
    """Confere se o código de rastreio segue o formato FR + 8 dígitos + BR."""
    return bool(PADRAO_CODIGO.match(codigo))


@dataclass
class EventoRastreio:
    """Um evento do rastreio: status, local e data."""
    status: str
    local: str
    data: str


def registrar_evento(historico, status, local, data):
    """Acrescenta um evento ao histórico de rastreio e devolve o histórico atualizado."""
    historico.append(EventoRastreio(status, local, data))
    return historico
