# Validation Prompts — SAAS-CHATBOT

> Prompts (in English — consumed by an LLM reviewer, English saves tokens) to re-validate the project.
> All three share one job: **cross-reference the documents, find gaps and inconsistencies** — quote
> both sides, no brainstorming, no speculation. Deterministic: same files ⇒ same findings.
> Three fronts: **(1)** technical/product plan + ADRs + FUTURE, **(2)** financial model/pricing,
> **(3)** factual base in the `router-adapters` catalog ↔ `PRICING/`.
> Last updated: 2026-06-14

---

## 🔍 PROMPT 1 — Cross-check the plan (architecture, ADRs, roadmap, FUTURE)

```
You are a documentation-consistency auditor for a whitelabel RAG chatbot SaaS. Cross-reference the
docs and report ONLY factual contradictions, stale references, and missing required links. Do NOT
brainstorm, propose architecture, or judge if a decision is "good" — only whether the docs AGREE.
Deterministic: same files ⇒ same findings.

READ ALL FIRST:
- @todo/SAAS-CHATBOT/CONTEXT.md
- @todo/SAAS-CHATBOT/adr/README.md  (the ADR index — read it to get the real ADR count; never assume)
- @todo/SAAS-CHATBOT/adr/*.md
- @todo/SAAS-CHATBOT/PLAN.md
- @todo/SAAS-CHATBOT/ARCHITECTURE.md
- @todo/SAAS-CHATBOT/PROGRESS.md
- @todo/SAAS-CHATBOT/FUTURE/*.md

A finding is ONLY one of:
- CONTRADICTION — two docs state incompatible facts about the same thing.
- STALE — a reference (number range, "ADR #N", "§N", a name) no longer matches its source of truth.
- MISSING — an ADR/doc mandates something (an Acceptance clause, a column, a per-phase task) that the
  doc responsible for carrying it does not contain.
Taste, "could be better", and speculative future risks are NOT findings — drop them.

CHECK EXACTLY THESE, IN ORDER (for each: quote every place it appears, mark MATCH/CONTRADICTION/STALE/MISSING):
I1. ADR inventory — does adr/README.md match the ADR tables in PLAN.md and ARCHITECTURE §8? Do in-text
    ranges ("ADRs 001–0NN") match the highest real ADR? Every ADR file in the index and vice-versa?
I2. LLM mode — is "Managed default vs BYOK" stated consistently across CONTEXT, PLAN, ARCHITECTURE,
    ADR 009/013? Flag BYOK-first narration vs Managed-default, and present-tense claims that ignore
    "Managed only at F4".
I3. Tenant isolation key — same column name everywhere (tenant_id vs org_id)? Which ER tables carry it
    vs ADR 016's "every tenant-owned table carries it + a policy"? List each tenant-owned entity ✓/✗.
I4. Phase assignment — for {guardrails, rate-limiting, LGPD, Managed billing/wallet, incremental
    re-embed, BYOK key rotation, domain ownership/session token}: phase in ADRs vs PLAN vs PROGRESS vs
    Lifecycle. Flag any that differ, or that land AFTER "Beta = real tenants" starts.
I5. ADR acceptance ↔ PROGRESS — every ADR with an "Implementation contract"/"Acceptance" clause must
    have a matching gate in PROGRESS. Table: ADR → Acceptance → PROGRESS gate or MISSING.
I6. Data-model hooks — CONVERSATION.status (ADR 008) vs FUTURE/03 states; MEMBER.role vs the `agent`
    actor FUTURE/02 needs without migration; BOT fields FUTURE/09 adds vs the ER.
I7. Decisions without an ADR — anything stated as DECIDED in prose (queue, BaaS, real-time transport,
    chunking strategy) with no ADR. List claim + where + confirm no ADR covers it.
I8. Names & pointers — component/library/model names and every "§N"/"ADR #N" cross-reference: do they
    resolve and say what the citing doc claims?

Also: does ADR 016's request-centric isolation cover the worker's PG-write path (ARCHITECTURE §6)?
Does FUTURE build order ("02→03→04→09; 01 independent") match the per-file dependencies? Is every
PLAN "in scope" item in exactly one PROGRESS phase?

RESPOND (fixed structure):
1. Coverage line: # ADRs read, # invariants checked, # rows compared.
2. One table: Invariant | Doc A (quote + file:loc) | Doc B (quote + file:loc) | Verdict | One-line fix.
   Only non-MATCH rows; order I1→I8.
3. ADR-acceptance ↔ PROGRESS table (I5).
4. Decisions without an ADR (I7).
5. Severity 🔴/🟡/🟢 per row — by leak/correctness/coding-blocker impact only.

HARD RULES: every finding quotes BOTH sides with file+location (no quote ⇒ drop it). No opinions, no
"consider…", no future risks, no style notes. If an invariant is clean, write "I{n}: consistent".
No financial analysis (PROMPT 2).
```

---

## 💰 PROMPT 2 — Cross-check the financial model (pricing ↔ its own numbers)

```
You are a unit-economics auditor for a whitelabel RAG chatbot. Cross-reference the PRICING docs
against each other and against their source numbers, and report ONLY arithmetic errors, internal
contradictions, and numbers with no traceable source. Do NOT redesign the pricing or give strategic
opinions. Show the math for every check. Deterministic: same files ⇒ same findings.

READ ALL FIRST:
- @todo/SAAS-CHATBOT/PRICING/README.md       (thesis: no-markup / routing-spread, TCO)
- @todo/SAAS-CHATBOT/PRICING/models.md       (model prices + 80/15/5 mix + blended + spread)
- @todo/SAAS-CHATBOT/PRICING/embeddings.md   (embedding prices)
- @todo/SAAS-CHATBOT/PRICING/infrastructure.md
- @todo/SAAS-CHATBOT/PRICING/plans.md        (plans, caps, reingestion, worst-case margin)
- @todo/SAAS-CHATBOT/PRICING/billing.md      (Managed/BYOK, wallet, metering, payments)
- @todo/SAAS-CHATBOT/PRICING/market.md
- @todo/SAAS-CHATBOT/PRICING/infra.md        (self-host breakeven — infra cost)
- @todo/router-adapters/ANALYSIS/model-benchmark.md  (quality scores — price source of truth)
- @todo/router-adapters/benchmark-app/db.json        (the live model catalog the prices derive from)

A finding is ONLY one of:
- ARITHMETIC ERROR — a computed value (blended cost, spread, margin, simulation row, breakeven) does
  not equal what its own inputs produce. Show: inputs → your recompute → the doc's number → delta.
- CONTRADICTION — two PRICING docs state different values/phases for the same thing (e.g. a plan price,
  a cap, a routing %, BYOK floor, the anchor).
- UNSOURCED — a PRICING number with no backing in the router-adapters catalog (or that diverges from it).
Strategic opinions ("anchor too high", "Free will bleed") are NOT findings here — drop them.

CHECK EXACTLY THESE, IN ORDER:
M1. Blended cost — recompute from models.md prices × the 80/15/5 mix; compare to the stated ~$1.35/1M.
M2. Spread — recompute (anchor − blended)/anchor with Sonnet 4.6 = $9/1M; compare to the stated ~85%.
M3. Anchor & model prices — every model price in models.md matches the router-adapters catalog?
M4. Embedding price — embeddings.md default (Qwen3 8B) matches its source?
M5. Plan table — Free / Starter / Pro / Business prices and caps stated identically across README,
    plans.md, billing.md (and any place a plan price appears)?
M6. Per-client simulations (models.md 100M–2B) — recompute each row; flag mismatches.
M7. Worst-case reingestion & margin floor (plans.md) — recompute K × storage and the floor %; matches?
M8. BYOK floor — the "forgone spread" figure recomputes from the same blended/anchor?
M9. Fees — Stripe and PIX (1.19%) applied consistently wherever they appear?

RESPOND (fixed structure):
1. Coverage line: # PRICING docs read, # checks M1–M9 done.
2. Arithmetic table: Check | Inputs | My recompute | Doc value (file:loc) | Verdict (✅/❌ + delta).
3. Source→number table: each key PRICING number → router-adapters catalog (✅ matches / ❌ diverges → correct).
4. Internal contradictions list (M5 and any cross-doc value mismatch), quoting both sides.
5. Severity 🔴/🟡/🟢 per finding — by size of the R$/% impact only.

HARD RULES: ALWAYS show the math. Quote file+location for every number. Separate FACT (in a file) from
ASSUMPTION (you supplied). No architecture/code (PROMPT 1). No strategic redesign — only do the numbers
agree with each other and with their source (the router-adapters catalog).
```

---

## 📊 PROMPT 3 — Cross-check the factual base (router-adapters catalog ↔ `PRICING/`)

> SSOT for model prices + quality scores = the **`router-adapters` catalog** (the `benchmark-app`
> store `db.json` + `ANALYSIS/model-benchmark.md`), refreshed by the benchmark-app's **Scan**.
> Infra cost lives in `PRICING/infra.md` (part of SAAS-CHATBOT).

```
You are a data auditor verifying the FACTUAL BASE under the pricing of a whitelabel RAG chatbot.
Cross-reference the source files against the live data and against where they are consumed, and report
ONLY stale data, broken source→derived links, and arithmetic errors. Do NOT give strategic opinions.
Show the math. Deterministic: same files ⇒ same findings.

STEP 0 — REFRESH:
- In `@todo/router-adapters/benchmark-app/`, run a **Scan** (refreshes live OpenRouter prices + AA
  scores into `db.json`). See its README for how to run it.
- Check the "Newest" / NEW-PROMO models there. Any model used by PRICING but lacking a score in
  `@todo/router-adapters/ANALYSIS/model-benchmark.md` is a MISSING finding.

READ:
- @todo/router-adapters/ANALYSIS/model-benchmark.md  (quality scores)
- @todo/router-adapters/benchmark-app/db.json        (live model prices — SSOT)
- @todo/SAAS-CHATBOT/PRICING/infra.md                (self-host breakeven)
- @todo/SAAS-CHATBOT/PRICING/models.md + embeddings.md  (where the source is consumed)

A finding is ONLY one of:
- STALE — a price/score/assumption in the docs no longer matches the refreshed live data (show old→new).
- BROKEN LINK — a number used in models.md/embeddings.md does not derive from the SSOT/benchmark.
- ARITHMETIC ERROR — an average, blended, spread, or breakeven that doesn't recompute. Show the math.
- MISSING — a model priced/used with no quality score (or a benchmarked model that no longer exists).

CHECK EXACTLY THESE, IN ORDER:
D1. Prices live — each cited model price still matches the refreshed SSOT? Promos baked in (flag expiry)?
D2. Names — every cited model still exists under that exact name (no rename/discontinue)?
D3. Averages — each (input+output)/2 per model recomputes correctly?
D4. Blended & spread — derive correctly from the SSOT prices × the 80/15/5 mix (≈$1.35/1M, ≈85%)?
D5. Embedding — embeddings.md default price matches the SSOT?
D6. Anchor — Sonnet 4.6 = $9/1M matches the SSOT?
D7. Infra — RTX 5090 breakeven (~3.6 mo @ 100M/mo; ~15 days @ 1B) recomputes from its assumptions?
D8. Coverage — every model PRICING uses has a benchmark score in the router-adapters benchmark?

RESPOND (fixed structure):
1. Coverage line: refreshed yes/no, # models checked, # checks D1–D8 done.
2. "old → new" diff table for every changed datum (price/score/assumption), with source.
3. Arithmetic table: Check | Inputs | My recompute | Doc value (file:loc) | Verdict (✅/❌).
4. Source→derived table: each PRICING number → SSOT/benchmark (✅ matches / ❌ diverges → correct).
5. Severity 🔴/🟡/🟢 per finding + cadence (what to re-audit monthly vs quarterly).

HARD RULES: ALWAYS show the math, refresh before judging staleness, quote file+location, separate FACT
from ASSUMPTION, flag every PRICING number with no traceable backing in the router-adapters catalog.
No architecture (P1), no pricing redesign (P2).
```
