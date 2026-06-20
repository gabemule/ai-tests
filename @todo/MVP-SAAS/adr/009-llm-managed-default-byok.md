# ADR 009 — LLM modes: Managed (default) + BYOK (Enterprise add-on)

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `chat-sse` (BYOK bootstrap), `managed-mode` (the default at GA)

## Context

Chat generation tokens are the biggest variable cost of RAG. We need a billing model that (a) covers
cost predictably, (b) earns margin, and (c) controls financial risk. Two ways a tenant can power
generation: we hold the key (Managed) or the tenant brings their own (BYOK).

## Decision

- **Managed is the default mode on every tier (Free → Enterprise).** We use our key, **meter usage
  locally** (ADR 011), and bill via a **prepaid wallet + auto-recharge + monthly spend cap**, Stripe
  as gateway (ADR 012).
- **No explicit markup.** The customer pays a **managed price anchored on the principal mainstream
  tier** (avg of Anthropic Sonnet + an OpenAI principal model — a *price* reference, not a quality
  ceiling; billing unit `fixed-per-message` **or** `metered-per-token` — open decision, ADR 014);
  margin is generated **structurally by routing** a cheaper blended mix under the hood — the spread
  (~85%) is ours (ADR 014). See `PRICING/`.
- **BYOK is an Enterprise-only paid add-on** (sold on governance/compliance/data-residency, not
  savings). The platform never bills the tenant's LLM tokens in BYOK; pricing has a floor referenced
  on the forgone spread.

## Consequences

- The routing spread is earned across the **whole ladder**, not just upper tiers.
- **Sequencing (feature-graph):** BYOK ships first inside `chat-sse` as the technical bootstrap (zero
  financial risk, no wallet yet). The spread is then measured on the un-billed **`managed-exec`**
  dogfood path (`metering` shadow + `model-routing`) before money exists. **Managed for paying
  tenants** (`managed-mode`, which needs both `wallet` and `billing`) lands later and becomes the
  default; from then, BYOK is offered only as the Enterprise add-on.
- "No hidden markup" copy is avoided — we sell Managed on convenience + predictable price.
- **The ~85% spread is a modeled estimate** (depends on a router that doesn't exist yet); validate
  before treating as fact.
