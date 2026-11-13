"""python tests/test_rag_16.py  (ou pytest). Confere: reescrita (enchimento sai, termos técnicos entram), regras do dicionário em ASCII, 'antes x depois' no DEV e no TESTE,
HyDE sem LLM não é melhor que a reescrita (o teste trava essa conclusão), e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag

IX = rag.build(); DEV, TEST = IX["dev"], IX["test"]


def test_reescrita_tira_enchimento_e_poe_termo_tecnico():
    r = rag.rewrite(IX, "oi, queria saber: meu cachorro tá com a barriga ruim"); assert "oi" in r["removed"] and "queria" in r["removed"]
    assert {"diarreia", "barriga"} <= set(r["text"].split())  # termo técnico entra e a pergunta original continua na consulta
    assert [a["rule"] for a in r["added"]] == ["barriga ruim"]


def test_regras_em_ascii():
    """A consulta é normalizada (sem acento) antes de casar: regra com acento nunca dispara (bug já ocorrido com 'coçando')."""
    assert all(pat.isascii() for pat, _ in IX["rules"])


def test_antes_e_depois_exemplo():
    q = "tem como parcelar o atendimento?"; raw, rw = rag.search(IX, q, "raw"), rag.search(IX, q, "rewrite")
    assert rag.rank_of(IX, raw, "pagamento") > 10 and rag.rank_of(IX, rw, "pagamento") == 1


def test_metricas_dev_e_teste():
    dev, _ = rag.evaluate(IX, DEV); te, _ = rag.evaluate(IX, TEST); print("DEV", dev, "| TESTE", te)
    assert te["rewrite"]["hit1"] > te["raw"]["hit1"] and te["rewrite"]["mrr"] > te["raw"]["mrr"] and te["rewrite"]["worse"] == 0  # reescrita ajuda no TESTE, que não foi usado para escrever o dicionário
    assert dev["rewrite"]["hit1"] > te["rewrite"]["hit1"]  # DEV foi usado para escrever o dicionário: sempre melhor que o TESTE (o número do DEV não vale como medida)


def test_hyde_sem_llm_nao_ganha_da_reescrita():
    te, _ = rag.evaluate(IX, TEST); assert te["hyde"]["hit1"] == te["rewrite"]["hit1"] and te["hyde"]["worse"] >= 1  # piora algumas perguntas e melhora outras; conclusão registrada no README


def test_paridade_js():
    js = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for row, x in zip(js["q"], DEV + TEST):
        for (query, rk), m in zip(row, ("raw", "rewrite", "hyde")):
            r = rag.search(IX, x["q"], m); assert (query, rk) == (r["query"], rag.rank_of(IX, r, x["gold"])), (x["q"], m, query, r["query"])
    assert js["dev"] == rag.evaluate(IX, DEV)[0] and js["test"] == rag.evaluate(IX, TEST)[0]


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
