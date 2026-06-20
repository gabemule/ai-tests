# MVP-SAAS — Architecture Decision Records

> Source of truth for the platform's architecture & product decisions. One file per ADR.
> `FEATURES/`, `ARCHITECTURE.md` and `CONTEXT.md` **reference** these by number — they do not
> restate them. Economic rationale (price/margin) lives in `PRICING/`; billing ADRs link to it.
> Last updated: 2026-06-20

## Format

Each ADR is short and uniform: **Status · Features · Context · Decision · Consequences** (+ an
optional **Implementation contract**). Numbering is stable (never renumbered) because other docs
reference ADRs by number (e.g. "ADR 016"). 001–018 are carried over from the previous
planning iteration in clean format; **019 (confidence-gate) and 020 (admin/operator surface) are new
to this rebuild**.

## Index

> **"Primary owner" column** = the feature that most directly owns each decision, **not** an
> exhaustive list of citing features. Other features may legitimately reference an ADR (e.g. ADR 016
> is also cited by `retrieval`/`rbac`; ADR 011 by `chat-sse`/`managed-mode`; ADR 003 by `widget-v0`;
> ADR 006 by `tool-calling`; ADR 015 by `knowledge-sync`). The authoritative ADR↔feature mapping is
> each feature's own `PLAN.md` header (`ADRs:` line) + the catalog table in `FEATURES/README.md`.

| # | Title | Status | Primary owner | One-liner |
|---|---|---|---|---|
| [001](./001-polyglot-split.md) | Polyglot split (NestJS + Python worker + Next.js) | Accepted | core-api, ingestion | Node where it's the common path; Python where the ecosystem matters |
| [002](./002-postgres-pgvector-single-store.md) | Postgres + pgvector as single store | Accepted | core-db, retrieval | Relational + vectors together; correct multi-tenant setup |
| [003](./003-api-keys-two-axes.md) | API keys on two axes (environment × scope) | Accepted | api-keys | `sandbox/production` × `secret/publishable` |
| [004](./004-widget-two-layer-security.md) | Widget security = two layers | Accepted | widget-security | Publishable key + Origin **plus** domain ownership proof |
| [005](./005-byok-encrypted-at-rest.md) | BYOK keys encrypted at rest | Accepted | chat-sse | Tenant keys never logged, never leave but the outbound call |
| [006](./006-guardrails-phased.md) | Guardrails — phased | Accepted | guardrails | Prompt scoping + I/O filtering first; `moderation-adapters` later |
| [007](./007-ingest-async.md) | `/ingest` is asynchronous | Accepted | ingestion, job-contract | `202 Accepted` + job id; embeddings are CPU-bound |
| [008](./008-conversation-message-persistence.md) | Conversation/Message persisted from the start | Accepted | chat-sse | History + metering substrate + ticketing/quality hook |
| [009](./009-llm-managed-default-byok.md) | LLM modes — Managed (default) + BYOK (Enterprise add-on) | Accepted | chat-sse, managed-mode | Managed all tiers; BYOK = paid Enterprise add-on |
| [010](./010-embeddings-always-managed.md) | Embeddings always managed (never BYOK) | Accepted | ingestion, retrieval | Tiny cost; better UX; baked into plan capacity |
| [011](./011-metering-local-llm-adapters.md) | Token counting local in `llm-adapters`; product persists usage | Accepted | metering | Lib computes tokens; product persists usage |
| [012](./012-payments-stripe-paymentprovider.md) | Payments — Stripe + `PaymentProvider` abstraction | Accepted | billing, wallet | Stripe primary; pluggable BR gateways (PIX) later |
| [013](./013-managed-first-positioning.md) | Managed-first positioning | Accepted | managed-mode | Managed default on every tier incl. Free; BYOK Enterprise-only |
| [014](./014-model-routing-margin-lever.md) | Model routing as a margin lever | Accepted | model-routing | Anchor on premium model; route a cheaper mix; spread is margin |
| [015](./015-incremental-re-embed-by-chunk.md) | Incremental re-embed by chunk | Accepted | incremental-reembed | Diff per chunk hash → bounds worst-case re-embed cost |
| [016](./016-tenant-isolation-rls.md) | Tenant isolation via Postgres RLS | Accepted | core-db | Physical isolation by `tenant_id`; schema-per-tenant rejected |
| [017](./017-embedding-parity-runtime-invariant.md) | Embedding parity is a runtime invariant | Accepted | ingestion, retrieval | Same model/dim/normalization both sides or silent degradation |
| [018](./018-ingestion-job-contract.md) | Ingestion job contract (the "sacred seam") | Accepted | job-contract | Versioned API↔worker job schema, validated on both Node + Python |
| [019](./019-confidence-gate.md) | Retrieval confidence gate (floor + optional ceiling) | Accepted | confidence-gate | Refuse to hallucinate below a threshold; optionally skip the LLM on near-exact matches |
| [020](./020-admin-operator-surface.md) | Admin/operator surface = separate app, cross-tenant privileged role | Accepted | admin-app | Operator console bypasses RLS by design (inverse of ADR 016); houses Research + cost×revenue |

## What changed vs. the frozen plan

- **001** now states the polyglot principle explicitly ("Python where the ecosystem matters, Node
  where it's the common path") and references features instead of phases.
- **Phase tags (F1–F4)** in the old ADRs were replaced by **feature references** (the slugs in
  `FEATURES/README.md`) — phases are now only a derived view.
- **019 is new** — the confidence gate did not exist in the old plan.
- **020 is new** — the admin/operator surface (cross-tenant console, the inverse privilege domain of
  ADR 016) did not exist in the old plan; it owns `admin-app` + the Research module + cost×revenue.
