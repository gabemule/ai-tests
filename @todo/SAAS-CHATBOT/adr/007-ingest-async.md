# ADR 007 — `/ingest` is asynchronous

**Status:** Accepted · 2026-06-14

## Context

Embedding generation is CPU-heavy and long-running. Doing it on the request path would block uploads
and couple the API's latency to document size.

## Decision

`POST /documents` (upload) returns **`202 Accepted` + a job id** and enqueues an ingestion job. The
Python worker consumes it; progress is read via polling (`GET /jobs/{id}`) or SSE.

## Consequences

- Requires a job queue as the API↔worker seam (Upstash QStash — see ADR 001 / `ARCHITECTURE.md` §4).
- The queue is at-least-once: job handling must be **idempotent** and carry a DLQ + signature
  verification.
- Document status (`pending|processing|ready|failed`) is the user-facing progress surface.
