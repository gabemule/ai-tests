# Validation Prompts — SAAS-CHATBOT

> Prompts (in English — they're consumed by an LLM reviewer, so English saves tokens) for an LLM
> reviewer to critically and independently re-validate the project.
> Three fronts: **(1)** technical/product plan + ADRs + FUTURE, **(2)** financial model/pricing,
> **(3)** the factual base in `ANALYSIS/` (quality, price-per-token, infra breakeven).
> Last updated: 2026-06-14

---

## 🔍 PROMPT 1 — Validate the plan (architecture, ADRs, roadmap and FUTURE)

> Phased: **1A** validates the ADRs in isolation; **1B** validates the full plan (incl. FUTURE)
> against the ADRs and the objectives. Run both phases in sequence, in the same session.

```
You are a Staff/Principal Engineer doing a critical, independent technical review of a whitelabel
RAG chatbot SaaS. Your goal is NOT to praise — it's to find holes, risks and inconsistencies before
we write production code. This review is phased: first the ADRs (1A), then the full plan against the
ADRs and the FUTURE (1B).

CONTEXT TO READ (in this order):
1. @todo/SAAS-CHATBOT/CONTEXT.md      — compiled project state
2. @todo/SAAS-CHATBOT/adr/*.md        — the architecture decisions (ADRs 001–017) + adr/README.md
3. @todo/SAAS-CHATBOT/PLAN.md         — roadmap, phases, scope, gaps
4. @todo/SAAS-CHATBOT/ARCHITECTURE.md — components, data flow, contracts
5. @todo/SAAS-CHATBOT/PROGRESS.md     — where we are
6. @todo/SAAS-CHATBOT/FUTURE/*.md     — planned extensions (future scope, but part of the plan)

SCOPE RULE: technical/product focus. Do NOT go into financial/margin/cost analysis — that's covered
by PROMPT 2. Here you may take the PRICING numbers as given data.

═══════════════════════════════════════════════════════════════════════════════
PHASE 1A — Validate the ADRs in isolation
═══════════════════════════════════════════════════════════════════════════════
For the set adr/001–017:
- **Form:** is each ADR well-formed (clear Context / Decision / Consequences, actionable decision)?
- **Coherence with each other:** does any ADR contradict another? (e.g. isolation, LLM modes,
  embeddings, metering, billing). Is there overlap or redundancy between ADRs?
- **Coherence with the business:** does each decision make sense against the business rules and the
  objectives (multi-tenant whitelabel RAG, Managed-first, BYOK Enterprise-only, polyglot split)?
- **Gaps:** is there an important decision already made in the plan that has NO ADR and should?
  Is there an ADR that became stale relative to the current state?
- **Actionable Consequences:** the "Consequences" that call for validation/test (e.g. RLS leak test,
  embedding identity columns, queue idempotency) — are they reflected in the plan/PROGRESS?

═══════════════════════════════════════════════════════════════════════════════
PHASE 1B — Validate the full plan (PLAN/ARCHITECTURE/CONTEXT/PROGRESS + FUTURE) against the ADRs
═══════════════════════════════════════════════════════════════════════════════
- **Plan ↔ ADRs coherence:** does what's in PLAN/ARCHITECTURE/CONTEXT faithfully reflect the ADRs?
  Does any doc assert something an ADR already decided differently?
- **Internal coherence between docs:** do PLAN, ARCHITECTURE, CONTEXT and PROGRESS contradict each
  other anywhere (phase scope, data model, contracts, component names)?
- **FUTURE as part of the whole:** are the FUTURE/ vectors coherent with the core and the ADRs?
  Should any FUTURE item be MVP (or should something in MVP be deferred)? Does the FUTURE build order
  (and the dependencies between 01–09) make sense?
- **Architecture:** separation of responsibilities, multi-tenancy (cross-tenant leakage), single
  points of failure, the polyglot seam (NestJS API ↔ Python worker via queue), embedding parity.
- **Roadmap:** F1–F4 in the right order? Was anything critical pushed back improperly?
- **Intended objectives:** does the plan as a whole achieve the product's objectives, or is there
  drift?

HOW TO RESPOND:
1. **Executive summary** (5–8 lines): is the plan technically sound? Biggest risk? Can we code?
2. **PHASE 1A findings (ADRs)** by severity 🔴/🟡/🟢: ADR, problem, why it matters, fix.
3. **PHASE 1B findings (plan+FUTURE)** by severity 🔴/🟡/🟢: file/section, problem, fix.
4. **Contradictions/gaps** between documents and between docs↔ADRs (objective list).
5. **Decisions that should become an ADR** (if any).
6. **Top 5 prioritized actions** (what I'd do first).

Rules: be specific (cite ADR/file/section), propose concrete alternatives, separate FACT from
OPINION, and do NOT go into financial analysis — that's covered by PROMPT 2.
```

---

## 💰 PROMPT 2 — Validate the financial model (pricing, margin, costs)

> The pricing content lives in `PRICING/` (split by file). The source numbers come from `ANALYSIS/`
> (and/or the price-per-token source, wherever it lives after the split).

```
You are a SaaS CFO/FP&A + unit-economics analyst doing a critical, independent financial review of a
whitelabel RAG chatbot. Your goal is to stress-test the pricing, the margin and the model's
sustainability — to find where the numbers break, not to validate them out of politeness.

CONTEXT TO READ (in this order):
1. @todo/SAAS-CHATBOT/PRICING/README.md         — thesis (no-markup/routing-spread), TCO, roadmap, open Qs
2. @todo/SAAS-CHATBOT/PRICING/models.md         — generation model prices + routing mix + spread
3. @todo/SAAS-CHATBOT/PRICING/embeddings.md     — embedding prices (default Qwen3 8B + fallback)
4. @todo/SAAS-CHATBOT/PRICING/infrastructure.md — provider tiers + infra by scale stage
5. @todo/SAAS-CHATBOT/PRICING/plans.md          — plans, caps, reingestion, margin analysis (worst-case)
6. @todo/SAAS-CHATBOT/PRICING/billing.md         — modes (Managed/BYOK), wallet, metering, payments
7. @todo/SAAS-CHATBOT/PRICING/market.md          — global + BR benchmark
8. @todo/SAAS-CHATBOT/ANALYSIS/*.md              — factual base (price per token, benchmark, infra)

MODEL TO VALIDATE (summary):
- Public price anchored on the COST of the premium model (Sonnet 4.6 = $9/1M), with NO explicit markup.
- Margin comes from ROUTING INTELLIGENCE: mix Option B (80% Qwen3.7 Plus + 15% DeepSeek V4 Pro +
  5% Sonnet 4.6) → blended cost ~$1.35/1M → spread ~85% vs. the $9 anchor.
- Managed (prepaid wallet) = default on all tiers; BYOK = paid Enterprise-only add-on.
- Plans: Free / Starter $19 (R$99) / Pro $39 (R$199) / Business $119 (R$599) / Enterprise custom.

SCOPE OF THIS REVIEW (focus: financial, NOT architecture/code):
- Unit economics: does the ~85% routing margin hold? What if the real mix diverges (harder queries →
  more Sonnet)? Do a sensitivity analysis (mix 60/30/10, 50/30/20, etc.) and show where the margin
  drops to dangerous levels.
- Model price risk: OpenRouter prices are volatile and have promos baked in. Does the model withstand
  a 30–50% rise in the cost of the principal tier (Qwen)? What if the promos expire?
- Anchoring: is anchoring on Sonnet 4.6 ($9/1M) defensible, or too expensive/cheap? Compare with the
  competitors' TCO (market.md + README TCO).
- Plans & caps: do the prices cover the worst-case reingestion (plans.md, worst-case)? Is the ~45%
  floor margin comfortable or tight? Is Free (Managed, included balance) zero-risk or can it bleed?
- BYOK Enterprise: does the "floor referenced on the forgone spread (~$7.6k/mo per 1B tokens)" make
  sense? How would you price this add-on (fixed, % of volume, hybrid)?
- Financial management: does prepaid wallet + auto-recharge + hard cap protect cash? Risk of default,
  chargeback, negative float under competition? Are Stripe fees and PIX (1.19%) well modeled?
- Self-host (ANALYSIS/infra.md): is the RTX 5090 breakeven (~3.6 months @ 100M tok/mo) correct and
  should it accelerate the entry of a local zero-token-cost tier? Impact on margin if it enters?
- Per-client simulations (models.md, 100M to 2B tokens): do the numbers add up? Redo them and flag errors.

HOW TO RESPOND:
1. **Executive summary** (5–8 lines): is the model sustainable? Biggest risk to the margin?
2. **Arithmetic check**: recompute blended cost, spread, plan margins and the per-client simulation
   table. Flag any divergence with the corrected number.
3. **Sensitivity analysis**: margin table under different routing mixes and different model price
   levels (base / stress / pessimistic).
4. **Findings by severity** 🔴/🟡/🟢 — each with file/section, impact in R$/%, and fix.
5. **Business risks**: third-party price dependency, promos, FX volatility, abuse.
6. **Top 5 prioritized actions** to protect the margin.

Rules: ALWAYS show the math (not just conclusions), use the real numbers from the files, separate
FACT from ASSUMPTION, and do NOT go into architecture/code — that's covered by PROMPT 1.
```

---

## 📊 PROMPT 3 — Validate the factual base (`ANALYSIS/` ↔ `PRICING/`)

> `ANALYSIS/` is the **factual foundation** the `PRICING/` derives from: model quality
> (`model-benchmark.md`), price per token (`openrouter-pricing.md`) and self-host breakeven
> (`infra.md`). This prompt validates the source and the **source→derived coherence**.
>
> **Note:** `openrouter-pricing.md` (live price) may migrate into `PRICING/` during the split —
> read it wherever it lives (`ANALYSIS/` or `PRICING/`).

```
You are a data/cost analyst doing a critical, independent review of the FACTUAL BASE that underpins
the pricing of a whitelabel RAG chatbot. Your goal is to check whether the source data is still true,
whether it's up to date, and whether the numbers the pricing uses DERIVE CORRECTLY from that source.
You are the link between market reality and the financial model.

CONTEXT TO READ:
1. @todo/SAAS-CHATBOT/ANALYSIS/model-benchmark.md   — model quality scores
2. @todo/SAAS-CHATBOT/ANALYSIS/openrouter-pricing.md — price per token (OR @todo/SAAS-CHATBOT/PRICING/,
                                                       if already migrated in the split)
3. @todo/SAAS-CHATBOT/ANALYSIS/infra.md             — local infra breakeven (self-host / GPU)
4. @todo/SAAS-CHATBOT/PRICING/models.md + embeddings.md — where the source is CONSUMED (the derived)

SCOPE OF THIS REVIEW:
- **model-benchmark.md:** do the quality scores still match reality? Is the score methodology
  defensible (how it was measured, source)? New models (e.g. Qwen3.7 Plus/Max) without a score — how
  are they being positioned and is that justifiable? Was any benchmarked model discontinued/renamed?
- **price per token (openrouter-pricing):** are the prices still valid (re-audit live on OpenRouter)?
  Are there temporary promos baked in that may expire? Do the cited models still exist under that name?
  Are the input/output pairs and the average (input+output)/2 computed correctly?
- **infra.md:** is the RTX 5090 breakeven (~3.6 months @ 100M tok/mo; ~15 days @ 1B) arithmetically
  correct? Are the assumptions (power draw, token throughput, GPU lifespan/cost, utilization)
  realistic? Is the entry point of a self-host tier well positioned?
- **SOURCE → DERIVED COHERENCE (the key point):** do the numbers `PRICING/models.md` and
  `embeddings.md` use derive correctly from the source? Specifically:
  - do the blended ~$1.35/1M and the spread ~85% match the prices in `openrouter-pricing.md` and the
    80/15/5 mix?
  - does the default embedding price (Qwen3 8B) in `embeddings.md` match the source?
  - does the Sonnet 4.6 = $9/1M anchor match the source?
  - any number in PRICING/ that has NO backing in ANALYSIS/ (or that diverges) is a finding.

HOW TO RESPOND:
1. **Executive summary** (5–8 lines): is the factual base still reliable? Biggest stale-data risk?
2. **"old → new" diff** per datum that changed (price, score, infra assumption), with the source.
3. **Arithmetic check**: recompute the price averages, the blended, the spread and the GPU breakeven.
4. **Source→derived coherence**: a table pointing each PRICING/ number to whether it matches ANALYSIS/
   (✅ matches / ❌ diverges → corrected number).
5. **Findings by severity** 🔴/🟡/🟢 — each with file, impact, and fix.
6. **Cadence recommendation**: what needs re-auditing monthly vs. quarterly.

Rules: ALWAYS show the math, re-validate prices live when possible, separate FACT from ASSUMPTION,
and make explicit any number in PRICING/ that has no traceable backing in ANALYSIS/.
```
