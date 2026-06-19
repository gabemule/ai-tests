# Feature: core-api

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** core-db *(hard)* · **ADRs:** 001

## Objective

NestJS API skeleton: the Node/TS service that owns auth, tenancy wiring, and the request lifecycle.
The common-path runtime where chat, retrieval, and governance will live.

## Scope

**In:**
- NestJS project scaffolding (modules, config, health check).
- Basic auth + a single organization (no full RBAC yet).
- Per-request middleware that sets `app.tenant_id` transaction-locally (consumes `core-db`).
- Wiring for the Node builds of `llm-adapters` / `embedding-adapters` (no endpoints yet).

**Out:**
- RBAC roles (→ `rbac`), API keys (→ `api-keys`), chat/retrieval endpoints (→ later features).
- Ingestion orchestration (→ `job-contract` / `ingestion`).

## Done criterion

A request authenticated for a tenant reaches a handler with `app.tenant_id` correctly set
(verified by an RLS-scoped read returning only that tenant's rows); an unauthenticated request is
rejected.
