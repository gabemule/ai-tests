# PRICING — Generation models & routing intelligence (the margin engine)

> Part of `PRICING/`. **This is where the margin comes from.** The *logic* below is durable; the
> *prices* are 🔁 volatile — they come from our live tooling in `../research-app/` (run
> `npm install && npm run dev`, hit the **Scan** button; curated tiers + live prices land in `db.json`). Re-fetch and
> recompute the blend + spread before trusting any table.
> Last updated: 2026-06-20 · numbers below are recomputed from the **`db.json` 2026-06-18 scan**, illustrative only.

---

## The margin engine

We **anchor the per-message price on the cost of the premium model** and let the **router** run a
cheaper blended mix under the hood. The customer pays the anchor price regardless of which model
actually runs; the difference (`anchor − real blended cost`) is the margin. (ADR 014)

### Roles in the mix

| Role | Example model *(db.json scan)* | $/1M (avg) | AA index | Why |
|---|---|---|---|---|
| **Anchor / Premium (price + ~5%)** | Claude Sonnet 4.6 | $9.00 | ~36–47 | the price the customer pays; a strong mainstream model, ~40–49% cheaper than the priciest frontier tier (Opus 4.8 / GPT-5.5 ~$15–17.5) → the sweet spot |
| **Principal (~80%)** | Qwen3.7 Plus | $0.80 | ~39 | near-anchor quality at a fraction of the cost; handles the vast majority of queries |
| **Economy (~15%)** | DeepSeek V4 Pro | $0.6525 | ~44 | simple queries; best ROI tier |

> **AA index reality check (from `db.json`):** the Artificial Analysis Intelligence Index in this
> snapshot is a **~0–60 scale**, not 0–100 — the catalog tops out at ~60 (Claude Fable 5 59.9) and
> the premium tier sits ~50–56. The earlier "~score 97 / 99–100 frontier" framing was wrong; use the
> real index above. Re-pull via `../research-app/` before trusting any score.
> Exact model IDs + live per-1M-token prices + quality scores live in `../research-app/` (the
> `project_models` set is tagged by tier: `anchor` / `principal` / `economy`). The dashboard's
> **"Newest"** tab surfaces just-launched models to benchmark as candidates.

### The spread (illustrative, snapshot)

With a mix of ~**80%** principal / ~**15%** economy / ~**5%** premium anchor:

```
blended cost ≈ 0.80×(principal) + 0.15×(economy) + 0.05×(anchor)
```

On the `db.json` 2026-06-18 scan this computes to:

```
0.80 × $0.80 (Qwen3.7 Plus)      = $0.640
0.15 × $0.6525 (DeepSeek V4 Pro) = $0.098
0.05 × $9.00 (Sonnet 4.6 anchor) = $0.450
blended ≈ $1.19/1M  vs.  $9/1M anchor  →  margin ≈ ($9 − $1.19)/$9 ≈ 87%
```

We **quote ~85% publicly** (rounded down — the measured snapshot is ~87%; under-promise, leave
headroom for price drift). We size margins on **full price** (not promo prices) so a promo expiry
never breaks the model.

> ⚠️ **The ~85% is a modeled estimate, not a measured fact.** It depends on (a) a router that does not
> exist yet and (b) the real query-difficulty distribution. The feature `model-routing` validates it
> against real `metering` data before any revenue leans on it. See `REVALIDATION.md`.

> **Token-ratio caveat (conservative).** The `$/1M` figures use `avg = (in + out)/2`, i.e. a **1:1
> input:output** assumption. RAG is **input-heavy** (system prompt + retrieved chunks dominate, output
> is short), and input tokens are cheaper *and* largely cacheable — so the real blended cost lands
> **below** $1.19 and the true margin is likely **>87%**. We keep the conservative headline (don't
> inflate the thesis); the upside is documented, not banked. `research-app/` EVOLUTION §2 tracks a
> weighted RAG-aware cost model (`w_in`/`w_out` + cache) to replace the symmetric average.

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
  curated `infrastructure.md` suggested the breakeven arrives sooner than expected at our volumes;
  re-derive locally before committing.

### Managed billing variant — two candidates, decision deferred

We keep **two billing models** on the table and pick once real `metering`/`model-routing` data lands.
Both preserve the routing spread as ours (we never hand metered savings + markup to the customer).

| Candidate | How billed | Argument |
|---|---|---|
| **Fixed per message** | flat per-message price, anchored on the premium model | predictable bill; margin & router fully invisible; routing savings are 100% ours. Risk: heavy queries must be absorbed in aggregate, so the anchor needs a buffer |
| **Metered per token** | per-token price on the customer's own metered tokens (ADR 011 local counting) | billed unit = metered unit → no message↔token conversion; heavy queries self-price (the user pays for what they burn); routing spread still ours because we price the token, not pass through cost |
| ~~Metered + markup~~ | actual metered cost + ~20% | rejected — hands routing savings to the customer, kills the margin |
| ~~Prepaid credit + markup~~ | generic credit + ~20% | rejected — same margin shape as metered+markup, opaque "credit" feel |

> **Decision: deferred.** Both *fixed-per-message* and *metered-per-token* keep the router as a real
> margin lever (unlike metered+markup). The choice between them needs real mix + difficulty data from
> `metering`/`model-routing`; until then we document both side-by-side rather than lock in.

### The spread by volume (illustrative, snapshot)

Revenue = anchor price the customer pays; cost = our blended mix. The margin is **volume-linear** (a
fixed ~87% of revenue at this snapshot; quoted as ~85%), so heavier tenants don't compress it — they *scale* it.

| Tokens/mo | Revenue *(anchor ~$9/1M)* | Cost *(mix ~$1.19/1M)* | Spread (ours) | Margin |
|---|---|---|---|---|
| 100M | ~$900 | ~$119 | **~$781** | ~87% |
| 500M | ~$4,500 | ~$595 | **~$3,905** | ~87% |
| 1B | ~$9,000 | ~$1,188 | **~$7,812** | ~87% |
| 2B | ~$18,000 | ~$2,376 | **~$15,624** | ~87% |

> This is why **Managed-first** + the **prepaid wallet** matter: every token a Managed tenant burns
> widens the spread, with zero token risk to us. It's also the reference for the **BYOK Enterprise
> floor** (`billing.md`): a ~1B-tokens/mo tenant on BYOK gives up ~$7.6k/mo of spread, so the
> governance fee must recapture a meaningful share.
>
> **Re-validate these digits in `../research-app/`** — they are a dated snapshot, not a quote.
