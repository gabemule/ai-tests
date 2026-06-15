# ADR 018 — Ingestion job contract (the "sacred seam")

**Status:** Accepted · 2026-06-14

## Context

The polyglot split (ADR 001) makes the **API↔worker handoff** the single most critical integration
point of the platform: the **NestJS API enqueues** ingestion jobs and the **Python worker consumes**
them. If the two sides drift on the job's shape, ingestion breaks across a language boundary — the
hardest kind of bug to catch.

This is **not** the adapter parity schema (which lives inside `llm-adapters`/`embedding-adapters` and
only keeps their Python/TS builds identical — see `CONTEXT.md` gotchas). The job contract is a
**product** concern and must live **in the product**, so the libraries stay decoupled and the
graduation/extraction stays mechanical.

## Decision

The ingestion job is an **explicit, versioned contract** owned by the product and **validated on both
sides**:

- A single **schema definition** (e.g. JSON Schema) for the job payload, carrying at minimum:
  `schema_version`, `document_id`, `tenant_id`, `bot_id`, the object-storage reference of the raw
  file, and the content hash (for idempotency, ADR 007).
- The **Node API validates on enqueue**; the **Python worker validates on consume**. A payload that
  fails validation is rejected (and, per ADR 007, an unsigned/forged payload is rejected before
  processing).
- The contract is **versioned** (`schema_version`): consumers reject unknown major versions rather
  than silently mis-parsing.

## Consequences

- The contract definition lives in the **product** (shared between `chatbot-api` and
  `chatbot-ingestion-worker`), never inside the adapter libraries — preserving the graduation
  discipline (`CONTEXT.md`).
- Pairs with ADR 007 (async ingest): the same payload carries the idempotency key (content hash) and
  is signature-verified at the worker.
- Pairs with ADR 017 (embedding parity): the worker resolves the **active embedding config** from the
  single shared source, not from the job payload, so the contract never encodes a drifting model.

## Implementation contract (F1)

- Define the job schema once (`schema_version` + the fields above) and **validate on both** the
  enqueue (Node) and consume (Python) paths.
- **Acceptance:** a payload missing or malforming a required field is rejected on **both** sides; a
  payload with an unknown major `schema_version` is rejected by the worker rather than processed.
