"""Núcleo de busca compartilhado (sem dependência paga, sem rede). Espelhado em core.js; tests/parity confere os dois lados.
Real: BM25 por palavra, TF-IDF de n-gramas de caracteres (esparso), LSA (SVD do TF-IDF, denso mas NÃO neural), fusão RRF, reranker por heurística."""
import math, re, unicodedata

K1, B, RRF_K = 1.5, 0.75, 60
STOP = set("a o as os um uma uns umas de do da dos das em no na nos nas por para com e ou que qual quais quando como se ao aos e sao ser tem ter pode posso preciso quero meu minha seu sua sobre mais ate quanto quantos quantas quanta onde ha foi vai fazer faco existe suas seus ja nao sim eu voce meus minhas pra pro esta estao".split())


def norm(s): return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if not unicodedata.combining(c))


def tokens(s):
    out = []
    for t in re.findall(r"[a-z0-9]+", norm(s)):
        if len(t) < 2 or t in STOP: continue
        out.append(t[:-1] if len(t) > 3 and t.endswith("s") else t)
    return out


def sentences(text): return [x for x in re.split(r"(?<=[a-zà-ú0-9][.!?])\s+", re.sub(r"\s+", " ", text).strip(), flags=re.I) if x]


# ---- BM25 ----
def bm25_index(texts):
    toks = [tokens(t) for t in texts]; df = {}
    for tk in toks:
        for t in set(tk): df[t] = df.get(t, 0) + 1
    return {"df": df, "avgdl": sum(len(t) for t in toks) / max(1, len(toks)), "n": len(toks)}, toks


def bm25_score(ix, q, dt):
    s = 0.0
    for t in set(q):
        tf = dt.count(t)
        if tf: n = ix["df"][t]; s += math.log(1 + (ix["n"] - n + 0.5) / (n + 0.5)) * tf * (K1 + 1) / (tf + K1 * (1 - B + B * len(dt) / ix["avgdl"]))
    return s


# ---- TF-IDF de n-gramas de caracteres (vetor esparso, L2) ----
def grams(toks, n=3): return [("#" + t + "#")[i:i + n] for t in toks for i in range(max(1, len(t) + 2 - n + 1))]


def _l2(v):
    z = math.sqrt(sum(x * x for x in v.values())) or 1.0
    return {k: x / z for k, x in v.items()}


def ng_vec(toks, idf):
    tf = {}
    for g in grams(toks): tf[g] = tf.get(g, 0) + 1
    return _l2({g: (1 + math.log(c)) * idf[g] for g, c in tf.items() if g in idf})


def ng_index(tok_lists):
    df = {}
    for tk in tok_lists:
        for g in set(grams(tk)): df[g] = df.get(g, 0) + 1
    N = len(tok_lists); idf = {g: math.log((1 + N) / (1 + c)) + 1 for g, c in df.items()}
    return idf, [ng_vec(tk, idf) for tk in tok_lists]


def cos(a, b): return sum(x * b.get(k, 0.0) for k, x in a.items())


# ---- LSA (denso, local; não é rede neural) ----
def lsa_build(tok_lists, k=24):
    import numpy as np
    df = {}
    for tk in tok_lists:
        for t in set(tk): df[t] = df.get(t, 0) + 1
    vocab = sorted(df); N = len(tok_lists); idf = {t: round(math.log((1 + N) / (1 + df[t])) + 1, 4) for t in vocab}
    ix = {t: i for i, t in enumerate(vocab)}; M = np.zeros((N, len(vocab)))
    for r, tk in enumerate(tok_lists):
        for t, c in __import__("collections").Counter(tk).items(): M[r, ix[t]] = (1 + math.log(c)) * idf[t]
    M /= np.maximum(np.linalg.norm(M, axis=1, keepdims=True), 1e-9)
    k = min(k, min(M.shape) - 1); _, _, Vt = np.linalg.svd(M, full_matrices=False)
    P = np.round(Vt[:k].T, 4)  # vocab x k
    # sinal fixo: maior componente de cada eixo positivo (SVD só define o eixo a menos de sinal)
    for j in range(k): P[:, j] *= 1 if P[np.argmax(np.abs(P[:, j])), j] > 0 else -1
    lsa = {"vocab": vocab, "idf": idf, "proj": P.tolist(), "k": k}
    return lsa, [lsa_vec(lsa, tk) for tk in tok_lists]


def lsa_vec(lsa, toks):
    ix = lsa.setdefault("_ix", {t: i for i, t in enumerate(lsa["vocab"])}); out = [0.0] * lsa["k"]; tf = {}
    for t in toks:
        if t in ix: tf[t] = tf.get(t, 0) + 1
    w = {t: (1 + math.log(c)) * lsa["idf"][t] for t, c in tf.items()}; z = math.sqrt(sum(x * x for x in w.values())) or 1.0
    for t, x in w.items():
        row = lsa["proj"][ix[t]]
        for j in range(lsa["k"]): out[j] += x / z * row[j]
    z = math.sqrt(sum(x * x for x in out))
    return [round(x / z, 5) if z > 1e-9 else 0.0 for x in out]


def dot(a, b): return sum(x * y for x, y in zip(a, b))


# ---- fusão e reranking ----
def rank(scores):
    """ids ordenados por score desc (desempate: menor id); só quem tem score > 0."""
    return [i for i, s in sorted(enumerate(scores), key=lambda p: (-p[1], p[0])) if s > 0]


def rrf(rankings, k=RRF_K):
    sc = {}
    for r in rankings:
        for pos, i in enumerate(r): sc[i] = sc.get(i, 0.0) + 1.0 / (k + pos + 1)
    return sorted(sc.items(), key=lambda p: (-p[1], p[0]))


def rerank_features(q, heading, dt):
    """Heurística (NÃO é cross-encoder): cobertura dos termos + bigramas consecutivos da pergunta presentes + termo no título."""
    qs = set(q)
    cov = len(qs & set(dt)) / len(qs) if qs else 0.0
    bi = [(q[i], q[i + 1]) for i in range(len(q) - 1)]; pairs = {(dt[i], dt[i + 1]) for i in range(len(dt) - 1)}
    big = sum(1 for p in bi if p in pairs) / len(bi) if bi else 0.0
    head = len(qs & set(tokens(heading))) / len(qs) if qs else 0.0
    return cov, big, head


def rerank_score(f, fused_norm): return round(0.35 * f[0] + 0.25 * f[1] + 0.15 * f[2] + 0.25 * fused_norm, 5)


# ---- glossário de sinônimos (só do lado da pergunta) ----
def gloss_norm(raw):
    """Normaliza o glossário com o mesmo tokenizador da pergunta (ex.: 'meses' -> 'mese')."""
    return {C0: [t for s in v for t in tokens(s)] for k, v in raw.items() for C0 in tokens(k)[:1]}


def expand(gl, q):
    groups = [[t] + [s for s in gl.get(t, []) if s != t] for t in tokens(q)]; flat = []
    for g in groups:
        for t in g:
            if t not in flat: flat.append(t)
    return groups, flat
