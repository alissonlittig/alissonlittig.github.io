"""Pré-calcula o índice e grava demo/index.json + demo/index.js (mesmo JSON em <script>: a demo abre por duplo clique, sem servidor)."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); (H / "demo").mkdir(exist_ok=True)
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8")
(H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
print("indice ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
