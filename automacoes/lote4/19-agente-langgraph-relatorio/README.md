# 19 · Multi-step research agent (LangGraph) / Agente de pesquisa multi-etapas

![demo](prints/demo_1366.png)

## EN

**Business problem.** Market briefs are assembled by hand from several sources. Under time pressure people quote numbers without a source, or forget to say a source was unreachable.

**What it does.** A stateful LangGraph graph: `plan → retrieve → write → critique → (revise → retrieve)* → accept → compile`.
- *Plan* picks the sections (market, pricing, competition, churn, channels, logistics, regulation) from the question.
- *Retrieve* searches a local corpus and "fetches" each source with 3 attempts. An unreachable source is left out and written into the report's data-quality notes.
- *Write* drafts each section citing `[d03]`-style source ids.
- *Critique* is plain code: a section needs 2+ distinct sources, may only cite what was retrieved, and every number must appear in a cited source. A failed section is redone once with a wider search; if it still fails it is kept with a "Limited evidence" tag. A topic with no source becomes "Not enough evidence", never an invented paragraph.
- A question under 3 meaningful words stops cleanly (exit 1) instead of writing a report.

**Honest gain estimate.** If a manual brief takes ~90 min and the first automatic draft takes ~2 min plus ~15 min of review, that is about 70 min per brief. This is an estimate, not a measurement, and depends on the right sources being in the corpus.

**Stack.** Python 3.13, LangGraph (`StateGraph`, conditional edges). The writer is `MockLLM` (deterministic, assembles sentences from sources). `OllamaLLM` shows where a local ≤3B model plugs in; **it was not run** (Ollama is not installed here).

**Run.**
```
pip install langgraph
python agent.py "market size, pricing and churn for coffee subscriptions" --out out
python agent.py "pricing and competition" --fault d03=99 --fault d08=1   # source down + flaky source
python tests/test_agent.py                                              # 6 tests
```
Real outputs from these runs are in `output/` (`*.md` reports, `*.trace.json` node-by-node traces, `too_short.error.txt`).

**Interactive demo.** `../../demos/19-agente-langgraph-relatorio/`.

## PT

**Problema de negócio.** Briefings de mercado são montados à mão com várias fontes. Com pressa, citam número sem fonte ou esquecem de avisar que uma fonte estava fora do ar.

**O que faz.** Grafo LangGraph com estado: `planejar → buscar → escrever → criticar → (revisar → buscar)* → aceitar → compilar`.
- O planejador escolhe as seções pela pergunta (mercado, preço, concorrência, churn, canais, logística, regulação).
- A busca consulta um corpus local e "baixa" cada fonte com 3 tentativas. Fonte inacessível fica de fora e entra nas notas de qualidade de dados do relatório.
- O redator cita ids de fonte no formato `[d03]`.
- O crítico é código simples: seção precisa de 2+ fontes distintas, só cita o que foi recuperado e todo número tem que estar numa fonte citada. Seção reprovada é refeita uma vez com busca mais ampla; se ainda falhar, fica marcada "Limited evidence". Tema sem fonte vira "Not enough evidence", nunca um parágrafo inventado.
- Pergunta curta demais (menos de 3 palavras úteis) para na hora (saída 1) em vez de escrever relatório.

**Ganho estimado (honesto).** Se um briefing manual leva ~90 min e o primeiro rascunho automático leva ~2 min mais ~15 min de revisão, são ~70 min por briefing. É estimativa, não medição, e depende de as fontes certas estarem no corpus.

**Stack.** Python 3.13, LangGraph. O redator é `MockLLM` (determinístico). `OllamaLLM` mostra onde entra um modelo local de até 3B; **não foi executado** (Ollama não está instalado).

**Como rodar.** Comandos acima. Saídas reais em `output/`. Demo interativa em `../../demos/19-agente-langgraph-relatorio/`.
