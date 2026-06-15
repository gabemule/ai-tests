# ADR 015 — Incremental re-embed by chunk

**Status:** Accepted · 2026-06-14

## Context

When a document changes (manual re-upload or knowledge-sync, `FUTURE/07`), re-embedding the whole
file is wasteful and inflates worst-case embedding cost per tenant — the only AI cost that grows with
a tenant (`PRICING.md` §1.3).

## Decision

Re-embed **only the chunks that changed**: diff at the chunk level (content hash per chunk), delete
the changed chunks' old vectors, embed only the new ones, upsert. This keeps the **effective**
reingestion volume (K) at ~1–2 in real use.

The per-plan **reingestion budget = K × storage** (`PRICING.md` §6.1 / §7.3), launched cautiously at
**K=3** with **5× as the approved ceiling**.

## Consequences

- Nominal reingestion budgets can be generous while real cost stays far below the worst case.
- Bounds worst-case cost exposure per tenant (`PRICING.md` §7.3).
- On hitting the budget: **degrade** (pause re-embeds) — never block live chat.
