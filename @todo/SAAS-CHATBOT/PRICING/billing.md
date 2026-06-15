# PRICING — Billing (LLM modes, wallet, metering, payments)

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔒 Mostly stable business logic. Only the Stripe/PIX fee numbers (§9) are volatile — re-check those
> against reality. See `VALIDATION-PROMPTS.md` (this folder) for the per-file re-validation prompt.

---

## §4 — LLM billing modes

Two ways a tenant can power chat generation:

| Mode | How it works | Best for | Our financial risk |
|---|---|---|---|
| **Managed** (default, all tiers) | We use our key, **meter usage locally**, bill via a **prepaid wallet** at **our per-message price** (anchored on the premium model, Sonnet 4.6; router runs a cheaper blended mix, the spread is our margin) | Every customer, Free → Enterprise | Controlled via prepaid + caps |
| **BYOK** (Enterprise add-on) | Tenant brings their LLM key; we never touch their billing | Enterprise accounts with compliance/data-residency/dedicated-key needs | **None** (but **forgoes our spread** — priced as a paid add-on, §4.3) |

> **Managed-first positioning:** Managed is the **default mode on every tier** — it's where our
> **routing spread (~85%, `models.md` §8)** is earned, and the spread now exists **across the whole
> ladder** (Free → Enterprise), not just from Pro up. Pricing is directly comparable to competitors
> (`README.md` §3). **BYOK is no longer a self-serve option** on the paid ladder — it became an
> **Enterprise add-on** (§4.3), because every BYOK tenant is a tenant where we earn **$0 on tokens**
> (no spread) *and* can deduce our margin (`README.md` §1.4).

> **Phasing:** BYOK ships first in F1–F2 as the **technical** bootstrap (zero financial risk, no
> wallet needed yet). **Managed** ships in **F4 (GA)** alongside billing-lite and becomes the
> **default for all tiers**; from GA onward, **BYOK is offered only as a paid Enterprise add-on**
> (§4.3), not as a self-serve mode.

### §4.1 — Managed = Prepaid Wallet + Auto-Recharge

Each Managed tenant has a **credit wallet** (USD/BRL balance) — **on every tier, Free → Enterprise**
(Free runs on a small included starter balance; see `plans.md` §6.2). Every Managed message debits
**our per-message price** from the balance (anchored on the premium model, Sonnet 4.6; the router
keeps the real cost below it, so the spread is our margin — `models.md` §8). The customer sees the
**per-message price and their consumption**, not the underlying cost or spread.

Customer-configurable controls:

| Setting | Example | Purpose |
|---|---|---|
| Manual top-up | buy $50 | initial / ad-hoc credit |
| Auto-recharge trigger | "when balance < $5" | low-balance threshold |
| Auto-recharge amount | "buy $50" | how much to re-buy |
| Monthly spend cap | "max $200 / month" | hard ceiling per period |
| Payment method | saved card (Stripe) | source of charges |

**Auto-recharge flow:**

```
chat consumes credit → balance drops below trigger ($5)
   → month spend < cap?  → YES: charge $50 on card (Stripe) → credit wallet
                         → NO  (cap reached): do NOT recharge → Managed service pauses
                               (alert customer; they can raise the cap or top up manually)
```

**Hard cap is real-time** because metering is **local and immediate** (see §5): we block the
*next* request the instant the balance hits zero or the monthly cap is reached — no dependence
on the provider's delayed usage API.

### §4.2 — Safeguards (the tricky corners)

- **Anti-loop recharge:** cap auto-recharges per window (e.g. **max 3/day**) — protects the
  customer's card against a bug or abuse spiral. Enforced against the ledger, not a mutable flag.
- **Idempotent charges:** every Stripe charge *and* every ledger write uses an idempotency key, so a
  retried webhook/charge is a no-op (never double-charge or double-credit one trigger).
- **Reserve/hold:** debit an *estimate* before the request, reconcile to actual cost after —
  prevents a negative balance under concurrent requests. Holds carry a **TTL + reaper**: a hold is
  auto-released if the request that placed it never reconciles (crash/timeout), so funds can't be
  stranded.
- **No credit expiration:** purchased credit doesn't expire (friendlier, simpler).
- **Alerts:** email/webhook on *low balance*, *auto-recharge done*, *cap reached / service paused*.

> **Engineering contract (F4) — wallet as an append-only ledger.** A single mutable `balance` column
> is fragile: concurrent messages race on it, a retried Stripe webhook double-credits, and an
> orphaned reserve locks funds forever. So model the wallet as an **append-only ledger**
> (`wallet_entries`: credit/debit/hold/release, each with `idempotency_key`, `amount`, `reason`,
> `created_at`); the balance is a **derived sum** (or a cached projection reconciled from the ledger).
> The idempotency keys, the reserve/hold TTL + reaper, and the anti-loop cap above are all enforced
> against this ledger.
> **Acceptance:** (a) a double-delivered Stripe webhook credits **once**; (b) concurrent debits never
> drive the balance negative; (c) an orphaned hold is reaped after its TTL.

### §4.3 — BYOK as a paid Enterprise add-on

In the new margin model the business runs on the **routing spread** (~85%) earned in **Managed**
(`models.md` §8). Every BYOK tenant is therefore a tenant where we earn **$0 on tokens** *and* who
can deduce our margin (`README.md` §1.4). So BYOK is **no longer a self-serve mode** — it's an
**Enterprise-only add-on**, repositioned and **priced**:

- **What it's sold as (value):** governance, not savings — **own provider key**, **data residency /
  compliance**, **dedicated capacity**, contractual control over the model relationship. This is
  exactly what Enterprise buyers ask for; the per-token economics are a side effect, not the pitch.
- **What it's *not* sold as:** "bring your own key to save money / avoid our markup". That framing
  invites the exact spread-deduction we want to avoid (`README.md` §1.4) and trains the customer to
  see our Managed price as a markup.
- **How it's priced — negotiated case-by-case, with a floor:** Enterprise is already "custom / sob
  consulta", so BYOK enters as a **negotiated add-on** with **no public number**. Internally we set
  a **floor referenced on the spread we forgo**: a BYOK tenant projected at ~1B tokens/mo is giving
  up ~**$7.6k/mo** of spread (`models.md` §8.2), so the governance fee must recapture a meaningful
  share of that — we never sell BYOK below the floor where it becomes cheaper for us to just run
  Managed.

> **Net effect:** Managed stays the universal default (margin across the whole ladder); BYOK becomes
> a deliberate, paid Enterprise lever for accounts that genuinely need it — priced so it never
> quietly erodes the spread that funds the business.

---

## §5 — Metering (the source of truth)

- **Local metering in `llm-adapters` is the source of truth.** Every request counts input/output
  tokens from the provider response and writes `usage` per tenant/bot/message. It is **immediate**
  (enables real-time hard cap) and **uniform** (same code across all providers, BYOK or Managed).
- **Per-tenant provider sub-key (where supported, e.g. OpenAI Projects)** is a **secondary layer**:
  isolates blast radius (a leaked key affects one tenant) and lets us **reconcile** our numbers
  against the provider invoice monthly to detect drift. It is **not** the primary meter.

> This also elevates `llm-adapters` from "a wrapper" to the platform's **governance/metering point**.

---

## §9 — Payments & gateway

- **Stripe is the primary gateway** — off-session charges + card vault (needed for wallet
  auto-recharge), subscriptions for plans, USD & BRL, global reach, idempotency keys.
- **`PaymentProvider` abstraction** — all payment logic sits behind an interface so we can plug
  **Mercado Pago / Pagar.me (Stone) + PIX** for the BR market later without touching billing logic.
  (See ADR #12.) PIX in particular is a strong BR conversion lever (low fee, instant).
