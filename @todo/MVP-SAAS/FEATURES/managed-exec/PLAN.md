# Feature: managed-exec

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** chat-sse *(hard)*, metering *(hard)* · **ADRs:** 009, 011, 014

## Objective

The **Managed execution path without billing** — the internal "dogfood Managed" runtime that lets us
**measure before anyone is charged**. We hold the platform key, run generation on it, and shadow-meter
the result; there is **no wallet, no hard cap, no customer billing** here. This is the path that
`model-routing` later plugs its blend into and validates the ~85% spread on.

> **Why this exists (breaks a circular dependency).** Validating the routing spread requires routed
> traffic on **our** platform key. But routing only runs in Managed, and the full **`managed-mode`**
> (wallet debit + real-time hard cap) hard-depends on `wallet` + `model-routing`. If the only Managed
> path were `managed-mode`, you could never route-and-measure before building billing — a cycle.
> `managed-exec` is the **un-billed** Managed path that breaks it: platform key + shadow meter, nothing
> financial. `model-routing` plugs its blend into it; `managed-mode` later wraps it with wallet + cap.

## Scope

**In:**
- A Managed generation path on the **platform key** (not a tenant BYOK key): retrieve → prompt →
  `llm-adapters` chat, identical to `chat-sse` but keyed by us.
- A **routing seam**: a model-selection hook that defaults to a single model now and accepts the
  `model-routing` blend (workhorse / economy / anchor escalation) when it lands — no hard dep on the
  router to exist first.
- **Shadow-metered** via `metering` (ADR 011): every generation writes `usage` rows, **no wallet
  debit, no charging**.
- Restricted to **internal/dogfood bots** (our own platform, a representative query corpus) — not
  exposed to paying tenants.

**Out:**
- The router itself (→ `model-routing`) — `managed-exec` only provides the seam it plugs into.
- Wallet ledger + real-time hard cap + anchor-priced debit (→ `managed-mode`).
- Payment capture / plans / auto-recharge (→ `billing`).
- Opening Managed to external paying tenants (→ `managed-mode`).

## Done criterion

An internal dogfood bot answers over the platform key and (once `model-routing` lands) runs the real
blend; every answer produces `usage` rows in shadow mode with **zero** charges; the routed blended cost
and quality are queryable from real traffic — the substrate `model-routing` uses to validate the
modeled spread.
