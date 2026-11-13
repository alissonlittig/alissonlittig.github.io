"""python tests/test_rag_11.py  (ou pytest). Confere: AST (linhas reais), arquivo:linha aponta para o def/class/constante certo, docstring literal, recusa, repo de exemplo funciona, paridade Python x JS."""
import json, pathlib, re, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag, rag_core as C

IX = rag.build(); QS = json.loads((H / "tests" / "questions.json").read_text("utf-8")); REPO = H / "data" / "repo"


def test_repo_de_exemplo_funciona():
    out = subprocess.run([sys.executable, "smoke.py"], cwd=REPO, capture_output=True, text=True, check=True).stdout; assert "repo ok" in out


def test_chunks_apontam_para_linhas_reais():
    for c in IX["chunks"]:
        lines = (REPO / c["file"]).read_text("utf-8").splitlines()
        assert c["start"] <= c["line"] <= c["end"] and c["code"] == "\n".join(lines[c["start"] - 1:c["end"]])
        if c["kind"] in ("função", "método"): assert re.match(r"\s*(async )?def " + c["name"].split(".")[-1] + r"\(", lines[c["line"] - 1]), c
        if c["kind"] == "classe": assert lines[c["line"] - 1].lstrip().startswith("class " + c["name"]), c
        if c["kind"] == "constante": assert lines[c["line"] - 1].startswith(c["name"] + " ="), c
    assert {"calcular_frete", "Pedido.valor_frete", "Pedido", "PRAZO_DIAS"} <= {c["name"] for c in IX["chunks"]}  # métodos e constantes entram


def test_perguntas_citam_arquivo_linha():
    for x in (x for x in QS if not x.get("refuse")):
        r = rag.answer(IX, x["q"]); assert r["status"] == "answered", (x["q"], r.get("reason"))
        assert r["sources"][0]["ref"] == x["ref"], (x["q"], r["sources"][0]["ref"])
        f, n = r["sources"][0]["ref"].split(":"); line = (REPO / f).read_text("utf-8").splitlines()[int(n) - 1]
        assert re.match(r"\s*(def|class|[A-Z_]+ =)", line), line  # o ponto citado é mesmo o começo do trecho


def test_resposta_e_literal_do_arquivo():
    for x in (x for x in QS if not x.get("refuse")):
        r = rag.answer(IX, x["q"]); txt = re.sub(r"\s*\[1\]$", "", r["answer"]); f = r["sources"][0]["ref"].split(":")[0]
        assert txt in " ".join((REPO / f).read_text("utf-8").split()), txt


def test_recusa():
    for x in (x for x in QS if x.get("refuse")):
        r = rag.answer(IX, x["q"]); assert r["status"] == "refused" and r["answer"] is None, x


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), QS):
        py = rag.answer(IX, x["q"])
        assert (js["status"], js["answer"], js["ids"], js["coverage"]) == (py["status"], py["answer"], [h["id"] for h in py["hits"]], py["coverage"]), (x["q"], js, py["answer"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
