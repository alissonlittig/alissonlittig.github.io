"""python tests/test_rag_07.py (ou pytest). Chunking com linha real, resposta literal, flags conferidas à mão, destaques, recusa, aviso legal, paridade Python x JS."""
import json, pathlib, re, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); T = json.loads((H / "data" / "tests.json").read_text("utf-8")); BY = {c["key"]: c for c in IX["chunks"]}


def test_chunk_aponta_linha_real_do_arquivo():
    for c in IX["chunks"]:
        ln = (H / "data" / c["docfile"]).read_text("utf-8").splitlines()[c["line"] - 1]; assert ln == c["item"] + " " + c["text"], c["key"]


def test_resposta_e_o_item_literal():
    for x in T["questions"]:
        r = rag.answer(IX, x["q"])
        if r["status"] == "answered": assert IX["chunks"][r["chunk"]]["text"] in (H / "data" / IX["chunks"][r["chunk"]]["docfile"]).read_text("utf-8")


def test_flags_na_mao():
    assert BY["A:4.2"]["flags"] == ["multa_alta"] and BY["A:12.1"]["flags"] == ["foro_distante"] and BY["B:9.1"]["flags"] == [] and BY["B:3.2"]["flags"] == []  # multa 10% e foro na cidade: sem alerta
    assert BY["A:3.2"]["flags"] == ["aviso_curto", "renovacao_automatica"]


def test_flags_batem_com_o_gabarito():
    e = rag.evaluate(IX, T); assert not e["flag_fp"] and not e["flag_fn"], e


def test_destaques_cobrem_valor_e_prazo():
    c = BY["A:2.1"]; got = [(c["text"][s["s"]:s["e"]], s["k"]) for s in c["spans"]]; assert ("R$ 48.000,00", "valor") in got and ("30 dias", "prazo") in got


def test_fora_do_escopo_recusa():
    for q in T["oos"]: assert rag.answer(IX, q)["status"] == "refused", q


def test_filtro_por_tipo_so_traz_o_tipo():
    r = rag.answer(IX, "multa", "rescisao_multa"); assert r["hits"] and all(IX["chunks"][h["id"]]["type"] == "rescisao_multa" for h in r["hits"])


def test_aviso_legal_presente():
    assert "Não é aconselhamento jurídico" in IX["disclaimer"] and "Não é aconselhamento jurídico" in (H / "README.md").read_text("utf-8") and "aconselhamento jur" in (H / "demo" / "app.js").read_text("utf-8")


def test_recall_minimo():
    e = rag.evaluate(IX, T); assert e["recall3"] >= 0.9 and e["recall1"] >= 0.7, e


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for js in d["ask"]:
        py = rag.answer(IX, js["q"]); assert (js["status"], js["chunk"], js["cov"], [h["id"] for h in js["hits"]]) == (py["status"], py["chunk"], py["coverage"], [h["id"] for h in py["hits"]]), js["q"]
    assert d["filt"] == [h["id"] for h in rag.answer(IX, "multa", "rescisao_multa")["hits"]]
    py = rag.evaluate(IX, T); assert (d["ev"]["recall1"], d["ev"]["recall3"], d["ev"]["flag_tp"]) == (py["recall1"], py["recall3"], py["flag_tp"])


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(T['questions']) + len(T['oos'])} perguntas, {len(IX['chunks'])} itens)")
