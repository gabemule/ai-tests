# ADR 012 — Payments: Stripe primary + `PaymentProvider` abstraction

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `billing`, `wallet`

## Context

Managed billing needs off-session charges + a card vault (for wallet auto-recharge) and subscriptions
for plans, in USD & BRL. The BR market also wants PIX/boleto, which Stripe covers unevenly.

## Decision

- **Stripe is the primary gateway** — off-session charges + card vault, subscriptions, USD & BRL,
  idempotency keys.
- **All payment logic sits behind a `PaymentProvider` interface** so we can plug
  **Mercado Pago / Pagar.me (Stone) + PIX** for BR later without touching billing logic.

## Consequences

- PIX (1.19%, no fixed fee) is a real BR margin/conversion lever vs. card (3.99% + R$0.39) — adding
  it via the abstraction pays for itself on BR volume.
- Charge idempotency keys are mandatory to avoid double-charging an auto-recharge trigger
  (feature `wallet`, ledger semantics).
