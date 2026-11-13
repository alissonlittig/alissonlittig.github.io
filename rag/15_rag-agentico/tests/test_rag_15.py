"""python tests/test_rag_15.py  (ou pytest). Confere: calculadora segura, fatos extraídos por regex, rotas (buscar/calcular/perguntar/recusar), pergunta de volta + retomada,
linha de base (RAG simples não calcula), DEV x TESTE e paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)
import rag

IX = rag.build(); TS = json.loads((H / "data" / "tests.json").read_text("utf-8"))
route = lambda r: [s["k"] for s in r["steps"] if s["k"] != "pensar"]


def test_calculadora_segura():
    assert rag.calc("350*0.62+18") == 235.0 and rag.calc("400*0.95-(400*0.62+18)") == 114.0 and rag.calc("-2*(3+1)") == -8.0
    for bad in ("__import__('os')", "1+", "2**3", "abc"):
        try: rag.calc(bad); raise AssertionError(bad)
        except (ValueError, IndexError): pass


def test_fatos_extraidos_por_regex():
    f = {c["facts"]["plano"]: c["facts"] for c in IX["chunks"] if "plano" in c["facts"]}
    assert f["casa"] == {"plano": "casa", "tarifa": 0.62, "taxa": 18.0, "min": 151, "max": 500} and f["solo"]["max"] == 150 and f["empresa"]["min"] == 501
    assert any(c["facts"].get("ref") == 0.95 for c in IX["chunks"])


def test_rotas_e_numeros():
    r = rag.agent(IX, "quanto vou pagar com 350 kWh no plano Casa?"); assert route(r) == ["buscar", "calcular", "responder"] and "R$ 235,00" in r["reply"] and r["cite"]
    r = rag.agent(IX, "qual a diferença entre Casa e Empresa para 600 kWh?"); assert "R$ 15,00" in r["reply"] and route(r).count("calcular") == 3
    r = rag.agent(IX, "quanto economizo com 10 kWh no plano Empresa?"); assert "a mais" in r["reply"]  # economia negativa vira aviso, não número com sinal
    assert route(rag.agent(IX, "quanto custa a adesão?")) == ["buscar", "responder"]  # 'quanto custa' sem contexto de fatura não vira conta


def test_pergunta_de_volta_e_retomada():
    a = rag.agent(IX, "quanto economizo no plano Casa?"); assert a["kind"] == "ask" and a["state"]["pending"] == "kwh" and route(a) == ["perguntar"]
    b = rag.agent(IX, "uns 400 kwh", a["state"]); assert b["kind"] == "answer" and "R$ 114,00" in b["reply"] and b["state"] == {}
    c = rag.agent(IX, "quanto custa a adesão?", a["state"]); assert "R$ 90,00" in c["reply"]  # pendência ignorada se a pessoa muda de assunto


def test_nao_inventa_plano_nem_consumo():
    assert rag.agent(IX, "quanto custa o plano Premium com 200 kWh?")["kind"] == "refuse"
    assert rag.agent(IX, "quanto pago com 99999999 kWh no plano Casa?")["kind"] == "refuse"


def test_linha_de_base_nao_calcula():
    ev = rag.evaluate(IX, TS); assert ev["calc_n"] == 7 and ev["simple_calc_ok"] == 0 and ev["answer_ok"] == ev["n"]


def test_metricas_dev_teste():
    dev, te = rag.evaluate(IX, TS[0::2]), rag.evaluate(IX, TS[1::2]); print("DEV", dev, "| TESTE", te)
    assert dev["route_ok"] / dev["n"] >= 0.9 and te["route_ok"] / te["n"] >= 0.9 and dev["answer_ok"] == dev["kind_ok"]  # T=0.5 fixado antes


def test_paridade_js():
    out = subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout; js = json.loads(out)
    sig = lambda r: {"kind": r["kind"], "reply": r["reply"], "steps": [[s["k"], s.get("expr"), s.get("res")] for s in r["steps"]]}
    py = [sig(rag.agent(IX, x["q"])) for x in TS]; a = rag.agent(IX, "quanto economizo no plano Casa?"); py += [sig(a), sig(rag.agent(IX, "uns 400 kwh", a["state"]))]
    for x, y, q in zip(js, py, [t["q"] for t in TS] + ["pendente", "retomada"]): assert x == y, (q, x, y)


if __name__ == "__main__":
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith("test_"):
            try: f(); print("OK  ", n)
            except Exception as e: fails += 1; print("FALHA", n, repr(e)[:300])
    sys.exit(1 if fails else 0)
