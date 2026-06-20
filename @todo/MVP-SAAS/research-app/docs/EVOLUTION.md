# models-app — EVOLUTION (from price consultant to pricing oracle)

> Plan for evolving the app from a **price × score consultant** into a **pricing oracle**: it should
> not only show prices and scores, but **produce evidence** to choose the best cost×benefit models
> and **feed pricing studies**.
> Relocated to `MVP-SAAS/research-app/`.
> Last updated: 2026-06-19

## Context

Today the app (ex-`benchmark-app`) does three things well: scan OpenRouter prices, scan Artificial
Analysis scores, and let a human curate which models sit in each tier (`db.json`). It computes
`value_aa = aa_index / blended $/1M` on the fly.

What it is **missing** to be an oracle:

1. A **RAG-aware cost model** (today's `avg = (in+out)/2` overstates RAG cost).
2. **Three tiers** (`economy`/`principal`/`premium`) instead of two.
3. A **pricing study** output (blended cost, margin by mix, plan simulation).
4. **Telemetry ingestion** — real routing traces to validate the mix and the real blended cost.
5. A hook for **our own `rag_score`** (from `../../BENCHMARK/` — *planned, not yet in the workspace*) to replace the coding-focused AA floor.

## Goals

- Evolve `db.json` + services so the app produces **pricing evidence**, not just a lookup table.
- Keep the **producer/consumer split**: this app produces the curated catalog; `router-adapters`
  consumes it; `PRICING/` consumes the evidence.
- Stay a **prototype on the path to Supabase** — the data model here is what the DB will mirror.

## 1. Three tiers + premium-equivalent search

Replace the 2-tier set (`primary`/`economy`) with **three**: `economy` / `principal` / `premium`,
plus `-alt` fallbacks and the `bench-score-*` / `bench-price-*` thresholds per tier.

- `bench-score-premium` is **anchored on a real premium model's score**; the resolver (in
  `router-adapters`) then picks the **cheapest model that clears that floor** → premium-equivalent
  quality at a fraction of the price.
- `tiers.js` known tiers updated to the 3-tier nomenclature.

## 2. RAG-aware cost model

Add a weighted, cache-aware blended cost alongside the existing symmetric `avg_per_1m`:

```
blended_per_1M = w_in · in_per_1M · (1 − cache_fraction · cache_discount) + w_out · out_per_1M
```

- New `db.json` block `pricing.weights`: `{ w_in, w_out, cache_fraction, cache_discount }`.
- `merge.js` emits both `avg_per_1m` (unchanged) and `blended_per_1m` (new) per row.
- `value_aa` gains a sibling `value_blended = score / blended_per_1m`.

> Rationale: in RAG the input (system prompt + chunks) dominates and is largely cacheable; the
> symmetric average misprices it. See `../analise-modelos-rag-pricing.pdf` §4.

## 3. Pricing study (the oracle output)

New report (endpoint `GET /api/pricing-study` + a tab) that crosses **curated tiers × prices × mix**:

- Input: `pricing.mix` (e.g. `{ principal: 0.80, economy: 0.15, premium: 0.05 }`, matching
  `../../PRICING/models.md` / ADR 014) from `db.json`.
- Output: **blended cost / 1M** (weighted by mix), the **price / 1M** we charge (billing unit is an
  open decision — `fixed-per-message` vs `metered-per-token`, `../../PRICING/`), and
  **margin = (price − blended_cost) / price**.
- Simulation: vary the mix and see margin move — evidence for `PRICING/` decisions.

> The **mix and the charged price are business data** owned by `../../PRICING/`. The app reads them
> as parameters and computes the study; it does not decide them.

## 4. Telemetry ingestion (real evidence)

`router-adapters` emits a **trace** per `route()` and an **outcome** per model call (see its
`TelemetryPort`). The app ingests them to validate assumptions:

```
trace   { reqId, tier, signals, model, reason, ts }
outcome { reqId, tokens_in, tokens_out, cached, latency_ms, cost_real,
          confidence, cited_context, feedback }
```

- New `db.json` block `traces[]` (later a Supabase `routing_traces` table).
- Derived metrics: **real mix** (vs. the assumed 80/15/5), **real blended cost/1M** (vs. modeled),
  and an **online `rag_score`** per model (% cited context, mean confidence, 👍/👎).

## 5. Hook for our own `rag_score`

`../../BENCHMARK/` (*planned, not yet in the workspace*) produces a `rag_score` per model (offline
eval + online traces). The floor logic uses `rag_score` when present, falling back to the external AA
index otherwise:

- New `db.json` block `rag_scores` (model id → score, source: offline|online, updated_at).
- `quality.js` / floor logic prefers `rag_score` over `aa_index` for `bench-score-*` gating.

## 6. Data model (new `db.json` blocks)

```jsonc
{
  "ourModels": { "tiers": { /* economy/principal/premium + -alt + bench-* */ } },
  "prices":  { /* unchanged */ },
  "scores":  { /* unchanged: external AA-style */ },
  "pricing": {
    "weights": { "w_in": 0.85, "w_out": 0.15, "cache_fraction": 0.7, "cache_discount": 0.9 },
    "mix":     { "principal": 0.80, "economy": 0.15, "premium": 0.05 },
    "price_per_1m": 0.0 /* charge from PRICING; billing unit open: fixed-per-message vs metered-per-token */
  },
  "rag_scores": { /* model id → { score, source, updated_at } (from BENCHMARK) */ },
  "traces": [ /* routing traces+outcomes (from router-adapters telemetry) */ ],
  "meta": { /* unchanged */ }
}
```

## Phases

1. **Cost model** — `pricing.weights` + `blended_per_1m` in `merge.js` + `value_blended`. → verify: a row shows both avg and blended.
2. **Three tiers** — update `tiers.js` + seed `db.json` to economy/principal/premium. → verify: tier select offers 3 tiers.
3. **Pricing study** — `pricing.mix` + `/api/pricing-study` + tab. → verify: blended cost + margin render from the mix.
4. **Telemetry ingestion** — `traces[]` + a POST to accept traces + real-mix/real-cost derivations. → verify: posting traces updates real mix.
5. **rag_score hook** — `rag_scores` block + floor prefers it. → verify: a model with a rag_score gates on it, not the AA index.

## Out of scope

- The router resolver itself (lives in `router-adapters`).
- The eval harness (lives in `../../BENCHMARK/`); this app only **ingests** its `rag_score` output.
- The Supabase migration (target state; this prototype proves the data model first).
