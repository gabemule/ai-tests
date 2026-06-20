# router-adapters

Reusable library that **decides which model handles each request**. The application hands the router a
category (`economy` / `principal` / `premium`); the router returns the **cheapest available model that
clears a quality floor** — turning model selection from hardcoded code into curated data.

Part of the AI adapters ecosystem alongside `llm-adapters` and `embedding-adapters` (same Hexagonal
pattern). Promoted from `@todo/FUTURE.md` (was the #2 candidate library).

## Why

In MVP-SAAS Managed mode the customer pays a price anchored on the premium model, but most
queries don't need it. Routing the bulk to cheaper models that still clear a quality bar is the margin
spread (see `@todo/MVP-SAAS/adr/014-model-routing-margin-lever.md`). This library is the **dynamic
evolution** of ADR 014's static routing percentages: models leave the code and become curated data.

## Generic library — consumes an external catalog

This is a **generic, product-agnostic** library (Port + adapters + resolver + telemetry), like its
siblings `llm-adapters` / `embedding-adapters`. It **does not own** any model list — it reads a
**catalog contract** (curated lists + thresholds) provided by the application.

For the MVP-SAAS product, that catalog is produced by **`@todo/MVP-SAAS/research-app/`** (the
curation tool: OpenRouter prices × Artificial Analysis scores), and the quality floor is
refined by **`@todo/MVP-SAAS/FEATURES/retrieval-eval/`** (our own RAG eval → `rag_score`). The router only
**consumes** the catalog; it never hosts or curates it.


## Usage (intended)

```typescript
const router = RouterProvider.create({ provider: 'heuristic' })

const choice = await router.route({
  category: 'economy',
  query: 'What are your business hours?',
  context: { /* optional retrieval/complexity signals */ },
})
// → { model: 'deepseek/deepseek-v4-flash', reason: 'cheapest above floor in economy' }
```

## Routing policy

Per product tier the catalog exposes curated candidates (`economy` / `economy-alt`,
`principal` / `principal-alt`, `premium` / `premium-alt`), a **quality floor** (`bench-score-*`) and a
**price ceiling** (`bench-price-*`). Resolution: pick the **cheapest** candidate that clears the floor,
stays under the ceiling, and is currently available — fall back to `-alt` if the titular is down.

> The floor is mandatory: "cheapest" without a floor drifts to the weakest model.

## Strategies (adapters)

- **heuristic** — length/keyword/regex rules (cheap, local, deterministic).
- **classifier** — small LLM/embedding intent/complexity classifier (local).
- **external** — OpenRouter Auto / NotDiamond (API-based routing services).
- **ollama** — self-hosted open-source model as a zero-token-cost tier.

## Telemetry (feeds the eval loop)

The router exposes a **`TelemetryPort`**: each `route()` emits a **trace** (decision) and, after the
model call, an **outcome** (tokens, cost, latency, confidence, cited-context, feedback). These traces
are consumed by `@todo/MVP-SAAS/FEATURES/retrieval-eval/` (online `rag_score`) and `research-app/` (real mix / real
blended cost) — closing the loop: the router's own decisions generate the evidence that improves the
catalog it reads.

## Status

Planning. The catalog/curation tool (`research-app`) is built and live at
`@todo/MVP-SAAS/research-app/`; the router library itself is not yet implemented. See
`PLAN.md` for the build plan and `CONTEXT.md` for the knowledge base.

## Docs

- `CONTEXT.md` — knowledge base (scope philosophy, catalog contract, architecture, pitfalls).
- `PLAN.md` — build plan (contracts → resolver → strategies → telemetry → parity).
- `@todo/MVP-SAAS/research-app/` — the curation tool that produces the catalog.
- `@todo/MVP-SAAS/FEATURES/retrieval-eval/` — the RAG eval that refines the quality floor.
