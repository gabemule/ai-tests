# ADR 016 — Tenant isolation via Postgres RLS (not schema-per-tenant)

**Status:** Accepted · 2026-06-14

## Context

A multi-tenant RAG platform on a single Postgres + pgvector store (ADR 002) must guarantee that one
tenant can never read another's data. A shared `WHERE tenant_id = ?` filter is one bug away from a
cross-tenant leak. Schema-per-tenant was the alternative considered.

## Decision

Tenant isolation is **physical**, via **Postgres Row-Level Security (RLS)** scoped by `tenant_id`.
Every tenant-owned table carries `tenant_id` and an RLS policy, from F1. Schema-per-tenant was
**rejected**: it multiplies migrations and connection pools per tenant and becomes an operational
burden at scale, whereas RLS is the pragmatic, pgvector-friendly default.

## Consequences

- Shapes the data model from F1 (every tenant table has `tenant_id` + policy).
- The `tenant_id` must be set per request in a way that survives connection pooling (transaction-local
  session variable, pooler in transaction mode) — a critical correctness detail to validate with a
  leak test.

## Implementation contract (F1)

- Set the tenant **transaction-locally** at the start of every request's transaction:
  `set_config('app.tenant_id', $1, true)` (or `SET LOCAL`) — the `true` keeps it local to the
  current transaction, so it can't bleed into the next request on a reused pooled connection.
- Run the pooler in **transaction mode** (PgBouncer/Supabase) so a connection is held only for the
  duration of a transaction, never across requests.
- RLS policy is **default-deny / fail-closed**: when `app.tenant_id` is unset the policy matches
  **zero** rows (never all rows).
- **Acceptance (leak test):** two interleaved requests for tenant A and B over the **same** pooled
  connection never read each other's rows; and a query with no `app.tenant_id` set returns **zero**
  rows.

