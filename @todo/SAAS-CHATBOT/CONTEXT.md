# SAAS-CHATBOT — Context

> Feature-specific knowledge base. Maintained for context recovery between sessions.
> Last updated: 2026-06-14

## What this is

Whitelabel RAG chatbot SaaS. Tenants upload documents, configure a bot (prompt,
guardrails, BYOK LLM key, allowed domains), and embed a chat widget on their own
sites via a `<script>` snippet. Built **on top of** the monorepo's adapter libraries —
not a RAG reimplementation.

**Incubation:** lives in `ai-tests` (incubator) while embryonic; **graduates to its own
repo** before publish/deploy. Keep cross-package deps clean for a mechanical extraction.

## Domains

| Domain | Responsibility |
|---|---|
| **Tenancy & Identity** | org → bots → members; RBAC (owner/admin/editor/viewer) |
| **Knowledge / Embeddings** | doc upload → ingestion (Python worker) → pgvector; tenant-isolated retrieval |
| **Bot Config** | system prompt, guardrails, BYOK LLM key, enabled domains |
| **Governance** | usage metering, rate limiting, per-plan limits, prompt security |
| **Distribution (Widget)** | embeddable script, publishable key, domain validation |

## Key Files (planned)

- `ai-tests/pkgs/chatbot-api/` — **NestJS (Node/TS)** backend: auth, tenancy, retrieval, chat (SSE),
  usage, ingestion orchestration (enqueues jobs)
- `ai-tests/pkgs/chatbot-ingestion-worker/` — **Python** worker: parse → chunk → embed → pgvector
- `ai-tests/pkgs/chatbot-portal/` — Next.js admin UI
- `ai-tests/pkgs/chatbot-widget/` — embeddable script + chat UI

## Integration Points

- **`embedding-adapters`** — used in **two** places, in two languages:
  - the **Python worker** at ingestion time (doc → vectors), leaning on the rich parsing ecosystem;
  - the **NestJS API** (Node build) at query time (question → vector).
  Provider-agnostic (OpenAI / SentenceTransformers / Cohere / VoyageAI / Ollama).
- **`llm-adapters`** (Node build) — used by the NestJS chat endpoint with the tenant's BYOK key.
- **Job queue** — the API↔worker handoff (the cross-language seam). API enqueues, worker consumes.
- **Future adapters** (from `@todo/FUTURE.md`): `reranker-adapters` (retrieval quality),
  `ocr-adapters` (image/scanned-PDF ingestion), `moderation-adapters` (content safety).

## Patterns Adopted

- **Polyglot split:** NestJS API (Node) + Python ingestion worker. Each consumes the adapters'
  native build (Node vs Python). Chat lives in the API; heavy parsing/embedding lives in the worker.
- **Two-axis API keys:** environment (`sandbox` | `production`) × scope (`secret` | `publishable`).
- **Async ingestion:** `POST /ingest` → `202 Accepted` + job id; progress via `GET /jobs/{id}` or SSE.
- **SSE for chat streaming** (matches the adapters' streaming surface).

## Gotchas

- **Two distinct schema concerns — don't conflate them:**
  1. **Adapter parity schema (inside the libs)** — `llm-adapters` / `embedding-adapters` carry a
     shared JSON schema whose only job is to keep the **Python and TS builds of each adapter
     identical** (same message/IO shape across languages). This belongs to the libs, not the product.
  2. **Ingestion job contract (the product seam)** — the **API↔worker handoff** (job over the queue)
     is a **product** concern and lives **in the product**, not inside the adapters (keeping the libs
     decoupled so the graduation/extraction stays mechanical). It must be an **explicit, versioned
     contract** consumed and validated by both the Node API and the Python worker. This is the
     **sacred seam** of the polyglot split.
- **Embedding parity is a runtime invariant, not a schema concern.** Ingestion embeds in **Python**
  (worker) and query embeds in **Node** (API). They MUST use the **same provider + model + dimension
  + normalization**, or the vectors won't live in the same space and retrieval degrades **silently**
  (no error). The adapter parity schema does NOT protect against this — it's runtime config. Lock the
  embedding model in a **single shared config source** consumed by both sides (never two parallel
  configs), and ideally guard it with a parity test.

- **Re-embed incrementally by chunk, not by document** (ADR #15 in `PLAN.md`) — diff per chunk
  (content hash), re-embed only changed chunks. Keeps the effective reingestion volume (K) low and
  bounds worst-case cost. Reingestion budget = `K × storage`, launch K=3, ceiling 5× (`PRICING.md`
  §6.1 / §7.3).

- **Tenant isolation must be physical**, not a shared `where`-clause — use **Postgres RLS scoped by
  `tenant_id`** (ADR #16; schema-per-tenant rejected — it multiplies migrations/connections per
  tenant). A single filter bug = cross-tenant data leak.

- **Widget domain validation needs ownership proof** (DNS TXT or `/.well-known/<token>`), not just
  an `Origin` check — otherwise anyone copies the publishable key + script and impersonates a domain.
- **BYOK keys encrypted at rest**; never logged, never leave with anything but the outbound LLM call.
- **Ingestion is CPU-heavy** — keep it off the request path (Python worker / async jobs).
- **Images/scanned docs deferred to F4** — they depend on OCR (`ocr-adapters`), not available yet.
- **Graduation discipline:** because this will leave `ai-tests`, avoid deep/implicit coupling to
  sibling packages — depend on their public interfaces only.
