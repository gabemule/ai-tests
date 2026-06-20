# Feature: revenue-analytics

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** billing *(hard)*, cost-attribution *(hard)* · **ADRs:** 020

## Objective

The **business dashboard** in the admin console: cross every tenant's **revenue** (subscription +
wallet spend) with its **cost** (`cost-attribution`) to get **margin per tenant** and the aggregate
view (MRR, top consumers, blended margin). Closes the economic-validation loop — the `PRICING/` thesis
becomes a measured number per tenant.

> This is the **revenue + margin** half of the two dimensions. Cost comes from `cost-attribution`.

## Scope

**In:**
- **Revenue per tenant** = subscription (plan) + wallet spend (Managed), from `billing`/`wallet`.
- **Margin per tenant** = revenue − cost (`cost-attribution`), per period.
- **Aggregate view:** MRR, total cost, blended margin, top consumers, tenants below a margin floor.
- Feeds back into `PRICING/REVALIDATION.md`: the measured blend/spread vs. the modeled ~85%.
- Read via the admin privileged role (ADR 020); cross-tenant.

**Out:**
- The cost computation itself (→ `cost-attribution`).
- Charging / payment capture (→ `billing`).
- The model-cost catalog (→ `admin-app` Research module).

## Done criterion

For any period, the admin console shows **margin per tenant** (revenue − cost) and an aggregate
(MRR, blended margin, top consumers); the measured blended cost/spread is comparable to the modeled
~85% in `PRICING/`, flagging drift when it diverges materially.
