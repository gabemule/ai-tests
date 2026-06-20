# Feature: managed-mode

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** wallet *(hard)*, model-routing *(hard)* · **ADRs:** 009, 011, 013

## Objective

The Managed default: we hold the key, meter locally, route the blend, and bill a prepaid wallet at a
managed price anchored on the premium model — with a real-time hard cap so no single response can
push the wallet negative.

> **Billing unit stays the open two-candidate decision** (`fixed-per-message` vs
> `metered-per-token`, ADR 014 / `PRICING/models.md`). This feature implements the **mechanism**
> (anchor-priced wallet debit + hard cap); the *unit* is configurable and only locked once real
> `metering`/`model-routing` data lands. The hard cap below derives an affordable budget at the
> anchor regardless of which unit is chosen.


## Scope

**In:**
- Managed generation path: platform key + routing (`model-routing`) + wallet debit (`wallet`).
- Managed price anchored on the premium model (billing unit `fixed-per-message` **or**
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
