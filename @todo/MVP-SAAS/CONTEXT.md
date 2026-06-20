# CONTEXT.md — MVP-SAAS Knowledge Base

> Maintained for context recovery between sessions. Read this first.
> Last updated: 2026-06-20

## Stack & Infra

- **chatbot-api** — NestJS (Node/TS): auth, tenancy, retrieval, chat (SSE), usage,
  ingestion orchestration (enqueues jobs). Uses Node builds of `llm-adapters` +
  `embedding-adapters`.
- **chatbot-ingestion-worker** — Python: parse → chunk → embed → pgvector. Uses the
  Python build of `embedding-adapters` + the rich parsing ecosystem.
- **chatbot-portal** — Next.js (App Router) **tenant** admin UI (RLS-scoped to one org).
- **chatbot-admin** — Next.js **operator console** — *our* surface, cross-tenant by a privileged role
  (the inverse of RLS; ADR 020). Houses tenant management, the **Research module** (graduated
  `research-app`), and cost×revenue analytics. Physically separate app, own operator auth, audited.
- **chatbot-widget** — embeddable `<script>` + chat UI.
- **Postgres + pgvector** — single store (relational + vectors). RLS by `tenant_id`.
- **Object storage** (S3-compatible / Supabase Storage) — raw uploaded files.
- **Job queue** (Upstash QStash) — the API↔worker seam (cross-language handoff).

## Architecture (key patterns)

- **Polyglot split by ecosystem fit:** *Python where the ecosystem matters* (document
  parsing, OCR, offline eval), *Node where it's the common path* (API, chat, governance,
  query-embed). The TS stack unifies API + portal + widget. (ADR 001)
- **Reuse, not reinvention:** the product is a shell around the existing adapter engine.
- **Feature-graph model:** the project is a graph of independent features with explicit
  `depends_on` (hard/soft). Build order = incremental milestones M1–M4 (a derived view). (`FEATURES/README.md`)
- **Revenue-oriented, incremental ordering:** ship a working embeddable bot first, make it a
  self-service multi-tenant product, then layer monetization on a base that already works.
- **RAG quality comes early (not as a demo):** eval + confidence-gate (anti-hallucination floor) +
  reranking land before broad rollout because a bot that makes things up doesn't retain paying customers.
- **Two-axis API keys:** environment (`sandbox`|`production`) × scope (`secret`|`publishable`). (ADR 003)
- **Async ingestion:** `POST /documents` → `202 Accepted` + job id; status via polling/SSE. (ADR 007)
- **SSE chat streaming** (matches the adapters' streaming surface).

## Domains

| Domain | Responsibility |
|---|---|
| Tenancy & Identity | org → bots → members; RBAC (owner/admin/editor/viewer) |
| Knowledge / Embeddings | upload → ingestion (Python) → pgvector; tenant-isolated retrieval |
| Retrieval Quality | eval harness, confidence gate, reranking |
| Bot Config | system prompt, guardrails, LLM mode, enabled domains |
| Governance | usage metering, rate limiting, per-plan limits, prompt security |
| Distribution (Widget) | embeddable script, publishable key, domain validation |
| Monetization | metering, wallet (ledger), routing, managed mode, billing |
| Operator/Admin | cross-tenant console: tenant mgmt, model-cost research, cost×revenue per tenant (ADR 020) |

## LLM modes (the economic core)

- **Managed = GA-target default** on every tier: we hold the key, meter usage locally,
  bill a prepaid wallet; margin = routing spread (~85%), no markup. **Billing unit is an
  open decision** — two candidates kept side-by-side (`fixed-per-message` vs
  `metered-per-token`), choice deferred until real metering data. (ADR 009/013/014)
- **Phasing:** BYOK ships first (M1, in `chat-sse`) as the technical bootstrap (no wallet, zero
  financial risk); Managed lands with the monetization milestone (M4) and becomes default; BYOK then
  is the **paid Enterprise-only add-on** sold on governance/compliance.
- **Embeddings always managed** (never BYOK) — tiny cost, baked into plan capacity. (ADR 010)
- Economic detail in `PRICING/`. **The ~85% spread is a modeled estimate** (depends on a
  router that doesn't exist yet) — validate before treating as fact.

## Integration Points

- **`embedding-adapters`** — two languages, two places: Python worker (ingestion),
  Node API (query-time). Same model/dim/normalization both sides or retrieval degrades
  silently (ADR 017).
- **`llm-adapters`** (Node) — chat endpoint; computes token counts locally (ADR 011).
- **Job queue (QStash)** — API enqueues, worker consumes; the "sacred seam" (ADR 018).
- **Future adapters:** `reranker-adapters`, `router-adapters`, `ocr-adapters`,
  `moderation-adapters`.

## Current State

- **Planning only.** No code written. This workspace was rebuilt 2026-06-17 into a
  feature-graph model.
- Active focus: materialize the feature catalog + ADRs. See `PROGRESS.md`.

## Active Decisions (ADRs)

See `adr/README.md` for the full index. Survivors from the old plan + new #019
(confidence-gate) and #020 (admin/operator surface). ADRs are the source of truth for *why*;
features reference them.

## Known Pitfalls

- **Tenant isolation must be physical** — RLS by `tenant_id`, fail-closed (zero rows when
  unset). Worker sets `app.tenant_id` transaction-locally too. A single filter bug = leak. (ADR 016)
- **Embedding parity is a runtime invariant** — not a schema concern. Lock model/dim/normalization in
  one language-neutral `embedding-config.json` consumed by both Python and Node, hash it into the job
  contract + vector row (`embedding_version`), and assert parity in CI. (ADR 017)
- **Two distinct schema concerns — don't conflate:** (a) adapter parity schema lives *in the
  libs* (keeps Python/TS builds identical); (b) ingestion job contract is a *product* concern,
  validated on both sides (ADR 018).
- **Re-embed incrementally by chunk** (diff per chunk hash), not by document. (ADR 015)
- **Widget needs domain ownership proof** (DNS TXT / `.well-known`), not just an Origin check. (ADR 004)
- **BYOK keys encrypted at rest** — never logged, never leave but the outbound LLM call. (ADR 005)
- **Ingestion is CPU-heavy** — keep it off the request path (Python worker / async jobs). (ADR 007)
- **The margin thesis is unvalidated** — Managed/routing land late; the ~85% is a model, not
  measured. Revenue features carry this risk explicitly (`FEATURES/`). The admin console
  (`cost-attribution` + `revenue-analytics`) turns it into a **measured per-tenant** number once
  `metering`/`billing` exist (ADR 020).
- **Graduation discipline** — depend on adapters' public interfaces only; no deep coupling.
- **The admin console deliberately bypasses RLS** — `chatbot-admin` runs on a privileged cross-tenant
  role (the inverse of ADR 016). This is intentional and is the system's largest blast radius: separate
  app, separate operator auth, audited writes. The API/worker/portal stay RLS-subject (ADR 020).
