# ARCHITECTURE — MVP-SAAS

> Concept + diagrams. Companion to `FEATURES/README.md` (the feature graph),
> `CONTEXT.md` (working knowledge), `PROGRESS.md` (status).
> Last updated: 2026-06-20

---

## 1. Concept in one sentence

A **whitelabel RAG chatbot platform**: a customer uploads documents, configures a bot,
and drops a `<script>` on their site — the chat answers grounded in **their** documents.
LLM runs **Managed** by default at GA (platform key, wallet-billed); **BYOK** is the
M1–M2 bootstrap and later an Enterprise add-on (ADR 009/013).

## 2. Central principle — reuse, not reinvention

The AI engine is a pair of **co-built sibling libraries** in the monorepo (`llm-adapters`,
`embedding-adapters`) — **planned, not yet implemented** (both `0/48` / `0/47`, zero code; see
`FEATURES/README.md` → "Engine prerequisite"). This product is the **shell** (tenancy, ingestion,
retrieval quality, governance, distribution, monetization) wrapped around that engine, behind a clean
public interface so the extraction stays mechanical. "Reuse, not reinvention" = *don't re-implement RAG
primitives in the product*, **not** *the engine is already done*.

```
        ┌─────────────────────────────────────────────┐
        │            MVP-SAAS (the shell)             │
        │ tenancy · ingestion · RAG quality · widget  │
        │        · governance · monetization          │
        └───────────────┬─────────────────────────────┘
                        │ uses
        ┌───────────────▼─────────────────────────────┐
        │   Engine (co-built siblings — not yet built)│
        │     llm-adapters   ·   embedding-adapters   │
        └─────────────────────────────────────────────┘
```

## 3. Polyglot split — by ecosystem fit

Principle: **Python where the ecosystem matters** (document parsing, OCR, offline eval),
**Node where it's the common path** (API, chat, governance, query-embed). The TS stack
unifies API + portal + widget. (ADR 001)

```mermaid
flowchart TB
    subgraph customer["Customer's website"]
        widget["chatbot-widget<br/>(&lt;script&gt; embed)"]
    end
    subgraph platform["MVP-SAAS Platform"]
        portal["chatbot-portal<br/>(Next.js · tenant admin)"]
        admin["chatbot-admin<br/>(operator console · cross-tenant)"]
        api["chatbot-api<br/>(NestJS / Node)"]
        worker["chatbot-ingestion-worker<br/>(Python)"]
    end
    subgraph engine["Engine (dual-lang siblings)"]
        embN["embedding-adapters (Node)"]
        embP["embedding-adapters (Python)"]
        llm["llm-adapters (Node)"]
    end
    subgraph stores["Data / Infra"]
        pg[("Postgres + pgvector")]
        obj[("Object storage<br/>raw files")]
        q[["Job queue (QStash)"]]
    end
    subgraph external["External providers"]
        prov["LLM &amp; Embedding APIs"]
    end

    portal -- "HTTPS (tenant admin)" --> api
    admin -- "privileged role · cross-tenant (ADR 020)" --> pg
    widget -- "HTTPS / SSE (chat)" --> api
    api -- "enqueue job" --> q
    q -- "consume" --> worker
    api --> embN
    api --> llm
    worker --> embP
    embN --> prov
    embP --> prov
    llm --> prov
    api --> pg
    api --> obj
    worker --> pg
    worker --> obj
```

- **chatbot-api (NestJS / Node)** — the brain. Auth, tenancy, retrieval, chat (SSE),
  usage/limits, ingestion *orchestration* (enqueues jobs). Node adapters for chat + query-embed.
- **chatbot-ingestion-worker (Python)** — the muscle. Parses (pypdf/pdfminer/unstructured/
  python-docx/pandas), chunks, embeds (Python `embedding-adapters`), upserts pgvector.
- **chatbot-portal (Next.js)** — the **tenant's** admin (orgs/bots/docs/keys/domains/dashboards),
  RLS-scoped to one org.
- **chatbot-admin (operator console)** — **our** surface, the third app. Cross-tenant by design via a
  **privileged role** (the deliberate inverse of RLS, ADR 020): tenant management, the **Research
  module** (graduated `research-app` — model/embedding catalog + unit costs), and cost×revenue
  analytics (`cost-attribution` / `revenue-analytics`). Physically separate, own operator auth,
  audited. **Largest blast radius in the system** — never a route inside `portal`.
- **chatbot-widget** — the distribution (publishable key + domain validation).

## 4. Domain model (multi-tenant)

```mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBER : has
    ORGANIZATION ||--o{ API_KEY : owns
    ORGANIZATION ||--o{ BOT : owns
    ORGANIZATION ||--o{ WALLET_ENTRY : "prepaid ledger"
    BOT ||--o{ ALLOWED_DOMAIN : allows
    BOT ||--o{ DOCUMENT : "knowledge source"
    DOCUMENT ||--o{ CHUNK : "split into"
    CHUNK ||--|| EMBEDDING : "vectorized as"
    BOT ||--o{ CONVERSATION : "chats"
    CONVERSATION ||--o{ MESSAGE : "contains"
    OPERATOR ||--o{ ADMIN_AUDIT : "logs"

    ORGANIZATION {
        uuid id PK
        string name
        string plan
    }
    MEMBER {
        uuid id PK
        uuid tenant_id FK
        string email
        string role
    }
    API_KEY {
        uuid id PK
        uuid tenant_id FK
        string environment
        string scope
        string hash
    }
    BOT {
        uuid id PK
        uuid tenant_id FK
        text system_prompt
        json guardrails
        bytes byok_llm_key
    }
    ALLOWED_DOMAIN {
        uuid id PK
        uuid bot_id FK
        uuid tenant_id
        string domain
        bool verified
        string ownership_token
    }
    DOCUMENT {
        uuid id PK
        uuid bot_id FK
        uuid tenant_id
        string filename
        string status
    }
    CHUNK {
        uuid id PK
        uuid document_id FK
        uuid tenant_id
        int index
        text content
        string content_hash
    }
    EMBEDDING {
        uuid id PK
        uuid chunk_id FK
        uuid tenant_id
        vector embedding
        string embedding_model
        int embedding_dim
        bool embedding_normalized
        int embedding_version
    }
    CONVERSATION {
        uuid id PK
        uuid bot_id FK
        uuid tenant_id
        string status
        timestamp created_at
    }
    MESSAGE {
        uuid id PK
        uuid conversation_id FK
        uuid tenant_id
        string role
        text content
        int tokens_in
        int tokens_out
        timestamp created_at
    }
    WALLET_ENTRY {
        uuid id PK
        uuid tenant_id FK
        string type
        string idempotency_key
        bigint amount
        string reason
        timestamp created_at
    }
    OPERATOR {
        uuid id PK
        string email
        string role
    }
    ADMIN_AUDIT {
        uuid id PK
        uuid operator_id FK
        string action
        uuid target_tenant_id
        json detail
        timestamp created_at
    }
```

> **`OPERATOR` / `ADMIN_AUDIT` are NOT tenant-scoped (ADR 020).** They live outside the `tenant_id`
> RLS boundary — operators are not tenant members, and the audit trail is the operator plane's
> append-only log (every privileged cross-tenant write). Only the `chatbot-admin` privileged role
> touches them; the API/worker/portal never do.

> **Isolation is physical (ADR 016).** One uniform key — `tenant_id` everywhere (FK on
> org-owned tables, denormalized on bot-scoped + hot-path tables) — so a single RLS policy
> `USING (tenant_id = current_setting('app.tenant_id')::uuid)` applies identically. Fail-closed:
> unset `tenant_id` → zero rows. The Python worker sets `app.tenant_id` transaction-locally too.
>
> **Conversation/Message persisted from M1 (ADR 008)** — history + metering substrate + future
> ticketing/quality-metrics hook, no retrofit.
>
> **Embedding identity on the vector row (ADR 017)** — `embedding_model/dim/normalized/version`
> guard the parity invariant and enable safe re-embed on model change (ADR 015).

## 5. Flow 1 — Ingestion (async, cross-language)

```mermaid
sequenceDiagram
    actor User as Admin (portal)
    participant API as chatbot-api (NestJS)
    participant Q as Job queue (QStash)
    participant W as ingestion-worker (Python)
    participant Emb as embedding-adapters (Python)
    participant Obj as Object storage
    participant PG as Postgres + pgvector

    User->>API: POST /documents (upload)
    API->>Obj: store raw file
    API->>PG: create Document, status pending
    API->>Q: enqueue job (schema_version, document_id, tenant_id, bot_id, file_ref, content_hash)
    API-->>User: 202 Accepted with job_id
    Note over Q,W: async, off the request path (validated job contract, ADR 018)
    Q->>W: deliver job (signature-verified, ADR 007)
    W->>W: validate contract + set app.tenant_id (txn-local)
    W->>Obj: fetch raw file
    W->>W: parse + chunk (hash per chunk)
    W->>Emb: embed chunks (active shared config, ADR 017)
    Emb-->>W: vectors
    W->>PG: upsert chunks + embeddings (idempotent by content_hash)
    W->>PG: set Document.status ready
    User->>API: GET /jobs/job_id
    API-->>User: status ready
```

## 6. Flow 2 — Chat (RAG + streaming + the new gate)

```mermaid
sequenceDiagram
    actor Visitor as Site visitor
    participant W as chatbot-widget
    participant API as chatbot-api (NestJS)
    participant Emb as embedding-adapters (Node)
    participant PG as Postgres + pgvector
    participant LLM as llm-adapters (Node)
    participant Prov as LLM provider

    Visitor->>W: types question
    W->>API: POST /chat (publishable key, Origin)
    API->>API: validate key + Origin (+ domain proof, ADR 004)
    API->>Emb: embed question
    Emb-->>API: query vector
    API->>PG: similarity search (tenant + bot scoped)
    PG-->>API: top-k chunks + scores
    Note over API: confidence-gate (ADR 019)
    API->>API: scores below floor, return dont-know fallback (no LLM)
    API->>API: optional near-exact match, answer from chunk (no LLM)
    API->>API: else build prompt (system + context + windowed history)
    API->>LLM: chat (Managed routed model or BYOK tenant key)
    LLM->>Prov: request
    Prov-->>LLM: streamed tokens
    LLM-->>API: stream (+ local token count, ADR 011)
    API-->>W: SSE stream
    W-->>Visitor: renders answer (live)
```

> **confidence-gate (ADR 019)** is the new step between retrieval and generation: a **floor**
> that refuses to hallucinate when nothing is relevant, and an optional **ceiling** that answers
> without the LLM on near-exact matches (token savings + latency). Calibrated by `retrieval-eval`.
>
> **Managed hard cap (ADR 011, GA):** before each Managed generation the API derives an
> affordable `max_tokens` from the wallet balance at the anchor price; pairs with the
> wallet reserve/hold so no single answer drives the balance negative.

## 7. Decision index

Full rationale in `adr/` (source of truth). Features reference ADRs by number; see
`FEATURES/README.md` for the feature↔ADR mapping.

## 8. Lifecycle — incubation to product

```mermaid
flowchart LR
    idea["idea / spike"] --> embryo["embryonic (in ai-tests)"]
    embryo --> mature["matured"]
    mature --> repo["graduates to own repo"]
    repo --> ship["publish / deploy"]
```

While embryonic it lives in the `ai-tests` incubator, reusing the adapters as siblings. On
maturity it graduates to its own repo — so coupling stays at the public-interface level.
