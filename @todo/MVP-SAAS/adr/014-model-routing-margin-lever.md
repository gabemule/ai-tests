# ADR 014 — Model routing as a margin lever

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `model-routing` (calibrated by `retrieval-eval` + `metering`), `managed-exec` (the
un-billed dogfood path the blend is validated on), `managed-mode`

## Context

In Managed mode the customer pays a managed price **anchored on the principal mainstream tier** — the
average of two vendors' *principal* models (e.g. Anthropic **Sonnet** + an OpenAI principal model;
illustrative ~$9/1M, research-app is SSOT for the real price) — billed either per-message or per
metered token (see Decision). The anchor is a **price reference**, not a quality ceiling: each vendor
has a weak/principal/premium ladder (Haiku/Sonnet/Opus), and we anchor on the **principal** tier a
mainstream buyer expects. Most queries don't even need that, so running everything at anchor quality
would waste the margin opportunity. The margin is not a markup — it's the routing spread.

## Decision

- **Route each query by intent/complexity** across a blended mix (`PRICING/models.md`; model names
  are **illustrative** — research-app/admin-app is SSOT):
  - ~80% → **workhorse** (Qwen-class, ~$0.80/1M avg)
  - ~15% → **economy** (DeepSeek-class, ~$0.6525/1M avg)
  - ~5% → **anchor-tier escalation** (the principal-tier anchor models, ~$9/1M, hard queries)
  - **+ routing/classification overhead** (a cheap extra call per query — counted in the blend).
  - Blended ≈ $1.2–1.3/1M vs. the ~$9 anchor → **~85% modeled** (quoted ~85%), ours.
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
  feature-graph sequences `metering` (shadow) + `managed-exec` (un-billed dogfood Managed path) +
  `retrieval-eval` *before* `model-routing` so the blend can be validated on real routed traffic —
  on **our** platform key, charging nobody — before revenue depends on it.
