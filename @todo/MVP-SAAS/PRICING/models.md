# PRICING — Generation models & routing intelligence (the margin engine)

> Part of `PRICING/`. **This is where the margin comes from.** The *logic* below is durable; the
> *prices* are 🔁 volatile — they come from our live tooling in `get-model-prices/` (run
> `bash get-model-prices/fetch-openrouter-pricing.sh`, browse `get-model-prices/openrouter-pricing.html`). Re-fetch and
> recompute the blend + spread before trusting any table.
> Last updated: 2026-06-17 · numbers below are a **2026-06-14 snapshot**, illustrative only.

---

## The margin engine

We **anchor the per-message price on the cost of the premium model** and let the **router** run a
cheaper blended mix under the hood. The customer pays the anchor price regardless of which model
actually runs; the difference (`anchor − real blended cost`) is the margin. (ADR 014)

### Roles in the mix

| Role | Example model *(snapshot)* | Why |
|---|---|---|
| **Anchor (price)** | a premium model (~score 97, e.g. Sonnet-class) | the price the customer pays; ~1pt below the 99–100 frontier but ~40–49% cheaper → the sweet spot |
| **Principal (~80%)** | a near-premium workhorse (e.g. Qwen Plus-class) | handles the vast majority of queries at a fraction of the anchor cost |
| **Economy (~15%)** | a cheap-but-competent model (e.g. DeepSeek-class) | simple queries; best ROI tier |
| **Premium (~5%)** | the anchor itself, on hard queries | quality backstop for the few queries that need it |

> Exact model IDs + live per-1M-token prices + quality scores live in `get-model-prices/` (the
> `project_models` set is tagged by tier: `anchor` / `principal` / `economy`). The dashboard's
> **"Newest"** tab surfaces just-launched models to benchmark as candidates.

### The spread (illustrative, snapshot)

With a mix of ~**80%** principal / ~**15%** economy / ~**5%** premium anchor:

```
blended cost ≈ 0.80×(principal) + 0.15×(economy) + 0.05×(anchor)
```

On the 2026-06-14 snapshot this came to **~$1.35/1M** blended vs. a **~$9/1M** anchor →
**margin ≈ ($9 − $1.35) / $9 ≈ 85%**. We size margins on **full price** (not promo prices) so a promo
expiry never breaks the model.

> ⚠️ **The ~85% is a modeled estimate, not a measured fact.** It depends on (a) a router that does not
> exist yet and (b) the real query-difficulty distribution. The feature `model-routing` validates it
> against real `metering` data before any revenue leans on it. See `REVALIDATION.md`.

---

## Router as a margin lever

- **Model routing / cascading** — classify each query's intent/complexity; route simple questions to
  principal/economy, hard ones to the premium anchor. Customer pays the **anchor price** either way;
  the cheaper real cost is our spread. Works **in aggregate** (law of large numbers) — we never
  throttle an individual user to a cheap model (that would hurt quality), we route by complexity and
  let the mix average out. (ADR 014 · feature `model-routing` · future `router-adapters`)
- **Pricing posture (start safe):** charge the **anchor price** from day one; once real mix data
  exists, the average cost is known and we *can choose* to lower the anchor as a competitive lever —
  a deliberate move, never the default.
- **Self-hosted Ollama (future exploration):** an open-source model on our own GPU has **no per-token
  cost** — trades variable token cost for **fixed GPU cost**, a 4th zero-token-cost routing tier. The
  frozen `ANALYSIS/infra.md` suggested the breakeven arrives sooner than expected at our volumes;
  re-derive locally before committing.

### Managed billing variant — chosen: fixed per message

| Variant | How billed | Verdict |
|---|---|---|
| **Fixed per message** ✅ | flat per-message price, anchored on the premium model | **chosen** — routing savings are 100% ours; predictable bill; margin & router invisible |
| Metered + markup | actual metered cost + ~20% | rejected — hands routing savings to the customer, kills the margin |
| Prepaid credit + markup | generic credit + ~20% | rejected — same margin shape as metered, opaque "credit" feel |

> **Decision:** fixed per message, so the router is a real margin lever, not savings we give away.
> Heavy-query risk is absorbed in aggregate; we calibrate the anchor with a buffer and monitor real mix
> before ever lowering it. The exact per-message price is set once real `metering`/`model-routing` data
> lands.

### The spread by volume (illustrative, snapshot)

Revenue = anchor price the customer pays; cost = our blended mix. The margin is **volume-linear** (a
fixed ~85% of revenue), so heavier tenants don't compress it — they *scale* it.

| Tokens/mo | Revenue *(anchor ~$9/1M)* | Cost *(mix ~$1.35/1M)* | Spread (ours) | Margin |
|---|---|---|---|---|
| 100M | ~$900 | ~$135 | **~$765** | ~85% |
| 500M | ~$4,500 | ~$674 | **~$3,826** | ~85% |
| 1B | ~$9,000 | ~$1,348 | **~$7,652** | ~85% |
| 2B | ~$18,000 | ~$2,696 | **~$15,304** | ~85% |

> This is why **Managed-first** + the **prepaid wallet** matter: every token a Managed tenant burns
> widens the spread, with zero token risk to us. It's also the reference for the **BYOK Enterprise
> floor** (`billing.md`): a ~1B-tokens/mo tenant on BYOK gives up ~$7.6k/mo of spread, so the
> governance fee must recapture a meaningful share.
>
> **Re-validate these digits in `get-model-prices/`** — they are a dated snapshot, not a quote.
