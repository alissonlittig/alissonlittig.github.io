"""Copia o núcleo para os projetos 09-12 (não mexe em 01-08) e gera demo/index.html + demo/index.js. Rode: python _shared/sync_09_12.py"""
import json, pathlib, shutil, subprocess, sys
R = pathlib.Path(__file__).parent.parent; S = R / "_shared"
META = {"09_graphrag-simples": ("GraphRAG simples", "Demo de RAG local: grafo de entidades e busca por vizinhança, com visualização do grafo e resposta com citação."),
        "10_rag-filtros-facetas": ("RAG com filtros por metadados e facetas", "Demo de RAG local: busca com filtros de data, autor e categoria e contagem de facetas."),
        "11_rag-de-codigo": ("RAG de código com arquivo:linha", "Demo de RAG local: pergunte sobre um repositório pequeno e receba a resposta com arquivo:linha."),
        "12_rag-deteccao-alucinacao": ("RAG com detecção de alucinação", "Demo de RAG local: checa se cada frase de uma resposta tem suporte nos trechos e marca as que não têm.")}
for slug, (t, d) in META.items():
    p = R / slug
    if not p.exists(): continue
    shutil.copy(S / "rag_core.py", p / "rag_core.py"); (p / "demo").mkdir(exist_ok=True)
    for f in ("core.js", "style.css", "ui.js"): shutil.copy(S / f, p / "demo" / f)
    shutil.copy(S / "extra_09_12.css", p / "demo" / "extra.css")
    html = (S / "index.tpl").read_text("utf-8").replace("__TITLE__", t).replace("__DESC__", d).replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="extra.css">')
    if slug.startswith("12"): html = html.replace('<script src="index.js"></script>', '<script src="index.js"></script><script src="samples.js"></script>')
    (p / "demo" / "index.html").write_text(html, "utf-8")
    if (p / "rag.py").exists(): subprocess.run([sys.executable, "build_index.py"], cwd=p, check=True)
    print("sync", slug)
