"""Validação e normalização de CEP, e região de destino."""
import re

REGIOES = {"0": "sudeste", "1": "sudeste", "2": "sudeste", "3": "sudeste", "4": "nordeste",
           "5": "nordeste", "6": "norte", "7": "centro-oeste", "8": "sul", "9": "sul"}


def normalizar_cep(cep):
    """Remove pontos e traço do CEP e devolve só os 8 dígitos."""
    return re.sub(r"\D", "", cep)


def validar_cep(cep):
    """Diz se o CEP tem exatamente 8 dígitos depois de normalizado."""
    return len(normalizar_cep(cep)) == 8


def regiao_do_cep(cep):
    """Descobre a região do país pelo primeiro dígito do CEP. Levanta ValueError se o CEP for inválido."""
    if not validar_cep(cep):
        raise ValueError(f"CEP inválido: {cep!r}")
    return REGIOES[normalizar_cep(cep)[0]]
