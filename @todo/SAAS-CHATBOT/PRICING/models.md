# PRICING — Generation models & routing intelligence (the margin engine)

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔁 **Re-audit monthly.** Generation model prices come from the SSOT `openrouter-pricing.md`
> (live OpenRouter data via `fetch-openrouter-pricing.sh`); quality scores come from
> `../ANALYSIS/model-benchmark.md`. Re-fetch and recompute the blended cost + spread before trusting
> the tables below. See `VALIDATION-PROMPTS.md` (this folder) for the per-file re-validation prompt.

---

## §1.5 — Model layer & routing intelligence (the margin engine)

This is where the margin comes from. We **anchor the per-message price on the cost of the premium
model** and let the **router** run a cheaper blended mix under the hood. **All prices re-validated
live on OpenRouter 2026-06-14** (avg = (input+output)/2 per 1M tokens; prices sourced from the SSOT
`openrouter-pricing.md`, links in `sources.md`).

| Role | Model | Score* | In $/1M | Out $/1M | **Avg $/1M** | Note |
|---|---|---|---|---|---|---|
| **Anchor (price)** ⭐ | **Sonnet 4.6** | 97 | $3 | $15 | **$9.00** | the price the customer pays; the sweet spot |
| Premium alt | Opus 4.8 | 100 | $5 | $25 | $15.00 | top quality; pricier anchor option |
| Premium alt | GPT-5.5 | 99 | $5 | $30 | $17.50 | most expensive |
| **Principal (80%)** ⭐ | **Qwen3.7 Plus** | n/d | $0.40 | $1.60 | **$1.00** | new main workhorse (promo: $0.32/$1.28 = $0.80) |
| Principal alt | Qwen3.6 Plus | 96 | $0.50 | $1.75 | $1.1375 | prior analysis main (promo: $0.325/$1.95) |
| Principal alt | Qwen3.7 Max | n/d | $2.50 | $7.50 | $5.00 | flagship Qwen (promo: $1.25/$3.75 = $2.50) |
| **Econômico (15%)** ⭐ | **DeepSeek V4 Pro** | 89 | $0.435 | $0.87 | **$0.6525** | best-ROI cheap tier |
| Econômico alt | Kimi K2.6 | 90 | $0.68 | $3.41 | $2.045 | strong coding/UI |
| Econômico alt | DeepSeek V3.2 | 84 | $0.2288 | $0.3432 | $0.286 | cheapest competent |

> *Quality score from `../ANALYSIS/model-benchmark.md` (100 = best). Qwen3.7 Max/Plus are newer than
> the benchmark, so no score yet — placed by price/positioning. **These "n/d" models are exactly what
> the tooling's "Newest" tab surfaces** — re-validation must benchmark them (see PROMPT 3 in the root
> `../VALIDATION-PROMPTS.md`).

**Chosen routing mix (Option B — "optimized"):**

| Share | Model | Avg $/1M |
|---|---|---|
| 80% | Qwen3.7 Plus | $1.00 |
| 15% | DeepSeek V4 Pro | $0.6525 |
| 5% | Sonnet 4.6 (hard queries) | $9.00 |

- **Blended cost (full price, conservative)** = `0.80×$1.00 + 0.15×$0.6525 + 0.05×$9.00` ≈ **$1.35/1M**
- **Margin vs. anchor** = `($9.00 − $1.35) / $9.00` ≈ **85%**
- With **launch promos** still active the blend drops to ~**$1.26/1M** (~86%) — but we size margins
  on **full price** so a promo expiry never breaks the model.

> **Why Sonnet 4.6 as the anchor (not Opus/GPT-5.5):** at score 97 it's ~1 point below the
> 99–100 frontier while costing **40–49% less** ($9 vs $15–17.5/1M). The quality gap a customer
> *perceives* is negligible; the cost gap is not. It's the sweet spot — premium-grade price the
> customer trusts, with the most headroom for the routing spread underneath.

---

## §8 — Managed cost optimization — router as a margin lever (F4+)

We price Managed **per message, anchored on the premium model (Sonnet 4.6, $9/1M)**, and the
customer pays that fixed price regardless of which model actually runs. So when our **router** sends
a query to a cheaper model (Qwen3.7 Plus at ~$1/1M as the principal, DeepSeek V4 Pro at ~$0.65/1M
for the economy tier), the difference (anchor price − real cost) is **ours** — the router isn't
"savings passed to the customer", it **is the margin** (the blended mix runs ~$1.35/1M vs the $9
anchor → ~85%, §1.5). The better the router, the bigger that stream → a direct incentive to keep
improving it.

- **Model routing / cascading** — classify each query's intent/complexity and route simple
  questions to the principal/economy models (Qwen3.7 Plus / DeepSeek V4 Pro), hard ones to the
  premium anchor (Sonnet 4.6). Customer pays the **anchor price** either way; the cheaper real cost
  is our spread. Works **in aggregate** (law of large numbers across many chats) — we don't throttle
  individual users to the cheap model, which would hurt quality; we route by complexity and let the
  mix average out. (See ADR #14; future `router-adapters` in `../FUTURE.md`.)
- **Pricing posture (start safe):** charge the **premium-model (anchor) price** from day one; once
  we have real mix data, the average cost is known and we *can choose* to lower the anchor as a
  competitive lever — but that's a deliberate move, never the default.
- **Self-hosted Ollama (future exploration)** — run an open-source model on our own server with
  **no per-token cost**. Trades variable token cost for **fixed infra/GPU cost** — a 4th
  zero-token-cost routing tier that the `../ANALYSIS/infra.md` analysis shows arrives **sooner than
  expected**: an **RTX 5090 (~R$18k)** running a Qwen3.6/DeepSeek-class model pays back in **~3.6
  months** at just **100M Sonnet-equivalent tokens/mo** (and in **~15 days** at 1B tokens/mo). At our
  volumes this becomes a real lever — evaluate it as a zero-token-cost tier inside routing.

### §8.1 — Managed billing variant — chosen: (b) Fixed per message

| Variant | How customer is billed | Pros | Cons |
|---|---|---|---|
| **(b) Fixed per message** ✅ **chosen** | flat per-message price, anchored on the premium model (Sonnet 4.6) | routing savings are **100% ours**; predictable bill; margin & router invisible | risk if a query is unusually heavy (absorbed in aggregate) |
| (a) Metered + markup | actual metered cost + ~20% | transparent, fair | **rejected** — hands the routing savings to the customer, killing the margin |
| (c) Prepaid credit + markup | generic credit balance + ~20% | simplest mental model | "credit" abstraction can feel opaque; same margin shape as (a) |

> **Decision:** go with **(b) Fixed per message** so the router becomes a real margin lever (§8),
> not just savings we give away. Heavy-query risk is absorbed **in aggregate** (law of large
> numbers); we calibrate the anchor with a buffer and monitor real mix before ever lowering it.
> The exact per-message price is set in **F4 (billing-lite)** once we have usage data.

### §8.2 — Per-client simulation (the spread, by volume)

What a single Managed tenant earns us across realistic monthly token bands. **Revenue** = the
anchor price (Sonnet 4.6, $9/1M) the customer pays; **cost** = our blended routing mix (Option B,
$1.35/1M, full price — §1.5). The spread is the margin. (Per-token figures from the SSOT
`openrouter-pricing.md`, re-validated 2026-06-14.)

| Tokens/mo | Revenue *(anchor $9/1M)* | Our cost *(mix $1.35/1M)* | **Spread (ours)** | Margin |
|---|---|---|---|---|
| 100M | $900 | $135 | **$765** | ~85% |
| 500M | $4,500 | $674 | **$3,826** | ~85% |
| 1B | $9,000 | $1,348 | **$7,652** | ~85% |
| 1.5B | $13,500 | $2,022 | **$11,478** | ~85% |
| 2B | $18,000 | $2,696 | **$15,304** | ~85% |

> **Reference points (single-model, no routing — from `openrouter-pricing.md`):** at 1B
> tokens/mo, pure Sonnet 4.6 = **$9,000**, pure Qwen3.6 Plus = **$1,138**, pure DeepSeek V4 Pro =
> **$652**. Our Option B blend (**$1,348**) sits just above the cheapest tiers while we charge the
> full Sonnet anchor — that gap is the whole business model.
>
> **The margin is volume-linear** (a fixed ~85% of revenue), so heavier tenants don't compress it —
> they *scale* it. This is why **Managed-first** (`billing.md` §4) and the **prepaid wallet**
> (`billing.md` §4.1) matter: every token a Managed tenant burns widens the spread, with zero token
> risk to us.
