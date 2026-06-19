# PLAN-REVALIDATE-MVP — Rebuild spec & resume prompt

> **Purpose:** this file lets a fresh session (a future me, or another agent) understand —
> from zero — what we're doing, why, what's already decided, what's done, and how to
> continue. Read it first if you have no prior context.
> Last updated: 2026-06-17

---

## 1. Mission

Recreate the planning of the old `@todo/SAAS-CHATBOT/` project inside this new workspace
`@todo/MVP-SAAS/`, under a **feature-graph model** that is **showcase-first** — importing
**only what survives** the new model. Not a copy: a deliberate re-derivation.

## 2. Why this rebuild exists

The old `SAAS-CHATBOT/` plan is excellent but structured as a **monolithic F1→F4 phase
roadmap**, which had two problems for our goal:

1. **RAG quality** (retrieval eval, reranking, anti-hallucination) was deferred to F4 /
   "nice-to-have" — yet it's the strongest **showcase** of AI product engineering.
2. **The economic thesis** (Managed + routing spread, the ~85% margin) lands only at GA,
   so the whole platform gets built before the business model is validated.

The new model fixes this by treating the project as a **graph of independent features**
with explicit dependencies; phases become a *derived view*, and the queue is reordered
**showcase-first**.

## 3. Decisions locked (do NOT re-litigate)

1. **New workspace from scratch** in `@todo/MVP-SAAS/`; old `@todo/SAAS-CHATBOT/` stays
   **frozen** as historical reference (never edited).
2. **Feature-graph is the primary structure**; F1–F4 phases demoted to a derived view
   (`FEATURES/README.md`).
3. **Showcase first, revenue close behind.** RAG quality pulled forward to a first-class
   "F1.5"; revenue features (wallet/routing/billing) sequenced after, de-risked by metering
   shadow mode + retrieval-eval.
4. **Polyglot kept**, with the explicit principle: *Python where the ecosystem matters
   (parsing/OCR/eval), Node where it's the common path (API/chat/governance/query-embed)*.
   (ADR 001)
5. **New feature `confidence-gate` + ADR 019** — retrieval-confidence short-circuit: a safe
   **floor** ("don't know" instead of hallucinate) + an optional **ceiling** (answer without
   the LLM on near-exact matches). Did not exist in the old plan.
6. **ADRs carried over in clean format** (survivors only) — no "evaluation diary".

## 4. Source of truth & references

| Where | What |
|---|---|
| `@todo/MVP-SAAS/` *(this workspace)* | The new plan — **active, source of truth going forward** |
| `@todo/SAAS-CHATBOT/` *(frozen)* | The old plan — **read-only reference** to mine content from |
| `MVP-SAAS/CONTEXT.md` | Compiled knowledge of the new model (read first) |
| `MVP-SAAS/PROGRESS.md` | Live status — "where are we" |
| `MVP-SAAS/FEATURES/README.md` | The feature graph + queue + derived F1–F4 view |
| `MVP-SAAS/adr/` | Surviving ADRs (clean) + ADR 019 |
| `SAAS-CHATBOT/adr/` (001–018) | Old ADRs — the rationale to distill from |
| `SAAS-CHATBOT/PRICING/` | Economic model — distill the thesis/plans |
| `SAAS-CHATBOT/FUTURE/` | Market-adjacency backlog — carried as backlog cards |
| `SAAS-CHATBOT/ANALYSIS/` | Dated research (infra, model-benchmark) — **reference, don't recreate** |

## 5. The filter (recreate only if it fits the new model)

For each old asset, decide consciously — **keep / adapt / drop** — and apply the new model.

| Old asset | Decision | Note |
|---|---|---|
| 18 ADRs | **keep most, re-phrase a few** | clean format; same numbering 001–018 preserved |
| Domain model (ER) | **keep** | strong multi-tenant design |
| Roadmap F1–F4 (as structure) | **drop as structure → derived view** | replaced by the feature graph |
| PRICING (margin thesis) | **adapt** | keep the logic; Managed/routing no longer "end of line" |
| FUTURE/ | **keep as backlog cards** | already independent features |
| ANALYSIS/ (infra, benchmark) | **reference, don't recreate** | dated research; point to `SAAS-CHATBOT/ANALYSIS/` |

## 6. Migration map (from → to)

| `SAAS-CHATBOT/` (old) | `MVP-SAAS/` (new) |
|---|---|
| `PLAN.md` (roadmap + scope + decisions) | split: `FEATURES/README.md` (graph/queue) + `adr/` + `README.md` |
| `ARCHITECTURE.md` | `ARCHITECTURE.md` (distilled; polyglot-by-ecosystem; gate in chat flow) |
| `CONTEXT.md` | `CONTEXT.md` (recompiled for the new model) |
| `PROGRESS.md` (0/32, phase-based) | `PROGRESS.md` (feature-based, honest counters) |
| `adr/001–018` | `adr/001–018` (clean) **+ new `adr/019` confidence-gate** |
| `PRICING/*` | `PRICING/*` (distilled) |
| `FUTURE/*` | `FEATURES/README.md` ⚪ backlog section (+ optional per-card PLAN later) |
| `ANALYSIS/*` | not recreated — referenced |

## 7. Execution checklist (current status)

- [x] **Foundation** — `README.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `PROGRESS.md`,
  `FEATURES/README.md` (graph + queue + derived F1–F4 view)
- [x] **This resume spec** — `PLAN-REVALIDATE-MVP.md`
- [x] **ADRs** — recreated surviving 001–018 in clean format + wrote `adr/019` (confidence-gate)
  + `adr/README.md` index
- [x] **Feature `PLAN.md`s** — all 21 active features (core → RAG quality → platform → revenue)
  **+ 8 ⚪ Future backlog** features, each with its own `PLAN.md` (`Status: backlog`, promotable)
- [x] **PRICING self-contained** — durable margin thesis + billing + plans + revalidation distilled
  into `MVP-SAAS/PRICING/` as ours; volatile provider digits handled by live tooling
  `PRICING/get-model-prices/` (the OpenRouter scraper), not hand-copied (decision §8)
- [x] **Final review with Barney** — consistency sweep + granularity review done; 3 open questions
  in §8 resolved


## 8. Open questions (RESOLVED 2026-06-17)

- ~~**PRICING depth:**~~ **RESOLVED → full self-contained distillation.** The durable monetization
  logic lives in `MVP-SAAS/PRICING/` (README · billing · models · plans · REVALIDATION) as ours — we
  don't link to the frozen doc. Only volatile provider digits are deferred, and they're handled by
  **live tooling** (`PRICING/get-model-prices/`, the OpenRouter scraper + dashboard + snapshots),
  not hand-copied tables.
- ~~**Backlog cards:**~~ **RESOLVED → each gets a `PLAN.md`.** The 8 FUTURE items are now first-class
  features (`FEATURES/<slug>/PLAN.md`, `Layer: ⚪ Future`, `Status: backlog`), same format as the 21
  active ones, freely promotable to a real layer. `FEATURES/README.md` ⚪ section is a full catalog.
- ~~**Feature granularity:**~~ **RESOLVED → 21 active features are well-sized.** Reviewed; no pair
  always moves together, none is oversized. Revisit only if reality proves otherwise during the build.

> **Minor follow-up (not blocking):** `guardrails` lives in the 🟠 Revenue layer though it's
> conceptually governance. Kept as-is — there is no "Governance" layer defined, and the derived F3
> view already treats it as governance. Reclassify only if a Governance layer is later introduced.


---

## 9. RESUME PROCEDURE (imperative — do this to continue from zero)

1. **Read context, in order:**
   - `@todo/MVP-SAAS/CONTEXT.md` (project knowledge)
   - `@todo/MVP-SAAS/PROGRESS.md` (where we left off)
   - `@todo/MVP-SAAS/FEATURES/README.md` (the graph + queue)
   - this file (`PLAN-REVALIDATE-MVP.md`) for the decisions and the filter.

2. **See what already exists:** list `@todo/MVP-SAAS/` recursively. Cross-check against the
   checklist in §7. Anything already written is done — don't redo it.

3. **For each pending item in §7**, in order:
   - Open the corresponding **source** file(s) in `@todo/SAAS-CHATBOT/` (use the migration
     map §6 to find them).
   - Apply **the filter** (§5): keep / adapt / drop.
   - Recreate it in `@todo/MVP-SAAS/` in the new model's shape, referencing ADRs by number.

4. **When writing ADRs:** bring over **only survivors** 001–018 in **clean format** (Context /
   Decision / Consequences / optional Implementation contract). Add `adr/019` for confidence-gate
   (floor + optional ceiling, calibrated by `retrieval-eval`). Update `adr/README.md` index.

5. **When writing feature `PLAN.md`s:** each must carry — objective, scope (in/out),
   `depends_on` (hard/soft), ADRs touched, and a concrete done-criterion. Order by the queue in
   `FEATURES/README.md`.

6. **After each meaningful block:** update `MVP-SAAS/PROGRESS.md` (check items, fix counters,
   update "Current Focus") and append any runtime decision to its "Decisions Made During
   Execution" log.

7. **Do NOT** edit anything under `@todo/SAAS-CHATBOT/` — it is frozen reference.

8. **Do NOT** use git (no commit/push) — that's Barney's job.

> **Definition of done for this rebuild:** every item in §7 checked, `PROGRESS.md` reflects it,
> and a fresh reader can navigate `MVP-SAAS/` end-to-end without ever needing the old plan
> except as historical reference.
