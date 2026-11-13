"""python tests/test_rag_05.py (ou pytest). Cálculo conferido à mão, recusa, fonte = linha real do CSV, paridade Python x JS."""
import csv, json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda vários projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); TESTS = json.loads((H / "data" / "tests.json").read_text("utf-8"))
RAW = list(csv.reader(open(H / "data" / "vendas.csv", encoding="utf-8", newline="")))


def test_conta_na_mao():
    r = rag.ask(IX, "Quanto vendemos no total?"); assert r["value"] == sum(int(x[9]) for x in RAW[1:]) == 11190
    r = rag.ask(IX, "Quantos pedidos foram feitos em Londrina?"); assert r["value"] == sum(1 for x in RAW[1:] if x[3] == "Londrina")


def test_fonte_e_linha_real_do_csv():
    for q in ["Quanto a Ana vendeu em março?", "Qual a maior venda do Bruno?", "Qual cidade vendeu mais?"]:
        r = rag.ask(IX, q); assert r["sources"], q
        for s in r["sources"]: assert RAW[s["line"] - 1][0] == s["row"][0], (q, s)  # linha N do arquivo = pedido citado


def test_filtros_valem_nas_fontes():
    r = rag.ask(IX, "Quanto a Ana vendeu em março?"); assert all(s["row"][6] == "Ana" and s["row"][2] == "março" for s in r["sources"])


def test_maior_venda_aponta_a_linha_do_maximo():
    r = rag.ask(IX, "Qual a maior venda do Bruno?"); assert r["sources"][0]["row"][9] == r["value"]


def test_recusa_termo_que_nao_existe():
    for q in ["Qual a margem de lucro?", "Quanto gastamos com frete?", "como fazer bolo", "Quantos pedidos foram feitos em Florianópolis?", "?"]: assert rag.ask(IX, q)["status"] == "refused", q


def test_perguntas_de_desenvolvimento():
    e = rag.evaluate(IX, [t for t in TESTS if not t.get("set")]); assert not e["wrong"], e["wrong"]


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for js in d:
        py = rag.ask(IX, js["q"]); assert (js["status"], js["first"]) == (py["status"], py.get("first")), js["q"]
        assert (js["value"] is None) == (py["value"] is None) and (py["value"] is None or abs(js["value"] - py["value"]) < 0.006), js["q"]
        assert js["table"] == py["table"] and js["lines"] == [s["line"] for s in py["sources"]], js["q"]
        assert all(abs(a - s["bm25"]) < 1e-3 for a, s in zip(js["bm"], py["sources"])), js["q"]


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(TESTS)} perguntas, {len(IX['rows'])} linhas)")
