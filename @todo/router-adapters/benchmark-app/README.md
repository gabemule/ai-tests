# benchmark-app

> ⚠️ **Prototype / proof-of-concept.** This is a **local example of where we want to get to**, not the
> final implementation. The target is a more robust application that **persists the catalog to Supabase
> alongside the rest of the SAAS-CHATBOT platform** — so the model list, prices and tiers can be read
> **directly from the DB** (instead of a local `db.json`). Treat the current Vite + lowdb stack as a
> throwaway curation sandbox that proves the data model; the production version lives in the DB.

Local **catalog / curation tool** for `router-adapters`: track model **pricing** (OpenRouter) ×
**quality** (Artificial Analysis), curate our model set + tiers, and keep it all in a single
**versioned `db.json`**. This is the **producer** half — it maintains the curated lists + thresholds
that the router (the consumer) resolves against at runtime. See `../README.md` and `../CONTEXT.md`.

Replaces the old `get-model-benchmark/` (bash scripts + static `file://` dashboard).

## Stack

- **Vite** (vanilla JS) frontend — port `5173`.
- **Node** plain `http` server (no Express) + **lowdb** on `db.json` — port `3001`.
- Vite dev-proxies `/api` → `http://localhost:3001`.

## Setup

```bash
npm install
cp .env.example .env   # then put your Artificial Analysis key in it
npm run dev            # runs server + vite together (concurrently)
```

Open http://localhost:5173.

`.env`:

```
ARTIFICIAL_ANALYSIS_KEY=your-key-here
```

The key is read **server-side only** (never shipped to the client).

## How it works

- **Scan** (header button) → server fetches live OpenRouter prices + the full AA score catalog,
  moves the current data to `*_prev` (for the NEW/PROMO/Δ-score diff), and writes `db.json`.
- **Benchmark** is computed on every read (`GET /api/data`) by crossing prices × scores by normalized
  slug — so it always reflects the current tiers without a re-scan.
- **★ select** a model (Prices tab) → adds it to our set with the default tier (`primary`).
- **Tier `<select>`** (Benchmark tab) → set/clear each model's project tier; blank = remove from ours.
  Every edit `PUT`s to the server and persists to `db.json` instantly.

### Project tiers (curated lists the router consumes)

Two product tiers (`primary` / `economy`) across three axes, used by `router-adapters` to resolve the
cheapest-available-above-floor model:

- **`primary` / `primary-alt`**, **`economy` / `economy-alt`** — the curated candidates (titular + fallback).
- **`bench-score-primary` / `bench-score-economy`** — the quality floor (AA-index a model must clear).
- **`bench-price-primary` / `bench-price-economy`** — the price ceiling (blended $/1M a model must stay under).

### Quality tier (dynamic)

Models are categorized by a **quality tier** derived from the AA Intelligence Index. The catalog's
**top index** is split into 4 equal bands (`max/4`): `flagship` (≥75% of max), `strong` (≥50%),
`mid` (≥25%), `basic` (<25%). The cuts re-compute on each read and scale with the frontier, so they
adapt as a stronger model raises the ceiling. Price is shown as a plain column (no fixed price cuts).

This is distinct from our **project tier** (`primary`/`economy`/`bench-*`), which is our manual tag.

## Data model (`db.json`)

```jsonc
{
  "ourModels": { "tiers": { "anthropic/claude-...": "bench-score-primary", ... } },
  "prices": { /* last scan: project_models, all_models, newest, embeddings_all */ },
  "scores": { /* last scan: aa_catalog */ },
  "prices_prev": { /* previous scan, for NEW/PROMO diff */ },
  "scores_prev": { /* previous scan, for score_delta */ },
  "meta": { "last_scan": "...", "quality": { "q25": .., "q50": .., "q75": .. } }
}
```

`db.json` **is** the store and the git-tracked artifact — commit it to version the data.

## API

| Method | Route              | Purpose                                                        |
| ------ | ------------------ | -------------------------------------------------------------- |
| GET    | `/api/data`        | `{ ourModels, prices, scores, benchmark, meta }` (benchmark live) |
| POST   | `/api/scan`        | refresh prices + scores (current→prev), write db, return data  |
| PUT    | `/api/our-models`  | write `{ tiers }` (★ + tier edits), return fresh data          |

## Layout

```
server/
  index.js              http routes + lowdb writes
  db.js                 lowdb setup + default schema
  services/
    normalize.js        slug + price helpers
    fetch-prices.js     OpenRouter live prices
    fetch-scores.js     AA catalog (key from .env)
    quality.js          dynamic AA-index quality bands (max/4)
    merge.js            price × score cross → value_aa rows
src/
  main.js               bootstrap + state + events
  api.js                endpoint client
  render.js             Prices/Scores/Benchmark tables
  tiers.js              project tiers + tier <select>
  styles.css            dark theme
index.html              markup only
db.json                 the store (versioned)
```
