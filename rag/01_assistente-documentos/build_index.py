"""Pré-calcula o índice (chunks, df do BM25, idf e vetores de n-gramas) e grava demo/index.json + copia o núcleo JS para a demo."""
import json, pathlib, shutil, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); (H / "demo").mkdir(exist_ok=True)
js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8")
(H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")  # mesmo JSON em <script>: a demo abre até por duplo clique (file://), sem servidor
print(len(ix["chunks"]), "trechos ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
