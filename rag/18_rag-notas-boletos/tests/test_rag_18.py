"""python tests/test_rag_18.py (ou pytest). Extração dos PDFs == gabarito, soma em centavos, recusa, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); T = IX["tests"]; GAB = json.loads((H / "data" / "gabarito.json").read_text("utf-8"))


def test_extracao_dos_pdfs_bate_com_o_gabarito():
    assert IX["errors"] == [] and len(IX["docs"]) == len(GAB) == 37
    got = {(d["file"], d["page"]): d for d in IX["docs"]}
    for g in GAB:
        d = got[(g["file"], g["page"])]
        assert (d["kind"], d["issuer"], d["category"], d["date"], d["amount"], d["status"], d["due"]) == (g["kind"], g["issuer"], g["category"], g["date"], g["amount"], g["status"], g["due"]), g


def test_pdf_de_4_paginas_vira_4_documentos_com_pagina():
    c = [d for d in IX["docs"] if d["file"] == "condominio_2026_ago_nov.pdf"]; assert sorted(d["page"] for d in c) == [1, 2, 3, 4] and [d["status"] for d in sorted(c, key=lambda d: d["page"])] == ["pago"] * 3 + ["aberto"]


def test_perguntas_de_teste_total_e_contagem_exatos():
    e = rag.evaluate(IX, T); assert e["exact"] == 1.0, e["wrong"]


def test_valor_distrator_nao_e_somado():
    r = rag.answer(IX, "Quanto paguei no Mercado Bom Preço em agosto?"); assert r["total"] == 31248 + 19876  # "valor dos tributos" (17%) existe no PDF e não entra


def test_boleto_pago_conta_no_mes_do_pagamento():
    d = next(d for d in IX["docs"] if d["file"] == "condominio_2026_ago_nov.pdf" and d["page"] == 2); assert d["date"] == "2026-09-09" and d["due"] == "2026-09-10"


def test_aberto_nao_entra_no_paguei():
    assert rag.answer(IX, "Quanto paguei de energia em novembro?")["total"] == 0 and rag.answer(IX, "Quanto devo de energia?")["total"] == 20510


def test_fora_do_escopo_recusa_e_nao_soma_tudo():
    for q in T["oos"]: assert rag.answer(IX, q)["status"] == "refused", q


def test_emitente_vence_categoria():
    assert rag.parse_q(IX, "gastei no mercado bom preço")["entity"]["name"] == "Mercado Bom Preço Ltda." and rag.parse_q(IX, "gastei no mercado")["entity"]["name"] == "supermercado"


def test_todo_emitente_tem_entidade():
    nomes = {e["name"] for e in IX["entities"] if e["kind"] == "emitente"}; assert {d["issuer"] for d in IX["docs"]} <= nomes


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for js in d["ask"]:
        py = rag.answer(IX, js["q"]); assert (js["status"], js["total"], js["count"], [h["id"] for h in js["docs"]], js["agg"], js["max"]) == (py["status"], py["total"], py["count"], [h["id"] for h in py["docs"]], py["parsed"]["agg"], py["max"]), js["q"]
        assert [h["bm25"] for h in js["docs"]] == [h["bm25"] for h in py["docs"]], js["q"]
    assert d["ev"]["exact"] == rag.evaluate(IX, T)["exact"]


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(T['questions']) + len(T['oos'])} perguntas, {len(IX['docs'])} documentos em {len({d['file'] for d in IX['docs']})} PDFs)")
