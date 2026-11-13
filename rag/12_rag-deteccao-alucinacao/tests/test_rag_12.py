"""python tests/test_rag_12.py  (ou pytest). Confere: casos construídos (número, polaridade, inventado), resposta extrativa 100% suportada, precisão/recall DEV x TESTE e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag, rag_core as C

IX = rag.build(); RS = json.loads((H / "data" / "respostas.json").read_text("utf-8"))
lab = lambda q, a: [s["label"] for s in rag.check(IX, q, a)["sentences"]]


def test_casos_construidos():
    assert lab("Qual a multa?", "O atraso na devolução gera multa de R$ 0,50 por dia e por livro.") == ["suportada"]
    assert lab("Qual a multa?", "O atraso na devolução gera multa de R$ 2,00 por dia e por livro.") == ["sem suporte"]  # número trocado
    assert lab("Posso fazer fogueira no parque?", "Fazer fogueira é permitido em qualquer área do parque.") == ["sem suporte"]  # polaridade oposta
    assert lab("Posso levar cachorro?", "A bicicleta elétrica custa mil reais.") == ["sem suporte"]  # sem relação nenhuma
    r = rag.check(IX, "Qual a multa?", "O atraso gera multa de R$ 3,00 por dia."); assert "3.00" in r["sentences"][0]["issues"][0]


def test_resposta_extrativa_e_sempre_suportada():
    """Se a 'resposta' é uma frase copiada do documento, o verificador tem que aprovar (limite superior do método)."""
    for c in IX["chunks"]:
        for s in C.sentences(c["text"]):
            r = rag.check(IX, c["section"], s); assert r["sentences"][0]["label"] in ("suportada", "na"), (s, r["sentences"][0])


def test_metricas_dev_teste():
    dev = rag.evaluate(IX, [r for r in RS if r["split"] == "dev"]); te = rag.evaluate(IX, [r for r in RS if r["split"] == "test"])
    print("DEV", dev, "| TESTE", te)
    assert te["precision"] == 1.0 and te["recall"] >= 0.8 and te["fp"] == 0  # limiares HI/LO foram fixados antes de medir o TESTE
    assert dev["precision"] == 1.0 and dev["recall"] >= 0.6


def test_erros_conhecidos_continuam_visiveis():
    """Limites reais, documentados no README: contagem escrita por extenso e mistura de fatos verdadeiros não são pegos."""
    assert lab("Quanto tempo posso ficar com um livro?", "O prazo de empréstimo é de 14 dias e pode ser renovado duas vezes.")[0] != "sem suporte"
    assert lab("A biblioteca abre aos domingos?", "A biblioteca abre aos domingos, das 9h às 13h.")[0] != "sem suporte"


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), RS):
        py = rag.check(IX, x["q"], x["answer"])
        assert js["hits"] == [h["id"] for h in py["hits"]] and js["s"] == [[s["label"], s["support"], s["issues"]] for s in py["sentences"]] and js["summary"] == py["summary"], (x["id"], js, py["summary"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
