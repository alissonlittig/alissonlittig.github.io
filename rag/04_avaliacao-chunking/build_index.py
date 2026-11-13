"""Pré-calcula, para cada estratégia de chunking, os trechos + df do BM25 -> demo/index.json e demo/index.js; grava results/metrics.json e results/tabela.md."""
import json, pathlib, rag
H = pathlib.Path(__file__).parent
ix = rag.build(); js = json.dumps(ix, ensure_ascii=False, separators=(",", ":")); (H / "demo" / "index.json").write_text(js, "utf-8"); (H / "demo" / "index.js").write_text("window.RAG_INDEX=" + js + ";", "utf-8")
ev = {n: rag.evaluate_cfg(c, ix["questions"]) for n, c in ix["configs"].items()}; (H / "results").mkdir(exist_ok=True); (H / "results" / "metrics.json").write_text(json.dumps(ev, indent=1), "utf-8")
rows = ["| estratégia | trechos | palavras/trecho | hit@1 | hit@3 | MRR | teto | contexto (palavras, top-3) |", "|---|--:|--:|--:|--:|--:|--:|--:|"]
rows += [f"| {n} | {e['chunks']} | {e['avg_words']} | {e['hit@1']} | {e['hit@3']} | {e['mrr']} | {e['ceiling']} | {e['ctx_words']} |" for n, e in ev.items()]
(H / "results" / "tabela.md").write_text("\n".join(rows) + "\n", "utf-8"); print(len(ix["configs"]), "estratégias ->", (H / "demo" / "index.json").stat().st_size // 1024, "KB")
