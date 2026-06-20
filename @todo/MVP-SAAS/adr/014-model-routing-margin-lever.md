# ADR 014 — Model routing as a margin lever

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `model-routing` (calibrated by `retrieval-eval` + `metering`)

## Context

In Managed mode the customer pays a managed price **anchored on the premium model**
(Sonnet 4.6, $9/1M) — billed either per-message or per metered token (see Decision). Most queries
don't need premium quality, so running everything on the premium model would waste the margin
opportunity. The margin is not a markup — it's the routing spread.

## Decision

- **Route each query by intent/complexity** across a blended mix (`PRICING/models.md`):
  - ~80% → **Qwen3.7 Plus** ($0.80/1M avg, principal workhorse)
  - ~15% → **DeepSeek V4 Pro** ($0.6525/1M avg, economy)
  - ~5% → **Sonnet 4.6** ($9/1M, hard queries, the anchor)
  - Blended ≈ $1.19/1M vs. the $9 anchor → **~87% measured, quoted ~85%**, ours (`db.json` 2026-06-18 scan).
- Routing works **in aggregate** (law of large numbers), never by throttling individual users to a
  cheap model.
- **Managed billing variant: two candidates, decision deferred** (`PRICING/models.md`):
  - **fixed-per-message** — flat anchored price; predictable bill; router fully invisible.
  - **metered-per-token** — price the customer's own metered tokens (ADR 011 local counting); billed
    unit = metered unit, heavy queries self-price.
  Both keep routing savings 100% ours (unlike metered+markup). The choice — and the exact price — is
  calibrated once real `metering`/`model-routing` usage data lands.

## Consequences

- The better the router, the bigger the margin → direct incentive to keep improving it.
- **Future exploration:** a self-hosted **Ollama** open-source model = a 4th zero-token-cost routing
  tier (fixed GPU cost vs. variable tokens). May graduate into a `router-adapters` library — tracked
  in `FEATURES/README.md` ⚪ backlog.
- Pricing posture: charge the anchor price from day one; lowering the anchor is a deliberate
  competitive lever, never a default.
- **This is the unvalidated economic core.** The ~85% spread is a model, not measured; the
  feature-graph sequences `metering` (shadow) + `retrieval-eval` *before* `model-routing` so the
  blend can be validated before revenue depends on it.
