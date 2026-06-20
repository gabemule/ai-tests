# Feature: managed-mode

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** managed-exec *(hard)*, wallet *(hard)*, model-routing *(hard)*, billing *(hard)* · **ADRs:** 009, 011, 013

## Objective

The Managed default for paying tenants: wrap the `managed-exec` runtime (platform key + routing +
shadow meter) with **billing** — debit a prepaid wallet at a managed price anchored on the principal
tier, with a real-time hard cap so no single response can push the wallet negative.

> **Co-dependency with `billing` (hard).** A real-time hard cap is only safe if a depleted wallet can
> be **refilled** — that's `billing`'s auto-recharge. Managed-for-paying-tenants therefore hard-depends
> on `billing` (Stripe + auto-recharge), not just on `wallet`. "Charging a real customer" is the pair
> `managed-mode` + `billing`, never either alone.

> **Billing unit stays the open two-candidate decision** (`fixed-per-message` vs
> `metered-per-token`, ADR 014 / `PRICING/models.md`). This feature implements the **mechanism**
> (anchor-priced wallet debit + hard cap); the *unit* is configurable and only locked once real
> `metering`/`model-routing` data lands. The hard cap below derives an affordable budget at the
> anchor regardless of which unit is chosen.


## Scope

**In:**
- Managed generation path: reuse `managed-exec` (platform key + routing) + wallet debit (`wallet`).
- Managed price anchored on the principal tier (billing unit `fixed-per-message` **or**
  `metered-per-token` — open decision, ADR 014); routing spread is the margin.

- **Real-time hard cap:** before each generation compute an affordable `max_tokens` from the
  remaining balance at the anchor price; reserve/hold up front, reconcile to actual on completion
  (ADR 011).
- Stop a stream cleanly at the cap with a user-facing "limit reached".
- Managed becomes the **default** mode on every tier; BYOK becomes Enterprise-only add-on (ADR 013).

**Out:**
- Payment capture / auto-recharge / plans (→ `billing`).
- The shadow-mode meter (→ `metering`) and the ledger primitive (→ `wallet`).

## Done criterion

A tenant with a tiny balance issues a prompt that *would* generate a long answer; the response is
truncated at the affordable `max_tokens` and the wallet **never goes negative**; under normal balance,
Managed chat answers and debits correctly at the anchor price.
