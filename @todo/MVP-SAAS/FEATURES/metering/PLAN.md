# Feature: metering

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** chat-sse *(hard)* · **ADRs:** 011

## Objective

Measure usage **in shadow mode** — count tokens per tenant/bot/message — **without charging anyone**.
De-risks the economic thesis before money depends on it.

> **Where invoice reconciliation is possible.** Reconciling our token counts against the **provider
> invoice** is only possible on **our own platform key** — i.e. on the `managed-exec` dogfood path,
> where *we* receive the bill. In **BYOK** `chat-sse` the invoice goes to the **tenant**, so we can
> count tokens but **cannot** invoice-reconcile. The invoice-drift check is therefore a `managed-exec`
> concern; BYOK metering validates per-message token *counts* only.

## Scope

**In:**
- Persist `usage` rows from the counts `llm-adapters` returns (ADR 011): per tenant/bot/message,
  `tokens_in`/`tokens_out`, model used — uniform across BYOK and Managed.
- Monthly reconciliation **on our platform key only** (`managed-exec`): our counts vs. the actual
  provider invoice we receive (drift report). Not applicable to BYOK (tenant owns that invoice).
- Shadow mode only — no wallet debit, no plan enforcement.

**Out:**
- The wallet ledger (→ `wallet`), routing (→ `model-routing`), charging (→ `managed-mode`/`billing`).

## Done criterion

Over a test period, a per-tenant/bot/message usage report is queryable with **zero** charges applied;
and on the `managed-exec` platform key our `usage` totals reconcile against the provider invoice **we
receive** within an acceptable drift (BYOK metering validates counts only — no invoice on our side).
