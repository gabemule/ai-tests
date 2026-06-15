# ADR 014 — Model routing as a margin lever (F4+)

**Status:** Accepted · 2026-06-14

## Context

In Managed mode the customer pays a fixed per-message price **anchored on the premium model**
(Sonnet 4.6, $9/1M). Most queries don't need premium quality, so running everything on the premium
model would waste the margin opportunity. The margin is not a markup — it's the routing spread.

## Decision

- **Route each query by intent/complexity** across a blended mix (`PRICING.md` §1.5 / §8):
  - ~80% → **Qwen3.7 Plus** (~$1/1M, principal workhorse)
  - ~15% → **DeepSeek V4 Pro** (~$0.65/1M, economy)
  - ~5% → **Sonnet 4.6** (hard queries, the anchor)
  - Blended ≈ $1.35/1M vs. the $9 anchor → **~85% spread**, ours.
- Routing works **in aggregate** (law of large numbers), never by throttling individual users to a
  cheap model.
- **Managed billing variant = (b) fixed-per-message** (chosen, `PRICING.md` §8.1) — routing savings
  are 100% ours; the exact per-message price is calibrated in F4 with real usage data.

## Consequences

- The better the router, the bigger the margin → direct incentive to keep improving it.
- **Future exploration:** a self-hosted **Ollama** open-source model = a 4th zero-token-cost routing
  tier (fixed GPU cost vs. variable tokens; `PRICING.md` §8). May graduate into a `router-adapters`
  library — tracked in `FUTURE/`.
- Pricing posture: charge the anchor price from day one; lowering the anchor is a deliberate
  competitive lever, never a default (`PRICING.md` §1.4).
