"""Pré-calcula o índice (itens, tipo, flags, destaques, BM25, n-gramas) -> demo/index.json + demo/index.js; grava results/metrics.json."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); T = json.loads((H / "data" / "tests.json").read_text("utf-8")); ix["tests"] = T
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
(H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps(rag.evaluate(rag.build(), T), indent=1, ensure_ascii=False), "utf-8")
print(len(ix["chunks"]), "itens ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
