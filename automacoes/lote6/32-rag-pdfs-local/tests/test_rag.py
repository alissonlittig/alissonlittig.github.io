import math, pathlib, re, sys, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import run_scenarios, rag

R, IX = run_scenarios.main(); n = 0; DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"
def check(c, m):
    global n
    assert c, m; n += 1; print("ok", m)

check(len(IX["chunks"]) == 15 and {c["file"] for c in IX["chunks"]} == {"politica_reembolso.pdf", "manual_atendimento.pdf", "guia_acesso_ti.pdf"}, "3 PDFs reais indexados em 15 trechos")
# BM25 conferido à mão num caso mínimo: N=2, df=1, tf=1, dl=avgdl=3 -> ln(2)
toy = rag.index_from([{"file": "a", "page": 1, "section": "", "text": "gato come peixe"}, {"file": "b", "page": 1, "section": "", "text": "cachorro come osso"}])
check(abs(rag.bm25(toy, ["gato"], toy["chunks"][0]) - math.log(2)) < 1e-9 and rag.bm25(toy, ["gato"], toy["chunks"][1]) == 0, "BM25 bate com a conta à mão (ln 2) e dá 0 para trecho sem o termo")
src = lambda k: (R[k]["sources"][0]["file"], R[k]["sources"][0]["page"]) if R[k]["sources"] else None
for k, want in (("prazo", ("politica_reembolso.pdf", 1)), ("jantar", ("politica_reembolso.pdf", 2)), ("senha", ("guia_acesso_ti.pdf", 1)), ("sabado", ("manual_atendimento.pdf", 1)), ("multa", ("manual_atendimento.pdf", 2))):
    check(R[k]["status"] == "answered" and src(k) == want, f"'{R[k]['input']['pergunta']}' -> {want[0]} p.{want[1]}")
check("30 dias corridos" in R["prazo"]["answer"] and "R$ 120 para jantar" in R["jantar"]["answer"] and "Aos sábados o chat atende das 9h às 13h" in R["sabado"]["answer"], "a frase certa vem na resposta (prazo 30 dias, jantar R$ 120, sábado 9h-13h)")
# resposta extrativa: toda frase devolvida existe no texto bruto dos PDFs (nada inventado)
raw = {f.name: re.sub(r"\s+", " ", " ".join(t for _, t in rag.load_pdf(f))) for f in DOCS.glob("*.pdf")}
for k in ("prazo", "jantar", "senha", "sabado", "multa", "bitcoin"):
    check(all(s in raw[R[k]["sources"][0]["file"]] for s in rag.sentences(R[k]["answer"])), f"{k}: cada frase da resposta aparece palavra por palavra no PDF citado")
f = R["fora"]; check(f["status"] == "refused" and f["answer"] is None and f["sources"] == [] and "não encontrei" in f["reason"], "pergunta fora dos documentos: recusa, sem fonte e sem chute")
b = R["bitcoin"]; check(b["status"] == "partial" and b["unmatched"] == ["bitcoin"], "termo que não existe nos PDFs (bitcoin): resposta marcada PARCIAL e o termo é apontado")
v = R["vazia"]; check(v["status"] == "refused" and v["terms"] == [] and "palavras comuns" in v["reason"], "pergunta só com palavras comuns: pede reescrita")
check(rag.tokens("Aos SÁBADOS, o chat às 9h") == ["sabado", "chat", "9h"], "normaliza acento, caixa e plural; tira palavras comuns")
with tempfile.TemporaryDirectory() as d:
    try: rag.build_index(d); check(False, "pasta sem PDF")
    except ValueError as e: check("nenhum texto extraído" in str(e), "pasta sem PDF (ou PDF escaneado): erro claro, sem índice vazio")
print(n, "ok")
