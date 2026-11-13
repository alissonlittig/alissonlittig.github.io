"""Roda o OCR de verdade nas 5 imagens de amostras/ e grava output/scenarios.json (texto lido, confiança, resultado) + output/recibos.xlsx."""
import json, pathlib
import ocr_recibo
HERE = pathlib.Path(__file__).parent
KEYS = {"recibo_01.png": "ok", "recibo_02.png": "qtd_inferida", "recibo_03.png": "total_errado", "recibo_04.png": "feira", "recibo_05_borrado.png": "borrado"}
KEEP = ("loja", "cnpj", "data", "itens", "soma", "total", "avisos", "notas", "status")


def main():
    rs = [ocr_recibo.process(HERE / "amostras" / f) for f in KEYS]; R = {}
    for (f, k), r in zip(KEYS.items(), rs): R[k] = {"file": f, "input": {"texto": r["texto"], "conf": str(r["conf"])}, **{x: r[x] for x in KEEP}}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); ocr_recibo.write_xlsx(rs, HERE / "output" / "recibos.xlsx"); return R


if __name__ == "__main__": main(); print("ok")
