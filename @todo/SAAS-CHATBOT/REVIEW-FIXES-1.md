# REVIEW-FIXES-1 — Document consistency (Type A)

> Mechanical alignment fixes across the SAAS-CHATBOT docs. **Source of truth = `PRICING.md`**
> (business model) and **`adr/`** (decisions). These are *not* new decisions — they propagate
> decisions already made into the derived docs (`PLAN.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `FUTURE/`).
> Last updated: 2026-06-14
>
> **Context (2026-06-14):** the 18 feature ADRs were extracted into `adr/` and the stale ones
> (009/013/014) were already corrected there. So the items below now target the **derived docs** that
> still carry the old text, plus slimming `PLAN.md`/`CONTEXT.md` to *reference* `adr/` instead of
> restating it.

## Summary

| ID | What | Severity | Files | Status |
|---|---|---|---|---|
| A1 | Drop "~20% markup" → routing-spread margin model | 🔴 | `PLAN.md`, `ARCHITECTURE.md` | [ ] |
| A2 | BYOK = Enterprise-only paid add-on (not "advanced", not Free/Starter-only) | 🔴 | `PLAN.md`, `ARCHITECTURE.md`, `CONTEXT.md` | [ ] |
| A3 | Managed = default on **every** tier (incl. Free) | 🟡 | `PLAN.md` | [ ] |
| A4 | Rewrite `CONTEXT.md` lean: Managed + wallet + metering + routing; reference `adr/` | 🔴 | `CONTEXT.md` | [ ] |
| A5 | Fix price ladder "R$49–R$449" → real plans (Free R$0 · R$99–R$599) | 🟡 | `FUTURE/06-competitive-moat.md` | [ ] |
| A6 | Name the queue (Upstash QStash) + align future-adapter inventory | 🟢 | `ARCHITECTURE.md`, `CONTEXT.md` | [ ] |
| A7 | Pin FUTURE build order (02 → 03 → 04 → 09) | 🟢 | `FUTURE/README.md` | [ ] |
| A8 | Slim `PLAN.md` "Decisions (feature ADRs)" → index table linking `adr/` | 🟢 | `PLAN.md` | [ ] |

---

## A1 — Drop "~20% markup" → routing-spread margin model 🔴

**What's wrong:** several docs still describe Managed margin as a "~20% markup". The model changed
(2026-06-14, `PRICING.md` §1): **no markup** — the per-message price is anchored on the premium model
(Sonnet 4.6, $9/1M) and margin comes from the **routing spread** (~85%, blended ~$1.35/1M).

**Why it matters:** the whole monetization story is wrong if it says markup. It contradicts
`PRICING.md` and the corrected `adr/009`, `adr/013`, `adr/014`.

**Where:**
- `PLAN.md:133` — "(~20% markup)"
- `PLAN.md:147` — "the ~20% markup margin"
- `PLAN.md:156` — "metered+markup / fixed-per-message / prepaid-credit … decided in F4" (variant is
  already chosen: fixed-per-message, `PRICING.md` §8.1)
- `ARCHITECTURE.md:284` (§8 row 9) — "Managed = wallet + markup margin"

**How to fix:** replace markup wording with "anchor price + routing spread (~85%)". For `PLAN.md` this
is largely subsumed by **A8** (the ADR prose becomes an index row pointing to `adr/009`/`014`). For
`ARCHITECTURE.md` §8 row 9, change the *Why* to "Managed = wallet; margin = routing spread (no
markup)". Row 14 *Why* already says "second margin stream on the anchor price" — fine.

**Acceptance:** `grep -rn "markup" PLAN.md ARCHITECTURE.md` returns nothing (or only inside `adr/`
where it's used correctly as "no markup").

---

## A2 — BYOK = Enterprise-only paid add-on 🔴

**What's wrong:** docs still frame BYOK as a self-serve "advanced" mode available on lower tiers.
Current model (`PRICING.md` §4/§4.3, `adr/009`/`adr/013`): **BYOK is an Enterprise-only paid add-on**,
sold on governance/compliance — never as a self-serve cost-saving option.

**Why it matters:** every BYOK tenant earns us $0 on tokens *and* can deduce the spread (`PRICING.md`
§1.4). The positioning is load-bearing for the business model.

**Where:**
- `PLAN.md:131` — "Managed (default) + BYOK (advanced)"
- `PLAN.md:134` — "BYOK ships first (F1–F2); Managed lands at GA (F4), on Pro/Business/Enterprise first"
- `PLAN.md:149` — "Default onboarding steers to Managed; Free/Starter stay BYOK-only"
- `ARCHITECTURE.md:288` (§8 row 13) — "BYOK stays advanced opt-in"
- `CONTEXT.md` — BYOK described as a core product axis (see A4, full rewrite)

**How to fix:** PLAN lines are subsumed by **A8** (→ point to `adr/009`/`adr/013`). For
`ARCHITECTURE.md` §8 row 13 *Why*: "Managed default on every tier; **BYOK = Enterprise-only paid
add-on**". Preserve the **phasing** note (BYOK technical-first F1–F2, Managed at F4) — it's still true
(`adr/009` Consequences).

**Acceptance:** no doc says BYOK is "advanced", "Free/Starter BYOK-only", or self-serve; all point to
the Enterprise-add-on framing.

---

## A3 — Managed = default on every tier (incl. Free) 🟡

**What's wrong:** `PLAN.md:134/149` imply Managed starts at Pro and Free/Starter are BYOK-only.
Current model (`PRICING.md` §6, `adr/013`): **Managed is the default on every tier, including Free**
(Free runs on the economy model + small starter balance + hard cap).

**Where:** `PLAN.md:134`, `PLAN.md:149`.

**How to fix:** subsumed by **A8** (index → `adr/013`). If any standalone sentence remains, state
"Managed default on all tiers incl. Free".

**Acceptance:** no doc restricts Managed to upper tiers.

---

## A4 — Rewrite `CONTEXT.md` lean 🔴

**What's wrong:** `CONTEXT.md` still describes a BYOK-centric product and **duplicates ADRs verbatim**
(embedding parity, RLS, re-embed). Per `.clinerules`, CONTEXT.md must be readable in 60s and
reference ADRs by number, not restate them.

**Why it matters:** it's the session-recovery cache; if it's stale/BYOK-only it misleads every future
session.

**Where:** `CONTEXT.md` — "What this is" (line ~9), Domains/Bot Config (line ~22), Governance (~23),
Integration Points (~40 "the tenant's BYOK key"), Gotchas (the long re-stated ADR paragraphs ~60–86).

**How to fix:** rewrite so:
- **What this is** = Managed (default, wallet + metering + routing) **and** BYOK (Enterprise add-on);
  built on the adapter libs.
- **Gotchas** become short bullets that **reference `adr/NNN`** (e.g. "Tenant isolation = RLS — see
  `adr/016`"; "Embedding parity — see `adr/017`"; "Re-embed by chunk — see `adr/015`") instead of
  copying the rationale.
- Keep the genuinely CONTEXT-only knowledge (the two-schema-concerns gotcha, the polyglot seam).

**Acceptance:** `CONTEXT.md` ≤ ~90 lines, mentions Managed/wallet/metering/routing, and its gotchas
link to `adr/` instead of duplicating them.

---

## A5 — Fix price ladder in FUTURE/06 🟡

**What's wrong:** `FUTURE/06-competitive-moat.md:51` says our ladder is "**R$49–R$449**". Real ladder
(`PRICING.md` §6): **Free R$0 · Starter R$99 · Pro R$199 · Business R$599**.

**Where:** `FUTURE/06-competitive-moat.md:51`.

**How to fix:** replace "R$49–R$449" with "R$99–R$599 (Free R$0)".

**Acceptance:** the figure matches `PRICING.md` §6; `grep "R\$49\|R\$449"` returns nothing.

---

## A6 — Name the queue (Upstash QStash) + adapter inventory 🟢

**What's wrong:** `ARCHITECTURE.md` (diagrams, line ~69/~209) and `CONTEXT.md:41` call it a generic
"Job queue". The chosen tech is **Upstash QStash** (`PRICING.md` §1.1, `adr/007`). Also align the
"future adapters" list to the canonical set (router / reranker / ocr / moderation / channel).

**Where:** `ARCHITECTURE.md:69`, `:209`; `CONTEXT.md:41` + the "Future adapters" bullet (~43).

**How to fix:** label the queue node/participant "Job queue (Upstash QStash)"; make the future-adapter
inventory consistent with `PLAN.md`/`FUTURE/`.

**Acceptance:** QStash named at least once in ARCHITECTURE and CONTEXT; adapter list consistent.

---

## A7 — Pin FUTURE build order 🟢

**What's wrong:** `FUTURE/README.md` §3 lists extension vectors but never states the **dependency
order**. The natural topological order is **02 (agent console) → 03 (ticketing) → 04 (quality
metrics) → 09 (bot mode/availability)**, since each builds on the prior.

**Where:** `FUTURE/README.md` §3 (or a new one-liner under it).

**How to fix:** add a short "Build order" note: `02 → 03 → 04 → 09` (with 01 channels independent).

**Acceptance:** the order is stated once, explicitly.

---

## A8 — Slim `PLAN.md` Decisions → index table 🟢

**What's wrong:** `PLAN.md` "Decisions (feature ADRs)" (lines ~105–183) restates all 18 ADRs as prose
— now duplicated by `adr/`. Per `.clinerules`, ADRs live in `adr/`; other docs reference them.

**Why it matters:** removes duplication (and the stale markup/BYOK wording in A1/A2/A3 lives exactly
here), keeps PLAN focused on roadmap/scope/gaps.

**Where:** `PLAN.md:105–183`.

**How to fix:** replace the prose block with a compact **index table** (#, title, link to
`adr/NNN-*.md`) mirroring `adr/README.md`, plus a one-line pointer: "Full rationale in `adr/`."

**Acceptance:** PLAN's Decisions section is a table (no per-ADR prose); all rows link to `adr/`; the
markup/BYOK/Managed wording (A1/A2/A3) is gone from PLAN as a side effect.

---

## How to execute

1. Do **A8 first** (it removes the PLAN prose that A1/A2/A3 would otherwise edit line-by-line).
2. Then **A6** (ARCHITECTURE §8 rows 9/13 + queue naming) — apply the A1/A2 wording there.
3. **A4** (CONTEXT rewrite).
4. **A5** + **A7** (independent one-liners).
5. Verify: `grep -rn "markup\|BYOK (advanced)\|R\$49\|R\$449" PLAN.md ARCHITECTURE.md CONTEXT.md FUTURE/`
   returns nothing; tick the Summary checkboxes.
