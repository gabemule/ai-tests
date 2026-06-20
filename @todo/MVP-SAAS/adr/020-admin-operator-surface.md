# ADR 020 — Admin/operator surface = separate app with a cross-tenant privileged role

**Status:** Accepted · 2026-06-20 (new in MVP-SAAS)
**Features:** `admin-app` (introduces it), `cost-attribution`, `revenue-analytics`

## Context

The platform has tenant-facing surfaces (`portal`, `widget`) and the API/worker — **all of them are
RLS-subject** (non-owner role, no `BYPASSRLS`, fail-closed; ADR 016). That is the whole security
posture: a tenant can only ever see its own rows.

But running the **business** needs the opposite: *we* (the operator) must see **across all tenants** —
who the customers are, what each tenant **costs** us (tokens + infra), what each tenant **earns** us
(subscription + wallet spend), and the resulting **margin per tenant**. None of that is expressible
under tenant-scoped RLS. There is also no operator-facing surface in the plan today — only the
tenant's `portal`.

This is a genuine architecture decision, not "one more screen": it introduces the **only** place in
the system that legitimately crosses the tenant boundary, so it must be designed as a distinct
privilege domain.

## Decision

The admin/operator console is a **separate application** with its **own auth** and a **privileged,
cross-tenant database role**:

- **Physically separate app** (`chatbot-admin`) — not a route inside `portal`, not the same public
  surface. Operator identities are **not** tenant members; admin auth is independent of tenant login.
- **Privileged DB role** — admin reads use a **service-role / `BYPASSRLS`** connection (the
  deliberate inverse of ADR 016), because cross-tenant aggregation cannot work under tenant-scoped
  RLS. This role is used **only** by the admin app, **never** by the API/worker/portal.
- **Read-mostly + audited** — the admin surface is primarily analytical (tenants, costs, revenue,
  model catalog). Any privileged write (e.g. a manual wallet credit, a plan override) is **logged to
  an append-only audit trail** (who/what/when).
- **The Research module lives here** — the `research-app` (model/embedding catalog + unit costs)
  graduates from standalone Vite+lowdb into a **module of the admin app**, persisted in Supabase
  alongside the rest of the platform (its own README already targets this).

## Consequences

- **Largest blast radius in the system.** A compromise of the admin app is a cross-tenant breach by
  design, so it gets the strictest treatment: isolated deploy/domain, separate credentials, MFA for
  operators, network restrictions where possible, and the audit trail above.
- **Not the same as `rbac`.** `rbac` (ADR 016 family) governs roles **within** a tenant
  (owner/admin/editor/viewer). This is **operator** authorization — a different identity plane.
- **Closes the economic-validation loop.** `cost-attribution` + `revenue-analytics` turn the
  `PRICING/` margin thesis from a modeled snapshot into a **measured, per-tenant** number — the same
  loop `REVALIDATION.md` asks for, now with a home.
- **Sequencing.** The admin **shell** + tenant management can land early (alongside `portal`), but the
  **cost×revenue core** depends on the revenue layer (`metering` → `wallet` → `billing`) existing, or
  the dashboards have no real data. The feature graph encodes this with hard deps.

## Implementation contract (feature `admin-app`)

- A **separate auth domain** for operators (not tenant `MEMBER` rows); no tenant login can reach admin
  routes.
- A **single privileged DB role** used exclusively by the admin app; the API/worker/portal continue on
  the RLS-subject role unchanged.
- An **append-only `admin_audit` trail** for every privileged write.
- **Acceptance:** (a) an operator can list and inspect **all** tenants cross-tenant; (b) a tenant
  login cannot reach any admin route or the privileged role; (c) a privileged write produces an audit
  entry; (d) the API/worker/portal still cannot read across tenants (ADR 016 leak test still passes).
