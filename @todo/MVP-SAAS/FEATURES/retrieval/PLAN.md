# Feature: retrieval

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** ingestion *(hard)* · **ADRs:** 002, 010, 016, 017

## Objective

Tenant-scoped similarity search over pgvector: embed the query (Node side) and return the top-k
chunks for a tenant, respecting RLS and the embedding-parity invariant.

## Scope

**In:**
- Query-time embedding via the Node `embedding-adapters`, using the **same** active config as
  ingestion (single shared source).
- Top-k similarity search over pgvector, RLS-scoped by `tenant_id`.
- Match only rows with the **same** embedding identity (model/dim/normalization/version); refuse +
  flag a mismatch rather than comparing across spaces.

**Out:**
- LLM generation / chat (→ `chat-sse`).
- Eval harness (→ `retrieval-eval`), confidence gate (→ `confidence-gate`), reranking (→ `reranking`).

## Done criterion

A parity test fails if ingestion and query resolve to different model/dim/normalization; a query for
tenant A never returns tenant B's chunks; and top-k results come back ranked by similarity for a
known dataset.
