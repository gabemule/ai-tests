# SAAS-CHATBOT — Plan

> Whitelabel RAG chatbot platform. Admin portal + injectable widget, built on the
> existing `llm-adapters` and `embedding-adapters` libraries of this monorepo.
> Last updated: 2026-06-14
>
> See `ARCHITECTURE.md` for the conceptual overview + diagrams (components, ER,
> chat/ingestion sequence). This file owns the roadmap, scope and decisions.


## Context

This is a standalone SaaS product living inside the `ai-tests` monorepo. It is a
**whitelabel chatbot platform**: a tenant uploads documents, configures a bot
(prompt, guardrails, LLM key), and embeds a chat widget on their own website via a
`<script>` snippet — with domain-validated, key-scoped access.

**Why it exists (strategic):** it is a portfolio/showcase asset demonstrating
end-to-end AI product engineering (multi-tenant RAG, BYOK, ingestion pipeline,
distribution). It is intentionally **separate** from `xctx` (which stays the clean
open-source "code intelligence" architecture showcase). The two tell different
stories; mixing them dilutes both.

> **Incubation note:** `ai-tests` is a **sandbox / brainstorming workspace** only.
> This project lives here while embryonic. Once it matures, it **graduates to its own
> dedicated repository** before any publish/deploy. Keep dependencies on monorepo
> siblings (`llm-adapters`, `embedding-adapters`) **clean and explicit** so the
> extraction stays mechanical — vendor or re-package them as proper deps at graduation.


**Engine reuse, not reinvention:** the platform does **not** re-implement RAG. It
consumes the monorepo's existing building blocks:
- `embedding-adapters` — document → embeddings (OpenAI, SentenceTransformers, Cohere, VoyageAI, Ollama)
- `llm-adapters` — chat completions with BYOK (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- (future) `reranker-adapters`, `router-adapters`, `ocr-adapters`, `moderation-adapters` from `@todo/FUTURE.md`

## Goals

1. **Admin portal** (Next.js) — multi-tenant, RBAC, manage bots/docs/keys/prompt/limits.
2. **Backend API** (NestJS) — auth, tenancy, RAG retrieval, chat (SSE), usage metering; orchestrates ingestion jobs.
3. **Ingestion worker** (Python) — consumes jobs: load → parse → chunk → embed → store (pgvector).
4. **Document ingestion** — upload → chunk → embed → store (pgvector), text/PDF first.
5. **Bot configuration** — system prompt, guardrails, BYOK LLM key, enabled domains.
6. **Embeddable widget** — `<script>` snippet with publishable key + domain validation.
7. **Governance** — usage counter, rate limiting, per-plan usage limits, prompt security.

## Scope

**In scope (toward GA):**
- Multi-tenant data model (org → bots → members), RBAC roles
- API keys: 2 axes — environment (`sandbox` | `production`) × scope (`secret` | `publishable`)
- Document ingestion pipeline (see roadmap below)
- RAG retrieval over pgvector with physical tenant isolation
- Chat endpoint (SSE streaming) using BYOK via `llm-adapters`
- Prompt config + guardrails (input/output filtering, prompt-injection resistance)
- Widget script + domain ownership verification (DNS TXT / `.well-known`)
- Usage metering, rate limiting, per-plan limits
- Billing-lite + analytics (GA)

**Out of scope (even at GA):**
- Fine-tuning / model training
- Complex multi-step agent frameworks (use the adapters directly)
- Native mobile app
- On-prem / self-hosted distribution (cloud SaaS first)

## Architecture

Monorepo packages (siblings under `ai-tests/pkgs/`):

```
ai-tests/pkgs/
├── chatbot-api/               → NestJS (Node/TS) backend
│   ├── auth & tenancy (orgs, members, RBAC)
│   ├── api keys (sandbox/prod × secret/publishable)
│   ├── ingestion orchestration (enqueue jobs → ingestion worker)
│   ├── retrieval (pgvector, tenant-isolated; query embed via embedding-adapters Node)
│   ├── chat (SSE, BYOK via llm-adapters Node)
│   ├── usage metering + rate limiting
│   └── reuses: embedding-adapters (Node), llm-adapters (Node)
├── chatbot-ingestion-worker/  → Python worker
│   ├── consumes ingestion jobs from the API (queue)
│   ├── document parsing (pypdf/pdfminer/unstructured/python-docx/pandas)
│   ├── chunking → embed (embedding-adapters Python) → pgvector
│   └── reports job status back (pgvector + jobs table)
├── chatbot-portal/            → Next.js (App Router) admin UI
│   ├── org/bot management, document upload
│   ├── prompt + guardrails config
│   ├── API key management, domain allowlist
│   └── usage dashboards
└── chatbot-widget/            → embeddable script
    ├── <script> loader + chat UI (iframe/shadow DOM)
    ├── publishable key + Origin check
    └── domain validation handshake
```

**Data stores:**
- **Postgres + pgvector** — relational data + vector store, one source of truth.
- **Object storage** (S3-compatible / Supabase Storage) — raw uploaded files.

**Tenant isolation:** physical, not a shared `where`-clause. **Postgres Row-Level
Security (RLS)** scoped by `tenant_id` (ADR #16; schema-per-tenant rejected). A single
filter bug must not leak data across tenants.


## Decisions (feature ADRs)

> Decisions live in `adr/` (source of truth) — one file per ADR, numbering stable. This table is
> just the index; **full rationale in `adr/`**. Economic rationale (price/margin) lives in `PRICING/`.

| # | Title | One-liner |
|---|---|---|
| [001](./adr/001-polyglot-split-nestjs-python.md) | Polyglot split (NestJS API + Python worker + Next.js) | Node API for chat/query; Python worker for heavy ingestion |
| [002](./adr/002-postgres-pgvector-single-store.md) | Postgres + pgvector as single store | Relational + vectors together; correct multi-tenant setup |
| [003](./adr/003-api-keys-two-axes.md) | API keys on two axes (environment × scope) | `sandbox/production` × `secret/publishable` |
| [004](./adr/004-widget-two-layer-security.md) | Widget security = two layers | Publishable key + Origin **plus** domain ownership proof |
| [005](./adr/005-byok-encrypted-at-rest.md) | BYOK keys encrypted at rest | Tenant keys never logged, never leave but the outbound call |
| [006](./adr/006-guardrails-phased.md) | Guardrails — phased | Prompt scoping + I/O filtering first; `moderation-adapters` later |
| [007](./adr/007-ingest-async.md) | `/ingest` is asynchronous | `202 Accepted` + job id; embeddings are CPU-bound |
| [008](./adr/008-conversation-message-persistence.md) | Conversation/Message persisted from F1 | History + metering substrate + ticketing/quality hook |
| [009](./adr/009-llm-managed-default-byok.md) | LLM modes — Managed (default) + BYOK (Enterprise add-on) | Managed all tiers; BYOK = paid Enterprise add-on |
| [010](./adr/010-embeddings-always-managed.md) | Embeddings always managed (never BYOK) | Tiny cost; better UX; baked into plan capacity |
| [011](./adr/011-metering-local-llm-adapters.md) | Token counting local in `llm-adapters`; product persists usage | Lib computes tokens; product (Supabase logger) persists usage |
| [012](./adr/012-payments-stripe-paymentprovider.md) | Payments — Stripe + `PaymentProvider` abstraction | Stripe primary; pluggable BR gateways (PIX) later |
| [013](./adr/013-managed-first-positioning.md) | Managed-first positioning | Managed default on every tier incl. Free; BYOK Enterprise-only |
| [014](./adr/014-model-routing-margin-lever.md) | Model routing as a margin lever (F4+) | Anchor on premium model; route a cheaper mix; spread is margin |
| [015](./adr/015-incremental-re-embed-by-chunk.md) | Incremental re-embed by chunk | Diff per chunk hash → effective K ~1–2, bounds worst-case cost |
| [016](./adr/016-tenant-isolation-rls.md) | Tenant isolation via Postgres RLS | Physical isolation by `tenant_id`; schema-per-tenant rejected |
| [017](./adr/017-embedding-parity-runtime-invariant.md) | Embedding parity is a runtime invariant | Same model/dim/normalization both sides or silent degradation |
| [018](./adr/018-ingestion-job-contract.md) | Ingestion job contract (the "sacred seam") | Versioned API↔worker job schema, validated on both Node + Python |




## Phases

### Phase 1 — MVP (prove the RAG loop)
- `chatbot-api` skeleton (NestJS) + Postgres/pgvector setup
- `chatbot-ingestion-worker` skeleton (Python) + job handoff from the API
- Basic auth + single org (no RBAC yet)
- Document upload: `.txt`, `.md`, `.html`, native-text `.pdf`
- Ingestion pipeline (worker): loader → chunk → embed (`embedding-adapters`, Python) → pgvector
- One bot: system prompt + BYOK LLM key
- Chat endpoint (SSE) via `llm-adapters` with retrieved context
- Widget v0 (`chatbot-widget`): script + basic chat UI, single hardcoded domain
- **Effort:** Large

### Phase 2 — Multi-tenant platform
- Multi-org + bots; RBAC roles (owner / admin / editor / viewer)
- API keys: sandbox/production × secret/publishable; rotation + revocation
- Usage counter (messages, tokens, docs) per tenant/bot
- Widget domain validation (allowlist + ownership proof: DNS TXT / `.well-known`)
- Portal screens for all of the above
- **Effort:** Large

### Phase 3 — Governance / production-ready
- Rate limiting (per key, per tenant)
- Per-plan usage limits + soft/hard caps
- Guardrails / prompt security (input/output filtering, injection resistance)
- More document types: `.docx`, `.csv`, `.xlsx`
- **Effort:** Medium-Large

### Phase 4 — GA (scale + extras)
- OCR for images & scanned PDFs (via `ocr-adapters`)
- URL/sitemap crawling ingestion
- Reranking for retrieval quality (via `reranker-adapters`)
- Billing-lite (plans, metering → invoice) + Managed wallet + analytics dashboards
- Model routing / cascading + decide Managed billing variant (via `router-adapters`)
- Content moderation (via `moderation-adapters`)
- **Effort:** Large

## Document ingestion roadmap (quick wins first)

| Phase | Types | Effort | Notes |
|---|---|---|---|
| F1 (MVP) | `.txt`, `.md`, `.html` | Trivial | Plain text, direct chunking |
| F1 (MVP) | `.pdf` (native text) | Low | `pypdf`/`pdfminer`; covers ~80% of PDFs |
| F3 | `.docx`, `.csv`, `.xlsx` | Medium | Ready loaders; spreadsheets need row→text strategy |
| F4 | scanned `.pdf`, images | High | Requires OCR → `ocr-adapters` |
| F4 | URLs / sitemap (crawl) | Medium-High | Scraping-based ingestion |

> Images/scanned docs are explicitly deferred to F4 (they depend on OCR).

## Lifecycle terminology

- **MVP** — minimum that proves the loop works (may be rough, single-user) → F1
- **Beta** — open to a few real tenants, "use at your own risk" → F2→F3
- **GA (General Availability)** — stable, scalable, secure, billed — actually sellable → F4

## Known Gaps / Deferred

> Acknowledged but intentionally not solved yet — registered so they don't become surprises.
> None block F1 (single internal user).

| Gap | Why deferred | When to address |
|---|---|---|
| **LGPD / data protection** — tenant docs likely contain PII; need retention, deletion (right to erasure), and a DPA. BR + PIX focus makes this real. | No real external tenants until Beta; F1 is single internal user. | **F3** (governance), before opening to real tenants. |
| **BYOK key rotation + managed-KMS upgrade** — at-rest **envelope encryption ships in F1** (ADR 005); only key *rotation* and a move to a managed KMS remain open. | Only one BYOK key (mine) in F1; rotation surface is trivial until multiple Enterprise keys exist. | When the key-management surface grows (**F2**). |
| **RAG retrieval quality eval** — no metric for retrieval quality yet. Strong portfolio differentiator for an "AI product engineering" showcase. | Not needed to prove the loop. | **F4** nice-to-have (or earlier if time allows). |

