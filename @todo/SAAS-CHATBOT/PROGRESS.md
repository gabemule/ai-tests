# SAAS-CHATBOT — Progress

**Status:** 0/32 items · Phase: F1 (MVP) — not started



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
- [ ] **Ingestion job contract** (ADR #18): explicit, versioned schema for the API↔worker job, validated on **both** the Node (enqueue) and Python (consume) sides
- [ ] Postgres + pgvector provisioned (local docker)
- [ ] Basic auth + single org (no RBAC)
- [ ] Document upload endpoint (`.txt`, `.md`, `.html`, native-text `.pdf`)
- [ ] Ingestion pipeline (worker): loader → chunk → embed (`embedding-adapters` Python) → pgvector
- [ ] Async `/ingest` (202 + job id, `GET /jobs/{id}`)
- [ ] One bot: system prompt + BYOK LLM key (encrypted at rest)
- [ ] Conversation/Message persistence (ADR #8: history + metering substrate)
- [ ] Chat endpoint (SSE) via `llm-adapters` (Node) with retrieved context
- [ ] `chatbot-widget` v0: script + basic chat UI (single hardcoded domain)

### Phase 1 — Acceptance gates (the ADR "Consequences" made verifiable)
> These are not features — they are the **tests** the F1 ADRs require. Each maps to an ADR's
> Acceptance clause; F1 is not "done" until they pass.
- [ ] **RLS leak test** (ADR #16): two interleaved A/B requests over the **same** pooled connection never read each other's rows; a query with no `app.tenant_id` set returns **zero** rows (fail-closed)
- [ ] **Embedding parity test** (ADR #17): build fails if Python ingestion and Node query resolve to different model/dim/normalization; + migration test that old `embedding_version` rows are detected and re-embedded, not queried across spaces
- [ ] **Ingestion job contract dual-side validation** (ADR #18): a job payload that violates the versioned schema is rejected on **both** the Node (enqueue) and Python (consume) sides; a version mismatch fails closed rather than processing a malformed job
- [ ] **Ingest idempotency + DLQ + signature** (ADR #7): a redelivered job produces **no** duplicate chunks; a permanently failing job lands in the DLQ + document `failed`; an unsigned QStash payload is rejected
- [ ] **Conversation windowing/summary** (ADR #8): a very long conversation still produces a prompt under the model's context budget via a bounded window + running summary
- [ ] **BYOK at-rest check** (ADR #5): stored `byok_llm_key` is ciphertext (no plaintext at rest); logs never contain the key


### Phase 2 — Multi-tenant platform
- [ ] Multi-org + bots data model
- [ ] RBAC roles (owner / admin / editor / viewer) — leave room for a future `agent` actor without migration (`FUTURE/02`)
- [ ] API keys: sandbox/production × secret/publishable (+ rotation/revocation)
- [ ] Usage counter (messages, tokens, docs) per tenant/bot
- [ ] **Incremental re-embed by chunk** (ADR #15): on document re-upload, diff per chunk hash → delete changed chunks' old vectors → embed only the new ones (effective K ~1–2)
- [ ] Widget domain validation (allowlist + ownership proof: DNS TXT / `.well-known`)
- [ ] `chatbot-portal` (Next.js) screens for orgs/bots/docs/keys
- [ ] **Metering in shadow mode** — record usage + reconcile vs. provider invoice, no charging yet (gate for F4 billing; validate the meter before money depends on it)

#### Phase 2 — Acceptance gate
- [ ] **Widget session token + abuse rate-limit** (ADR #4): a stale/forged session token is rejected, and requests beyond the per-key/session/IP limit on one leaked publishable key are throttled (distinct from the F3 per-plan/per-tenant governance limits)


### Phase 3 — Governance
- [ ] Rate limiting (per key, per tenant)
- [ ] Per-plan usage limits + soft/hard caps
- [ ] Guardrails / prompt security (input/output filtering, injection resistance)
- [ ] Document types: `.docx`, `.csv`, `.xlsx`

### Pre-F4 gate
- [ ] **Validate the routing classifier** (80/15/5 mix) in measurement mode on real traffic — confirm the blended cost lands near plan (~$1.35/1M) **before** the F4 anchor price is locked (`adr/014`, `PRICING/models.md` §8 / `PRICING/README.md` §11)

### Phase 4 — GA
- [ ] OCR for images & scanned PDFs (`ocr-adapters`)
- [ ] URL/sitemap crawling ingestion
- [ ] Reranking (`reranker-adapters`)
- [ ] Billing-lite + analytics dashboards
- [ ] Content moderation (`moderation-adapters`)
- [ ] **Shared outbound egress guard** (SSRF/allowlist/timeout) for the tool executor + any outbound caller (`FUTURE/08`)

#### Phase 4 — Acceptance gate
- [ ] **Managed wallet hard cap** (ADR #11): before each Managed generation the API derives an affordable `max_tokens` from the wallet's remaining balance and caps the provider call; a stream that hits the cap stops cleanly ("limit reached") and **no single answer can drive the balance negative** (pairs with the `WALLET_ENTRY` reserve/hold)


## Decisions Made During Execution
- 2026-06-14: Project incubates in `ai-tests`; graduates to its own repo before publish/deploy.
- 2026-06-14: Stack = **NestJS API (Node/TS) + Python ingestion worker + Next.js front**. API uses
  Node adapters (chat + query-embed); worker uses Python adapters + parsing ecosystem. Polyglot
  split chosen for the Python doc-parsing strength + TS unification (portal/widget) + cross-language
  orchestration as a showcase. (Supersedes the earlier "FastAPI back" idea.)
- 2026-06-14: Standalone from `xctx` (no dependency on its Embeddings API).
- 2026-06-14: **Pricing review** — Starter $10→$19 (R$99), Business $89→$119 (R$599) to hold a ≥45%
  worst-case margin floor. Pro unchanged ($39). See `PRICING/plans.md` §6.
- 2026-06-14: **Reingestion budget** model = `K × storage`/mo (not per-doc). Launch **K=3**, approved
  ceiling **5×**, uniform across tiers. On budget hit: degrade (pause re-embed), never block chat.
  New `PRICING/plans.md` §6.1 / §6.2 / §7.3 (worst-case cost-per-tenant table + K knob).
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


