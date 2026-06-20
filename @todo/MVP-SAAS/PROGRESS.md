# PROGRESS — MVP-SAAS

**Status:** Planning · 0 features started · 0 lines of product code

## Current Focus

Rebuild of the planning workspace is **complete**. All documentation deliverables (foundation,
ADRs, feature `PLAN.md`s, PRICING) are written; the workspace is navigable end-to-end without
the frozen old plan.

Next step: start the build — pick the first feature off the queue (`core-db`).

Blocker: none.

## Documentation progress (this rebuild)

- [x] `README.md` — entry point
- [x] `CONTEXT.md` — compiled knowledge
- [x] `FEATURES/README.md` — catalog + dependency graph + queue + derived M1–M4 milestones view
- [x] `PROGRESS.md` *(this)*
- [x] `ARCHITECTURE.md` — concept + diagrams
- [x] `adr/` — surviving ADRs 001–018 (clean) + ADR 019 (confidence-gate) + ADR 020 (admin/operator
  surface) + `adr/README.md` index
- [x] `FEATURES/<slug>/PLAN.md` — all 26 active features + 8 ⚪ Future backlog (34 total) + 2 co-built
  engine libs (counted separately)
- [x] `PRICING/` — **self-contained** (README · billing · models · plans · REVALIDATION · embeddings ·
  infrastructure) + live tooling in `research-app/` (Vite + lowdb OpenRouter/AA scanner)



## Feature progress

Status per feature. `todo` = planned, not started. See `FEATURES/<slug>/PLAN.md` for each.

### 🔵 Core
- [ ] `core-db` — todo
- [ ] `core-api` — todo
- [ ] `job-contract` — todo
- [ ] `ingestion` — todo
- [ ] `retrieval` — todo
- [ ] `chat-sse` — todo
- [ ] `widget-v0` — todo

### 🟢 RAG Quality
- [ ] `retrieval-eval` — todo
- [ ] `confidence-gate` — todo
- [ ] `reranking` — todo

### 🟡 Platform
- [ ] `rbac` — todo
- [ ] `api-keys` — todo
- [ ] `widget-security` — todo
- [ ] `incremental-reembed` — todo
- [ ] `portal` — todo
- [ ] `admin-app` — todo

### 🟠 Revenue
- [ ] `metering` — todo
- [ ] `managed-exec` — todo *(new: un-billed Managed dogfood path; breaks routing↔managed cycle)*
- [ ] `model-routing` — todo
- [ ] `wallet` — todo
- [ ] `billing` — todo
- [ ] `managed-mode` — todo
- [ ] `guardrails-min` — todo *(split: injection + I/O, before public widget)*
- [ ] `guardrails-full` — todo *(split: per-bot scoping + hardening, before broad rollout)*
- [ ] `cost-attribution` — todo
- [ ] `revenue-analytics` — todo

### ⚪ Future (backlog — each has a `PLAN.md`, `Status: backlog`, promotable)
- [ ] `channels` — backlog
- [ ] `agent-console` — backlog
- [ ] `ticketing` — backlog
- [ ] `quality-metrics` — backlog
- [ ] `bot-mode-availability` — backlog
- [ ] `knowledge-sync` — backlog
- [ ] `tool-calling` — backlog
- [ ] `embedded-ai-layer` — backlog *(exploratory)*


## Decisions Made During Execution

- 2026-06-17: **Rebuilt from scratch** in `@todo/MVP-SAAS/` from the previous planning iteration.
  Recreate only what survives the new model.
- 2026-06-17: **Feature-graph is the primary structure**; F1–F4 phases demoted to a derived view.
- 2026-06-17: **Showcase-first** ordering → RAG quality (eval/confidence-gate/reranking) pulled
  forward to a first-class F1.5, no longer an F4 nice-to-have.
- 2026-06-17: **Polyglot kept**, with the explicit principle "Python where the ecosystem matters
  (parsing/OCR/eval), Node where it's the common path (API/chat/governance)". Recorded in ADR 001.
- 2026-06-17: **New feature `confidence-gate` + ADR 019** — retrieval-confidence short-circuit:
  a safe floor ("don't know" instead of hallucinate) and an optional ceiling (answer without LLM
  on near-exact matches). Did not exist in the old plan.
- 2026-06-17: ADRs carried over in **clean format** (survivors only), not as an evaluation diary.
- 2026-06-17: **PRICING is self-contained, not a link to the old doc.** The durable monetization
  logic (margin engine, billing modes, plan ladder, revalidation) lives in `MVP-SAAS/PRICING/` as
  ours; only volatile provider digits are deferred — handled by **live tooling**, not hand-copied
  tables. (Supersedes the earlier "lean summary referencing the frozen tables" leaning in §8.)
- 2026-06-17: **OpenRouter/AA scanner brought in** as `research-app/` (Vite + lowdb, "Scan" button
  fetches live OpenRouter prices × Artificial Analysis scores, curates tiers into `db.json`). It's our
  analysis tool; numbers in the `.md`s are a **2026-06-14 snapshot**, re-scan here to revalidate.
- 2026-06-19: **Absorbed from frozen SAAS-CHATBOT and made lean** — moved `research-app/`,
  `PRICING/embeddings.md`, `PRICING/infrastructure.md` into MVP-SAAS; dropped `market.md`, raw
  `infra.md`, and `BENCHMARK-PLAN.md` (obsolete/never-built tooling). Managed billing now documents
  **two candidates** (fixed-per-message + metered-per-token), decision deferred. SAAS-CHATBOT removed.
- 2026-06-17: **FUTURE backlog promoted to first-class features** — each of the 8 cards now has a
  `FEATURES/<slug>/PLAN.md` (`Layer: ⚪ Future`, `Status: backlog`), same format as the 21 active
  ones, promotable to a real layer freely. FEATURES/README ⚪ section is now a full catalog (29 total).
  *(Counts as of this 2026-06-17 entry; later grew to 24 active / 32 total — see the 2026-06-20 entry.)*
- 2026-06-17: **Consistency sweep + granularity review done** — ADR refs / `depends_on` / queue all
  consistent; 21 active features judged well-sized (no merges/splits). Minor note: `guardrails` sits
  in the 🟠 Revenue layer though it's conceptually governance — kept as-is (no Governance layer
  defined; the derived F3 view already treats it as governance).
- 2026-06-20: **Admin/operator surface added** (`admin-app` + ADR 020). The plan had a tenant `portal`
  but **no operator console** — *our* cross-tenant surface to manage customers and see cost×revenue per
  tenant. Decided: (a) `admin-app` is a **separate app on a privileged role** (the deliberate inverse of
  RLS/ADR 016); (b) the `research-app` **graduates into a Research module** of the admin (lowdb →
  Supabase); (c) added two Revenue features — `cost-attribution` (real cost/tenant) and
  `revenue-analytics` (cost × revenue → margin/tenant). `admin-app` is an **active** feature (not
  backlog) because monetization needs it. Counts: **21 → 24 active** (32 total). The cost×revenue core
  depends on the revenue layer (`metering`/`billing`), so it sequences after it.
- 2026-06-20: **"Showcase-first" narrative dropped; goal restated as revenue.** The README/CONTEXT
  framing of "demonstrate end-to-end AI engineering" was incoherent with the whole `PRICING/` thesis
  (margin/wallet/routing). Reframed: **build a sellable product incrementally**; polyglot is an
  engineering decision (Python worker for parsing/OCR/eval, TS everywhere else), not a demo. The dead
  **F1–F4 "derived view"** (tied to a plan that no longer exists) was **replaced** by **incremental
  validation milestones M1–M4** (M1 closed loop → M2 self-service product → M3 trustworthy/bounded →
  M4 monetized). The recommended queue was reordered accordingly; the **`confidence-gate` floor moved
  into M2** (so the first real customer's bot doesn't hallucinate). No feature, dependency, or ADR
  changed — only narrative + ordering. Earlier 2026-06-17 "showcase/F1.5" log entries are kept as
  historical record.
- 2026-06-20: **Adversarial review sweep — coherence + economic honesty fixes.**
  Resolved a set of contradictions/gaps found in a critical pass:
  - **Engine reframed as co-dependency, not asset.** `llm-adapters`/`embedding-adapters` are `0/48`/`0/47`
    (zero code); Core features now hard-depend on the adapter builds (`FEATURES/README.md` "Engine
    prerequisite"); README/ARCHITECTURE/CONTEXT corrected ("co-built, not pre-existing").
  - **New feature `managed-exec`** (un-billed Managed path: platform key + routing seam + shadow meter)
    breaks the `model-routing`↔`managed-mode` **circular dependency** and is the only place
    provider-invoice reconciliation works (we get that bill, not the BYOK tenant).
  - **`model-routing` deps `soft`→`hard`** (metering + retrieval-eval) to match its done-criterion.
  - **`metering`** no longer claims BYOK invoice reconciliation (tenant owns that invoice).
  - **`managed-mode`** now hard-depends on `billing` too (a hard cap needs auto-recharge to refill).
  - **Anchor reframed:** "premium model" → **principal mainstream tier = avg(Anthropic Sonnet + OpenAI
    principal placeholder)**, a *price* reference not a quality ceiling; 80% tier renamed
    `principal`→`workhorse`; **routing/classification overhead** added to the blend; model SKUs marked
    **illustrative** (research-app/admin-app is SSOT for model selection + prices). ADR 009/014, PRICING.
  - **Margin honesty:** `plans.md` now separates subscription vs token margin, adds a **negative-spread**
    scenario, **Free-tier token cost**, and **break-even by infra stage**.
  - **`guardrails` split** into `guardrails-min` (M2, before public widget) + `guardrails-full` (M4).
  - **ADR 011** clarified the `max_tokens` cap is token-denominated (billing *unit* still open).
  - **ADR 017** added: a **dim change** is a schema migration (not just a version bump) + ANN/RLS note.
  - **confidence-gate** floor ships in **M2 as an uncalibrated safe default**, calibrated in M3.
  - Counts: **24 → 26 active** (34 total) + 2 co-built engine libs counted separately.
