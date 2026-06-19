# ADR 015 — Incremental re-embed by chunk

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `incremental-reembed` (depends on `ingestion`)

## Context

When a document changes (manual re-upload or knowledge-sync, future), re-embedding the whole file is
wasteful and inflates worst-case embedding cost per tenant — the only AI cost that grows with a
tenant (`PRICING/embeddings.md`).

## Decision

Re-embed **only the chunks that changed**: diff at the chunk level (content hash per chunk), delete
the changed chunks' old vectors, embed only the new ones, upsert. This keeps the **effective**
reingestion volume (K) at ~1–2 in real use.

The per-plan **reingestion budget = K × storage**, launched cautiously at **K=3** with **5× as the
approved ceiling**.

## Consequences

- Nominal reingestion budgets can be generous while real cost stays far below the worst case.
- Bounds worst-case cost exposure per tenant.
- On hitting the budget: **degrade** (pause re-embeds) — never block live chat.
