"""Gera 4 recibos FICTÍCIOS (PNG) em amostras/ com Pillow: não são notas reais, as lojas e os CNPJ não existem.
3 limpos e 1 degradado (borrado, torto, com ruído) para mostrar o caso de revisão humana. Semente fixa: sempre as mesmas imagens."""
import pathlib, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
HERE = pathlib.Path(__file__).parent; OUT = HERE / "amostras"; FONT = "C:/Windows/Fonts/cour.ttf"
RECIBOS = {
    "recibo_01": ("MERCADINHO BOA PRACA", "CNPJ 00.111.222/0001-00", "08/11/2026 14:32", [("ARROZ 5KG", 1, "28,90"), ("FEIJAO 1KG", 2, "8,45"), ("OLEO DE SOJA", 3, "7,20"), ("CAFE 500G", 1, "19,90")], None),
    "recibo_02": ("PAPELARIA CANTO VIVO", "CNPJ 00.333.444/0001-00", "09/11/2026 10:05", [("CADERNO 96F", 4, "18,90"), ("CANETA GEL", 10, "3,50"), ("PASTA A4", 2, "6,20")], None),
    "recibo_03": ("POSTO RIO CLARO", "CNPJ 00.555.666/0001-00", "10/11/2026 18:47", [("GASOLINA COMUM", 1, "212,40"), ("AGUA MINERAL", 2, "4,50")], "220,00"),  # total impresso não bate com a soma (221,40): vai para revisão
    "recibo_04": ("FEIRA DO BAIRRO", "CNPJ 00.777.888/0001-00", "11/11/2026 08:20", [("TOMATE KG", 2, "9,80"), ("BANANA DZ", 3, "6,50"), ("OVOS 12", 1, "14,00")], None),
}


def br(x): return f"{x:.2f}".replace(".", ",")


def lines_of(shop, cnpj, when, items, forced_total):
    soma = round(sum(q * float(u.replace(",", ".")) for _, q, u in items), 2); W = 35
    L = [shop.center(W), cnpj.center(W), "-" * W, f"DATA: {when}", "-" * W]
    for nome, q, u in items: L.append(f"{q:>2}x {nome:<14} {u:>6} {br(q * float(u.replace(',', '.'))):>7}")
    return L + ["-" * W, f"{'TOTAL R$':<25}{forced_total or br(soma):>10}", "OBRIGADO PELA PREFERENCIA".center(W)]


def draw(lines, degrade=False, seed=3):
    f = ImageFont.truetype(FONT, 32); w, h = 700, 80 + 46 * len(lines); im = Image.new("L", (w, h), 250); d = ImageDraw.Draw(im)
    for i, t in enumerate(lines): d.text((24, 36 + 46 * i), t, font=f, fill=20)
    if degrade:
        rnd = random.Random(seed); im = im.rotate(3, expand=True, fillcolor=250).filter(ImageFilter.GaussianBlur(1.9))
        px = im.load()
        for _ in range(int(im.width * im.height * 0.18)): x, y = rnd.randrange(im.width), rnd.randrange(im.height); px[x, y] = max(0, min(255, px[x, y] + rnd.randint(-110, 70)))
    return im


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for k, (s, c, d, it, ft) in RECIBOS.items(): draw(lines_of(s, c, d, it, ft)).save(OUT / f"{k}.png")
    draw(lines_of(*RECIBOS["recibo_02"][:4], None), degrade=True).save(OUT / "recibo_05_borrado.png"); print("ok", sorted(p.name for p in OUT.iterdir()))
