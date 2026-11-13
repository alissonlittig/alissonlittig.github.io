"""Pré-calcula o índice (léxico, df de BM25 por conceito e por palavra, vetores de n-gramas) -> demo/index.json + demo/index.js; grava results/metrics.json."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); tests = json.loads((H / "data" / "tests.json").read_text("utf-8")); ix["tests"] = tests
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
main, extra = [t for t in tests if not t.get("set")], [t for t in tests if t.get("set")]
out = {"main": {m: rag.evaluate(ix, main, m) for m in rag.MODES}, "extra": {m: rag.evaluate(ix, extra, m) for m in rag.MODES}, "coverage_min": rag.COVERAGE_MIN}
(H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), "utf-8")
print(len(ix["docs"]), "documentos ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
