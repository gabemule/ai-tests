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
