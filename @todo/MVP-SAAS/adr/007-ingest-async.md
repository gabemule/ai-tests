# ADR 007 — `/ingest` is asynchronous

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `ingestion`, `job-contract`

## Context

Embedding generation is CPU-heavy and long-running. Doing it on the request path would block uploads
and couple the API's latency to document size.

## Decision

`POST /documents` (upload) returns **`202 Accepted` + a job id** and enqueues an ingestion job. The
Python worker consumes it; progress is read via polling (`GET /jobs/{id}`) or SSE.

## Consequences

- Requires a job queue as the API↔worker seam (Upstash QStash — see ADR 001 / `ARCHITECTURE.md`).
- The queue is at-least-once: job handling must be **idempotent** and carry a DLQ + signature
  verification.
- Document status (`pending|processing|ready|failed`) is the user-facing progress surface.

## Implementation contract (feature `ingestion`)

- **Idempotent job handling:** key each job by `document_id` + content hash; a redelivery **upserts**
  (no duplicate chunks/embeddings) instead of re-inserting.
- **DLQ:** after N failed attempts route the job to a dead-letter queue and mark the document
  `failed`, instead of retrying indefinitely.
- **Verify the QStash signature** on every incoming job at the worker before processing — reject
  unsigned/forged payloads.
- **Acceptance:** (a) a redelivered job produces **no** duplicate chunks; (b) a permanently failing
  job lands in the DLQ + document `failed`; (c) an unsigned payload is rejected.
