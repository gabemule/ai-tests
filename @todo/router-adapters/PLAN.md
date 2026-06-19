# router-adapters — PLAN

## Context

Promoted from `@todo/FUTURE.md` (was the #2 candidate adapter library). The runtime job is small but
high-leverage: given a category (`primary` / `economy`), return the **cheapest available model that
clears a quality floor**. This turns model selection from hardcoded code into curated data — the
dynamic evolution of ADR 014's *static* routing percentages.

The **catalog half** already exists and is live: `benchmark-app/` scans OpenRouter prices + Artificial
Analysis scores and lets a human curate which models sit in each tier. What's missing is the **router
half** — the library that consumes that catalog at runtime.

## Goals

- A reusable library exposing `RouterPort.route({ category, query, context }) → { model, reason }`.
- **Cheapest-available-above-floor** resolution per product tier, with `-alt` fallback when the
  titular model is unavailable.
- Mirror the sibling libs' Hexagonal shape (`llm-adapters`, `embedding-adapters`): Port + adapters +
  `RouterProvider.create()` factory, TypeScript + Python parity.
- Consume the catalog produced by `benchmark-app/` (curated lists + thresholds) without owning the
  curation itself.

## Scope

**In:**
- `RouterPort` contract + `RouterProvider.create({ provider })` factory.
- Routing strategies as adapters: **heuristic** (rules), **classifier** (small LLM/embedding),
  **external** (OpenRouter Auto / NotDiamond), **ollama** (zero-token-cost tier).
- Cheapest-above-floor resolver + `-alt` fallback + availability check.
- A defined catalog input shape (curated lists + `bench-score-*` floors + `bench-price-*` ceilings).

**Out:**
- Curation UI / scanning — that's `benchmark-app/`'s job (see its `docs/`).
- Actually calling the chosen model — that's `llm-adapters`.
- Auto-promotion of new/promo models — notify-only for now (see `CRON.md`).

## Decisions

- **The library owns the policy; the app owns the lists.** Cheapest-above-floor resolution, `-alt`
  fallback, availability checks, and the routing strategies are repeatable infra. Which models live in
  `primary`/`economy` and the floors/ceilings themselves are business data the app/catalog provides.
- **Floor is mandatory.** "Cheapest" without a quality floor drifts to the weakest model — the resolver
  always gates on `bench-score-*` first, then minimizes price under `bench-price-*`.
- **Catalog is the input, not embedded.** The router reads curated lists + thresholds (the shape the
  `benchmark-app` produces); it does not hardcode model names.
- **Hexagonal + factory**, same as `llm-adapters` — so the strategy (heuristic/classifier/external/
  ollama) swaps without touching callers.
- **Notify-only crons.** New models and promos are surfaced for human curation, never auto-promoted
  (see `CRON.md`).

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

- **`benchmark-app/`** produces the catalog this router consumes.
- **`llm-adapters`** calls the model this router picks.
- **SAAS-CHATBOT (Managed mode)** materializes the margin spread of ADR 014 via this router.
- See `CONTEXT.md` for the full scope philosophy and the "two halves" split.
