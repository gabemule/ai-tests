# PRICING — Generation models & routing intelligence (the margin engine)

> Part of `PRICING/`. **This is where the margin comes from.** The *logic* below is durable; the
> *prices and the specific models* are 🔁 volatile — they are **illustrative examples from the first
> analysis**, not a locked selection. The live catalog (which models, which tiers, current prices)
> comes from our tooling in `../research-app/` (run `npm install && npm run dev`, hit **Scan**;
> curated tiers + live prices land in `db.json`) and, once it graduates, from the **admin-app Research
> module** (ADR 020) — that is the **source of truth** for model selection and unit costs. Re-fetch and
> recompute the blend + spread before trusting any table here.
> Last updated: 2026-06-20 · numbers below are an **illustrative snapshot**, not measured fact.

> ⚠️ **Model names are illustrative.** The specific SKUs below (Anthropic Sonnet/Haiku/Opus, an OpenAI
> principal model, Qwen, DeepSeek, etc.) are **examples from the first analysis** used to reason about
> the margin shape. The **research-app → admin-app Research module decides** which models we actually
> run, in which tier, and at what price. Don't treat any SKU or digit here as committed.

---

## The margin engine

We **anchor the per-message price on the cost of the principal mainstream tier** (not the absolute
frontier, and not the cheapest model) and let the **router** run a cheaper blended mix under the hood.
The customer pays the anchor price regardless of which model actually runs; the difference
(`anchor − real blended cost`) is the margin. (ADR 014)

> **What "anchor" means (important).** The anchor is a **price reference**, not a quality ceiling. In
> each vendor's ladder there's a *weak* tier, a *principal* tier, and a *premium* tier — e.g. Anthropic
> **Haiku (weak) / Sonnet (principal) / Opus (premium)**. We anchor on the **principal** tier (the
> mainstream workhorse a buyer would reasonably expect), and to avoid pinning the whole thesis to one
> vendor we take the **average of two principal-tier models — Anthropic Sonnet + an OpenAI principal
> model** — as the anchor price. (The OpenAI model + its exact price is an **illustrative placeholder**;
> the research-app fills the real number.) This is why a low Artificial Analysis score on a *cheaper*
> model in the blend is **not** a contradiction: the anchor is the price a mainstream buyer pays, the
> blend is what we actually spend.

### Roles in the mix *(illustrative — research-app/admin-app is SSOT)*

| Role | Example model(s) *(illustrative)* | $/1M (avg) | Why |
|---|---|---|---|
| **Anchor / Principal tier (price)** | avg( Anthropic **Sonnet** , OpenAI **principal** *(placeholder)* ) | ~$9.00 *(illustrative avg; research-app fills real)* | the **price** the customer pays — the mainstream principal tier across two vendors, averaged so the anchor isn't tied to one vendor's pricing move |
| **Workhorse (~80%)** | Qwen-class principal | ~$0.80 | strong general quality at a fraction of the cost; handles the vast majority of queries |
| **Economy (~15%)** | DeepSeek-class | ~$0.6525 | simple queries; best ROI tier |
| **Premium escalation (~5%)** | the anchor models themselves (Sonnet / OpenAI principal) | ~$9.00 | hard queries routed up to the anchor-tier models |

> **AA index reality check.** The Artificial Analysis Intelligence Index in the early `db.json`
> snapshots is a **~0–60 scale**, not 0–100. The anchor is chosen on **price-tier positioning**
> (principal mainstream), **not** on topping the quality index — so the cheaper blended models scoring
> *near or above* the anchor on AA is expected and fine: the anchor is a **price** reference. Re-pull
> live scores via `../research-app/` before trusting any number.
> Exact model IDs + live per-1M-token prices + quality scores live in `../research-app/` (the
> `project_models` set is tagged by tier: `economy` / `workhorse` / `anchor`, plus `-alt` backups and
> `bench-price-*` / `bench-score-*` thresholds). The dashboard's **"Newest"** tab surfaces
> just-launched models to benchmark as candidates.

### The spread (illustrative, snapshot)

With a mix of ~**80%** workhorse / ~**15%** economy / ~**5%** anchor-tier escalation:

```
blended cost ≈ 0.80×(workhorse) + 0.15×(economy) + 0.05×(anchor) + routing_overhead
```

On an illustrative snapshot this computes to:

```
0.80 × $0.80  (workhorse)            = $0.640
0.15 × $0.6525 (economy)             = $0.098
0.05 × $9.00  (anchor-tier avg)      = $0.450
+ routing/classification overhead    ≈ $0.05–0.15  (see below)
blended ≈ $1.24–1.34/1M  vs.  ~$9/1M anchor  →  margin ≈ ~85%
```

> **Routing overhead is real — count it.** Classifying each query's complexity to pick a tier usually
> costs an **extra (cheap) LLM or classifier call** per message. At ~$0.05–0.15/1M-equivalent it does
> **not** sink the thesis, but it must be in the blend so we don't overstate the spread. The router can
> later use a cheap local/embedding classifier to drive this toward ~$0. `research-app/` EVOLUTION
> tracks the weighted model that will replace these flat figures.

We **quote ~85% publicly** (rounded down; under-promise, leave headroom for price drift + routing
overhead). We size margins on **full price** (not promo prices) so a promo expiry never breaks the model.

> ⚠️ **The ~85% is a modeled estimate, not a measured fact.** It depends on (a) a router that does not
> exist yet, (b) the real query-difficulty distribution, and (c) the routing overhead above. The
> feature `model-routing` validates it against real `metering` data (on the **`managed-exec` dogfood
> path**, not BYOK traffic) before any revenue leans on it. See `REVALIDATION.md`.

> **Token-ratio caveat (conservative).** The `$/1M` figures use `avg = (in + out)/2`, i.e. a **1:1
> input:output** assumption. RAG is **input-heavy** (system prompt + retrieved chunks dominate, output
> is short), and input tokens are cheaper *and* largely cacheable — so the real blended cost lands
> **below** the headline and the true margin is likely **higher**. We keep the conservative headline
> (don't inflate the thesis); the upside is documented, not banked. `research-app/` EVOLUTION §2 tracks
> a weighted RAG-aware cost model (`w_in`/`w_out` + cache) to replace the symmetric average.

---

## Router as a margin lever

- **Model routing / cascading** — classify each query's intent/complexity; route simple questions to
  workhorse/economy, hard ones to the anchor tier. Customer pays the **anchor price** either way;
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
| **Fixed per message** | flat per-message price, anchored on the principal tier | predictable bill; margin & router fully invisible; routing savings are 100% ours. Risk: heavy queries must be absorbed in aggregate, so the anchor needs a buffer |
| **Metered per token** | per-token price on the customer's own metered tokens (ADR 011 local counting) | billed unit = metered unit → no message↔token conversion; heavy queries self-price (the user pays for what they burn); routing spread still ours because we price the token, not pass through cost |
| ~~Metered + markup~~ | actual metered cost + ~20% | rejected — hands routing savings to the customer, kills the margin |
| ~~Prepaid credit + markup~~ | generic credit + ~20% | rejected — same margin shape as metered+markup, opaque "credit" feel |

> **Decision: deferred.** Both *fixed-per-message* and *metered-per-token* keep the router as a real
> margin lever (unlike metered+markup). The choice between them needs real mix + difficulty data from
> `metering`/`model-routing`; until then we document both side-by-side rather than lock in.

### The spread by volume (illustrative, snapshot)

Revenue = anchor price the customer pays; cost = our blended mix. The margin is **volume-linear** (a
fixed ~85% of revenue at this snapshot), so heavier tenants don't compress it — they *scale* it.

| Tokens/mo | Revenue *(anchor ~$9/1M)* | Cost *(mix ~$1.3/1M)* | Spread (ours) | Margin |
|---|---|---|---|---|
| 100M | ~$900 | ~$130 | **~$770** | ~85% |
| 500M | ~$4,500 | ~$650 | **~$3,850** | ~85% |
| 1B | ~$9,000 | ~$1,300 | **~$7,700** | ~85% |
| 2B | ~$18,000 | ~$2,600 | **~$15,400** | ~85% |

> This is why **Managed-first** + the **prepaid wallet** matter: every token a Managed tenant burns
> widens the spread, with zero token risk to us. It's also the reference for the **BYOK Enterprise
> floor** (`billing.md`): a ~1B-tokens/mo tenant on BYOK gives up ~$7.7k/mo of spread, so the
> governance fee must recapture a meaningful share.
>
> **Re-validate these digits in `../research-app/`** — they are an illustrative snapshot, not a quote.
