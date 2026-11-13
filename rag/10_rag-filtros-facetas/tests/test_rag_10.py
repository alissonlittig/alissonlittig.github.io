"""python tests/test_rag_10.py  (ou pytest). Confere: filtros respeitados, facetas contadas à mão, pré x pós-filtro, recusa, frase literal e paridade Python x JS."""
import json, pathlib, re, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag, rag_core as C

IX = rag.build(); QS = json.loads((H / "tests" / "questions.json").read_text("utf-8")); CH = IX["chunks"]


def test_todo_resultado_passa_nos_filtros():
    for x in QS:
        r = rag.answer(IX, x["q"], x["f"])
        assert all(rag.passes(CH[h["id"]], x["f"]) for h in r["hits"]), x
        assert r["n_cand"] == sum(1 for c in CH if rag.passes(c, x["f"]))


def test_facetas_na_mao():
    r = rag.answer(IX, "", {})  # sem pergunta e sem filtro: facetas = contagem simples do corpus
    assert r["facets"]["cat"] == {k: sum(1 for c in CH if c["category"] == k) for k in ("infraestrutura", "pessoas", "produto", "segurança")} and sum(r["facets"]["cat"].values()) == 31
    assert r["facets"]["ano"] == {"2025": 16, "2026": 15}
    r = rag.answer(IX, "", {"cats": ["segurança"]})  # o filtro de categoria NÃO esconde as outras categorias; o de autor/ano sim
    assert r["facets"]["cat"]["produto"] == 7 and set(r["facets"]["autor"]) == {"Carla Nunes"}


def test_pre_filtro_enche_k_e_pos_filtro_nao():
    f = {"cats": ["segurança"]}; r = rag.answer(IX, "banco de dados backup acesso", f, k=5)
    assert len(r["hits"]) > r["post_filter_n"], (len(r["hits"]), r["post_filter_n"])


def test_perguntas():
    for x in QS:
        r = rag.answer(IX, x["q"], x["f"])
        if x.get("refuse"): assert r["status"] == "refused" and r["answer"] is None, x
        elif x["q"]: assert r["status"] == "answered" and r["hits"][0]["id"] in x["expect_any"], (x, [h["id"] for h in r["hits"]])
        else: assert r["status"] == "browse" and len(r["hits"]) > 0


def test_frase_literal():
    docs = " ".join(" ".join(c["text"].split()) for c in CH)
    for x in (x for x in QS if x["q"] and not x.get("refuse")):
        r = rag.answer(IX, x["q"], x["f"]); assert re.sub(r"\s*\[1\]$", "", r["answer"]) in docs


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), QS):
        py = rag.answer(IX, x["q"], x["f"])
        assert (js["status"], js["answer"], js["ids"], js["facets"], js["post"], js["n"]) == (py["status"], py["answer"], [h["id"] for h in py["hits"]], py["facets"], py.get("post_filter_n"), py["n_cand"]), (x, js, py["answer"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
