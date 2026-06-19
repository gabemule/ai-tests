# ADR 010 — Embeddings are always managed (never BYOK)

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `ingestion`, `retrieval`

## Context

Unlike chat generation, embedding cost is tiny (default Qwen3 Embedding 8B — see
`PRICING/embeddings.md` for the per-token cost) and embeddings are used on **both** sides of the
polyglot split (Python ingestion + Node query). Letting tenants BYOK their embedding provider would
break the parity invariant (ADR 017) and add UX friction for negligible savings.

## Decision

Embeddings are **always managed** — never BYOK. We run the embedding pipeline with a single locked
model (default Qwen3 Embedding 8B; OpenAI fallback). The cost is **baked into plan capacity**, not
billed per token.

## Consequences

- Reinforces the parity invariant (ADR 017): one shared embedding config for both ingestion and
  query.
- The only embedding cost that grows per tenant is **reingestion**, bounded by a per-plan budget
  (ADR 015). Query-time embedding is folded into the plan price.
