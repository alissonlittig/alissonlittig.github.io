"""python tests/test_rag_06.py (ou pytest). Mesmo conceito em 3 idiomas, recusa, citação no idioma do documento, comparação com baseline, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); TESTS = json.loads((H / "data" / "tests.json").read_text("utf-8")); MAIN = [t for t in TESTS if not t.get("set")]


def test_toda_pergunta_e_de_idioma_diferente_do_documento():
    for t in MAIN:
        if t["doc"] is not None: assert IX["docs"][t["doc"]]["lang"] != t["lang"], t["q"]


def test_mesmo_conceito_nos_tres_idiomas():
    assert rag.analyze_ids(IX, "monthly") == rag.analyze_ids(IX, "mensal") == rag.analyze_ids(IX, "mensual") == ["mes"]
    assert rag.analyze_ids(IX, "the room") == rag.analyze_ids(IX, "las salas") == ["sala"]


def test_resposta_e_frase_literal_no_idioma_do_documento():
    for t in MAIN:
        r = rag.answer(IX, t["q"])
        if r["status"] == "answered": assert r["answer"] in IX["docs"][r["doc"]]["text"] and r["doc_lang"] == IX["docs"][r["doc"]]["lang"]


def test_fora_do_escopo_recusa():
    for t in MAIN:
        if t["doc"] is None: assert rag.answer(IX, t["q"])["status"] == "refused", t["q"]


def test_lexico_vence_baseline_sem_traducao():
    c, r = rag.evaluate(IX, MAIN, "concept"), rag.evaluate(IX, MAIN, "raw"); assert c["recall1"] >= 0.95 and r["recall1"] < 0.5 and c["recall1"] > r["recall1"] + 0.4, (c, r)


def test_deteccao_de_idioma():
    ok = sum(rag.detect(IX, t["q"])[0] == t["lang"] for t in TESTS); assert ok / len(TESTS) >= 0.9, ok


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for t, js in zip(TESTS, d["ask"]):
        py = rag.answer(IX, t["q"]); assert (js["status"], js["doc"], js["cov"], js["lang"], js["ans"], js["concepts"]) == (py["status"], py.get("doc"), py["coverage"], py["lang"], py["answer"], py["concepts"]), t["q"]
        assert [h["id"] for h in js["hits"]] == [h["id"] for h in py["hits"]], t["q"]
    extra = [t for t in TESTS if t.get("set")]
    for m, (a, b) in zip(rag.MODES, d["modes"]): assert (a, b) == (rag.evaluate(IX, MAIN, m), rag.evaluate(IX, extra, m)), m


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(TESTS)} perguntas, {len(IX['docs'])} documentos)")
