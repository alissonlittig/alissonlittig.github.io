"""RAG de código: busca em um repositório pequeno de exemplo e responde com arquivo:linha. 100% local, sem chave, sem LLM.
Chunking pelo AST do Python (módulo, classe, função, método) -> cada chunk guarda arquivo, linha inicial/final, assinatura e docstring.
Indexação: identificadores separados (calcular_frete -> calcular frete; CamelCase também) + docstring + corpo, BM25 + n-gramas, RRF.
Resposta EXTRATIVA: a 1ª linha da docstring do melhor chunk (literal; constante = a linha do código) + [1] = arquivo:linha. Sem evidência -> recusa.
Uso: python rag.py "como validar um CEP?" """
import ast, json, pathlib, re, sys
from math import log
import rag_core as C

HERE = pathlib.Path(__file__).parent
REPO = HERE / "data" / "repo"
MIN_COVERAGE = 0.5


def split_ident(s): return re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s).replace("_", " ")


def chunks_of(path, rel):
    src = path.read_text("utf-8"); lines = src.splitlines(); tree = ast.parse(src); out = []

    def add(kind, name, node, start, end, doc):
        code = lines[start - 1:end]
        out.append({"file": rel, "kind": kind, "name": name, "line": node.lineno if node else 1, "start": start, "end": end,
                    "sig": lines[node.lineno - 1].strip() if node else "", "doc": (doc or "").strip().splitlines()[0] if doc else "", "code": "\n".join(code)})
    mod_doc = ast.get_docstring(tree)
    if mod_doc: add("módulo", rel, None, 1, tree.body[0].end_lineno, mod_doc)

    def walk(body, prefix=""):
        for n in body:
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                add("método" if prefix else "função", prefix + n.name, n, min([d.lineno for d in n.decorator_list] + [n.lineno]), n.end_lineno, ast.get_docstring(n))
            elif isinstance(n, ast.Assign) and not prefix and isinstance(n.targets[0], ast.Name):
                add("constante", n.targets[0].id, n, n.lineno, n.end_lineno, None)
            elif isinstance(n, ast.ClassDef):
                firstm = next((m for m in n.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))), None)
                add("classe", n.name, n, min([d.lineno for d in n.decorator_list] + [n.lineno]), (firstm.lineno - 1 if firstm else n.end_lineno), ast.get_docstring(n))
                walk(n.body, n.name + ".")
    walk(tree.body)
    return out


def index_text(c): return split_ident(c["file"].replace("/", " ").replace(".py", "") + " " + c["name"] + " " + c["sig"]) + " " + c["doc"] + " " + split_ident(c["code"])


def build(repo=REPO):
    repo = pathlib.Path(repo); chunks = [c for f in sorted(repo.rglob("*.py")) if f.name != "smoke.py" for c in chunks_of(f, f.relative_to(repo).as_posix())]
    for i, c in enumerate(chunks): c["id"] = i
    bix, toks = C.bm25_index([index_text(c) for c in chunks]); idf, vecs = C.ng_index(toks)
    r5 = lambda v: {k: round(x, 5) for k, x in v.items()}
    return {"chunks": chunks, "toks": toks, "bm25": {"df": bix["df"], "avgdl": bix["avgdl"], "n": bix["n"]}, "ng_idf": {k: round(x, 5) for k, x in idf.items()}, "ng_vecs": [r5(v) for v in vecs]}


def cite(c): return f"{c['file']}:{c['line']}"


def answer(ix, question, k=4):
    qt = C.tokens(question); qv = C.ng_vec(qt, ix["ng_idf"]); toks = ix["toks"]
    b = [C.bm25_score(ix["bm25"], qt, t) for t in toks]; v = [C.cos(qv, x) for x in ix["ng_vecs"]]
    fused = C.rrf([C.rank(b), C.rank(v)])[:k]
    res = {"terms": qt, "status": "refused", "answer": None, "sources": [], "coverage": 0.0,
           "hits": [{"id": i, "rrf": round(s, 5), "bm25": round(b[i], 4), "cos": round(v[i], 4)} for i, s in fused]}
    if not qt: res["reason"] = "só palavras comuns na pergunta"; return res
    if not fused: res["reason"] = "nenhum trecho de código tem relação com a pergunta"; return res
    N, df = ix["bm25"]["n"], ix["bm25"]["df"]; idf = lambda t: log(1 + (N - df[t] + .5) / (df[t] + .5)); unk = log(1 + (N + .5) / .5); w = lambda t: idf(t) if t in df else unk
    top = set(toks[fused[0][0]]); qs = sorted(set(qt))
    res["coverage"] = round(sum(w(t) for t in qs if t in top) / sum(w(t) for t in qs), 2)
    if res["coverage"] < MIN_COVERAGE: res["reason"] = f"não encontrei isso no repositório (cobertura {round(res['coverage'] * 100)}% < {round(MIN_COVERAGE * 100)}%)"; return res
    picks = [fused[0]]  # só o 1º resultado vira resposta; os demais ficam na lista de trechos (RRF tem notas muito próximas, não serve de corte)
    res.update(status="answered", answer=" ".join(f"{ix['chunks'][i]['doc'] or ix['chunks'][i]['sig']} [{n + 1}]" for n, (i, _) in enumerate(picks)),
               sources=[{"id": i, "ref": cite(ix["chunks"][i]), "kind": ix["chunks"][i]["kind"], "name": ix["chunks"][i]["name"]} for i, _ in picks])
    return res


if __name__ == "__main__":
    ix = build(); r = answer(ix, " ".join(sys.argv[1:]))
    print(r["answer"] or "Não sei. " + r.get("reason", "")); [print(f"  [{n + 1}] {s['ref']}  {s['kind']} {s['name']}") for n, s in enumerate(r["sources"])]
    for h in r["hits"]: c = ix["chunks"][h["id"]]; print("  ", h["rrf"], cite(c), c["name"])
