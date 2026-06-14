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

1. **NestJS API + Python ingestion worker + Next.js front (polyglot split)** — the API is
   **NestJS** (Node/TS): it powers chat (`llm-adapters` Node) and query-time embedding
   (`embedding-adapters` Node), and unifies the TS stack with the Next.js portal and the
   widget. Heavy **document ingestion** runs in a separate **Python worker**, where the
   parsing ecosystem (pypdf/pdfminer/unstructured/python-docx/pandas/Tesseract) is far
   stronger, using `embedding-adapters` Python. The adapters are dual-lang (Node + Python),
   so each side uses its native build. This also showcases cross-language orchestration.
2. **Postgres + pgvector** as the single store — relational + vectors together;
   simplest correct multi-tenant vector setup. Tenant isolation via RLS (ADR #16).

3. **API keys on 2 axes** — environment (`sandbox` = no billing, ephemeral; `production`)
   × scope (`secret` = server-side full access; `publishable` = widget, read-only chat,
   domain-locked). The "dev" idea = sandbox + secret.
4. **Widget security = 2 layers** — publishable key + `Origin`/`Referer` allowlist check,
   **plus** domain ownership proof (DNS TXT record or `/.well-known/<token>` file) before a
   domain is trusted. Without ownership proof, the allowlist is decorative.
5. **BYOK** — tenant's LLM provider keys stored **encrypted at rest**; chat calls go out
   with the tenant's own key via `llm-adapters`. In BYOK the platform never bills LLM usage.
6. **Guardrails — phased** — start with system-prompt scoping + input/output filtering +
   prompt-injection patterns; integrate `moderation-adapters` (FUTURE) later.
7. **`/ingest` is async** — embedding generation is CPU-heavy/long-running. Upload returns
   `202 Accepted` + job id; progress via polling (`GET /jobs/{id}`) or SSE.
8. **Standalone from `xctx`** — does not depend on the xctx Embeddings API; keeps xctx as a
   separate clean showcase. (A future integration is possible but not required.)
9. **LLM in two modes — Managed (default) + BYOK (advanced)** — Managed uses our key, meters
   usage locally, and bills via a **prepaid credit wallet + auto-recharge + monthly spend cap**
   (~20% markup), Stripe as gateway. BYOK lets a tenant bring their own key (zero financial risk
   for us). BYOK ships first (F1–F2); Managed lands at GA (F4), on Pro/Business/Enterprise first.
   See `PRICING.md` for the full model.
10. **Embeddings are always managed** (never BYOK) — embedding cost is tiny (~$0.02/1M tokens) and a
    managed pipeline is far better UX; the cost is baked into plan capacity, not billed per token.
11. **Metering is local in `llm-adapters`** (token count per request = source of truth: immediate,
    uniform across providers, enables real-time hard cap). Per-tenant provider sub-keys (where
    supported) are a **secondary** layer for blast-radius isolation + monthly reconciliation only.
12. **Payments — Stripe primary + `PaymentProvider` abstraction** — Stripe is the primary gateway
    (off-session charges + card vault for wallet auto-recharge, subscriptions for plans, USD & BRL,
    idempotency keys). All payment logic sits behind a `PaymentProvider` interface so we can plug
    **Mercado Pago / Pagar.me (Stone) + PIX** for the BR market later without touching billing logic.
    See `PRICING.md` §9.
13. **Managed-first positioning** — Managed is the **default/recommended** path: it's where we earn
    the ~20% markup margin and where pricing is directly comparable to bundled competitors via TCO.
    **BYOK** stays a first-class but **advanced** opt-in for teams that already run a provider account.
    Default onboarding steers to Managed; Free/Starter stay BYOK-only. See `PRICING.md` §4/§6.
14. **Model routing (F4+ optimization)** — in Managed mode, classify each query by intent/complexity
    and route simple ones to a cheap model (gpt-4o-mini / haiku / flash), complex ones to an expensive
    model (cascading). Lowers **average** managed cost and raises **our** margin without hurting quality.
    **Future exploration:** a self-hosted **Ollama** server running an open-source model — **no per-token
    cost** (trades variable token cost for fixed infra/GPU cost; only worth it at volume, with a
    quality/ops tradeoff). May graduate into a `router-adapters` library (see `@todo/FUTURE.md`). The 3
    Managed billing variants (metered+markup / fixed-per-message / prepaid-credit) are **decided in F4**.
    See `PRICING.md` §8.
15. **Incremental re-embed by chunk** — when a document changes (manual re-upload or knowledge-sync,
    `FUTURE/07`), re-embed **only the chunks that changed**, not the whole file. Diff at the chunk
    level (content hash per chunk), delete the changed chunks' old vectors, embed only the new ones,
    upsert. This keeps the *effective* reingestion volume (K) at ~1–2 in real use (edits touch a few
    chunks), so the per-plan **reingestion budget** can be nominally generous while real cost stays far
    below the worst case. It also bounds our worst-case cost exposure per tenant (see `PRICING.md`
    §6.1 / §7.3). **Reingestion budget = K × storage**, launched **cautiously at K=3** with **5× as the
    approved ceiling** to loosen once real usage data justifies it.
16. **Tenant isolation via Postgres RLS** (not schema-per-tenant) — physical isolation scoped by
    `tenant_id` through Row-Level Security policies. Schema-per-tenant was rejected: it multiplies
    migrations and connection pools per tenant and becomes an operational burden at scale, whereas
    RLS is the pragmatic, pgvector-friendly default that scales smoothly. Shapes the data model from
    F1 (every tenant-owned table carries `tenant_id` and an RLS policy).
17. **Embedding parity is a runtime invariant** — ingestion embeds in Python (worker), query embeds
    in Node (API); both MUST use the **same provider + model + dimension + normalization** or the
    vectors won't share a space and retrieval degrades **silently**. The embedding model is locked in
    a **single shared config source** consumed by both sides (never two parallel configs), ideally
    guarded by a parity test. This is config, not the adapter schema — the schema doesn't protect it.
18. **Conversation/Message persistence from F1** — chat history is stored as `CONVERSATION` +
    `MESSAGE` entities (not just passed transiently). Gives history for the chat flow, the substrate
    for per-message metering (`PRICING.md` §5), and the hook for future ticketing/quality-metrics
    (`FUTURE/03`–`04`) without retrofitting the data model later.




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
| **BYOK key crypto mechanics** — "encrypted at rest" is decided, but the *how* (KMS vs. envelope encryption, key rotation) is not. | Only one BYOK key (mine) in F1. | When building the BYOK key endpoint (**F2**). |
| **RAG retrieval quality eval** — no metric for retrieval quality yet. Strong portfolio differentiator for an "AI product engineering" showcase. | Not needed to prove the loop. | **F4** nice-to-have (or earlier if time allows). |

