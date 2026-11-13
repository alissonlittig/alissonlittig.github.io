"""python tests/test_rag_13.py  (ou pytest). Confere: respostas só com campos cadastrados, encaminhamento com chamado, 'clarify' de variante, DEV x TESTE e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag

IX = rag.build(); TS = json.loads((H / "data" / "tests.json").read_text("utf-8"))


def test_resposta_vem_dos_campos_cadastrados():
    r = rag.handle(IX, "quanto custa o vaso aurora grande?"); assert r["kind"] == "answer" and r["doc"] == "prod-aurora-g" and "R$ 139,90" in r["reply"]
    r = rag.handle(IX, "o cachepô de linho tá disponível?"); assert "esgotado" in r["reply"] and "20 dias" in r["reply"]
    r = rag.handle(IX, "tem frete grátis?"); assert r["reply"] == next(d["a"] for d in IX["docs"] if d["id"] == "faq-frete")


def test_variante_ambigua_pergunta_de_volta():
    r = rag.handle(IX, "quanto custa o vaso aurora?"); assert r["kind"] == "clarify" and "Médio" in r["reply"] and "Grande" in r["reply"]


def test_encaminha_com_chamado():
    for q, motivo in (("quero falar com um atendente", "pedido_humano"), ("vou denunciar no procon", "sensivel"), ("meu pedido 48213 não chegou", "pedido"), ("vocês vendem orquídea phalaenopsis?", "sem_base")):
        r = rag.handle(IX, q, ["oi"]); assert r["kind"] == "handoff" and r["ticket"]["motivo"] == motivo and r["ticket"]["mensagens"] == ["oi", q], q


def test_nao_inventa_produto():
    assert rag.handle(IX, "vendem notebook gamer")["kind"] == "handoff"


def test_erro_conhecido_continua_visivel():
    """Limite real, documentado no README: 'vendem iphone' casa com 'vendem no atacado' e é respondido."""
    assert rag.handle(IX, "vocês vendem iphone?")["doc"] == "faq-atacado"


def test_metricas_dev_teste():
    dev, te = rag.evaluate(IX, TS[0::2]), rag.evaluate(IX, TS[1::2]); print("DEV", dev, "| TESTE", te)
    assert dev["wrong_doc"] == 0 and te["wrong_doc"] == 0 and dev["answered_should_handoff"] == 0 and te["answered_should_handoff"] == 0  # o erro tolerado é encaminhar de mais
    assert dev["acc"] >= 0.9 and te["acc"] >= 0.85


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), TS):
        py = rag.handle(IX, x["q"]); assert (js["kind"], js["doc"], js["reply"]) == (py["kind"], py["doc"], py["reply"]), (x["q"], js, py["kind"], py["doc"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
