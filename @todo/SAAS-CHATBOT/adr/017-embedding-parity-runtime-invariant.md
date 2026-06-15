# ADR 017 — Embedding parity is a runtime invariant

**Status:** Accepted · 2026-06-14

## Context

Because of the polyglot split (ADR 001), ingestion embeds in **Python** (worker) and query embeds in
**Node** (API). If the two sides use a different provider/model/dimension/normalization, the vectors
won't share a space and retrieval degrades **silently** — no error, just worse answers. The adapter
parity schema (which keeps the Python/TS builds identical) does **not** protect against this; it's a
runtime config concern.

## Decision

Both sides MUST use the **same provider + model + dimension + normalization**, locked in a **single
shared config source** (never two parallel configs), ideally guarded by a **parity test**.

## Consequences

- The embedding identity (model/dim/normalization + a version) should be **stored on the vector row**
  so a future model change can be detected and migrated safely (re-embed on version mismatch).
- Reinforces ADR 010 (embeddings always managed) — one pipeline, one config.
