"""python tests/test_rag_20.py (ou pytest). Versões executadas de verdade, regressão detectada, portão com código de saída, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

HI = rag.build(); AN = rag.analyze(HI); BY = {a["id"]: a for a in AN}; QS = HI["questions"]


def test_sete_versoes_e_50_perguntas_com_6_fora_do_escopo():
    assert len(HI["versions"]) == 7 and len(QS) == 50 and sum(1 for q in QS if q.get("oos")) == 6 and all(len(v["per_q"]) == 50 for v in HI["versions"])


def test_a_melhoria_de_v1_a_v4_e_real():
    n = [v["metrics"]["nota"] for v in HI["versions"]]; assert n[0] < n[1] < n[2] < n[3] and HI["versions"][3]["metrics"]["recall3"] >= 0.95


def test_v5_sobe_a_nota_mas_da_alerta_porque_quebrou_pergunta():
    a = BY["v5"]; assert a["delta"] > 5 and len(a["down"]) >= 2 and a["status"] == "alerta" and HI["versions"][4]["metrics"]["false_refusal"] > 0


def test_v6_e_a_regressao_e_a_pergunta_que_quebrou_tem_acento():
    a = BY["v6"]; assert a["status"] == "regressao" and a["delta"] < -1 and len(a["down"]) >= 1
    assert any("minimo" in QS[i]["q"] or "preco" in QS[i]["q"] or "sao" in QS[i]["q"] for i in a["down"])  # pergunta digitada sem acento


def test_v7_corrige_e_volta_ao_nivel_da_v5():
    assert BY["v7"]["status"] == "ok" and BY["v7"]["nota"] >= BY["v5"]["nota"] and len(BY["v7"]["down"]) == 0


def test_tolerancia_muda_o_status():
    assert rag.analyze(HI, tol=5.0)[5]["status"] != "regressao" and rag.analyze(HI, tol=0.5)[5]["status"] == "regressao"


def test_nota_e_a_media_das_quatro_metricas():
    for v in HI["versions"]:
        m = v["metrics"]; assert abs(m["nota"] - 25 * (m["recall1"] + m["recall3"] + m["mrr"] + m["oos_refusal"])) < 0.01


def test_resultado_de_uma_pergunta_na_mao():
    r = HI["versions"][3]["per_q"][0]; assert QS[0]["q"] == "Quanto custa o plano Pro?" and r["rank"] == 1 and r["top"][0] == "plano_pro" and not r["refused"]
    oos = next(i for i, q in enumerate(QS) if q["q"] == "Qual a capital da França?"); assert HI["versions"][4]["per_q"][oos]["refused"] and not HI["versions"][3]["per_q"][oos]["refused"]


def test_portao_ci_codigo_de_saida():
    run = lambda *a: subprocess.run([sys.executable, str(H / "rag.py"), *a], capture_output=True, text=True, encoding="utf-8", env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"})
    assert run("--gate").returncode == 0 and run("--gate", "v6").returncode == 1


def test_historico_gravado_bate_com_o_build():
    subprocess.run([sys.executable, str(H / "rag.py")], capture_output=True, check=True); h = json.loads((H / "results" / "history.json").read_text("utf-8")); assert h["versions"] == HI["versions"]


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for tol in (0, 1, 2, 5): assert d[str(tol)] == [{**a, "delta": a["delta"]} for a in rag.analyze(HI, float(tol))], tol


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(QS)} perguntas, {len(HI['versions'])} versões)")
