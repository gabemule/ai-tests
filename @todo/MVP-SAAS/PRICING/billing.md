# PRICING — Billing (LLM modes, wallet, metering, payments)

> Part of `PRICING/`. The durable business logic of how money flows. Mostly 🔒 stable; only the
> Stripe/PIX fee numbers are volatile (re-check against reality).
> Last updated: 2026-06-19

---

## LLM billing modes

Two ways a tenant powers chat generation:

| Mode | How it works | Best for | Our risk |
|---|---|---|---|
| **Managed** *(default, all tiers)* | Our key, **meter locally**, bill a **prepaid wallet** at our managed price — **per-message OR metered-per-token** (both under evaluation, `models.md`; anchored on the premium model, router runs a cheaper blended mix, the spread is our margin) | Everyone, Free → Enterprise | Controlled (prepaid + caps) |
| **BYOK** *(Enterprise add-on)* | Tenant brings their LLM key; we never touch their billing | Enterprise w/ compliance / data-residency / dedicated-key needs | None — but forgoes our spread, so it's **priced** |

**Managed-first positioning.** Managed is the **default mode on every tier** — it's where the
**routing spread** (`models.md`) is earned, and the spread exists **across the whole ladder** (Free →
Enterprise), not just from Pro up. BYOK is **not** a self-serve option: every BYOK tenant is one where
we earn **$0 on tokens** *and* who can deduce our margin. (ADR 009, 013)

**Phasing (maps to features, not dates).** BYOK ships first as the **technical** bootstrap of
`chat-sse` (zero financial risk, no wallet needed). Managed lands with the revenue features
(`metering` → `model-routing` → `wallet` → `managed-mode` → `billing`) and becomes the default for all
tiers; from then on BYOK is offered only as a **paid Enterprise add-on**.

### Managed = prepaid wallet + auto-recharge

Each Managed tenant has a **credit wallet** (USD/BRL) on every tier (Free runs on a small included
starter balance). Every Managed message debits **our managed price** — billed either **per message**
or **per metered token** (the two candidates are documented side-by-side in `models.md`; choice
deferred until real metering data). Either way it's anchored so the router keeps real cost below it →
the spread is our margin. The customer sees the **price and their consumption**, never the underlying
cost or spread.

Customer-configurable controls: manual top-up · auto-recharge trigger (e.g. "when < $5") ·
auto-recharge amount · monthly spend cap · saved payment method.

**Auto-recharge flow:**

```
chat consumes credit → balance < trigger
   → month spend < cap?  → YES: charge card (Stripe) → credit wallet
                         → NO  (cap reached): do NOT recharge → Managed pauses
                               (alert customer; raise cap or top up manually)
```

The **hard cap is real-time** because metering is local and immediate (below): we block the *next*
request the instant the balance hits zero or the monthly cap — no dependence on the provider's delayed
usage API.

### Safeguards (the tricky corners)

- **Anti-loop recharge:** cap auto-recharges per window (e.g. max 3/day) — protects the card against a
  bug/abuse spiral. Enforced against the ledger, not a mutable flag.
- **Idempotent charges:** every Stripe charge *and* every ledger write uses an idempotency key — a
  retried webhook/charge is a no-op (never double-charge / double-credit).
- **Reserve/hold:** debit an *estimate* before the request, reconcile to actual after — prevents a
  negative balance under concurrent requests. Holds carry a **TTL + reaper** so a crashed request's
  hold is auto-released (funds never stranded).
- **No credit expiration** (friendlier, simpler).
- **Alerts:** low balance, auto-recharge done, cap reached / service paused.

> **Engineering contract — wallet as an append-only ledger.** A single mutable `balance` column is
> fragile (concurrent races, double-credit on retried webhook, orphaned reserves). Model the wallet as
> an **append-only ledger** (`WALLET_ENTRY`: credit/debit/hold/release, each with `idempotency_key`,
> `amount`, `reason`, `created_at`); balance is a **derived sum** (or a reconciled projection). The
> idempotency keys, reserve/hold TTL + reaper, and anti-loop cap are all enforced against this ledger.
> See feature `wallet` (ADR 012). **Acceptance:** (a) a double-delivered webhook credits **once**;
> (b) concurrent debits never go negative; (c) an orphaned hold is reaped after its TTL.

### BYOK as a paid Enterprise add-on

The business runs on the **routing spread** earned in Managed. Every BYOK tenant earns us **$0 on
tokens** *and* can deduce our margin. So BYOK is **not self-serve** — it's an **Enterprise-only
add-on**, repositioned and priced:

- **Sold as (value):** governance, not savings — own provider key, data residency / compliance,
  dedicated capacity, contractual control. The per-token economics are a side effect, not the pitch.
- **Not sold as:** "bring your own key to save money / avoid our markup" — that framing invites
  spread-deduction and trains the customer to read Managed as a markup.
- **Priced — negotiated, with a floor:** Enterprise is already "custom", so BYOK enters as a
  negotiated add-on with **no public number**. Internally we set a **floor referenced on the spread we
  forgo** (a tenant projected at ~1B tokens/mo gives up a large monthly spread — see `models.md`), so
  the governance fee recaptures a meaningful share. We never sell BYOK below the point where it's
  cheaper for us to just run Managed.

> **Net effect:** Managed stays the universal default (margin across the whole ladder); BYOK is a
> deliberate, paid Enterprise lever priced so it never quietly erodes the spread that funds the business.

---

## Metering (the source of truth)

- **Local metering in `llm-adapters` is the source of truth.** Every request counts input/output
  tokens from the provider response and writes `usage` per tenant/bot/message. It is **immediate**
  (enables the real-time hard cap) and **uniform** (same code across all providers, BYOK or Managed).
  (ADR 011 — see feature `metering`)
- **Per-tenant provider sub-key** (where supported, e.g. OpenAI Projects) is a **secondary** layer:
  isolates blast radius (a leaked key affects one tenant) and lets us **reconcile** our numbers against
  the provider invoice monthly to detect drift. Not the primary meter.

> This elevates `llm-adapters` from "a wrapper" to the platform's **governance/metering point**.

---

## Payments & gateway

- **Stripe is the primary gateway** — off-session charges + card vault (needed for wallet
  auto-recharge), subscriptions for plans, USD & BRL, idempotency keys. (ADR 012 — feature `billing`)
- **`PaymentProvider` abstraction** — all payment logic sits behind an interface so we can plug
  **Mercado Pago / Pagar.me + PIX** for BR later without touching billing logic. PIX is a strong BR
  conversion lever (low fee, instant).

> **Stripe/PIX fee numbers are volatile** — see `plans.md` margin tables (re-verify before trusting).
