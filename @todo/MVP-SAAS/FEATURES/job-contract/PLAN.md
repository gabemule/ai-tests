# Feature: job-contract

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** core-api *(hard)* · **ADRs:** 018, 007

## Objective

Define the versioned API↔worker ingestion job contract — the "sacred seam" of the polyglot split —
and validate it on **both** the Node (enqueue) and Python (consume) sides.

## Scope

**In:**
- A single schema definition (e.g. JSON Schema) for the job payload, carrying at minimum:
  `schema_version`, `document_id`, `tenant_id`, `bot_id`, object-storage ref of the raw file,
  content hash.
- Validation on enqueue (Node) and on consume (Python).
- Version handling: consumers reject unknown major `schema_version`.
- The contract lives **in the product** (shared), never inside the adapter libraries.

**Out:**
- Actual parse/chunk/embed work (→ `ingestion`).
- The queue transport setup beyond what's needed to define/validate the contract.

## Done criterion

A payload missing/malforming a required field is rejected on **both** sides; a payload with an
unknown major `schema_version` is rejected by the worker rather than processed.
