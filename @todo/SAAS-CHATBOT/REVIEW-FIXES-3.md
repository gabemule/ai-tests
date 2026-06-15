# REVIEW-FIXES-3 — Split `PRICING.md` into `PRICING/` (Type C — structural refactor)

> Break the monolithic `PRICING.md` (756 lines, 12 sections) into a `PRICING/` folder of focused
> files, so the **volatile numbers** (provider prices, model prices, infra tiers, competitor plans)
> live in small files that are easy to re-audit monthly (`PRICING.md` §12 already mandates a monthly
> re-audit), while the **stable business logic** stays in a hub. Then **re-map every `§X` anchor**
> across the project and **delete the old `PRICING.md`**.
> Last updated: 2026-06-14
>
> **Why now / why this is safe:** the split is mechanical (move text, keep section labels), but it
> breaks ~25 `PRICING.md §X` cross-references in ~12 files. This doc makes that re-map explicit and
> testable so nothing dangles. **Execute this LAST** — after `REVIEW-FIXES-1` and `-2` — because `-1`
> rewrites `PLAN.md`/`ARCHITECTURE.md`/`CONTEXT.md` on the very lines B4 also touches.

## Target structure — `PRICING/`

Sections grouped by *"what drifts together"* (🔁 = re-audited monthly; 🔒 = stable logic):

| File | Old sections | Churn | Purpose |
|---|---|---|---|
| `README.md` | §1 (intro/no-markup thesis), §3 (TCO), §10 (billing roadmap), §11 (open questions) | 🔒 | Hub + the business thesis + index of where each old section went |
| `infrastructure.md` | §1.1 (per-service tiers), §1.2 (infra by scale stage) | 🔁 | Provider prices (Supabase/Railway/Vercel/CF/Upstash/Stripe) |
| `models.md` | §1.5 (model layer & routing), §8 (router as margin lever, §8.1 variant, §8.2 per-client sim) | 🔁 | Generation model prices + routing mix + spread math |
| `embeddings.md` | §1.3 (managed embeddings + options list) | 🔁 | Embedding model prices + default/fallback |
| `plans.md` | §6 (plans), §6.1 (reingestion budget), §6.2 (limit rationale), §7 (margin §7.1/§7.2/§7.3) | 🔒/🔁 | Plan ladder + caps + margin analysis |
| `billing.md` | §4 (LLM modes/wallet/safeguards/BYOK add-on), §5 (metering), §9 (payments) | 🔒 | How billing works (modes, wallet, metering, gateway) |
| `market.md` | §2 (global benchmark §2.1/§2.2 + BR §2.3) | 🔁 | Competitor plans & billing models |
| `sources.md` | §12 (sources & revalidation links) | 🔁 | OpenRouter links + revalidation procedure |
| `VALIDATION-PROMPTS.md` | *(new)* | 🔒 | Per-file LLM prompts to re-validate each volatile file (see B7) |

> **Anchor convention after the split:** each old `§X` label is **preserved as a heading** inside its
> new file, so a reference reads `PRICING/models.md §1.5` (file + familiar section number). No
> renumbering — same reasoning as the ADR numbering stability.

## Summary

| ID | What | Severity | Files | Status |
|---|---|---|---|---|
| B1 | Create `PRICING/` and slice the 12 sections into the 8 content files (lossless) | 🔴 | `PRICING/*` | [ ] |
| B2 | Write `PRICING/README.md` hub: thesis + "old §X → new file" index table | 🔴 | `PRICING/README.md` | [ ] |
| B3 | Preserve every `§X` label as a heading in its new file (anchor convention) | 🟡 | `PRICING/*` | [ ] |
| B4 | Re-map all ~25 `PRICING.md §X` anchors across ~12 files (de→para table) | 🔴 | many (see B4) | [ ] |
| B5 | Update generic prose refs ("rationale lives in `PRICING.md`") → `PRICING/` | 🟡 | `adr/README.md`, `CONTEXT.md` | [ ] |
| B6 | **Delete** the old `PRICING.md` (gated by `grep` returning zero `PRICING.md` refs) | 🔴 | `PRICING.md` | [ ] |
| B7 | Add `PRICING/VALIDATION-PROMPTS.md` — per-file re-validation prompts | 🟡 | `PRICING/VALIDATION-PROMPTS.md` | [ ] |

---

## B1 — Create `PRICING/` and slice the content 🔴

**What:** create the `PRICING/` folder and move each section of the current `PRICING.md` into its
target file per the table above. **Lossless** — every table, callout and footnote goes somewhere; no
content is summarized away or dropped.

**How:**
- Copy each section verbatim into its new file; keep the `## §N — Title` heading text so anchors
  survive (B3).
- Cross-references **inside** PRICING (e.g. §1.5 → §8, §6.1 → §7.3) become **inter-file** links
  (`models.md` §8, `plans.md` §7.3). Update them in the same pass.
- Each new file gets a one-line header: `> Part of PRICING/. Companion to PRICING/README.md. Last
  updated: YYYY-MM-DD.`

**Acceptance:** the 8 files exist; concatenating them reproduces 100% of the old content (no section
missing); intra-PRICING links resolve to the new files.

---

## B2 — `PRICING/README.md` hub 🔴

**What:** the hub readers land on. Contains:
- The **thesis** (old §1): no-markup, price anchored on the premium model (Sonnet 4.6, $9/1M), margin
  = routing spread (~85%). Plus §3 TCO, §10 billing roadmap, §11 open questions.
- A **migration index table** "old section → new file" so anyone (and every `§X` ref) can find where
  content moved:

  | Old | New |
  |---|---|
  | §1 intro | `README.md` (thesis) |
  | §1.1 / §1.2 | `infrastructure.md` |
  | §1.3 | `embeddings.md` |
  | §1.5 / §8 | `models.md` |
  | §2 | `market.md` |
  | §3 | `README.md` |
  | §4 / §5 / §9 | `billing.md` |
  | §6 / §7 | `plans.md` |
  | §10 / §11 | `README.md` |
  | §12 | `sources.md` |

**Acceptance:** README opens with the thesis and carries the full migration table; a reader can map
any old `§X` to its new home in one glance.

---

## B3 — Preserve `§X` labels as headings 🟡

**What:** inside each new file, keep the section number in the heading (`## §1.5 — Model layer &
routing intelligence`), so external refs like ``PRICING/models.md` §1.5`` stay meaningful and the
reader finds the exact spot.

**Acceptance:** every old `§X` that is referenced elsewhere exists as a heading in its new file.

---

## B4 — Re-map all `§X` anchors across the project 🔴

**What:** rewrite every `` `PRICING.md` §X `` (and `PRICING.md §X`) reference to point at the new
file. Below is the inventory to fix (verified via `grep -rn "PRICING\.md" 2026-06-14`). Update each to
`PRICING/<file>.md` keeping the `§X`:

| File | Anchor(s) | → New target |
|---|---|---|
| `adr/002-postgres-pgvector-single-store.md` | §1.1/§1.2, §1.3 | `infrastructure.md`, `embeddings.md` |
| `adr/008-conversation-message-persistence.md` | §5 | `billing.md` |
| `adr/009-llm-managed-default-byok.md` | §1, §8, §4.3, §1.4 | `README.md`, `models.md`, `billing.md` |
| `adr/010-embeddings-always-managed.md` | §1.3, §6.1/§7.3 | `embeddings.md`, `plans.md` |
| `adr/011-metering-local-llm-adapters.md` | §4.1/§5 | `billing.md` |
| `adr/012-payments-stripe-paymentprovider.md` | §9, §1.1/§7, §4.2 | `billing.md`, `infrastructure.md`/`plans.md`, `billing.md` |
| `adr/013-managed-first-positioning.md` | §1.4, §6.2, §4.3 | `README.md`/`billing.md`, `plans.md`, `billing.md` |
| `adr/014-model-routing-margin-lever.md` | §1.5/§8, §8.1, §1.4 | `models.md`, `models.md`, `README.md` |
| `adr/015-incremental-re-embed-by-chunk.md` | §1.3, §6.1/§7.3 | `embeddings.md`, `plans.md` |
| `PLAN.md` | §9, §4/§6, §8, §6.1/§7.3, §5 | `billing.md`, `billing.md`/`plans.md`, `models.md`, `plans.md`, `billing.md` |
| `ARCHITECTURE.md` | §5 | `billing.md` |
| `CONTEXT.md` | §6.1/§7.3 | `plans.md` |
| `FUTURE/06-competitive-moat.md` | §2.3 (×2) | `market.md` |
| `FUTURE/07-knowledge-sync.md` | §1.3, §6.1 | `embeddings.md`, `plans.md` |
| `REVIEW-FIXES-1.md` | §1, §4/§4.3, §6, §8.1, §1.1, §1.4 | respective new files |
| `REVIEW-FIXES-2.md` | §4.1, §4.1/§4.2, §8, §11 | `billing.md`, `billing.md`, `models.md`, `README.md` |

> Generic refs **without** a `§` (e.g. FUTURE "update `../PRICING.md` when mature", `VALIDATION-PROMPTS.md`
> "modelo de custo, planos…") are handled in B5/B6 — they point at the folder, not a section.

**Acceptance:** `grep -rn "PRICING\.md §"` and `grep -rn "PRICING\.md\` §"` return **zero**; every
former anchor now reads `PRICING/<file>.md §X` and resolves.

---

## B5 — Update generic prose references 🟡

**What:** sentences that name `PRICING.md` without a section:
- `adr/README.md` — "Economic rationale (price/margin) lives in `PRICING.md`" → `PRICING/`.
- `CONTEXT.md` / `ARCHITECTURE.md` / `PLAN.md` companion-doc headers naming `PRICING.md` → `PRICING/`
  (or `PRICING/README.md`).
- `FUTURE/*` "update `../PRICING.md` when mature" (×7) → `../PRICING/` (the relevant file, usually
  `plans.md` for pricing gates).
- `VALIDATION-PROMPTS.md` (root) PROMPT 2 context list item `@todo/SAAS-CHATBOT/PRICING.md` →
  `@todo/SAAS-CHATBOT/PRICING/` (and ideally list the sub-files).

**Acceptance:** no doc names a bare `PRICING.md`; all point at `PRICING/` (folder or specific file).

---

## B6 — Delete the old `PRICING.md` 🔴

**What:** once B4 + B5 are done, **remove** `PRICING.md`. This is **gated**: do not delete until both
greps below return zero, or a dangling reference will be orphaned.

**How / gate:**
```
grep -rn "PRICING\.md" @todo/SAAS-CHATBOT/   # must be 0 before deleting
rm @todo/SAAS-CHATBOT/PRICING.md
```

**Acceptance:** `PRICING.md` no longer exists; `grep -rn "PRICING\.md"` returns nothing; all pricing
content is reachable under `PRICING/`.

---

## B7 — Add `PRICING/VALIDATION-PROMPTS.md` 🟡

**What:** mirror the root `VALIDATION-PROMPTS.md` pattern (pt-br prompts for an LLM reviewer), but
**one prompt per volatile file** — the whole point of the split is making re-validation per-file. Each
prompt tells the validator what to re-check and how to report. Cover at least:

- **`infrastructure.md`** — re-validate provider tiers live (Supabase/Railway/Vercel/Cloudflare/Upstash
  QStash/Stripe). Did any tier/price change? Does the scale-stage mapping (§1.2) still hold? Output a
  diff "old → new" per service + the impact on the `~Total/mo` per stage.
- **`models.md`** — re-validate generation model prices live on OpenRouter (anchor Sonnet 4.6 + the
  80/15/5 mix). Recompute the blended cost and the spread; flag if the ~85% margin moved. Check if
  promos expired. Re-run the §8.2 per-client table arithmetic.
- **`embeddings.md`** — re-validate embedding prices (default Qwen3 Embedding 8B + OpenAI fallback +
  the popularity-sorted list). Did the default's price/availability change? Recompute the `$/MB` rule
  of thumb and the reingestion worst-case (`plans.md` §7.3) if it moved.
- **`plans.md`** — given any cost change from the three files above, re-check that every plan still
  holds the ≥45% worst-case margin floor (§7.3) and that caps/K are still coherent. Flag any plan
  that dipped below floor with the corrected number.
- **`market.md`** — re-validate competitor plans (global §2.1/§2.2 + BR §2.3) live. Who re-priced?
  Does our positioning (entry ticket, PIX/boleto opening) still hold? Update the comparison.
- **`billing.md`** — lighter (stable logic), but re-check Stripe/PIX fees (§9) and the wallet
  safeguards still match reality.

Each prompt follows the root file's shape: **role** + **context to read** + **scope** + **how to
respond** (severity findings, show the math, diff old→new, separate FACT from ASSUMPTION).

**Acceptance:** `PRICING/VALIDATION-PROMPTS.md` exists with ≥6 per-file prompts in pt-br, each
self-contained (a reviewer can run one prompt to re-audit one file), consistent with the root
`VALIDATION-PROMPTS.md` tone.

---

## How to execute

> **Order matters — run REVIEW-FIXES in sequence: 1 → 2 → 3.** This (3) is last because `REVIEW-FIXES-1`
> rewrites `PLAN.md`/`ARCHITECTURE.md`/`CONTEXT.md` on lines B4 also edits. Splitting on top of the
> already-corrected state keeps B4 a clean mechanical re-map.

1. **B1 + B2 + B3** together — create `PRICING/`, slice content, write the hub, preserve `§X` headings.
2. **B7** — write `PRICING/VALIDATION-PROMPTS.md` (the per-file prompts).
3. **B4 + B5** — re-map all `§X` anchors and generic prose refs across the project.
4. **B6 last** — run the gate grep; only when it's zero, delete `PRICING.md`.
5. Final verify: `grep -rn "PRICING\.md" @todo/SAAS-CHATBOT/` returns nothing; tick the checkboxes.
