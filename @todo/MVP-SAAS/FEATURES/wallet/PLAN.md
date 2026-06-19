# Feature: wallet

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** metering *(hard)* · **ADRs:** 012

## Objective

A prepaid wallet as an **append-only ledger** (credit / debit / hold / release), idempotent, that
turns measured usage (`metering`) into a balance — the substrate for Managed billing.

## Scope

**In:**
- Append-only `WALLET_ENTRY` ledger: credit, debit, hold (reserve), release; balance is derived.
- **Idempotent** entries (idempotency keys) so a retried operation never double-debits.
- Reserve/hold-then-reconcile semantics for in-flight generations (pairs with `managed-mode`).
- Tenant-scoped (RLS, `tenant_id`).

**Out:**
- Payment capture / auto-recharge (→ `billing`).
- The real-time hard cap on generation (→ `managed-mode`).
- Routing (→ `model-routing`).

## Done criterion

A sequence of credit/hold/debit/release operations yields a correct derived balance; a replayed
(idempotent) operation does not change the balance twice; the ledger never allows a silent overwrite
(append-only).
