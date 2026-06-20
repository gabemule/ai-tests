# router-adapters — Project Knowledge Base

> Maintained by Cline for context recovery between sessions.
> Last updated: 2026-06-18

## Purpose

Reusable library that **decides which model handles each request**. Instead of hardcoding model
choices, the application hands the router a category (e.g. `economy` / `principal` / `premium`) and the
router returns the **cheapest available model that clears a quality floor** — turning model selection
from code into data (curated lists + thresholds).

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
| Cheapest-available-above-floor resolution | Which models are in `economy` / `principal` / `premium` |
| Fallback to `-alt` when the titular is down | The quality floors / price ceilings themselves |
| Provider availability / health checks | Why a model was curated into a tier |
| Routing strategies (heuristic / classifier / external) | The per-message price the app charges |

## Generic library — consumes an external catalog

This library is **generic and product-agnostic**. It does **not** own any model list. It consumes a
**catalog contract** (curated lists + thresholds) produced by the application:

- **`@todo/MVP-SAAS/research-app/`** — the producer: the curation tool scans live
  OpenRouter prices + Artificial Analysis scores, flags NEW/PROMO models, and lets a human curate
  which models sit in each tier (`db.json`). A manual **Scan** (re-run periodically) keeps it fresh.
- **`@todo/MVP-SAAS/FEATURES/retrieval-eval/`** — refines the quality floor with our own RAG eval (`rag_score`).

The router **consumes**; research-app **produces**; retrieval-eval **validates**.

> ⚠️ The catalog tool (`research-app`) is a **prototype** (Vite + lowdb `db.json`); the target is a
> Supabase-backed catalog read straight from the DB. See `research-app/README.md`.

## Source of truth for model prices & quality

The **list of models, per-token prices and quality scores lives in `@todo/MVP-SAAS/research-app/`**
(the curated `db.json`), not in this library. **Rule of thumb:** model list +
prices + scores → **research-app**; the quality floor evidence (`rag_score`) → **retrieval-eval**; business logic
(plans, margin/mix, billing, infra cost) → **MVP-SAAS/PRICING**. This library consumes all three;
it maintains none of them.

## Routing model (the policy)

The catalog exposes, per product tier (`economy` / `principal` / `premium`):

- **Curated candidates** — titular + `-alt` (e.g. `principal` / `principal-alt`).
- **Quality floor** — `bench-score-*` (the score a model must clear — `rag_score` when available from
  `retrieval-eval`, AA-index otherwise).
- **Price ceiling** — `bench-price-*` (the blended $/1M a model must stay under).

> **Resolution:** for a given category, pick the **cheapest** candidate that (a) clears the quality
> floor, (b) is under the price ceiling, and (c) is currently available. Fall back to `-alt` if the
> titular is unavailable. This is the dynamic evolution of ADR 014's *static* routing percentages —
> models leave the code and become curated data.

## Relationship to the wider ecosystem

- **`llm-adapters`** — the router picks a model; `llm-adapters` actually calls it. The router is a
  thin decision layer above it.
- **MVP-SAAS (Managed mode)** — the router materializes the margin spread described in
  `@todo/MVP-SAAS/adr/014-model-routing-margin-lever.md`. Better router → bigger spread.
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
- **TelemetryPort** — emits a **trace** per `route()` and an **outcome** per model call (tokens, cost,
  latency, confidence, cited-context, feedback). Consumed by `retrieval-eval` (online `rag_score`) and
  `research-app/` (real mix / real blended cost) — the router's decisions become the evidence loop.

## Current State

**Status:** Planning. The catalog/curation tool (`research-app`) is built and live at
`@todo/MVP-SAAS/research-app/`; the router library itself is not yet implemented. See
`PLAN.md` for the build plan and `research-app/docs/` for the catalog tool's own PLAN/PROGRESS.

## Known Pitfalls

- **"Cheapest" without a floor is a trap** — always gate on the quality floor, or the router drifts
  to the weakest model. The floor (`bench-score-*`) is mandatory, not optional.
- **Availability matters** — a curated model that's down must fall back to `-alt`, not error.
- **Catalog freshness** — stale prices/scores → wrong routing. A periodic re-**Scan** mitigates.
- **AA-index ≠ RAG fidelity** — the external index is coding/agentic-focused; prefer `retrieval-eval`'s
  `rag_score` for the floor when it exists.
