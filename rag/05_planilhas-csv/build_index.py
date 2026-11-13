"""Pré-calcula o índice (linhas, df do BM25, índice de valores) -> demo/index.json + demo/index.js; grava results/metrics.json."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); tests = json.loads((H / "data" / "tests.json").read_text("utf-8")); ix["tests"] = tests
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
ix2 = rag.build(); ev = lambda ts: rag.evaluate(ix2, ts)
(H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps({"dev": ev([t for t in tests if not t.get("set")]), "extra": ev([t for t in tests if t.get("set") == "extra"])}, indent=1, ensure_ascii=False), "utf-8")
print(len(ix["rows"]), "linhas ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
