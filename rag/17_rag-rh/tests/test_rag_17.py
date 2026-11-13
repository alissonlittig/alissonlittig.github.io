"""python tests/test_rag_17.py (ou pytest). Página/linha reais, resposta literal, vigência, 'antes', recusa, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); T = IX["tests"]; BY = {c["key"]: c for c in IX["chunks"]}


def test_chunk_aponta_linha_real_e_pagina():
    for c in IX["chunks"]:
        ln = (H / "data" / c["docfile"]).read_text("utf-8").splitlines()[c["line"] - 1]; assert ln == c["item"] + " " + c["text"], c["key"]
    assert BY["ferias_v2:2.1"]["page"] == 2 and BY["ferias_v2:4.1"]["page"] == 3 and BY["ferias_v1:3.1"]["page"] == 2 and BY["home_office:4.2"]["page"] == 3


def test_resposta_e_o_item_literal():
    for x in T["questions"]:
        r = rag.answer(IX, x["q"]); assert r["status"] == "answered", x["q"]
        c = IX["chunks"][r["chunk"]]; assert c["text"] in (H / "data" / c["docfile"]).read_text("utf-8")


def test_versao_antiga_fora_da_busca_por_padrao():
    q = "Com quantos dias de antecedência peço férias?"
    assert all(IX["chunks"][h["id"]]["current"] for h in rag.search(IX, q, False, 5)[0])
    assert any(not IX["chunks"][h["id"]]["current"] for h in rag.search(IX, q, True, 5)[0])


def test_antes_so_quando_numero_mudou():
    got = {c["key"]: IX["chunks"][c["before"]]["key"] for c in IX["chunks"] if c["before"] is not None}; assert got == T["antes"], got
    assert BY["ferias_v2:1.1"]["before"] is None  # texto mudou, números não


def test_destaques():
    c = BY["home_office:2.1"]; got = [(c["text"][s["s"]:s["e"]], s["k"]) for s in c["spans"]]; assert ("R$ 120,00", "valor") in got and ("2 dias", "prazo") in got
    assert ("20%", "percentual") in [(BY["beneficios:1.2"]["text"][s["s"]:s["e"]], s["k"]) for s in BY["beneficios:1.2"]["spans"]]


def test_fora_do_escopo_recusa():
    for q in T["oos"]: assert rag.answer(IX, q)["status"] == "refused", q


def test_recall_minimo():
    e = rag.evaluate(IX, T); assert e["recall3"] >= 0.95 and e["recall1"] >= 0.8 and e["oos_answered"] == 0, e


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for js in d["ask"]:
        py = rag.answer(IX, js["q"]); assert (js["status"], js["chunk"], js["cov"], [h["id"] for h in js["hits"]]) == (py["status"], py["chunk"], py["coverage"], [h["id"] for h in py["hits"]]), js["q"]
    assert d["old"] == [h["id"] for h in rag.answer(IX, "Com quantos dias de antecedência peço férias?", True)["hits"]]
    py = rag.evaluate(IX, T); assert (d["ev"]["recall1"], d["ev"]["recall3"]) == (py["recall1"], py["recall3"])


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(T['questions']) + len(T['oos'])} perguntas, {len(IX['chunks'])} itens)")
