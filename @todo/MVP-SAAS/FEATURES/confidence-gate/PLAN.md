# Feature: confidence-gate

**Layer:** 🟢 RAG Quality · **Status:** todo
**depends_on:** retrieval *(hard)*, retrieval-eval *(soft)* · **ADRs:** 019

## Objective

Insert a retrieval-confidence decision between retrieval and generation: a **floor** that refuses to
hallucinate when no chunk is relevant, and an optional **ceiling** that skips the LLM on near-exact
matches. "The bot knows when it doesn't know."

## Scope

**In:**
- **Floor (first):** if best similarity < refusal threshold → return a configurable fallback
  ("don't have that" / handoff / links) instead of calling the LLM.
- Per-bot config: refusal threshold + fallback behavior.
- Thresholds calibrated against `retrieval-eval` (soft dep — works without it, but uncalibrated).
- **Ceiling (optional, off by default):** if best similarity > near-exact threshold → optionally
  short-circuit the LLM and serve the chunk answer / cheap template.

**Out:**
- Reranking (→ `reranking`) and routing (→ `model-routing`) — the gate composes with, but is not,
  those.
- Auto-tuning thresholds (manual calibration from eval first).

## Done criterion

With the floor enabled, an off-domain query returns the fallback **without** an LLM call; an
on-domain query still answers normally. With the ceiling enabled on a bot, a near-verbatim query is
served without an LLM call. Thresholds trace back to `retrieval-eval` numbers.
