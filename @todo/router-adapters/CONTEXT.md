# router-adapters — Project Knowledge Base

> Maintained by Cline for context recovery between sessions.
> Last updated: 2026-06-18

## Purpose

Reusable library that **decides which model handles each request**. Instead of hardcoding model
choices, the application hands the router a category (e.g. `primary` / `economy`) and the router
returns the **cheapest available model that clears a quality floor** — turning model selection from
code into data (curated lists + thresholds).

Promoted from `@todo/FUTURE.md` (was the #2 candidate adapter library). Sits on top of
`llm-adapters` as a governance / cost-optimization layer.

## Library Scope Philosophy

> **Guiding principle:** the library owns the *routing policy* (repeatable infra). The application
> owns *what each category means* and the curation of the lists (business rules).
>
> **The test:** "Would I rewrite this the same way in the next project?" → if yes, it belongs in the
> library; if it varies per project, it stays in the app/catalog.

| ✅ Belongs in the library (repeatable infra) | ❌ Stays in the app / catalog (business logic) |
|---|---|
| Cheapest-available-above-floor resolution | Which models are in `primary` / `economy` |
| Fallback to `-alt` when the titular is down | The quality floors / price ceilings themselves |
| Provider availability / health checks | Why a model was curated into a tier |
| Routing strategies (heuristic / classifier / external) | The per-message price the app charges |

## The two halves

This concept has **two distinct pieces** that must not be conflated:

1. **The router (this library)** — runtime. Given a category, resolves the model by policy.
2. **The catalog / curation tool (`benchmark-app/`)** — the local app that **maintains the lists and
   thresholds** the router consumes. It scans live OpenRouter prices + Artificial Analysis scores,
   flags NEW/PROMO models, and lets a human curate which models sit in each tier.

The router **consumes**; the benchmark-app **produces**. Crons (see `CRON.md`) keep the catalog
fresh by surfacing new models and promos for human curation.

> ⚠️ **The `benchmark-app` is a prototype**, not the final implementation. It's a local example of
> the catalog we want; the target is a more robust app that **persists the catalog to Supabase
> alongside the SAAS-CHATBOT platform**, so the model list/prices/tiers are read **straight from the
> DB** instead of a local `db.json`. The current Vite + lowdb stack is a curation sandbox that proves
> the data model.

## Source of truth for model prices & quality

`router-adapters` now **owns the model catalog** for the whole ecosystem — the list of models, their
per-token prices and quality scores. This lives in the `benchmark-app` catalog (`db.json`) +
`ANALYSIS/model-benchmark.md` (quality scores), moved here from `SAAS-CHATBOT/ANALYSIS/`. **Rule of
thumb:** the **list of models and prices lives here**; **business logic** (plans, margin/mix, billing,
infra cost) lives in **SAAS-CHATBOT/PRICING**. PRICING consumes our numbers; it doesn't maintain them.

## Routing model (the policy)

The catalog exposes, per product tier:

- **Curated candidates** — `primary` / `primary-alt` and `economy` / `economy-alt`.
- **Quality floor** — `bench-score-{primary,economy}` (the AA-index a model must clear).
- **Price ceiling** — `bench-price-{primary,economy}` (the blended $/1M a model must stay under).

> **Resolution:** for a given category, pick the **cheapest** candidate that (a) clears the quality
> floor, (b) is under the price ceiling, and (c) is currently available. Fall back to `-alt` if the
> titular is unavailable. This is the dynamic evolution of ADR 014's *static* routing percentages —
> models leave the code and become curated data.

## Relationship to the wider ecosystem

- **`llm-adapters`** — the router picks a model; `llm-adapters` actually calls it. The router is a
  thin decision layer above it.
- **SAAS-CHATBOT (Managed mode)** — the router materializes the margin spread described in
  `@todo/SAAS-CHATBOT/adr/014-model-routing-margin-lever.md`. Better router → bigger spread.
- **Sibling adapter libs** — `llm-adapters`, `embedding-adapters` (same Hexagonal pattern).

## Architecture (intended)

Hexagonal (Ports & Adapters), mirroring the sibling libs:

```
Application → RouterPort.route({ category, query, context })
                     │
            ┌────────┴────────┐
            ▼                 ▼
      Heuristic         Classifier        (+ External: OpenRouter Auto / NotDiamond)
      (rules)           (small LLM)        (+ Ollama as a zero-token-cost tier)
```

- **RouterPort** — `route(input) → { model, reason }`.
- **Strategies/adapters** — heuristic (rules), classifier (small LLM/embedding), external services.
- **Factory** — `RouterProvider.create({ provider })`.

## Current State

**Status:** Planning. The **benchmark-app** (curation tool) is built and live; the router library
itself is not yet implemented. See `PLAN.md` for the build plan and `benchmark-app/docs/` for the
catalog tool's own PLAN/PROGRESS.

## Known Pitfalls

- **"Cheapest" without a floor is a trap** — always gate on the quality floor, or the router drifts
  to the weakest model. The floor (`bench-score-*`) is mandatory, not optional.
- **Availability matters** — a curated model that's down must fall back to `-alt`, not error.
- **Catalog freshness** — stale prices/scores → wrong routing. Crons mitigate (see `CRON.md`).
