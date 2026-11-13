"""Copia o núcleo compartilhado para cada projeto (cada um fica autocontido) e gera demo/index.html. Rode: python _shared/sync.py"""
import pathlib, shutil
R = pathlib.Path(__file__).parent.parent; S = R / "_shared"
META = {"01_assistente-documentos": ("Assistente de documentos com citação", "Demo de RAG local: pergunte a manuais fictícios e veja trechos recuperados, scores e a resposta com citação da fonte."),
        "02_busca-hibrida": ("Busca híbrida com reranking e métricas", "Demo de RAG local: BM25, vetorial, híbrida e reranking lado a lado, com recall@k e MRR."),
        "03_faq-ecommerce": ("FAQ de e-commerce com guardrail", "Demo de RAG local: FAQ fictício de loja que responde só quando tem evidência e diz 'não sei' quando não tem."),
        "04_avaliacao-chunking": ("Avaliação de estratégias de chunking", "Demo de RAG local: compara tamanhos de chunk e sobreposição com recall@k e MRR.")}
for slug, (t, d) in META.items():
    p = R / slug
    if not p.exists(): continue
    shutil.copy(S / "rag_core.py", p / "rag_core.py"); (p / "demo").mkdir(exist_ok=True)
    for f in ("core.js", "style.css", "ui.js"): shutil.copy(S / f, p / "demo" / f)
    (p / "demo" / "index.html").write_text((S / "index.tpl").read_text("utf-8").replace("__TITLE__", t).replace("__DESC__", d), "utf-8")
    print("sync", slug)
