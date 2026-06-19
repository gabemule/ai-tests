# ADR 016 — Tenant isolation via Postgres RLS (not schema-per-tenant)

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `core-db` (introduces it), `retrieval`, `rbac`, `ingestion` (worker writes)

## Context

A multi-tenant RAG platform on a single Postgres + pgvector store (ADR 002) must guarantee that one
tenant can never read another's data. A shared `WHERE tenant_id = ?` filter is one bug away from a
cross-tenant leak. Schema-per-tenant was the alternative considered.

## Decision

Tenant isolation is **physical**, via **Postgres Row-Level Security (RLS)** scoped by `tenant_id`.
Every tenant-owned table carries `tenant_id` and an RLS policy, from the very first feature.
Schema-per-tenant was **rejected**: it multiplies migrations and connection pools per tenant and
becomes an operational burden at scale, whereas RLS is the pragmatic, pgvector-friendly default.

**One uniform key — `tenant_id` everywhere.** The tenant boundary is the `ORGANIZATION`, so on
org-owned tables (`MEMBER`, `API_KEY`, `BOT`, `WALLET_ENTRY`) `tenant_id` **is** the FK to
`ORGANIZATION`; bot-scoped tables (`ALLOWED_DOMAIN`, `DOCUMENT`, `CHUNK`) and the hot-path tables
(`EMBEDDING`, `CONVERSATION`, `MESSAGE`) **denormalize** `tenant_id`. No table uses a differently
named isolation column (no `org_id` vs `tenant_id` split), so a single RLS policy
(`USING (tenant_id = current_setting('app.tenant_id')::uuid)`) applies identically everywhere.

## Consequences

- Shapes the data model from `core-db` (every tenant table has `tenant_id` + policy).
- The `tenant_id` must be set per request in a way that survives connection pooling (transaction-local
  session variable, pooler in transaction mode) — a critical correctness detail to validate with a
  leak test.

## Implementation contract (feature `core-db`)

- Set the tenant **transaction-locally** at the start of every request's transaction:
  `set_config('app.tenant_id', $1, true)` (or `SET LOCAL`) — the `true` keeps it local to the
  current transaction, so it can't bleed into the next request on a reused pooled connection.
- Run the pooler in **transaction mode** (PgBouncer/Supabase) so a connection is held only for the
  duration of a transaction, never across requests.
- RLS policy is **default-deny / fail-closed**: when `app.tenant_id` is unset the policy matches
  **zero** rows (never all rows).
- **Worker (off-request) writes:** the Python ingestion worker writes `CHUNK`/`EMBEDDING`/
  `DOCUMENT.status` **outside** any HTTP request, so it has no per-request session variable. It must
  set `app.tenant_id` **transaction-locally at the start of each job transaction**, taking the value
  from the `tenant_id` in the validated job contract (ADR 018), exactly as the API does per request.
  The same fail-closed RLS applies to the worker's connection.
- **Acceptance (leak test):** two interleaved requests for tenant A and B over the **same** pooled
  connection never read each other's rows; a query with no `app.tenant_id` set returns **zero**
  rows; and a worker job that does not set `app.tenant_id` is blocked by RLS (writes zero rows)
  rather than inserting unscoped data.
