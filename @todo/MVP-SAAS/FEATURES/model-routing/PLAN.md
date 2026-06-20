# Feature: model-routing

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** metering *(soft)*, retrieval-eval *(soft)* · **ADRs:** 014

## Objective

Route each query by intent/complexity across a blended model mix — the margin lever. Validate the
blend's quality (via `retrieval-eval`/eval) and its real cost (via `metering`) before revenue leans
on the modeled ~85% spread.

## Scope

**In:**
- A router that classifies query complexity and picks a model from the blended mix
  (~80% workhorse / ~15% economy / ~5% premium anchor).
- Routing works **in aggregate**, never throttling an individual user to a cheap model.
- Measure the *actual* blended cost against `metering` data; measure quality impact against eval.
- **Traffic source for validation:** the blend runs on an **internal dogfood Managed path** (our
  platform key, shadow-metered) over a representative query set — **not** on BYOK `chat-sse` traffic,
  which has no routing. This produces the routed cost/quality numbers with zero external billing,
  *before* `managed-mode` charges anyone. (See `PRICING/REVALIDATION.md` § de-risking.)

**Out:**
- Wallet/charging (→ `wallet`/`managed-mode`).
- A self-hosted Ollama tier / `router-adapters` library (backlog exploration).

## Done criterion

On measured traffic, the blended cost-per-message is computed from real `metering` data and compared
to the premium anchor (validating or correcting the modeled spread); routing decisions don't degrade
eval quality below an agreed threshold.
