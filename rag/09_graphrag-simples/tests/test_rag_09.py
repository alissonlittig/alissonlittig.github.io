"""python tests/test_rag_09.py  (ou pytest). Confere: entidades, arestas contadas à mão, caminhos reais, frase literal, recusa, recall e paridade Python x JS."""
import json, pathlib, re, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda os projetos no mesmo processo
import rag, rag_core as C

IX = rag.build(); QS = json.loads((H / "tests" / "questions.json").read_text("utf-8"))
NAME = {e["name"]: e["id"] for e in IX["entities"]}


def ents(i): return {IX["entities"][e]["name"] for e in IX["chunks"][i]["ents"]}


def test_entidades_e_arestas_na_mao():
    assert ents(2) == {"Helena Duarte", "Projeto Maré Alta", "Baía de Itaúna"}
    assert ents(5) == {"Otávio Brandão", "Fundação Costa Viva"}
    assert rag.find_ents(IX["entities"], "e a baia de itauna?") == [NAME["Baía de Itaúna"]]  # sem acento também acha
    # "Projeto Maré Alta" e "Laboratório de Instrumentação" aparecem juntos só no parágrafo 8
    w = {(a, b): n for a, b, n in IX["edges"]}; w = {**w, **{(b, a): n for (a, b), n in w.items()}}  # não direcionado
    assert w[(NAME["Laboratório de Instrumentação"], NAME["Projeto Maré Alta"])] == 1
    assert w[(NAME["Caio Seixas"], NAME["Marta Lacerda"])] == 1 and w[(NAME["Baía de Itaúna"], NAME["Caio Seixas"])] == 1
    n = sum(len(c["ents"]) * (len(c["ents"]) - 1) // 2 for c in IX["chunks"]); assert sum(e[2] for e in IX["edges"]) == n  # peso total = pares por parágrafo


def test_caminhos_sao_arestas_reais():
    edges = {frozenset((IX["entities"][a]["name"], IX["entities"][b]["name"])) for a, b, _ in IX["edges"]}
    for x in QS:
        if x.get("refuse"): continue
        for h in rag.answer(IX, x["q"], x["hops"])["hits"]:
            for u, v in zip(h["via"], h["via"][1:]): assert frozenset((u, v)) in edges, (x["q"], h["via"])


def test_recusa_e_hops0():
    r = rag.answer(IX, "quem ganhou a copa de 2014?"); assert r["status"] == "refused" and r["answer"] is None
    r0 = rag.answer(IX, QS[0]["q"], 0); assert all(h["via"] == [] for h in r0["hits"])  # 0 saltos: nada entra "pelo grafo"


def test_frase_literal_e_citacao():
    docs = " ".join(" ".join(f.read_text("utf-8").split()) for f in (H / "data").glob("*.md"))
    for x in (x for x in QS if not x.get("refuse")):
        r = rag.answer(IX, x["q"], x["hops"]); assert r["status"] == "answered"
        for part in re.split(r"\s*\[\d+\]\s*", r["answer"]):
            if part: assert part in docs, part
        assert max(int(m) for m in re.findall(r"\[(\d+)\]", r["answer"])) == len(r["sources"])


def test_recall_honesto():
    """Mede (não promete): recall@3 do baseline léxico x grafo nas perguntas com gabarito. Neste corpus minúsculo o grafo NÃO ganha; o teste só trava o piso."""
    qs = [x for x in QS if "gold" in x]; b = g = 0
    for x in qs:
        r = rag.answer(IX, x["q"], x["hops"]); gold = set(x["gold"])
        b += len(gold & set(r["baseline"])) / len(gold); g += len(gold & {h["id"] for h in r["hits"][:3]}) / len(gold)
    b, g = b / len(qs), g / len(qs); print(f"recall@3 baseline {b:.3f} | grafo {g:.3f} ({len(qs)} perguntas)")
    assert b >= 0.75 and g >= 0.75


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), QS):
        py = rag.answer(IX, x["q"], x.get("hops", 1))
        assert (js["status"], js["answer"], js["ids"], js["via"]) == (py["status"], py["answer"], [h["id"] for h in py["hits"]], [h["via"] for h in py["hits"]]), (x["q"], js, py["answer"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
