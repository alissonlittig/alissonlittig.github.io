"""Indexa os PDFs de docs/ de verdade (pypdf) e responde 8 perguntas. Grava output/index.json (trechos extraídos) e output/scenarios.json."""
import json, pathlib
import rag
HERE = pathlib.Path(__file__).parent
SEQ = [("prazo", "qual o prazo para pedir reembolso?"), ("jantar", "qual o limite para jantar em viagem?"), ("senha", "como redefinir minha senha?"), ("sabado", "qual o horário de atendimento no sábado?"),
       ("multa", "cancelar contrato tem multa?"), ("bitcoin", "como pedir reembolso de bitcoin?"), ("fora", "qual a capital da França?"), ("vazia", "como é o que?")]
KEEP = ("status", "answer", "terms", "unmatched", "coverage", "sources")


def main():
    ix = rag.build_index(HERE / "docs"); R = {}
    for k, q in SEQ: r = rag.answer(ix, q); R[k] = {"input": {"pergunta": q}, **{x: r[x] for x in KEEP}, "reason": r.get("reason")}
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "index.json").write_text(json.dumps([{x: c[x] for x in ("file", "page", "section", "text")} for c in ix["chunks"]], ensure_ascii=False, indent=1), "utf-8")
    (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R, ix


if __name__ == "__main__": main(); print("ok")
