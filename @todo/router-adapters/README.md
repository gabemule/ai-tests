# router-adapters

Reusable library that **decides which model handles each request**. The application hands the router a
category (`primary` / `economy`); the router returns the **cheapest available model that clears a
quality floor** — turning model selection from hardcoded code into curated data.

Part of the AI adapters ecosystem alongside `llm-adapters` and `embedding-adapters` (same Hexagonal
pattern). Promoted from `@todo/FUTURE.md` (was the #2 candidate library).

## Why

In SAAS-CHATBOT Managed mode the customer pays a fixed price anchored on the premium model, but most
queries don't need it. Routing the bulk to cheaper models that still clear a quality bar is the margin
spread (see `@todo/SAAS-CHATBOT/adr/014-model-routing-margin-lever.md`). This library is the **dynamic
evolution** of ADR 014's static routing percentages: models leave the code and become curated data.

## The two halves

1. **The router (this library)** — runtime. Given a category, resolves the model by policy.
2. **The catalog (`benchmark-app/`)** — the local curation tool that maintains the lists + thresholds
   the router consumes. It scans live OpenRouter prices + Artificial Analysis scores, flags NEW/PROMO
   models, and lets a human curate each tier. See `benchmark-app/README.md`.

The router **consumes**; the benchmark-app **produces**.

> ⚠️ **The `benchmark-app` is a prototype** — a local example of the catalog we want, not the final
> implementation. The target is a more robust app that **persists the catalog to Supabase alongside the
> SAAS-CHATBOT platform**, so the model list/prices/tiers are read **straight from the DB**. The current
> Vite + lowdb `db.json` is a curation sandbox that proves the data model.

## Usage (intended)

```typescript
const router = RouterProvider.create({ provider: 'heuristic' })

const choice = await router.route({
  category: 'primary',
  query: 'What are your business hours?',
  context: { /* optional hints */ },
})
// → { model: 'deepseek/deepseek-v4-flash', reason: 'cheapest above floor in economy' }
```

## Routing policy

Per product tier the catalog exposes curated candidates (`primary` / `primary-alt`,
`economy` / `economy-alt`), a **quality floor** (`bench-score-*`) and a **price ceiling**
(`bench-price-*`). Resolution: pick the **cheapest** candidate that clears the floor, stays under the
ceiling, and is currently available — fall back to `-alt` if the titular is down.

> The floor is mandatory: "cheapest" without a floor drifts to the weakest model.

## Strategies (adapters)

- **heuristic** — length/keyword/regex rules (cheap, local, deterministic).
- **classifier** — small LLM/embedding intent/complexity classifier (local).
- **external** — OpenRouter Auto / NotDiamond (API-based routing services).
- **ollama** — self-hosted open-source model as a zero-token-cost tier.

## Status

Planning. The **benchmark-app** (catalog/curation tool) is built and live; the router library itself is
not yet implemented. See `PLAN.md` for the build plan, `CONTEXT.md` for the knowledge base, and
`CRON.md` for the (notify-only) catalog-freshness ideas.

## Docs

- `CONTEXT.md` — knowledge base (scope philosophy, two halves, architecture, pitfalls).
- `PLAN.md` — build plan (contracts → resolver → strategies → parity).
- `CRON.md` — notify-only crons to keep the catalog fresh.
- `benchmark-app/` — the curation tool that produces the catalog.
