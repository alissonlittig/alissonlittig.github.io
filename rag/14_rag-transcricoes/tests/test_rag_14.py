"""python tests/test_rag_14.py  (ou pytest). Confere: timestamps do parser, resposta com mm:ss certo, pré-filtro por gravação, sem sobreposição nos resultados,
recusa fora de escopo, DEV x TESTE, efeito do tamanho da janela e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag

IX = rag.build(); TS = json.loads((H / "data" / "tests.json").read_text("utf-8"))


def test_parser_e_janelas():
    assert [d["id"] for d in IX["docs"]] == ["aula_tabela_dinamica", "kickoff_rota_leve", "orcamento_trimestre"]
    s = next(x for x in IX["segs"] if x["doc"] == "kickoff_rota_leve" and x["t"] == 18); assert s["who"] == "Marina" and "18 de maio" in s["text"]
    assert all(w["t0"] <= w["t1"] for w in IX["wins"]) and rag.mmss(125) == "02:05" and rag.sec("11:20") == 680


def test_resposta_cita_o_minuto_certo():
    a = rag.ask(IX, "quando sai o beta?")["answer"]; assert (a["doc"], a["ts"], a["who"]) == ("kickoff_rota_leve", "00:18", "Marina")
    a = rag.ask(IX, "quando vence o contrato do servidor?")["answer"]; assert (a["doc"], a["ts"]) == ("orcamento_trimestre", "07:10")


def test_pre_filtro_por_gravacao():
    r = rag.ask(IX, "como atualizar", doc="aula_tabela_dinamica"); assert r["hits"] and all(h["doc"] == "aula_tabela_dinamica" for h in r["hits"])
    assert rag.ask(IX, "quando sai o beta?", doc="orcamento_trimestre")["answer"] is None  # beta não existe na gravação do financeiro


def test_resultados_nao_se_sobrepoem():
    for x in TS[:12]:
        hs = rag.ask(IX, x["q"])["hits"]
        for i, a in enumerate(hs):
            for b in hs[i + 1:]: assert a["doc"] != b["doc"] or a["b"] < b["a"] or a["a"] > b["b"], x["q"]


def test_fora_de_escopo_recusa():
    for q in ("qual o preço do bitcoin hoje?", "qual a capital da França?"): assert rag.ask(IX, q)["answer"] is None, q


def test_metricas_dev_teste():
    dev, te = rag.evaluate(TS[0::2], ix=IX), rag.evaluate(TS[1::2], ix=IX); print("DEV", dev, "| TESTE", te)
    assert dev["hit3"] >= 0.9 and te["hit3"] >= 0.85 and dev["oos_refused"] == dev["oos"] and te["oos_refused"] == te["oos"]  # W=3 e T=0.45 fixados antes de medir o TESTE


def test_janela_maior_ajuda_a_achar():
    w1, w3 = rag.evaluate(TS, W=1), rag.evaluate(TS, W=3); assert w3["hit1"] > w1["hit1"] and w3["mrr"] > w1["mrr"]


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    for js, x in zip(json.loads(out), TS):
        py = rag.ask(IX, x["q"]); assert js["hits"] == [h["id"] for h in py["hits"]] and abs(js["conf"] - py["conf"]) < 1e-9 and js["seg"] == (py["answer"] or {}).get("seg"), (x["q"], js, py["conf"])


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
