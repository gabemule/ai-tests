# Feature: reranking

**Layer:** 🟢 RAG Quality · **Status:** todo
**depends_on:** retrieval *(hard)*, retrieval-eval *(soft)* · **ADRs:** — *(future `reranker-adapters`)*

## Objective

Reorder the retrieved top-k by relevance before the LLM, improving the chunks that actually reach the
prompt. Completes the RAG-quality trio (eval → gate → rerank).

## Scope

**In:**
- A reranking step over the `retrieval` top-k (cross-encoder / rerank model via a future
  `reranker-adapters`, or an interim provider).
- Measured against `retrieval-eval` (soft dep) to prove it actually improves precision@k.
- Configurable: on/off, k-in/k-out.

**Out:**
- Building the `reranker-adapters` library itself (tracked in backlog; interim provider acceptable).
- The confidence decision (→ `confidence-gate`) and model choice (→ `model-routing`).

## Done criterion

With reranking on, `retrieval-eval` shows a measurable precision@k improvement over the raw
similarity order on the eval dataset; the step is toggleable per bot.
