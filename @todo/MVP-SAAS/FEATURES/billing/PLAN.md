# Feature: billing

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** wallet *(hard)* · **ADRs:** 012

## Objective

Connect the wallet to real money: Stripe as the primary gateway behind a `PaymentProvider`
abstraction, plans/subscriptions, wallet auto-recharge, and a path to BR PIX/boleto.

## Scope

**In:**
- `PaymentProvider` interface; Stripe implementation (off-session charges, card vault,
  subscriptions, USD & BRL, idempotency keys).
- Wallet auto-recharge trigger (idempotent — never double-charge).
- Plan/subscription model + monthly spend cap.
- Abstraction ready to plug BR gateways (Mercado Pago / Pagar.me + PIX) later.

**Out:**
- The ledger itself (→ `wallet`) and generation hard cap (→ `managed-mode`).
- Building the BR-gateway implementations now (interface-ready, deferred).

## Done criterion

A low balance triggers an idempotent auto-recharge via Stripe (no double-charge on retry); a plan
subscription is created/charged; swapping the `PaymentProvider` implementation requires no change to
billing logic.
