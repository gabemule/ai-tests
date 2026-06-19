# benchmark-app — PLAN

> **Note (relocated):** this is the original plan written when the app lived at
> `MVP-SAAS/PRICING/benchmark-app/`. The app now lives at `@todo/router-adapters/benchmark-app/` as the
> catalog/curation tool for the `router-adapters` library. Paths below are historical; the decisions
> still hold.

## Context

The pricing/quality benchmark today lives in `PRICING/get-model-benchmark/`: bash scripts
(`fetch-openrouter-prices.sh`, `fetch-model-scores.sh`, `merge.sh`) that write JSON + JS companions,
plus a static `index.html` dashboard read straight from `file://`. The "our models" set + tiers was a
hardcoded map, later extracted to `our-models.json` and made editable via a ★ + File System Access API.

That ★/FS-Access flow was too fiddly (picker, file:// can't write). We pivot to a small local app that
owns the whole flow: fetch (scan), persist, and edit — all writing to a single versioned `db.json`.

## Goals

- A local app at `MVP-SAAS/PRICING/benchmark-app/` that:
  - **Scans** live OpenRouter prices + Artificial Analysis scores on a button click (server-side).
  - Persists prices, scores, and the editable "our models" set into a single **versioned `db.json`** (lowdb).
  - Lets us **★ select** models as ours and pick each one's **tier via a select**, writing to `db.json` instantly.
  - Shows the same three views as today: **Prices · Scores · Benchmark** (the price×score cross).
- After validation, **delete `get-model-benchmark/`** (scripts + dashboard become obsolete).

## Scope

**In:**
- Vite (vanilla JS, no framework) frontend; CSS and JS in separate files (not inline in HTML).
- Node (plain `http`, no Express) backend + lowdb on `db.json`.
- Ported services: prices fetch, scores fetch, merge (slug-normalized cross).
- NEW/PROMO/score_delta diff kept, baseline stored as `prices_prev`/`scores_prev` inside `db.json`.
- AA key read from `.env` server-side only (never shipped to client).

**Out:**
- No external DB (no SQLite/CouchDB) — lowdb on a single JSON file is the store.
- No auth, no multi-user, no deploy. Local tool only.
- No snapshot history dir (the single `*_prev` baseline replaces the dated snapshots).

## Decisions

- **Store = lowdb on `db.json`** (versioned). One file is both the db and the git-tracked artifact.
- **Benchmark computed on-the-fly** (in `GET /api/data`) from prices×scores×ourModels, so it always
  reflects the current tiers without a re-scan.
- **`/api/scan` does not touch `ourModels`** — that set is ours alone; scan only refreshes prices/scores
  (moving current → `*_prev` first for the diff).
- **Tier edit via `<select>`** of known tiers (Barney approved selects for this; the earlier "no select"
  constraint applied to the old static dashboard only).
- Known tiers: anchor, anchor-alt, premium-expensive, principal, principal-alt, economy, economy-alt, reference.
- `ourModels.tiers` seeded 1:1 from the current `get-model-benchmark/our-models.json`.

## Layout

```
benchmark-app/
  package.json            # vite, lowdb, dotenv; scripts: dev (vite + server), server
  vite.config.js          # proxy /api → http://localhost:3001
  .gitignore              # node_modules, .env
  .env.example            # ARTIFICIAL_ANALYSIS_KEY=
  db.json                 # lowdb (versioned): ourModels, prices, scores, prices_prev, scores_prev, meta
  server/
    index.js              # http server: routes /api/data, /api/scan, /api/our-models
    db.js                 # lowdb setup + default schema
    services/
      normalize.js        # slug normalization + price helpers (shared)
      fetch-prices.js     # OpenRouter live prices (public API, no key)
      fetch-scores.js     # AA full catalog (key from .env)
      merge.js            # price × score cross → value_aa rows
  index.html              # markup only
  src/
    main.js               # bootstrap + state
    api.js                # endpoint client
    render.js             # Prices/Scores/Benchmark tables
    tiers.js              # known tiers + tier <select>
    styles.css            # ported CSS
  README.md
```

## API

- `GET  /api/data`        → `{ ourModels, prices, scores, benchmark, meta }` (benchmark on-the-fly)
- `POST /api/scan`        → fetch prices + scores, current→prev, write db, return fresh data
- `PUT  /api/our-models`  → write `ourModels` (★ selection + per-model tier) to db

## Phases

1. Context docs (PLAN/PROGRESS) — this.
2. Scaffold: package.json, vite.config, .gitignore, .env.example, db.js, server skeleton.
3. Services: normalize, fetch-prices, fetch-scores, merge (port jq logic to JS).
4. Server routes wiring + lowdb.
5. Frontend: index.html, styles.css, render, tiers, api, main.
6. Seed db.json with current tiers.
7. README.
8. Validate `npm run dev` → scan → ★ + tier → persistence.
9. Remove `get-model-benchmark/` after validation; ask about commit message.
