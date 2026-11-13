"""python tests/test_rag.py (ou pytest). Guardrail, métricas conferidas à mão, resposta sempre = texto da FAQ, paridade Python x JS."""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).parent.parent; sys.path.insert(0, str(H))
sys.modules.pop("rag", None)  # pytest roda os 4 projetos no mesmo processo; cada um tem seu rag.py
import rag

IX = rag.build(); TESTS = json.loads((H / "data" / "tests.json").read_text("utf-8"))


def test_pergunta_igual_a_faq_responde_com_confianca_alta():
    for f in IX["faq"]:
        r = rag.ask(IX, f["q"]); assert r["decision"] == "answer" and r["faq"] == f["id"] and r["conf"] >= 0.8, (f["q"], r["conf"])


def test_resposta_e_sempre_texto_cadastrado():
    for x in TESTS:
        r = rag.ask(IX, x["q"]); assert r["answer"] is None or r["answer"] in {f["a"] for f in IX["faq"]}  # nunca texto gerado


def test_sem_evidencia_diz_nao_sei():
    for q in ["receita de bolo de cenoura", "como fazer um currículo", "xyzzy qwerty", "?"]:
        r = rag.ask(IX, q); assert r["decision"] == "idk" and r["answer"] is None, (q, r["conf"])


def test_limiar_mais_alto_nunca_responde_mais():
    prev = 10 ** 9
    for t in rag.SWEEP: n = sum(rag.ask(IX, x["q"], t)["decision"] == "answer" for x in TESTS); assert n <= prev; prev = n


def test_metricas_na_mao():
    mini = [{"q": "Qual o prazo de entrega?", "faq": 0}, {"q": "receita de bolo de cenoura", "faq": None}, {"q": "Qual o prazo de entrega?", "faq": 5}]
    e = rag.evaluate(IX, mini, 0.5); assert (e["correct"], e["wrong"], e["oos_refused"], e["oos_answered"]) == (1, 1, 1, 0) and e["coverage"] == 0.5 and e["precision"] == 0.5


def test_paridade_js():
    d = json.loads(subprocess.run(["node", str(H / "tests" / "parity.js")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    for x, js in zip(TESTS, d["ask"]):
        py = rag.ask(IX, x["q"]); assert (js["decision"], js["faq"], js["conf"]) == (py["decision"], py["faq"], py["conf"]), x["q"]
    dev, held = rag.split(TESTS)
    for t, (a, b, c) in zip(rag.SWEEP, d["ev"]): assert (a, b, c) == (rag.evaluate(IX, dev, t), rag.evaluate(IX, held, t), rag.evaluate(IX, held, t, False)), t


if __name__ == "__main__":
    t = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for f in t: f(); print("ok", f.__name__)
    print(f"{len(t)} grupos de teste verdes ({len(TESTS)} perguntas, {len(IX['faq'])} FAQs)")
