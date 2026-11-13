"""Pré-calcula o índice (BM25, n-gramas) e grava demo/index.json + demo/index.js (window.RAG_INDEX) com as perguntas de teste; grava results/metrics.json (varredura de limiar, DEV x TESTE, com/sem glossário)."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); tests = json.loads((H / "data" / "tests.json").read_text("utf-8")); ix["tests"] = tests
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
dev, held = rag.split(tests); out = {"default_t": rag.T_DEFAULT}
for nome, ts in (("dev", dev), ("teste", held)):
    out[nome] = {"com_glossario": [rag.evaluate(ix, ts, t) for t in rag.SWEEP], "sem_glossario": [rag.evaluate(ix, ts, t, False) for t in rag.SWEEP]}
(H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps(out, indent=1), "utf-8")
print(len(ix["faq"]), "FAQs ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
