# Feature: retrieval-eval

**Layer:** 🟢 RAG Quality · **Status:** todo
**depends_on:** retrieval *(hard)* · **ADRs:** — *(new)*

## Objective

An offline evaluation harness for retrieval quality: a labeled dataset + recall/precision metrics
that turns "the bot feels good" into a measurable number. Calibrates the confidence gate, reranking,
and (later) the routing blend. The protagonist of the showcase.

## Scope

**In:**
- A small curated eval dataset (queries → expected relevant chunks) over a known corpus.
- Metrics: recall@k, precision@k, MRR (or similar), reported reproducibly.
- A runnable harness (Python — eval is where the ecosystem matters, ADR 001) that scores the current
  `retrieval` config.
- Output that can calibrate thresholds for `confidence-gate` and the value of `reranking`.

**Out:**
- Online/production eval dashboards (future `quality-metrics`).
- Automated threshold tuning (manual reading of results first).
- LLM-answer quality eval (this is *retrieval* eval, not generation eval).

## Done criterion

Running the harness against the corpus produces stable recall/precision/MRR numbers; changing a
retrieval parameter (e.g. k or chunk size) produces a measurable, repeatable delta in the metrics.
