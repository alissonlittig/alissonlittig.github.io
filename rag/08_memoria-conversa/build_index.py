"""Pré-calcula o índice (trechos, slots, BM25, n-gramas) -> demo/index.json + demo/index.js; grava results/metrics.json (acerto por tamanho de janela de memória)."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); tests = json.loads((H / "data" / "tests.json").read_text("utf-8")); ix["tests"] = tests
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
(H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps([rag.evaluate(rag.build(), tests, w) for w in range(5)], indent=1, ensure_ascii=False), "utf-8")
print(len(ix["docs"]), "trechos ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
