# Feature: metering

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** chat-sse *(hard)* · **ADRs:** 011

## Objective

Measure Managed usage **in shadow mode** — count tokens per tenant/bot/message and reconcile against
provider invoices — **without charging anyone**. De-risks the economic thesis before money depends on
it.

## Scope

**In:**
- Persist `usage` rows from the counts `llm-adapters` returns (ADR 011): per tenant/bot/message,
  `tokens_in`/`tokens_out`, model used.
- Monthly reconciliation: our counts vs. the actual provider invoice (drift report).
- Shadow mode only — no wallet debit, no plan enforcement.

**Out:**
- The wallet ledger (→ `wallet`), routing (→ `model-routing`), charging (→ `managed-mode`/`billing`).

## Done criterion

Over a test period, our `usage` totals reconcile against the provider invoice within an acceptable
drift; a per-tenant/bot/message usage report is queryable — with **zero** charges applied.
