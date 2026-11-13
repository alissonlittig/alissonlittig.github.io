"""python tests/test_rag_19.py (ou pytest). Cache: acerto/erro, acerto falso contado, custo simulado coerente, limiar DEV/TESTE, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); ST = IX["stream"]


def test_fluxo_tem_100_perguntas_e_20_intencoes_divididas_em_dev_teste():
    assert len(ST) == 100 and len({x["intent"] for x in ST}) == 20 and {x["dev"] for x in ST} == {True, False}
    assert {x["intent"] for x in ST if x["dev"]}.isdisjoint({x["intent"] for x in ST if not x["dev"]})


def test_sem_cache_limiar_alto_nenhum_acerto_e_custo_igual_ao_base():
    r = rag.replay(IX, ST, "ng", 1.01); assert r["hits"] == 0 and r["llm_calls"] == 100 and r["saved_pct"] == 0.0 and abs(r["usd"] - r["base_usd"]) < 1e-12


def test_pergunta_repetida_exata_e_acerto_com_similaridade_1():
    r = rag.replay(IX, [ST[0], ST[0]], "ng", 0.9)["rows"]; assert not r[0]["hit"] and r[1]["hit"] and r[1]["sim"] == 1.0 and r[1]["ok"]


def test_limiar_baixo_gera_acerto_falso_e_ele_e_contado():
    r = rag.replay(IX, ST, "ng", 0.3); assert r["base_wrong"] == 0  # sem cache o RAG acerta tudo neste FAQ pequeno
    assert r["false_hits"] > 0 and r["wrong"] == r["false_hits"] == sum(1 for x in r["rows"] if not x["ok"])


def test_acerto_so_dos_acima_do_limiar():
    for t in (0.4, 0.6):
        for x in rag.replay(IX, ST, "ngx", t)["rows"]: assert (x["sim"] >= t - 1e-4) if x["hit"] else (x["sim"] < t + 1e-4)


def test_economia_cresce_quando_o_limiar_baixa():
    s = [rag.replay(IX, ST, "ngx", t)["saved_pct"] for t in (0.9, 0.7, 0.5, 0.3)]; assert s == sorted(s) and s[-1] > s[0]


def test_custo_simulado_bate_com_a_formula():
    c = rag.llm_cost(IX, "teste de custo", [0, 1, 2]); s = IX["sim"]; w = lambda t: len(t.split()) * s["tok_per_word"]
    tin = s["sys_tokens"] + w("teste de custo") + sum(w(IX["docs"][i]["text"]) for i in (0, 1, 2)); tout = w(IX["docs"][0]["text"])
    assert c["tin"] == round(tin) and c["tout"] == round(tout) and abs(c["usd"] - (tin * 0.5 + tout * 1.5) / 1e6) < 1e-12 and c["ms"] == round(700 + 22 * tout)


def test_limiar_escolhido_no_dev_respeita_o_teto_de_acerto_falso_no_dev_e_teste_e_separado():
    for k in rag.KINDS:
        t = rag.pick(IX, k)
        if t <= 1: assert rag.replay(IX, [x for x in ST if x["dev"]], k, t)["false_hit_rate"] <= rag.MAX_FALSE


def test_lsa_pequeno_fica_desligado():
    assert rag.pick(IX, "lsa") > 1  # achado honesto: LSA de 20 documentos não separa as intenções


def test_latencia_medida_e_positiva():
    m = rag.measure(IX, 1); assert all(m[k]["p50_ms"] > 0 for k in m)


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    assert d["ret"] == [rag.retrieve(IX, x["q"]) for x in ST]
    for key, v in d["rep"].items():
        k, t = key.split("|"); r = rag.replay(IX, ST, k, float(t)); assert v == [r["hits"], r["false_hits"], r["wrong"], r["saved_pct"]], key
        assert d["rep_rows"][key] == [x["hit"] for x in r["rows"]], key
    py = rag.report(IX)
    for k in rag.KINDS: assert (d["report"][k]["threshold"], d["report"][k]["hits"], d["report"][k]["false_hits"], d["report"][k]["saved_pct"]) == (py[k]["threshold"], py[k]["hits"], py[k]["false_hits"], py[k]["saved_pct"]), k


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(ST)} perguntas, {len(IX['docs'])} respostas)")
