# SAAS-CHATBOT — Progress

**Status:** 0/26 items · Phase: F1 (MVP) — not started


## Current Focus
Plan just created. Nothing built yet.
Next step: kick off **F1 (MVP)** — scaffold `chatbot-api` (NestJS) + Postgres/pgvector and
the `chatbot-ingestion-worker` (Python), then wire the ingestion loop
(`.txt/.md/.html/pdf` → `embedding-adapters` Python → pgvector) via a job queue handoff.
Blocker: none.

## Progress

### Phase 1 — MVP
- [ ] `chatbot-api` NestJS skeleton + project setup
- [ ] `chatbot-ingestion-worker` Python skeleton + job handoff from the API
- [ ] Postgres + pgvector provisioned (local docker)
- [ ] Basic auth + single org (no RBAC)
- [ ] Document upload endpoint (`.txt`, `.md`, `.html`, native-text `.pdf`)
- [ ] Ingestion pipeline (worker): loader → chunk → embed (`embedding-adapters` Python) → pgvector
- [ ] Async `/ingest` (202 + job id, `GET /jobs/{id}`)
- [ ] One bot: system prompt + BYOK LLM key (encrypted at rest)
- [ ] Conversation/Message persistence (ADR #8: history + metering substrate)
- [ ] Chat endpoint (SSE) via `llm-adapters` (Node) with retrieved context
- [ ] `chatbot-widget` v0: script + basic chat UI (single hardcoded domain)


### Phase 2 — Multi-tenant platform
- [ ] Multi-org + bots data model
- [ ] RBAC roles (owner / admin / editor / viewer)
- [ ] API keys: sandbox/production × secret/publishable (+ rotation/revocation)
- [ ] Usage counter (messages, tokens, docs) per tenant/bot
- [ ] Widget domain validation (allowlist + ownership proof: DNS TXT / `.well-known`)
- [ ] `chatbot-portal` (Next.js) screens for orgs/bots/docs/keys

### Phase 3 — Governance
- [ ] Rate limiting (per key, per tenant)
- [ ] Per-plan usage limits + soft/hard caps
- [ ] Guardrails / prompt security (input/output filtering, injection resistance)
- [ ] Document types: `.docx`, `.csv`, `.xlsx`

### Phase 4 — GA
- [ ] OCR for images & scanned PDFs (`ocr-adapters`)
- [ ] URL/sitemap crawling ingestion
- [ ] Reranking (`reranker-adapters`)
- [ ] Billing-lite + analytics dashboards
- [ ] Content moderation (`moderation-adapters`)

## Decisions Made During Execution
- 2026-06-14: Project incubates in `ai-tests`; graduates to its own repo before publish/deploy.
- 2026-06-14: Stack = **NestJS API (Node/TS) + Python ingestion worker + Next.js front**. API uses
  Node adapters (chat + query-embed); worker uses Python adapters + parsing ecosystem. Polyglot
  split chosen for the Python doc-parsing strength + TS unification (portal/widget) + cross-language
  orchestration as a showcase. (Supersedes the earlier "FastAPI back" idea.)
- 2026-06-14: Standalone from `xctx` (no dependency on its Embeddings API).
- 2026-06-14: **Pricing review** — Starter $10→$19 (R$99), Business $89→$119 (R$599) to hold a ≥45%
  worst-case margin floor. Pro unchanged ($39). See `PRICING.md` §6.
- 2026-06-14: **Reingestion budget** model = `K × storage`/mo (not per-doc). Launch **K=3**, approved
  ceiling **5×**, uniform across tiers. On budget hit: degrade (pause re-embed), never block chat.
  New `PRICING.md` §6.1 / §6.2 / §7.3 (worst-case cost-per-tenant table + K knob).
- 2026-06-14: **ADR #15 — incremental re-embed by chunk** (diff per chunk hash; re-embed only changed
  chunks) → keeps effective K ~1–2, bounds worst-case cost.
- 2026-06-14: **Two schema concerns separated** (corrects an earlier conflation): (a) the **adapter
  parity schema** lives inside `llm-adapters`/`embedding-adapters` and only keeps the Python+TS builds
  identical; (b) the **ingestion job contract** (API↔worker seam) is a **product** concern living in
  the product, not in the adapters. Validated on both sides. Recorded in `CONTEXT.md`.
- 2026-06-14: **BSP explicitly out** of `FUTURE/01-channels` — WhatsApp via Meta Cloud API direct;
  being a BSP is a scale-someday marker, not roadmap.
- 2026-06-14: **ADR #16 — tenant isolation via Postgres RLS** (schema-per-tenant rejected: multiplies
  migrations/connections). Decided now because it shapes the data model from F1.
- 2026-06-14: **ADR #17 — embedding parity is a runtime invariant** (same provider+model+dim+
  normalization on Python ingestion and Node query, from a single shared config; else silent
  retrieval degradation). Recorded in `CONTEXT.md` gotchas.
- 2026-06-14: **ADR #8 — Conversation/Message persisted from F1** (history + per-message metering
  substrate + ticketing/quality-metrics hook). Added to F1 checklist and the ER.
- 2026-06-14: **Known Gaps / Deferred** registered in `PLAN.md` — LGPD/data-protection (F3), BYOK key
  crypto mechanics (F2), RAG retrieval-quality eval (F4 nice-to-have). None block F1.


