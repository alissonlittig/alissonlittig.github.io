"""Pré-calcula o índice (BM25, n-gramas, LSA) e grava demo/index.json + demo/index.js (window.RAG_INDEX, abre por duplo clique) com as perguntas de avaliação."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); ix["questions"] = json.loads((H / "data" / "questions.json").read_text("utf-8"))
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
ev = rag.evaluate(ix, ix["questions"]); (H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps(ev, indent=1), "utf-8")
print(len(ix["passages"]), "trechos ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
