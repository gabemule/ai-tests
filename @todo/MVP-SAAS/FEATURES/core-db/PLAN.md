# Feature: core-db

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** — · **ADRs:** 002, 016

## Objective

Stand up Postgres + pgvector as the single store, with multi-tenant Row-Level Security wired from
the very first migration. This is the foundation every other feature builds on.

## Scope

**In:**
- Postgres + pgvector extension, base migration tooling.
- Schema scaffolding for the tenant-owned tables with a uniform `tenant_id` column everywhere
  (org-owned tables FK to `ORGANIZATION`; bot/hot-path tables denormalize `tenant_id`).
- RLS policy on every tenant table: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`,
  **default-deny / fail-closed**.
- Transaction-local tenant set (`set_config('app.tenant_id', $1, true)`) + pooler in transaction mode.
- **All app/worker DB roles are RLS-subject** — non-owner, **no `BYPASSRLS`**, and not the table owner
  (Postgres table owners bypass RLS by default). The Node API *and* the Python worker connect on such a
  role, or the whole isolation guarantee is silently void. `FORCE ROW LEVEL SECURITY` on tenant tables
  as a belt-and-suspenders.

**Out:**
- Application/auth logic (→ `core-api`).
- Domain-specific columns beyond the isolation scaffolding (added by the feature that owns them).

## Done criterion

**Leak test passes:** (a) two interleaved A/B requests over the **same** pooled connection never read
each other's rows; (b) a query with no `app.tenant_id` set returns **zero** rows; (c) a write with no
`app.tenant_id` is blocked by RLS (zero rows), not inserted unscoped.
