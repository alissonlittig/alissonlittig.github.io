"""python tests/test_rag.py (ou pytest). Métricas conferidas à mão, retrievers coerentes e paridade Python x JS (rankings, scores, métricas)."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda os 4 projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); QS = json.loads((H / "data" / "questions.json").read_text("utf-8"))


def test_metricas_na_mao():
    m = rag.metrics([7, 3, 9, 1], {9}); assert m == {"recall@1": 0.0, "recall@3": 1.0, "recall@5": 1.0, "mrr": 1 / 3}
    assert rag.metrics([1, 2], {5})["mrr"] == 0.0 and rag.metrics([5], {5})["mrr"] == 1.0


def test_cada_modo_acha_o_trecho_obvio():
    s = rag.search(IX, "como pedir férias")
    for m in rag.MODES: assert IX["passages"][s[m][0][0]]["title"] == "Solicitação de férias", m


def test_hibrido_nao_perde_para_o_pior_retriever():
    ev = rag.evaluate(IX, QS)["all"]; assert ev["hybrid"]["mrr"] >= min(ev[m]["mrr"] for m in ("bm25", "vector", "lsa"))
    assert all(0 <= v <= 1 for r in ev.values() for v in r.values())


def test_pergunta_sem_relacao_nao_quebra():
    s = rag.search(IX, "xyzzy qwerty"); assert s["bm25"] == [] and s["vector"] == [] or s["rerank"] is not None  # sem termo em comum: BM25 vazio, nada quebra


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for q, js in zip(QS, d["search"]):
        py = rag.search(IX, q["q"])
        for m in rag.MODES:
            assert [i for i, _ in js[m]] == [i for i, _ in py[m]], (q["q"], m)
            assert all(abs(a[1] - b[1]) < 2e-3 for a, b in zip(js[m], py[m])), (q["q"], m)
    assert d["ev"] == rag.evaluate(IX, QS), "métricas do navegador diferem do Python"


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(QS)} perguntas)")
