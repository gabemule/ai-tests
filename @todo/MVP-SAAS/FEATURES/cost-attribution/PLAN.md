# Feature: cost-attribution

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** metering *(hard)*, admin-app *(hard)* · **ADRs:** 011, 020

## Objective

Compute the **real cost of each tenant** to us: generation tokens (from `metering`) priced against the
Research catalog unit costs, plus a fair share of fixed infra. Turns "the margin thesis" into a
**measured per-tenant number**, surfaced in the admin console.

> This is the **cost** half of the two dimensions (cost × revenue). The **revenue** half + the margin
> view live in `revenue-analytics`.

## Scope

**In:**
- **Token cost per tenant** = `usage` rows (`metering`, ADR 011) × the per-model unit price from the
  **Research module** catalog (`admin-app`). Aggregated per tenant/bot/period.
- **Embedding cost per tenant** = ingestion + re-embed volume × embedding unit price (`embeddings.md`
  default/fallback), bounded by the reingestion budget.
- **Infra allocation** = a documented rateio of the fixed infra tiers (`infrastructure.md`) across
  active tenants (e.g. by usage share), so the per-tenant cost includes its slice of overhead.
- Read via the admin privileged role (ADR 020); cross-tenant aggregation.

**Out:**
- Revenue, margin, MRR, dashboards (→ `revenue-analytics`).
- Charging anything (this is internal cost accounting, not billing).
- The metering mechanism itself (→ `metering`).

## Done criterion

For any tenant and period, the admin console shows a **cost breakdown** (generation tokens + embeddings
+ allocated infra) derived from real `metering` data × the Research unit costs; the sum across tenants
reconciles against the platform's total cost within an acceptable drift.
