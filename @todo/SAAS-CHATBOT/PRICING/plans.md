# PRICING — Plans, caps & margin analysis

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔒/🔁 Plan **structure** is stable logic; the **margin numbers** depend on the volatile costs in
> `infrastructure.md`, `models.md` and `embeddings.md` — re-check them when those change. See
> `VALIDATION-PROMPTS.md` (this folder) for the per-file re-validation prompt.

---

## §6 — Plans

Prices shown in **USD + BRL** (psychological pricing per currency, not a raw FX conversion).
**Managed is the default mode on every tier**; **BYOK is an Enterprise-only paid add-on**
(`billing.md` §4.3). "Messages/mo" measures **platform usage**, not LLM cost (the wallet covers
generation), so we can be generous vs. competitors that bake the token into the price.

| Plan | USD | BRL | Bots | Docs / Storage | Messages/mo | Members | Domains | Doc types | LLM modes |
|---|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | R$0 | 1 | 20 / 25 MB | 100 | 1 | 1 | txt/md/html/pdf | **Managed** |
| **Starter** | $19 | R$99 | 1 | 50 / 100 MB | 500 | 1 | 1 | + docx/csv | **Managed** |
| **Pro** | $39 | R$199 | 3 | 200 / 250 MB | 2,000 | 3 | 3 | + docx/csv/xlsx | **Managed** |
| **Business** | $119 | R$599 | 10 | 1,000 / 2 GB | 10,000 | 10 | 10 | all + OCR | **Managed** |
| **Enterprise** | custom | custom | ∞ | custom | custom | custom | custom | all + OCR | **Managed** + BYOK *(paid add-on)* |

> **Price change (2026-06-14):** Starter $10→**$19** and Business $89→**$119** (BRL adjusted to
> R$99 / R$599). Rationale: the worst-case **reingestion** cost (storage × K, see §7.3) compresses
> margin on the larger tiers; the new prices keep every plan comfortably ≥45% margin even at the
> usage ceiling. Pro stays $39 (its worst case is already healthy).

### §6.1 — Reingestion budget (per plan)

Embedding is the only AI cost that grows per tenant (`embeddings.md` §1.3). It's bounded by a
**reingestion budget** = how many times per month a tenant may reprocess their whole base. Expressed
as a multiple **K** of storage: `monthly reingest volume ≤ K × storage`.

| Plan | Storage | **K (launch)** | Reingest budget/mo | Knowledge-sync (`../FUTURE/07`) | Min sync cadence |
|---|---|---|---|---|---|
| **Free** | 25 MB | 3× | 75 MB | ❌ manual upload | — |
| **Starter** | 100 MB | 3× | 300 MB | ❌ manual upload | — |
| **Pro** | 250 MB | 3× | 750 MB | ✅ 1 source | every **24h** (poll) |
| **Business** | 2 GB | 3× | 6 GB | ✅ up to 5 sources | every **1h** / webhook |
| **Enterprise** | custom | custom | custom | ✅ unlimited | near-real-time (push) |

- **Launch K = 3, approved ceiling = 5×.** We start **cautious** (K=3) and only loosen toward 5×
  once real usage data justifies it (deliberate move, not a default — same posture as the Managed
  anchor price, `README.md` §1.4).
- **K is uniform across tiers** (never lower on a bigger plan — that would be incoherent). The
  *absolute* budget still grows because storage grows.
- **Incremental re-embed by chunk** (decision, see `../PLAN.md` ADR) makes the *effective* K ~1–2 in
  real use: when a doc changes we re-embed **only the changed chunks**, not the whole file. So the
  nominal budget can be generous while the real cost stays far below the worst case.
- **On hitting the budget: degrade, don't block.** Pause re-embeds for that doc until the next
  cycle + alert — never block the live chat (the existing base keeps answering).
- A secondary **per-doc re-embed counter** is kept for **observability** (isolate a pathological
  doc), not as the billing cap — the volume budget above is the cap.

### §6.2 — Limit rationale

- **Bots / domains / members** — near-zero marginal cost; they're *product* gates that map to
  customer size, not infra cost. Cheap to be generous, but they anchor plan value.
- **Docs / storage** — real (small) cost driver; main lever that scales with tenant data.
- **Reingestion (K × storage)** — a **guardrail against runaway re-embed loops** (e.g. a synced
  doc changing 50×/day), **not** a revenue line: embedding is ~$0.005/MB, so this exists to cap
  worst-case exposure (§7.3), not to bill ingestion. Query-time embedding is folded into the plan.
- **Messages/mo** — proxy for compute + query-embedding load; soft cap with overage or upgrade prompt.
- **Doc types** — advanced loaders (docx/csv/xlsx, OCR) gated up the ladder (more to build/run).
- **Managed LLM** — default on **every tier** (Free → Enterprise): it's where the routing spread
  (~85%, `models.md` §8) is earned, so we want margin across the whole ladder, not just from Pro up.
  **Free runs 100% on the economy tier** (Qwen3.7 Plus / DeepSeek V4 Pro) on a small included starter
  balance — its token cost is negligible (100 msgs/mo ≈ ~150k tokens ≈ ~$0.0002 on the mix) and a
  hard wallet cap keeps it at zero risk.
- **BYOK** — **Enterprise-only paid add-on** (`billing.md` §4.3), sold on governance/compliance,
  never as a cost-saving option; priced (negotiated, with a floor) so it never erodes the Managed
  spread.

---

## §7 — Net margin analysis

Every paid tier is **Managed** now (BYOK is an Enterprise-only add-on, `billing.md` §4.3), so per
tenant the token cost is **covered by the wallet** and the routing spread (~85%, `models.md` §8) is
pure upside on top — only a few cents of embeddings/storage are actually ours. So plan price is
almost pure margin against fixed infra. After **Stripe fees** (US ~2.9% + $0.30; BR ~3.99% + R$0.39):

> **Margins below assume typical usage** (effective K ~1–2 thanks to chunk-level re-embed). For the
> **worst-case** ceiling (storage full × K=5 × full monthly reprocess) see **§7.3**.

**USD**

| Plan | Price | Stripe fee | Net after fee | ~Margin |
|---|---|---|---|---|
| Starter | $19 | ~$0.85 | ~$18.15 | ~95% |
| Pro | $39 | ~$1.43 | ~$37.57 | ~96% |
| Business | $119 | ~$3.75 | ~$115.25 | ~97% |

**BRL** (card 3.99% + R$0.39 — verified 2026-06-14)

| Plan | Price | Stripe fee (card) | Net (card) | Net (**PIX** 1.19%) | ~Margin |
|---|---|---|---|---|---|
| Starter | R$99 | ~R$4.34 | ~R$94.66 | ~R$97.82 | ~96–99% |
| Pro | R$199 | ~R$8.33 | ~R$190.67 | ~R$196.63 | ~96–99% |
| Business | R$599 | ~R$24.29 | ~R$574.71 | ~R$591.87 | ~96–99% |

> **PIX is a real margin lever in BR:** at **1.19%** (no fixed fee) it nets meaningfully more than
> card (3.99% + R$0.39) — e.g. Pro keeps ~R$6 more per charge. Adding PIX via the `PaymentProvider`
> abstraction (ADR #12) pays for itself fast on BR volume.

> **Break-even ≈ 3 Pro subscribers.** ~3 × $37.57 ≈ $113/mo net covers the entire **~$5–50/mo**
> fixed infra (Railway's $5 Hobby floor + Supabase Pro once you outgrow Free) with room to spare.
> Everything past that is margin. (Managed adds the **~85% routing spread** *on top* of wallet
> spend, so it's incremental margin, not a cost center.)

### §7.1 — Cost × revenue per plan

Per-tenant economics (USD). **Marginal cost/tenant** = embeddings + storage + amortized
compute/queue (a few cents). The **Managed spread** column is the incremental margin from the
**~85% routing spread** on wallet spend (`models.md` §8) — it now applies to **every paid tier** (all
Managed), and it's **pure upside on top** of the plan margin (the token cost itself is covered by the
wallet).

| Plan | Price | Stripe fee | Marginal cost/tenant *(est.)* | **Net (plan)** | **+ Managed spread** *(est. ~85% on ~$5–25 wallet)* | Effective net |
|---|---|---|---|---|---|---|
| Starter | $19 | ~$0.85 | ~$0.05 | **~$18.10** | ~$1–4 | ~$19–22 |
| Pro | $39 | ~$1.43 | ~$0.10 | **~$37.47** | ~$4–21 | ~$41–58 |
| Business | $119 | ~$3.75 | ~$0.20 | **~$115.05** | ~$13–64 | ~$128–179 |

> The plan price alone is ~94–96% margin (fixed infra is shared across all tenants, not per-tenant).
> **Managed** adds a second, usage-proportional margin stream on top — the heavier a tenant chats,
> the bigger its wallet spend and the bigger our **~85% routing spread** (`models.md` §8), with
> **zero token risk** (prepaid). A $25 wallet at the anchor price runs at ~$3.75 real cost → ~$21 is
> ours.

### §7.2 — Cost × revenue by scale scenario

Ties a realistic tenant mix to the **correct infra stage** from `infrastructure.md` §1.2 (so the
infra cost reflects the tier that load actually needs). Revenue is net-of-Stripe (card); **tenant
counts are estimates**.

| Scenario *(est. mix)* | Infra stage (`infrastructure.md` §1.2) | Infra/mo | Gross rev (net of fee) | **Result/mo** | Notes |
|---|---|---|---|---|---|
| 5× Starter | MVP ~$5 | ~$5 | ~$47 | **~+$42** | first paid tenants, infra still on free/hobby |
| 3× Pro | Early ~$71 | ~$71 | ~$112 | **~+$41** | break-even zone — infra (always-on) weighs most here |
| 10× Pro | Early ~$71 | ~$71 | ~$375 | **~+$304** | same infra tier, ~3× the revenue → margin jumps |
| 20× Pro + 5× Business | Growth ~$105 | ~$105 | ~$1,180 | **~+$1,075** | infra grew ~1.5×, revenue grew ~10× |
| 50× Pro + 20× Business | Scale ~$220 | ~$220 | ~$3,593 | **~+$3,373** | sub-linear infra; Managed extra (not shown) is pure upside on top |

> **The shape that matters:** infra is **near-fixed per stage**, so each additional tenant on the
> same tier is almost pure margin. The tight spot is the **Early stage** (~$71 infra for ~3–10
> tenants) — once you're past ~3 Pro you're firmly positive, and every tenant after that widens the
> gap fast. **Managed-mode wallets (§7.1) stack additional margin on top** of every scenario above.

### §7.3 — Worst-case cost per tenant (the exposure ceiling)

The question this answers: **at the absolute usage ceiling, how much can one tenant cost us?** The
only AI cost that scales per tenant is **embedding** (`embeddings.md` §1.3):
`embed_cost = storage_MB × K × $0.005`. Everything else (query-embed, file storage) is rounding
error. Below, the **embedding knob K** swept across values — K is *the* lever (launch = 3, ceiling =
5).

| Plan | Storage | K=1 *(initial only)* | K=3 *(launch)* | K=5 *(ceiling)* | K=10 | K=30 |
|---|---|---|---|---|---|---|
| Free | 25 MB | $0.13 | $0.38 | $0.63 | $1.25 | $3.75 |
| Starter | 100 MB | $0.50 | $1.50 | $2.50 | $5.00 | $15.00 |
| Pro | 250 MB | $1.25 | $3.75 | $6.25 | $12.50 | $37.50 |
| Business | 2 GB | $10.24 | $30.72 | $51.20 | $102.40 | $307.20 |

> This is a **theoretical ceiling**: storage 100% full of text **and** the entire base re-embedded
> K times in one month. **Chunk-level re-embed** (`../PLAN.md` ADR) keeps the *effective* K at ~1–2 in
> real use (edits touch a few chunks, not the whole file), so real cost lands near the **K=1–2**
> columns even when the nominal budget allows K=5.

**Total worst-case cost per tenant** — embedding (K=5 ceiling) **+ amortized infra/tenant + Stripe**.
Infra/tenant is highest at **Early** (~$71 spread over ~10 tenants ≈ $7.10) and falls fast as we scale
(Scale ≈ $0.88). This is the pessimistic envelope; typical tenants cost a fraction.

| Plan | Price | Infra/tenant *(Early ~$7.10)* | Embed (K=5) | Stripe | **Total cost** | **Worst-case margin** |
|---|---|---|---|---|---|---|
| Starter | $19 | $7.10 | $2.50 | $0.85 | **~$10.45** | **~45%** |
| Pro | $39 | $7.10 | $6.25 | $1.43 | **~$14.78** | **~62%** |
| Business | $119 | $7.10 | $51.20 | $3.75 | **~$62.05** | **~48%** |

> At **Scale** (infra/tenant ≈ $0.88) every worst-case margin above climbs ~10pp (Starter ~78%, Pro
> ~84%, Business ~53%). So the **worst time × worst usage** combo — few tenants *and* all of them
> maxing reingestion — is the only place margins compress, and even then the floor is **~45%**. The
> price bump (Starter $19, Business $119) was sized precisely to hold that floor.
>
> **Why this matters:** it bounds our downside. Even a pathological tenant on the biggest plan,
> abusing reingestion at the ceiling, during our most infra-fragile stage, still leaves ~48% margin —
> and chunk-level re-embed means almost nobody actually reaches it.
