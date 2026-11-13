"""python tests/test_rag.py (ou pytest). Chunkers conferidos à mão, propriedades (sobreposição, cobertura do texto), métricas e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda os 4 projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); QS = IX["questions"]


def test_janela_fixa_na_mao():
    t = " ".join(str(i) for i in range(10))
    assert rag.fixed(t, 4, 0) == ["0 1 2 3", "4 5 6 7", "8 9"]
    assert rag.fixed(t, 4, 0.25) == ["0 1 2 3", "3 4 5 6", "6 7 8 9"]  # passo 3: cada trecho repete 1 palavra do anterior


def test_frases_e_paragrafos():
    assert rag.by_sentences("A um. B dois. C três.", 2) == ["A um. B dois.", "C três."]
    assert rag.by_paragraph("p1 a\nb\n\np2") == ["p1 a b", "p2"]


def test_nenhuma_palavra_se_perde():
    docs = json.loads((H / "data" / "docs.json").read_text("utf-8"))
    for name, cfg in rag.configs().items():
        for doc, raw in docs.items():
            ch = [c["text"] for c in rag.chunk_all({doc: raw}, cfg)]; assert set(" ".join(raw.split()).split()) <= set(" ".join(ch).split()), (name, doc)


def test_sobreposicao_so_ajuda_o_teto():
    for n in (30, 60, 120, 240): assert rag.evaluate_cfg(IX["configs"][f"fixo{n}_25"], QS)["ceiling"] >= rag.evaluate_cfg(IX["configs"][f"fixo{n}_0"], QS)["ceiling"]


def test_metricas_na_mao():
    ix = rag.index_for([{"id": 0, "doc": "d", "text": "gato preto dorme"}, {"id": 1, "doc": "d", "text": "cachorro marrom corre muito rapido"}])
    e = rag.evaluate_cfg(ix, [{"q": "cachorro corre", "gold": "marrom corre"}, {"q": "gato dorme", "gold": "inexistente"}])
    assert (e["hit@1"], e["hit@3"], e["mrr"], e["ceiling"]) == (0.5, 0.5, 0.5, 0.5)


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for n, c in IX["configs"].items(): assert d["ev"][n] == rag.evaluate_cfg(c, QS), n
    for q, js in zip(QS, d["s"]): assert [i for i, _ in js] == [i for i, _ in rag.search(IX["configs"]["fixo60_25"], q["q"])], q["q"]


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(QS)} perguntas, {len(IX['configs'])} estratégias)")
