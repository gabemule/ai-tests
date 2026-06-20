# PRICING — Revalidation (what to re-measure, and when)

> The economic model is built on **estimates**. This file ties each estimate to the **feature** that
> turns it into a measured fact, so we re-validate at the right moment instead of trusting a number
> indefinitely. The guiding rule: **measure before money depends on it.**
> Last updated: 2026-06-19

---

## Two kinds of "volatile"

1. **Provider prices** (model $/1M, Stripe/PIX fees) — drift monthly, independent of our code.
   Re-fetch with the tooling; no feature needed.
2. **Model assumptions** (the ~85% spread, the ~80/15/5 mix, the per-message price) — can only be
   validated by **running the product**. Each is owned by a revenue feature below.

---

## Provider prices — re-fetch on cadence

| What | How | Cadence |
|---|---|---|
| Model $/1M (anchor, principal, economy) | `../research-app/` → `npm install && npm run dev`, hit **Scan** (curated tiers + live prices land in `db.json`) | monthly, or when a model is deprecated/launched |
| New candidate models | `../research-app/` dashboard "Newest" tab → benchmark quality | monthly |
| Stripe / PIX fees | check provider pricing pages | quarterly |
| Embedding $/MB, infra tiers | `embeddings.md` / `infrastructure.md` (re-derive locally if load-bearing) | when load-bearing |

> The `../research-app/` tooling already does **NEW/PROMO** diffing against dated snapshots, so a price drop
> or a new model surfaces automatically on the next Scan.

---

## Model assumptions — validated by features

| Estimate | Today's value *(snapshot)* | Validated by | What "validated" means |
|---|---|---|---|
| Per-tenant/message token usage | modeled | **`metering`** (shadow mode) | Real `usage` rows reconcile against the provider invoice within acceptable drift — **no charging yet**. |
| Real blended cost-per-message | ~$1.35/1M (modeled mix) | **`model-routing`** | Compute the *actual* blend from real `metering` traffic; compare to the modeled mix. |
| Routing quality impact | assumed neutral | **`model-routing`** + **`retrieval-eval`** | Routing decisions don't drop eval quality below an agreed threshold. |
| **The ~85% spread** | modeled | **`model-routing`** (on `metering` data) | `(anchor − measured blend) / anchor` computed on real traffic — confirms or corrects 85%. |
| Per-message anchor price | TBD | **`managed-mode`** / **`billing`** | Set once real usage exists; calibrated with a buffer over measured cost. |
| ~45% worst-case margin floor | modeled (K=5 ceiling) | **`incremental-reembed`** | Measured effective K (~1–2) confirms real cost sits far below the worst case. |
| BYOK Enterprise floor | referenced on forgone spread | **`billing`** (Enterprise deals) | Negotiated floor set so BYOK never undercuts the Managed spread. |

---

## The de-risking sequence (why the order matters)

```
metering (shadow)  →  measure real usage, reconcile vs. invoice, charge nobody
   → model-routing →  measure the real blend + quality → validate/correct the ~85%
      → wallet      →  ledger primitive (idempotent credit/debit/hold/release)
         → managed-mode → charge at a calibrated anchor price, real-time hard cap
            → billing  →  Stripe + plans + auto-recharge
```

Each step only starts once the previous one has produced numbers. By the time **revenue** depends on
the ~85% spread (`managed-mode`/`billing`), it has already been **measured** by `metering` +
`model-routing` — never assumed. If the measured spread comes in materially below 85%, the anchor
price (or the plan ladder) is re-calibrated **before** charging, not after.

> See `../FEATURES/README.md` (revenue layer) for the dependency graph, and `models.md` /
> `billing.md` / `plans.md` for the assumptions each feature is validating.
