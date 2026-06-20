# PRICING — Economic model (hub)

> The economic thesis for the platform, **self-contained in this workspace**. The durable logic
> (margin engine, billing modes, plan structure) lives here as ours; the **volatile provider prices**
> live in `../research-app/` (our live catalog tooling — code, not a doc to keep in sync).
> Companion to `../adr/` (decisions) and `../FEATURES/` (revenue layer).
> Last updated: 2026-06-19
>
> **Estimates, not quotes.** Every number here is an order-of-magnitude anchor to reason about plans
> and margins, **not** a billing source of truth. Provider prices drift; re-fetch via `../research-app/` and
> recompute before trusting any table. The **~85% routing spread is a modeled estimate** that depends
> on a router that does not exist yet — it is validated by the revenue features, not assumed.

---

## Files in this folder

| File | Churn | Purpose |
|---|---|---|
| `README.md` *(this)* | 🔒 | Hub: thesis + TCO + billing roadmap + open questions |
| `billing.md` | 🔒 | LLM modes (Managed/BYOK), wallet ledger, metering, payments |
| `models.md` | 🔁 | Generation mix + routing spread (the margin engine); reads `../research-app/` |
| `plans.md` | 🔒/🔁 | Plan ladder + caps + reingestion budget + margin analysis |
| `REVALIDATION.md` | 🔒 | What to re-measure when each revenue feature ships (ties numbers → features) |
| `embeddings.md` | 🔁 | Embedding-model prices (default/fallback) — load-bearing for `plans.md` worst-case |
| `infrastructure.md` | 🔁 | Fixed infra tier costs — load-bearing for `plans.md` margin floor |
| `../research-app/` | — | **Live-data tooling (code)** — Vite + lowdb catalog: OpenRouter prices × AA scores |

> **Why the split:** logic (this folder's `.md`) is atemporal and ours. Provider digits change
> monthly, so they're never hand-copied — `../research-app/` fetches them live and the docs reference it.

---

## The thesis (durable)

The biggest variable cost of RAG is **generation tokens**. Everything else (fixed infra + managed
embeddings) stays lean. We monetize generation through **two modes**:

| Mode | How it works | Our financial risk |
|---|---|---|
| **Managed** *(default, all tiers)* | We hold the key, **meter locally**, bill a **prepaid wallet** at our **managed price anchored on the premium model** — billed **per-message OR metered-per-token** (two candidates, decision deferred; see `models.md`), **no explicit markup**. | Controlled (prepaid + real-time cap) |
| **BYOK** *(Enterprise-only paid add-on)* | Customer brings their own key; their token cost, never on our bill. | None — but forgoes our spread, so it's a **paid** governance add-on |

**Margin = routing spread, not markup.** The managed price is anchored on the premium model's
cost; a cheaper blended mix runs under the hood; the spread (`anchor − real blended cost`, modeled
~85%) is ours. The better the router, the bigger the margin. (ADR 014, detail in `models.md`)

**Internal vs. public.** The spread is an **internal** mechanism. Publicly we present **one
managed price + a consumption dashboard** — never "provider cost + spread". Copy sells
**convenience + predictable price**, never "no markup" (that framing invites spread-deduction and
trains the customer to read our price as a markup).

**Consumption transparency ≠ cost transparency.** We owe customers full visibility into *what they
used and will pay*; we owe them **nothing** about what we paid the provider — exactly like
AWS/Twilio/Vercel publish a unit price, not "supplier cost + X%".

---

## TCO — the fair comparison

For a customer the real number is **Total Cost of Ownership** = platform price + LLM cost.

```
Competitor (bundled)  = plan price (token cost baked in, marked up opaquely)
Our Managed           = our plan price + prepaid wallet spend (our managed price; unit TBD)
Our BYOK (Enterprise) = our plan price + customer's own provider bill + governance add-on
```

Our **Managed** mode is the like-for-like competitor: a **predictable managed price** (billing unit
still an open decision — `fixed-per-message` vs `metered-per-token`, see `models.md`) at a **lower
platform base price** and with **higher message ceilings** (we don't cap hard to protect a bundled
token budget). Illustrative TCO at ~3,000 chats/mo *(estimates)*:

| Path | Platform | LLM cost | TCO / mo |
|---|---|---|---|
| Competitor bundled | ~$99 | included (opaque) | **~$99**, hard message cap |
| **Our Managed** | $39 (Pro) | ~$5–12 wallet | **~$44–51**, higher ceilings |

> BYOK is **Enterprise-only**, so for self-serve tiers the real comparison is **Managed vs.
> competitor bundled**.

---

## Billing roadmap (mapped to features, not phases)

| Stage | Posture | Features |
|---|---|---|
| **Bootstrap** | No billing. BYOK is the *technical* key mode (zero financial risk, no wallet). | `chat-sse` (BYOK) |
| **Measure** | Count usage in **shadow mode**, reconcile vs. invoice, **no charging**. | `metering` |
| **Validate** | Prove the real blended cost + quality before money depends on the spread. | `model-routing` |
| **Charge** | Prepaid wallet ledger → Managed default (real-time cap) → Stripe + plans. | `wallet` → `managed-mode` → `billing` |

> **Why this order:** the unvalidated ~85% spread is **de-risked by `metering` (shadow) +
> `retrieval-eval`** *before* revenue leans on it. `REVALIDATION.md` ties each number to the feature
> that validates it.

---

## Where the live numbers live (now local)

Provider prices are **not** hand-copied into these docs. They are fetched live by our tooling:

| Need | Where |
|---|---|
| Model prices + quality scores (live, SSOT) | `../research-app/` — `npm install && npm run dev`, hit **Scan** in the UI |
| Generation mix + routing spread math | `models.md` (reads `../research-app/`) |
| Plan ladder + caps + margin tables | `plans.md` |
| LLM modes, wallet, metering, payments | `billing.md` |
| Embedding prices · fixed infra tiers | `embeddings.md` · `infrastructure.md` |

> Embedding-model prices and infra-tier costs are kept as **dated research** in `embeddings.md` /
> `infrastructure.md` (2026-06-14 snapshots) — re-derive locally when they become load-bearing.

## Related ADRs

009 (Managed default + BYOK add-on) · 010 (embeddings always managed) · 011 (local metering) ·
012 (Stripe + `PaymentProvider`) · 013 (managed-first positioning) · 014 (routing as margin lever) ·
015 (incremental re-embed bounds the only per-tenant-growing cost).

## Open questions

- FX policy (BRL/USD): fixed table vs. periodic review.
- Overage on `Messages/mo`: block vs. soft charge vs. upgrade nudge.
- Anchor calibration (premium-model cost): revisit only as a deliberate competitive lever, never a default.
- Real routing-mix monitoring (the ~80/15/5 split) once usage lands — validates the spread.
- Per-message price calibration once real `metering` data exists.
- BYOK Enterprise floor: fixed fee vs. % of forgone spread.
- Higher-quality embedding as a paid upgrade.
- Self-hosted Ollama breakeven as a zero-token-cost routing tier.
