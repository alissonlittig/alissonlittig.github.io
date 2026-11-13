"""python tests/test_rag_08.py (ou pytest). Reescrita com memória, substituição de slot, herança de tópico, janela, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); TESTS = json.loads((H / "data" / "tests.json").read_text("utf-8"))


def test_elipse_herda_topico_e_troca_o_slot():
    r = rag.run(IX, ["Quanto custa o plano premium?", "E o família?"]); assert "familia" in r[1]["query"] and "premium" not in r[1]["query"] and "custa" in r[1]["query"] and r[1]["ellipsis"]
    assert r[1]["doc"] == 2


def test_topico_vem_do_ultimo_turno_do_mesmo_tipo_de_slot():
    r = rag.run(IX, ["Como exporto os relatórios no Android?", "Quanto custa o plano premium?", "E no iOS?"]); assert r[2]["doc"] == 6 and "exportar" in r[2]["query"] or "exporto" in r[2]["query"]


def test_sem_memoria_a_elipse_falha_onde_a_memoria_acerta():
    q = ["O desbloqueio por digital funciona no Android?", "E na versão Web?"]
    assert rag.run(IX, q, 0)[1]["doc"] != 11 and rag.run(IX, q, 3)[1]["doc"] == 11


def test_contexto_mole_nao_derruba_pergunta_nova():
    r = rag.run(IX, ["Quanto custa o plano premium?", "Como troco a senha?"]); assert r[1]["status"] == "answered" and r[1]["doc"] == 10 and r[1]["soft"] == ["premium"]


def test_fora_do_corpus_recusa_mesmo_com_memoria():
    r = rag.run(IX, ["Quanto custa o plano família?", "Qual a capital da França?"]); assert r[1]["status"] == "refused"


def test_janela_zero_nao_usa_memoria():
    r = rag.run(IX, ["Quanto custa o plano premium?", "E o família?"], 0); assert not r[1]["followup"] and not r[1]["ellipsis"]


def test_memoria_ajuda_e_o_numero_e_o_medido():
    e0, e3 = rag.evaluate(IX, TESTS, 0), rag.evaluate(IX, TESTS, 3); assert e3["follow_ok"] > e0["follow_ok"] and e3["follow_ok"] >= 13 and e0["first_ok"] == e3["first_ok"] == e3["first_n"], (e0, e3)


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for w, runs in zip([0, 1, 3], d["runs"]):
        for dlg, jr in zip(TESTS, runs):
            for r, j in zip(rag.run(IX, [t[0] for t in dlg["turns"]], w), jr): assert (j["query"], j["ellipsis"], j["soft"], j["status"], j["doc"], j["cov"], j["hits"]) == (r["query"], r["ellipsis"], r["soft"], r["status"], r["doc"], r["coverage"], [h["id"] for h in r["hits"]]), (w, j["q"])
    for w, e in enumerate(d["ev"]): assert e == rag.evaluate(IX, TESTS, w), w


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(TESTS)} diálogos, {len(IX['docs'])} trechos)")
