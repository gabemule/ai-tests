# Feature: ingestion

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** core-api *(hard)*, job-contract *(hard)* · **ADRs:** 001, 007, 010, 017

## Objective

The Python worker: consume ingestion jobs and run parse → chunk → embed → upsert into pgvector,
asynchronously and idempotently, with embedding parity locked to the query side.

## Scope

**In:**
- `POST /documents` returns `202 Accepted` + job id; enqueues a job (QStash).
- Python worker consumes, verifies the QStash signature, validates the contract (`job-contract`).
- Parse (start with PDF/txt/md) → chunk → embed with the Python `embedding-adapters`.
- Upsert chunks/embeddings; write `embedding_model/dim/normalized/version` columns (ADR 017).
- Idempotent handling keyed by `document_id` + content hash; DLQ after N failures.
- Worker sets `app.tenant_id` transaction-locally from the validated job (ADR 016).
- Document status surface: `pending|processing|ready|failed` (poll `GET /jobs/{id}` or SSE).

**Out:**
- OCR, docx/csv/xlsx, URL crawl (later / governance phase).
- Incremental re-embed by chunk diff (→ `incremental-reembed`).
- Retrieval/query path (→ `retrieval`).

## Done criterion

A redelivered job produces **no** duplicate chunks; a permanently failing job lands in the DLQ +
document `failed`; an unsigned payload is rejected; and ingested rows carry the active embedding
identity matching the query-side config.
