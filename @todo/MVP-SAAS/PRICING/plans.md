# PRICING — Plans, caps & margin analysis

> Part of `PRICING/`. Plan **structure** is durable logic (🔒); the **margin numbers** depend on the
> volatile model/embedding/infra costs (🔁 — re-derive via `../research-app/` and `infrastructure.md`).
> Last updated: 2026-06-19 · price/margin figures are a **2026-06-14 snapshot**, illustrative only.

---

## Plans

Prices in **USD + BRL** (psychological pricing per currency, not raw FX). **Managed is the default on
every tier**; **BYOK is an Enterprise-only paid add-on** (`billing.md`). "Messages/mo" measures
**platform usage**, not LLM cost (the wallet covers generation), so we can be generous vs. competitors
that bake the token into the price.

| Plan | USD | BRL | Bots | Docs / Storage | Messages/mo | Members | Domains | Doc types | LLM modes |
|---|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | R$0 | 1 | 20 / 25 MB | 100 | 1 | 1 | txt/md/html/pdf | **Managed** |
| **Starter** | $19 | R$99 | 1 | 50 / 100 MB | 500 | 1 | 1 | + docx/csv | **Managed** |
| **Pro** | $39 | R$199 | 3 | 200 / 250 MB | 2,000 | 3 | 3 | + docx/csv/xlsx | **Managed** |
| **Business** | $119 | R$599 | 10 | 1,000 / 2 GB | 10,000 | 10 | 10 | all + OCR | **Managed** |
| **Enterprise** | custom | custom | ∞ | custom | custom | custom | custom | all + OCR | **Managed** + BYOK *(paid add-on)* |

> Tiers were sized so every plan holds **≥45% margin even at the worst-case usage ceiling** (see
> "Worst-case cost per tenant" below). Re-check prices when the underlying costs drift.

### Reingestion budget (per plan)

Embedding is the only AI cost that grows per tenant. It's bounded by a **reingestion budget** = how
many times per month a tenant may reprocess their whole base, expressed as a multiple **K** of
storage: `monthly reingest volume ≤ K × storage`.

| Plan | Storage | K (launch) | Reingest budget/mo | Knowledge-sync (future) | Min sync cadence |
|---|---|---|---|---|---|
| Free | 25 MB | 3× | 75 MB | ❌ manual upload | — |
| Starter | 100 MB | 3× | 300 MB | ❌ manual upload | — |
| Pro | 250 MB | 3× | 750 MB | ✅ 1 source | every 24h (poll) |
| Business | 2 GB | 3× | 6 GB | ✅ up to 5 sources | every 1h / webhook |
| Enterprise | custom | custom | custom | ✅ unlimited | near-real-time (push) |

- **Launch K = 3, approved ceiling = 5×.** Start cautious; loosen toward 5× only once real usage data
  justifies it (deliberate, not a default).
- **K is uniform across tiers** (never lower on a bigger plan — incoherent). The *absolute* budget
  grows because storage grows.
- **Incremental re-embed by chunk** (feature `incremental-reembed`, ADR 015) makes the *effective* K
  ~1–2 in real use — only changed chunks are re-embedded — so the nominal budget can be generous while
  real cost stays far below the worst case.
- **On hitting the budget: degrade, don't block.** Pause re-embeds for that doc until the next cycle +
  alert — never block live chat (the existing base keeps answering).

### Limit rationale

- **Bots / domains / members** — near-zero marginal cost; *product* gates that map to customer size,
  not infra. Cheap to be generous, but they anchor plan value.
- **Docs / storage** — real (small) cost driver; the main lever that scales with tenant data.
- **Reingestion (K × storage)** — a **guardrail against runaway re-embed loops**, not a revenue line
  (embedding is ~$0.005/MB). Caps worst-case exposure; query-time embedding is folded into the plan.
- **Messages/mo** — proxy for compute + query-embedding load; soft cap with overage or upgrade prompt.
- **Doc types** — advanced loaders (docx/csv/xlsx, OCR) gated up the ladder (more to build/run).
- **Managed LLM** — default on **every tier**: it's where the routing spread is earned, so we want
  margin across the whole ladder. **Free runs 100% on the economy tier** on a small included balance —
  token cost is negligible (~100 msgs/mo) and a hard wallet cap keeps it at zero risk.
- **BYOK** — Enterprise-only paid add-on (`billing.md`), sold on governance/compliance, priced with a
  floor so it never erodes the Managed spread.

---

## Margin analysis (illustrative, snapshot)

> ⚠️ **What these tables do and don't include.** The **subscription** margin tables below are
> **platform-only**: they deliberately exclude generation tokens because, under Managed, **the wallet
> covers generation** as a separate prepaid line — the customer funds tokens, and our token *margin* is
> the routing **spread**, accounted separately (`models.md`). These two must not be conflated:
> - **Subscription margin** = plan price − Stripe fee − allocated fixed infra (below).
> - **Token/spread margin** = anchor price − blended cost, **only positive if the spread holds**
>   (`models.md`, unvalidated until `managed-exec`/`model-routing` measure it).
> See "**If the spread is wrong**" and "**Free-tier token cost**" below — the subscription margin does
> **not** rescue a negative spread.

Every paid tier is **Managed**, so per tenant the token cost is **covered by the wallet** and the
routing spread (~85%, `models.md`) is upside on top of the subscription — only a few cents of
embeddings/storage are ours. So the **subscription** price is almost pure margin against fixed infra.
After **Stripe fees** (US ~2.9% + $0.30; BR card ~3.99% + R$0.39; PIX ~1.19%):

**USD**

| Plan | Price | Stripe fee | Net | ~Margin |
|---|---|---|---|---|
| Starter | $19 | ~$0.85 | ~$18.15 | ~95% |
| Pro | $39 | ~$1.43 | ~$37.57 | ~96% |
| Business | $119 | ~$3.75 | ~$115.25 | ~97% |

**BRL** (PIX nets meaningfully more than card — a real BR margin lever)

| Plan | Price | Net (card) | Net (PIX) | ~Margin |
|---|---|---|---|---|
| Starter | R$99 | ~R$94.66 | ~R$97.82 | ~96–99% |
| Pro | R$199 | ~R$190.67 | ~R$196.63 | ~96–99% |
| Business | R$599 | ~R$574.71 | ~R$591.87 | ~96–99% |

> **Break-even by infra stage** (subscription revenue must cover fixed infra at *that* stage —
> `infrastructure.md`):
>
> | Stage | Fixed infra/mo | Break-even (Pro $39 net ~$37.6) |
> |---|---|---|
> | MVP | ~$5 | ~1 Pro sub |
> | **Early** *(first paying tenants)* | **~$71** | **~2 Pro subs** |
> | Growth | ~$105 | ~3 Pro subs |
> | Scale | ~$220 | ~6 Pro subs |
>
> The often-quoted "~3 Pro subs covers infra" is the **MVP/Growth** figure; the **Early** stage (where
> the first paying tenants force always-on Railway+Supabase Pro) needs ~2 and the relative cost jump is
> steepest there. Everything past break-even is subscription margin; the Managed spread is **incremental
> on top of wallet spend** — *if* the spread holds (see below).

### If the spread is wrong (the scenario the rosy tables hide)

The subscription tables assume the routing spread is positive. It is **modeled, not measured**
(`models.md`, validated by `managed-exec`/`model-routing`). Stress it:

| Real blended cost vs anchor | Spread | What happens |
|---|---|---|
| ~$1.3/1M vs ~$9 *(modeled)* | ~85% | thesis holds — token margin is large upside |
| ~$4.5/1M vs ~$9 *(router weak / hard-query mix higher)* | ~50% | still positive, but the "95% margin" story is half — re-calibrate anchor before scaling |
| ~$9/1M vs ~$9 *(no routing benefit)* | ~0% | Managed earns **nothing** on tokens; only the subscription carries the business |
| ~$11/1M vs ~$9 *(anchor set too low / premium-heavy traffic)* | **negative** | **we lose money per token** — Managed must pause/re-price **before** charging; this is exactly why `managed-mode` is gated behind measured `metering`/`model-routing` |

> **Rule:** if measured spread comes in materially below model, the anchor (or plan ladder) is
> re-calibrated **before** Managed charges anyone (`REVALIDATION.md`). The subscription margin does
> **not** subsidize a negative token spread — they're separate lines.

### Free-tier token cost (we eat it)

Free runs Managed on a small included starter balance (`plans.md` plans table, ADR 013). Unlike paid
tiers, **there's no wallet top-up funding those tokens** — the platform absorbs them. At ~100 msgs/mo
on the economy tier this is **cents/tenant/mo**, capped hard by the included balance + wallet cap (zero
overrun risk). It is **not** zero, though: at scale, Free-tier token cost is a real (small) line —
budget it as a CAC/marketing cost, and keep the hard cap so a Free tenant can never burn beyond the
included balance.

### Worst-case cost per tenant (the exposure ceiling)

The only AI cost that scales per tenant is **embedding**: `embed_cost = storage_MB × K × $0.005`.
Swept across the embedding knob **K** (launch = 3, ceiling = 5):

> **2× safety margin baked in:** the `$0.005/MB` rate is derived from **$0.02/1M** (OpenAI
> `text-embedding-3-small`, the *fallback*). The chosen **default is Qwen3 Embedding 8B at $0.01/1M**
> (`embeddings.md`) — **half** the cost — so real embedding spend is ~½ the table below. We keep the
> conservative figure so the margin floor holds even on the fallback model.

| Plan | Storage | K=1 | K=3 (launch) | K=5 (ceiling) |
|---|---|---|---|---|
| Free | 25 MB | $0.13 | $0.38 | $0.63 |
| Starter | 100 MB | $0.50 | $1.50 | $2.50 |
| Pro | 250 MB | $1.25 | $3.75 | $6.25 |
| Business | 2 GB | $10.24 | $30.72 | $51.20 |

> This is a **theoretical ceiling** (storage 100% full of text **and** the whole base re-embedded K
> times in one month). Chunk-level re-embed keeps the *effective* K at ~1–2, so real cost lands near
> the K=1–2 columns. **Total worst-case margin** (embedding K=5 + amortized infra/tenant + Stripe) at
> our most infra-fragile (Early) stage still floors at **~45%** (Starter ~45%, Pro ~62%, Business
> ~48%), climbing ~10pp at Scale. The price sizing (Starter $19, Business $119) was chosen to hold
> that floor.
>
> **Re-derive** these with live numbers from `../research-app/` (model prices) + `infrastructure.md`
> (infra tiers) before treating as fact.
