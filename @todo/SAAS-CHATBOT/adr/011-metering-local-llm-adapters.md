# ADR 011 — Token counting is local in `llm-adapters`; the product persists usage

**Status:** Accepted · 2026-06-14

## Context

Managed billing (ADR 009) needs a meter that is immediate (to enforce a real-time hard cap) and
uniform across providers. Provider usage APIs are delayed and provider-specific, so they can't be the
primary meter. At the same time, the **graduation discipline** (see `CONTEXT.md`) requires the
adapter libraries to stay **decoupled from product domain concepts** (tenant, bot, wallet) so the
extraction to a dedicated repo stays mechanical — so the adapter must **not** own product persistence.

## Decision

Split the meter into a **library** half and a **product** half:

- **`llm-adapters` computes the count (source of truth for the number).** Every request derives
  input/output tokens from the provider response — **immediate** (enables a real-time hard cap) and
  **uniform** (same code across all providers, Managed or BYOK). The library returns the counts; it
  is **pure/agnostic** and knows nothing about tenant/bot/wallet.
- **The product persists `usage`.** Our backend (the "usage logger") writes the per-tenant/bot/message
  `usage` rows to **Supabase/Postgres** from the counts the adapter returns. Domain mapping
  (tenant/bot) and persistence live in the **product**, never in the library.

A **per-tenant provider sub-key** (where supported, e.g. OpenAI Projects) is a **secondary** layer
only: blast-radius isolation + monthly reconciliation against the provider invoice. Not the meter.

## Consequences

- Elevates `llm-adapters` to the platform's **token-counting point** while keeping it free of product
  domain concepts → graduation stays mechanical (CONTEXT.md "Graduation discipline").
- The product's usage logger is the system of record for billing; it consumes the adapter's counts.
- Enables the wallet hard cap to block the *next* request the instant balance/cap is reached
  (`PRICING/billing.md` §4.1 / §5).

## Implementation contract (F4)

The "next-request" hard cap protects the *next* message, but a single **streaming** answer is
generated *after* the request is admitted and can run long — a heavy/adversarial prompt could push
the wallet **negative within one response**. So:

- Before each Managed generation, compute an **affordable token budget** from the remaining balance
  at the anchor price and pass it as `max_tokens` (a hard ceiling the provider enforces), so no
  single response can exceed what the wallet can pay.
- Pair it with the **reserve/hold** of the wallet ledger (`PRICING/billing.md` §4.1/§4.2): reserve
  the estimated cost up front, reconcile to actual on completion; the `max_tokens` ceiling bounds
  the worst case the reserve must cover.
- On a stream that would exceed the budget mid-flight, stop cleanly at the cap with a user-facing
  "limit reached" rather than letting it overrun.
- **Acceptance:** a tenant with a tiny remaining balance issues a prompt that *would* generate a
  long answer, and the response is truncated at the affordable `max_tokens` with the wallet never
  going negative.
