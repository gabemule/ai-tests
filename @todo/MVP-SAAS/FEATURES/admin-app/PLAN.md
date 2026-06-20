# Feature: admin-app

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** core-api *(hard)*, rbac *(soft)* · **ADRs:** 020

## Objective

The **operator console** — *our* surface, not the tenant's. A separate app with its own auth and a
privileged cross-tenant role (ADR 020) where we manage customers, inspect every tenant, and curate the
model/embedding catalog. This is the shell + tenant management + the **Research module** (the
graduated `research-app`); the cost×revenue analytics ride on top later (`cost-attribution`,
`revenue-analytics`).

> **Distinct from `portal`.** `portal` is the **tenant's** UI, RLS-scoped to one org. `admin-app` is
> the **operator's** UI, cross-tenant by design (ADR 020) — the only surface that bypasses RLS.

## Scope

**In:**
- A **physically separate app** (`chatbot-admin`) with **operator auth** (not tenant `MEMBER` login).
- A **single privileged DB role** (service-role / `BYPASSRLS`) used only here; API/worker/portal stay
  RLS-subject (ADR 016 unchanged).
- **Tenant management:** list all organizations, plan, status, usage at a glance; drill into one
  tenant (bots, docs, members, keys).
- **Research module** — the `research-app` catalog graduated from Vite+lowdb into this app, **persisted
  in Supabase**: model/embedding lists, tiers (`economy`/`principal`/`premium` + `-alt` + `bench-*`),
  unit costs (the OpenRouter × Artificial Analysis scan). Becomes the SSOT for unit costs the rest of
  the platform reads.
- **Append-only `admin_audit`** trail for every privileged write (manual credit, plan override, etc.).

**Out:**
- Per-tenant cost attribution (→ `cost-attribution`).
- Revenue/margin dashboards (→ `revenue-analytics`).
- Tenant-facing screens (→ `portal`).
- The router that *consumes* the curated catalog (→ `model-routing` / future `router-adapters`).

## Done criterion

An operator logs into a separate admin app and lists **all** tenants cross-tenant; a tenant login
cannot reach any admin route or the privileged role; the Research module reads/writes the model
catalog from Supabase (a Scan updates unit costs); a privileged write produces an `admin_audit` entry;
the ADR 016 leak test still passes for the API/worker/portal.
