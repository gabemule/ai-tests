# router-adapters — PLAN

## Context

Promoted from `@todo/FUTURE.md` (was the #2 candidate adapter library). The runtime job is small but
high-leverage: given a category (`economy` / `principal` / `premium`), return the **cheapest available
model that clears a quality floor**. This turns model selection from hardcoded code into curated data —
the dynamic evolution of ADR 014's *static* routing percentages.

The **catalog half** already exists and is live as `@todo/MVP-SAAS/research-app/` (the
producer) — it scans OpenRouter prices + Artificial Analysis scores and lets a human curate which
models sit in each tier. What's missing is the **router half** — this generic library that consumes
that catalog at runtime (and emits telemetry back to `retrieval-eval`).

## Goals

- A reusable library exposing `RouterPort.route({ category, query, context }) → { model, reason }`.
- **Cheapest-available-above-floor** resolution per product tier, with `-alt` fallback when the
  titular model is unavailable.
- Mirror the sibling libs' Hexagonal shape (`llm-adapters`, `embedding-adapters`): Port + adapters +
  `RouterProvider.create()` factory, TypeScript + Python parity.
- Consume the catalog produced by `@todo/MVP-SAAS/research-app/` (curated lists + thresholds) without
  owning the curation itself.
- Emit routing telemetry (`TelemetryPort`) so `@todo/MVP-SAAS/FEATURES/retrieval-eval/` can build an online
  `rag_score` and `research-app/` can validate the real mix / real blended cost.

## Scope

**In:**
- `RouterPort` contract + `RouterProvider.create({ provider })` factory.
- Routing strategies as adapters: **heuristic** (rules), **classifier** (small LLM/embedding),
  **external** (OpenRouter Auto / NotDiamond), **ollama** (zero-token-cost tier).
- Cheapest-above-floor resolver + `-alt` fallback + availability check.
- A defined catalog input shape (curated lists + `bench-score-*` floors + `bench-price-*` ceilings).

**Out:**
- Curation UI / scanning — that's `research-app/`'s job (see its `docs/`).
- The RAG eval harness that produces `rag_score` — that's `retrieval-eval`'s job.
- Actually calling the chosen model — that's `llm-adapters`.
- Auto-promotion of new/promo models — notify-only for now (manual re-**Scan** in `research-app/`).

## Decisions

- **The library owns the policy; the app owns the lists.** Cheapest-above-floor resolution, `-alt`
  fallback, availability checks, and the routing strategies are repeatable infra. Which models live in
  `economy`/`principal`/`premium` and the floors/ceilings themselves are business data `research-app/` provides.
- **Floor is mandatory.** "Cheapest" without a quality floor drifts to the weakest model — the resolver
  always gates on `bench-score-*` first, then minimizes price under `bench-price-*`.
- **Catalog is the input, not embedded.** The router reads curated lists + thresholds (the shape
  `research-app` produces); it does not hardcode model names.
- **Hexagonal + factory**, same as `llm-adapters` — so the strategy (heuristic/classifier/external/
  ollama) swaps without touching callers.
- **Telemetry is first-class.** A `TelemetryPort` emits trace+outcome per request — the evidence loop
  that feeds `retrieval-eval` (online `rag_score`) and `research-app/` (real mix / real cost).
- **Notify-only scan.** New models and promos are surfaced for human curation, never auto-promoted
  (manual re-**Scan** in `research-app/`).

## Architecture (intended)

```
Application → RouterPort.route({ category, query, context })
                     │
            ┌────────┴────────┐
            ▼                 ▼
      Heuristic         Classifier        (+ External: OpenRouter Auto / NotDiamond)
      (rules)           (small LLM)        (+ Ollama as a zero-token-cost tier)
                     │
                     ▼
        cheapest-available-above-floor resolver
        (gate on bench-score-* → minimize price under bench-price-* → -alt fallback)
                     │
                     ▼
              { model, reason }
```

- **RouterPort** — `route(input) → { model, reason }`.
- **Adapters/strategies** — heuristic, classifier, external, ollama.
- **Factory** — `RouterProvider.create({ provider })`.
- **Resolver** — shared cheapest-above-floor logic all strategies feed into.

## Phases

1. **Contracts** — `RouterPort`, input/output types, catalog input shape. → verify: types compile, no impl.
2. **Resolver** — cheapest-above-floor + `-alt` fallback + availability stub. → verify: unit tests over a fixture catalog.
3. **Heuristic adapter** — length/keyword/regex complexity → category. → verify: tests map sample queries to categories.
4. **Factory** — `RouterProvider.create()` wiring. → verify: factory returns the right adapter.
5. **Classifier adapter** — small LLM/embedding intent classifier. → verify: tests vs. labeled samples.
6. **External + Ollama adapters** — OpenRouter Auto / NotDiamond / self-hosted tier. → verify: integration smoke tests.
7. **Python parity** — mirror the TS contract. → verify: same fixtures pass in both.

## Relationship to the ecosystem

- **`@todo/MVP-SAAS/research-app/`** (the producer) curates the catalog this router consumes —
  the tiers, `bench-score-*` floors and `bench-price-*` ceilings.
- **`@todo/MVP-SAAS/FEATURES/retrieval-eval/`** (the validator) consumes this router's telemetry to build the
  online `rag_score` that becomes the quality floor.
- **`llm-adapters`** calls the model this router picks.
- **MVP-SAAS (Managed mode)** materializes the margin spread of ADR 014 via this router.
- See `CONTEXT.md` for the full scope philosophy and the producer (research-app) / consumer (this lib) /
  validator (retrieval-eval) split.
