"""Copia o núcleo para os projetos 17-20 (não mexe em 01-16) e gera demo/index.html (+ index.js via build_index.py). Rode: python _shared/sync_17_20.py"""
import pathlib, shutil, subprocess, sys
R = pathlib.Path(__file__).parent.parent; S = R / "_shared"
META = {"17_rag-rh": ("RAG para RH: a regra e a página", "Demo de RAG local sobre políticas de RH fictícias: responde com o item literal, a página e o que mudou na versão nova."),
        "18_rag-notas-boletos": ("RAG sobre notas fiscais e boletos em PDF", "Demo de RAG local sobre PDFs fictícios de notas e boletos: responde 'quanto paguei de X em tal mês' somando os documentos e citando arquivo e página."),
        "19_cache-semantico-custo": ("Cache semântico e medição de custo e latência", "Demo de cache semântico para RAG local: acertos, erros do cache por limiar e custo simulado."),
        "20_painel-avaliacao-continua": ("Painel de avaliação contínua de RAG", "Painel de avaliação de RAG local: nota por versão, gráfico de regressão e perguntas que pioraram.")}
for slug, (t, d) in META.items():
    p = R / slug
    if not p.exists(): continue
    shutil.copy(S / "rag_core.py", p / "rag_core.py"); (p / "demo").mkdir(exist_ok=True)
    for f in ("core.js", "style.css", "ui.js"): shutil.copy(S / f, p / "demo" / f)
    shutil.copy(S / "extra_09_12.css", p / "demo" / "extra.css")
    ex = p / "demo" / "extra17_20.css"
    if (S / "extra_17_20.css").exists(): shutil.copy(S / "extra_17_20.css", ex)
    html = (S / "index.tpl").read_text("utf-8").replace("__TITLE__", t).replace("__DESC__", d).replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="extra.css">\n<link rel="stylesheet" href="extra17_20.css">')
    (p / "demo" / "index.html").write_text(html, "utf-8")
    if (p / "build_index.py").exists(): subprocess.run([sys.executable, "build_index.py"], cwd=p, check=True)
    print("sync", slug)
