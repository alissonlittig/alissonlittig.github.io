"""python tests/test_rag.py  (ou pytest). Confere: BM25 à mão, recuperação certa, recusa, frase literal no documento, e paridade Python x JS."""
import json, pathlib, subprocess, sys, math
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda os 4 projetos no mesmo processo
import rag, rag_core as C

IX = rag.build(); QS = json.loads((H / "tests" / "questions.json").read_text("utf-8"))


def test_bm25_na_mao():  # 1 termo em 1 de 2 docs, tf=1, dl=avgdl: idf=ln(1+(2-1+.5)/(1+.5))=ln2; tf-part=(k1+1)/(1+k1)=1
    bix, toks = C.bm25_index(["gato preto", "cachorro marrom"])
    assert abs(C.bm25_score(bix, C.tokens("gato"), toks[0]) - math.log(2)) < 1e-9 and C.bm25_score(bix, C.tokens("gato"), toks[1]) == 0


def test_perguntas_com_resposta():
    for x in (x for x in QS if not x.get("refuse")):
        r = rag.answer(IX, x["q"])
        assert r["status"] == "answered", (x["q"], r.get("reason"))
        assert (r["sources"][0]["doc"], r["sources"][0]["section"]) == (x["doc"], x["section"]) or any((s["doc"], s["section"]) == (x["doc"], x["section"]) for s in r["sources"]), (x["q"], r["sources"])


def test_recusa():
    for x in (x for x in QS if x.get("refuse")):
        r = rag.answer(IX, x["q"]); assert r["status"] == "refused" and r["answer"] is None, (x["q"], r["answer"])


def test_frase_literal_e_citacao():
    docs = {f.name: " ".join(f.read_text("utf-8").split()) for f in (H / "data").glob("*.md")}
    for x in (x for x in QS if not x.get("refuse")):
        r = rag.answer(IX, x["q"])
        for part in __import__("re").split(r"\s*\[\d+\]\s*", r["answer"]):
            if part: assert any(part in d for d in docs.values()), part  # toda frase devolvida existe palavra por palavra num documento
        n = max(int(m) for m in __import__("re").findall(r"\[(\d+)\]", r["answer"])); assert n == len(r["sources"])


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), QS):
        py = rag.answer(IX, x["q"])
        assert (js["status"], js["answer"], js["coverage"]) == (py["status"], py["answer"], py["coverage"]), (x["q"], js, py["answer"])
        assert js["hits"] == [h[0] for h in py["hits"]], x["q"]


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(QS)} perguntas)")
