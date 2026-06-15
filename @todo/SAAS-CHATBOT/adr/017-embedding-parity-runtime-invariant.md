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

## Implementation contract (F1)

- Add columns to the vector row: `embedding_model`, `embedding_dim`, `embedding_normalized` (bool),
  and an `embedding_version` (monotonic int or the model-config hash).
- At query time, retrieval reads the **active** embedding config and only matches rows with the
  **same** identity (or refuses + flags a mismatch) — never silently compares across spaces.
- Migration on a model change: bump `embedding_version`, **re-embed on mismatch** (reuses the
  chunk-level re-embed pipeline, ADR 015), backfilling rows lazily or in a batch job.
- **Acceptance:** a **parity test** that fails if ingestion and query resolve to different
  model/dim/normalization; and a migration test proving rows with an old `embedding_version` are
  detected and re-embedded rather than queried against the new space.
