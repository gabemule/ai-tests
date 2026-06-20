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

Every paid tier is **Managed**, so per tenant the token cost is **covered by the wallet** and the
routing spread (~85%, `models.md`) is pure upside on top — only a few cents of embeddings/storage are
ours. So plan price is almost pure margin against fixed infra. After **Stripe fees**
(US ~2.9% + $0.30; BR card ~3.99% + R$0.39; PIX ~1.19%):

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

> **Break-even ≈ 3 Pro subscribers** covers the entire ~$5–50/mo fixed infra. Everything past that is
> margin. Managed adds the **~85% routing spread on top** of wallet spend — incremental margin, not a
> cost center.

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
