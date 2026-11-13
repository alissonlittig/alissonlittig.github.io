"""Copia o núcleo para os projetos 13-16 (não mexe em 01-12) e gera demo/index.html + demo/index.js. Rode: python _shared/sync_13_16.py"""
import pathlib, shutil, subprocess, sys
R = pathlib.Path(__file__).parent.parent; S = R / "_shared"
META = {"13_atendimento-whatsapp": ("RAG de atendimento por WhatsApp (simulado)", "Demo de RAG local: conversa simulada que responde com catálogo e FAQ e encaminha a um humano quando não sabe."),
        "14_rag-transcricoes": ("RAG sobre transcrições com timestamp", "Demo de RAG local: busca por trecho em transcrições de reuniões e vídeo, com minuto e segundo."),
        "15_rag-agentico": ("RAG agêntico: buscar, calcular ou perguntar", "Demo de RAG local: um agente por regras decide entre buscar, calcular ou perguntar de volta e mostra cada passo."),
        "16_reescrita-de-pergunta": ("RAG com reescrita de pergunta e HyDE simulado", "Demo de RAG local: compara a busca antes e depois de reescrever a pergunta.")}
for slug, (t, d) in META.items():
    p = R / slug
    if not p.exists(): continue
    shutil.copy(S / "rag_core.py", p / "rag_core.py"); (p / "demo").mkdir(exist_ok=True); shutil.copy(S / "build_index_13_16.py", p / "build_index.py")
    for f in ("core.js", "style.css", "ui.js"): shutil.copy(S / f, p / "demo" / f)
    shutil.copy(S / "extra_09_12.css", p / "demo" / "extra.css")
    with open(p / "demo" / "extra.css", "a", encoding="utf-8") as f: f.write("\n" + (S / "extra_13_16.css").read_text("utf-8"))
    html = (S / "index.tpl").read_text("utf-8").replace("__TITLE__", t).replace("__DESC__", d).replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="extra.css">')
    (p / "demo" / "index.html").write_text(html, "utf-8")
    if (p / "rag.py").exists(): subprocess.run([sys.executable, "build_index.py"], cwd=p, check=True)
    print("sync", slug)
