# SAAS-CHATBOT — Architecture Decision Records

> Source of truth for the platform's architecture & product decisions. One file per ADR.
> `PLAN.md`, `ARCHITECTURE.md` and `CONTEXT.md` **reference** these by number — they do not
> restate them. Economic rationale (price/margin) lives in `PRICING/`; billing ADRs link to it.
> Last updated: 2026-06-14

## Format

Each ADR is short and uniform: **Status · Context · Decision · Consequences**. Numbering is stable
(1–17, never renumbered) because other docs reference ADRs by number (e.g. "ADR #16").

## Index

| # | Title | Status | One-liner |
|---|---|---|---|
| [001](./001-polyglot-split-nestjs-python.md) | Polyglot split (NestJS API + Python worker + Next.js) | Accepted | Node API for chat/query; Python worker for heavy ingestion |
| [002](./002-postgres-pgvector-single-store.md) | Postgres + pgvector as single store | Accepted | Relational + vectors together; correct multi-tenant setup |
| [003](./003-api-keys-two-axes.md) | API keys on two axes (environment × scope) | Accepted | `sandbox/production` × `secret/publishable` |
| [004](./004-widget-two-layer-security.md) | Widget security = two layers | Accepted | Publishable key + Origin **plus** domain ownership proof |
| [005](./005-byok-encrypted-at-rest.md) | BYOK keys encrypted at rest | Accepted | Tenant keys never logged, never leave but the outbound call |
| [006](./006-guardrails-phased.md) | Guardrails — phased | Accepted | Prompt scoping + I/O filtering first; `moderation-adapters` later |
| [007](./007-ingest-async.md) | `/ingest` is asynchronous | Accepted | `202 Accepted` + job id; embeddings are CPU-bound |
| [008](./008-conversation-message-persistence.md) | Conversation/Message persisted from F1 | Accepted | History + metering substrate + ticketing/quality hook |
| [009](./009-llm-managed-default-byok.md) | LLM modes — Managed (default) + BYOK (Enterprise add-on) | Accepted | Managed all tiers; BYOK = paid Enterprise add-on |
| [010](./010-embeddings-always-managed.md) | Embeddings always managed (never BYOK) | Accepted | Tiny cost; better UX; baked into plan capacity |
| [011](./011-metering-local-llm-adapters.md) | Metering is local in `llm-adapters` | Accepted | Immediate + uniform → real-time hard cap |
| [012](./012-payments-stripe-paymentprovider.md) | Payments — Stripe + `PaymentProvider` abstraction | Accepted | Stripe primary; pluggable BR gateways (PIX) later |
| [013](./013-managed-first-positioning.md) | Managed-first positioning | Accepted | Managed default on every tier incl. Free; BYOK Enterprise-only |
| [014](./014-model-routing-margin-lever.md) | Model routing as a margin lever (F4+) | Accepted | Anchor on premium model; route a cheaper mix; spread is margin |
| [015](./015-incremental-re-embed-by-chunk.md) | Incremental re-embed by chunk | Accepted | Diff per chunk hash → effective K ~1–2, bounds worst-case cost |
| [016](./016-tenant-isolation-rls.md) | Tenant isolation via Postgres RLS | Accepted | Physical isolation by `tenant_id`; schema-per-tenant rejected |
| [017](./017-embedding-parity-runtime-invariant.md) | Embedding parity is a runtime invariant | Accepted | Same model/dim/normalization both sides or silent degradation |
