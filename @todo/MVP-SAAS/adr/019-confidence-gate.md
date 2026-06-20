# ADR 019 — Retrieval confidence gate (floor + optional ceiling)

**Status:** Accepted · 2026-06-17 (new in MVP-SAAS)
**Features:** `confidence-gate` (depends on `retrieval`; calibrated by `retrieval-eval`)

## Context

A RAG bot answers from retrieved chunks. Two failure modes hurt a knowledge-base product:

1. **Hallucination on weak retrieval** — when no chunk is actually relevant, the LLM still produces
   a confident answer from its parametric memory, off-domain and wrong. This is the worst look for a
   support bot grounded on a customer's docs.
2. **Wasted spend on trivial retrieval** — when a query matches a chunk almost verbatim (e.g. an FAQ
   entry), paying for an LLM generation adds latency and token cost for no quality gain.

Neither reranking (which only *reorders* the top-k) nor model routing (which only *picks the model*)
addresses these — they assume the answer should still go through the LLM. We want a decision **before**
generation, based on retrieval confidence.

## Decision

Insert a **confidence gate** between retrieval and generation, driven by the similarity scores of the
retrieved chunks:

- **Floor (ships first, the safe half):** if the best similarity score is **below a refusal
  threshold**, do **not** call the LLM to invent an answer. Return a configurable fallback
  ("I don't have that in my knowledge base" / handoff / suggested links). Refusing to hallucinate is
  strictly safer than a wrong confident answer.
- **Ceiling (optional, the risky half, off by default):** if the best score is **above a
  near-exact threshold**, optionally **short-circuit the LLM** and serve the chunk's answer
  directly (or via a cheap template). Saves latency + tokens on trivial matches.

Both thresholds are **empirically calibrated by `retrieval-eval`**, never hardcoded blindly.

## Consequences

- **Similarity ≠ correctness.** A high score is not a guarantee of a right answer and a low score is
  not a guarantee of irrelevance; thresholds are a heuristic that *must* be tuned against a labeled
  dataset (`retrieval-eval`) and monitored, not set once. This is why the gate is `soft`-dependent on
  the eval harness.
- **The floor is low-risk and high-value** → it ships first (anti-hallucination, cheap, demoable).
  **The ceiling is higher-risk** (a wrong short-circuit serves a bad answer with full confidence and
  no LLM phrasing) → it stays **off by default**, opt-in per bot, and only after eval validates the
  near-exact threshold.
- Distinct from `reranking` (reorders chunks) and `model-routing` (picks the model): the gate decides
  **whether to generate at all**. They compose — gate first, then rerank, then route.
- Per-bot configurable: refusal threshold, fallback behavior, and whether the ceiling is enabled.
- **Product value:** "the bot knows when it doesn't know" is what keeps a grounded support bot from
  embarrassing the customer — the reason the confidence-gate floor lands early (milestone M2, before
  the first real customer; `FEATURES/README.md`).
