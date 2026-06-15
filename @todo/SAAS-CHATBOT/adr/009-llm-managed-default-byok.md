# ADR 009 — LLM modes: Managed (default) + BYOK (Enterprise add-on)

**Status:** Accepted · 2026-06-14

## Context

Chat generation tokens are the biggest variable cost of RAG. We need a billing model that (a) covers
cost predictably, (b) earns margin, and (c) controls financial risk. Two ways a tenant can power
generation: we hold the key (Managed) or the tenant brings their own (BYOK).

## Decision

- **Managed is the default mode on every tier (Free → Enterprise).** We use our key, **meter usage
  locally** (ADR 011), and bill via a **prepaid wallet + auto-recharge + monthly spend cap**, Stripe
  as gateway (ADR 012).
- **No explicit markup.** The customer pays a single **per-message price anchored on the premium
  model** (Sonnet 4.6); margin is generated **structurally by routing** a cheaper blended mix under
  the hood — the spread (~85%) is ours (ADR 014). See `PRICING/README.md` §1 / `PRICING/models.md` §8.
- **BYOK is an Enterprise-only paid add-on** (sold on governance/compliance/data-residency, not
  savings). The platform never bills the tenant's LLM tokens in BYOK; pricing has a floor referenced
  on the forgone spread. See `PRICING/billing.md` §4.3.

## Consequences

- The routing spread is earned across the **whole ladder**, not just upper tiers.
- **Phasing:** BYOK ships first in F1–F2 as the technical bootstrap (zero financial risk, no wallet
  yet). **Managed** lands at **F4 (GA)** with billing-lite and becomes the default; from GA, BYOK is
  offered only as the Enterprise add-on.
- "No hidden markup" copy is avoided — we sell Managed on convenience + predictable price (see
  `PRICING/README.md` §1.4).
