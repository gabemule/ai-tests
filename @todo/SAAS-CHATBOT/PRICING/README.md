# SAAS-CHATBOT — Pricing & Infra Cost (hub)

> Infra cost model + plan/pricing design for the whitelabel RAG chatbot platform.
> Content is split by *"what drifts together"* so the volatile numbers are easy to re-audit
> monthly (see `../VALIDATION-PROMPTS.md`).
> Companion to `../PLAN.md` (roadmap/decisions) and `../ARCHITECTURE.md` (components).
> Last updated: 2026-06-14
>
> **Estimates, not quotes.** Provider prices drift; treat all numbers as order-of-magnitude
> anchors to reason about plans and margins, not as a billing source of truth.
>
> **Division of labor (frontier):** PRICING/ owns the **business logic** — plans, caps, wallet,
> billing, TCO, margin/mix and **infra cost** (`infrastructure.md` + `infra.md`). The **list of
> models, per-token prices and quality scores** lives in **`router-adapters`** (the `benchmark-app`
> catalog + `ANALYSIS/model-benchmark.md`) — that's the source of truth for prices; the numbers here
> are **illustrative anchors** consumed from it.
>
> **Basis:** the model/pricing strategy here is grounded on the **router-adapters catalog** (model
> prices + `ANALYSIS/model-benchmark.md` quality scores) plus the local infra breakeven analysis in
> `infra.md` (this folder). Model prices last re-validated at the source on 2026-06-14.

---

## Files in this folder

| File | Old §§ | Churn | Purpose |
|---|---|---|---|
| `README.md` *(this)* | §1, §3, §10, §11 | 🔒 | Hub: thesis + TCO + roadmap + open questions + migration index |
| `infrastructure.md` | §1.1, §1.2 | 🔁 | Provider tiers + infra by scale stage |
| `infra.md` | *(moved from `../ANALYSIS/`)* | 🔁 | Self-host (RTX 5090) breakeven analysis — infra cost is part of SAAS-CHATBOT |
| `models.md` | §1.5, §8 | 🔁 | Generation mix + routing spread (prices consumed from the router-adapters catalog) |
| `embeddings.md` | §1.3 | 🔁 | Embedding default/fallback (full catalog in router-adapters) |
| `plans.md` | §6, §7 | 🔒/🔁 | Plan ladder + caps + reingestion + margin analysis |
| `billing.md` | §4, §5, §9 | 🔒 | LLM modes, wallet, metering, payments gateway |
| `market.md` | §2 | 🔁 | Competitor plans & billing models (global + BR) |
| `sources.md` | §12 | 🔁 | Where prices are sourced (router-adapters) + revalidation procedure + links |

> **Model prices, quality scores and the live-fetch tooling moved to `router-adapters`** (the
> `benchmark-app` catalog + `ANALYSIS/model-benchmark.md`). The old SSOT file `openrouter-pricing.md`
> and the `extract/` fetcher no longer live here — PRICING/ consumes those numbers, it doesn't
> maintain them. The root `../VALIDATION-PROMPTS.md` holds the per-file re-validation prompts.

### Migration index — old `§X` → new file

| Old | New home |
|---|---|
| §1 (intro/thesis) | `README.md` (thesis below) |
| §1.1 / §1.2 | `infrastructure.md` |
| §1.3 | `embeddings.md` |
| §1.4 | `README.md` (thesis) + `billing.md` |
| §1.5 / §8 (§8.1, §8.2) | `models.md` |
| §2 (§2.1, §2.2, §2.3) | `market.md` |
| §3 | `README.md` (TCO below) |
| §4 (§4.1, §4.2, §4.3) / §5 / §9 | `billing.md` |
| §6 (§6.1, §6.2) / §7 (§7.1, §7.2, §7.3) | `plans.md` |
| §10 / §11 | `README.md` (below) |
| §12 | `sources.md` |

> **Anchor convention:** each old `§X` label is **preserved as a heading** inside its new file, so an
> external reference reads `PRICING/models.md §1.5` (file + familiar section number). No renumbering.

---

## §1 — Cost model thesis (what *we* actually pay)

The biggest variable cost of RAG is **generation tokens**. We support two billing modes:
**Managed** (default, all tiers — we hold the key and bill the customer) and **BYOK** (an
Enterprise-only paid add-on, `billing.md` §4.3 — the customer brings their own key). In Managed, the
customer pays **our own per-message price anchored on the cost of the premium model** (Sonnet 4.6 —
our chosen sweet spot, `models.md` §1.5), charged **with no explicit markup**. The margin is
generated **structurally by our routing intelligence**: a cheaper near-premium model (Qwen3.7 Plus)
runs under the hood for the vast majority of queries, and the spread `anchor cost − real blended
cost ≈ 85%` is ours (see `models.md` §8). In BYOK the token cost isn't ours at all. Either way our
*own* fixed cost structure stays lean: **fixed infra** + **managed embeddings**.

> **Why no markup (changed 2026-06-14):** we used to model a ~20% markup on top of cost. The
> analyses showed that's noise next to the real lever — **model substitution**. By anchoring the
> *price* on the premium model's cost (Sonnet 4.6, $9/1M) and *running* a blended mix at ~$1.35/1M,
> the routing spread alone is **~85% margin** — far larger and more durable than any markup. So we
> **drop the markup entirely**: price = premium-model cost, margin = routing (`models.md` §1.5, §8).
> **Internal vs. public:** the routing spread is an **internal margin mechanism, not public
> material.** Publicly we present a single **per-message price** and a **consumption dashboard** —
> never the "provider cost + spread" breakdown.

### §1.4 — What the **customer** pays

- **Managed mode (default):** the customer pays **our own per-message price** out of a prepaid
  wallet. That price is **anchored on the cost of the premium model** (Sonnet 4.6 — `models.md`
  §1.5), so it covers cost no matter what runs, while our **router** picks a cheaper near-premium
  model under the hood — the spread (~85%) is ours (see `models.md` §8). Publicly the customer sees
  **a single per-message price + a consumption dashboard** ("you used N messages → R$ X"), never the
  provider cost or the spread.
- **BYOK mode (Enterprise-only add-on, `billing.md` §4.3):** the customer's own LLM generation
  tokens, billed by their provider — **never on our bill**.

> **Consumption transparency ≠ cost transparency.** We give customers full visibility into *what
> they used and will pay* (the consumption dashboard); we owe them **nothing** about *what we paid
> the provider* or our margin — exactly like AWS/Twilio/Vercel publish their own unit price, not
> "supplier cost + X%". Three caveats we keep in mind:
> 1. **BYOK makes the spread deducible** — a BYOK customer comparing their own provider bill to our
>    Managed per-message price can infer the routing margin. So Managed is never sold as "no markup";
>    it's sold on **convenience + predictable price** (no provider account to manage; our price
>    doesn't swing when token prices do). **Restricting BYOK to Enterprise** (few accounts, under
>    contract/NDA — see `billing.md` §4.3) keeps this deduction out of the self-serve tiers entirely.
> 2. **Avoid "transparent / no hidden markup" copy** — it contradicts the model. Say **"preço
>    simples e previsível"** + **"acompanhe seu consumo"**.
> 3. **The anchor is the premium-model cost** — calibrated on Sonnet 4.6 today; revisit with real
>    usage data before lowering it (lower = a competitive lever we *choose* to pull, not a default).

---

## §3 — TCO — the fair comparison

For a customer, the real number is **Total Cost of Ownership** = platform price + LLM cost.

```
Competitor (bundled)   = plan price (token cost already inside, marked up ~hidden)
Our BYOK               = our plan price + customer's own provider bill
Our Managed            = our plan price + prepaid wallet spend (our per-message price)
```

**Worked example** — a tenant running ~3,000 chats/mo, ~1.5k tokens each (gpt-4o-mini-class):

| Path | Platform | LLM cost | TCO / mo |
|---|---|---|---|
| Competitor bundled | ~$99 | (included, opaque) | **~$99** but hard message cap |
| **Our BYOK** | $39 (Pro) | ~$3–8 on customer's own OpenAI bill | **~$42–47** |
| **Our Managed** | $39 (Pro) | ~$5–12 wallet (our per-message price) | **~$44–51** |

> Our **Managed** mode is the like-for-like competitor: a **single, predictable per-message price**
> (not a per-token bill the customer has to model) vs. their embedded/opaque markup — at a **lower
> platform base price** and with **higher message ceilings** (we don't have to cap hard to protect a
> bundled token budget). The per-message price is anchored on the premium model (Sonnet 4.6); our
> router keeps the real cost below it via the cheaper blended mix (the spread is our margin, see
> `models.md` §8). The **BYOK** row above is kept only to illustrate TCO — on the live ladder BYOK is
> **Enterprise-only** (`billing.md` §4.3), so for self-serve tiers the real comparison is **Managed
> vs. competitor bundled**.

---

## §10 — Billing roadmap (aligned with F4 billing-lite)

| Stage | Billing posture |
|---|---|
| **MVP (F1)** | No billing. Single tenant, BYOK only. |
| **Beta (F2–F3)** | Manual plans (invoice/Stripe Checkout), BYOK only. Usage counters live. |
| **GA (F4)** | Automated metering → Stripe subscriptions for plans; **Managed becomes the default on every tier** (prepaid wallet + auto-recharge + spend cap; pick a Managed billing variant `models.md` §8.1); reconciliation against provider invoices; `PaymentProvider` ready for BR gateways. **BYOK is retired from self-serve and offered only as a paid Enterprise add-on** (`billing.md` §4.3). |

---

## §11 — Open questions

- FX policy for BRL vs USD over time (fixed table vs. periodic review).
- Overage handling on `Messages/mo` (block vs. soft overage charge vs. upgrade nudge).
- Anchor calibration for Managed (anchored on the premium-model cost, Sonnet 4.6 $9/1M; revisit
  only as a deliberate competitive lever, never as a default).
- Real routing-mix monitoring: track the actual 80/15/5 split vs. plan and recompute the blended
  cost (~$1.35/1M) as model prices and query difficulty drift.
- Per-message price calibration (the anchor on the premium model + buffer) once F4 usage data lands.
- **BYOK Enterprise add-on floor** (`billing.md` §4.3): how to set the negotiated minimum — fixed
  monthly fee vs. a % of the forgone spread (~$7.6k/mo per 1B tokens) — and how to present it as
  governance, not cost-saving.
- Whether a higher-quality embedding (e.g. Gemini Embedding 001 or `text-embedding-3-large`) becomes
  a paid-tier upgrade, now that **Qwen3 Embedding 8B is the default** and OpenAI is fallback
  (`embeddings.md` §1.3).
- When (if ever) self-hosted Ollama volume justifies the fixed GPU cost vs. API tokens — `infra.md`
  suggests the RTX 5090 breakeven (~3.6 mo @ 100M tok/mo) arrives sooner than expected (`models.md`
  §8).
