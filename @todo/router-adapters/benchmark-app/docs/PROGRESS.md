# benchmark-app — Progress

**Status:** Complete · now lives at `@todo/router-adapters/benchmark-app/` (curation tool for the router lib)

## Current Focus
App built, validated, and moved into `@todo/router-adapters/` as the catalog/curation tool.
Next step: none for the app itself — future work is the `router-adapters` library that consumes it
(see `../../PLAN.md`).
Blocker: none.

## Progress

### Docs
- [x] PLAN.md
- [x] PROGRESS.md

### Scaffold
- [x] package.json (vite, lowdb, dotenv; scripts dev/server)
- [x] vite.config.js (proxy /api → :3001)
- [x] .gitignore + .env.example
- [x] server/db.js (lowdb + default schema)

### Services (port from bash)
- [x] server/services/normalize.js
- [x] server/services/fetch-prices.js
- [x] server/services/fetch-scores.js
- [x] server/services/merge.js

### Server
- [x] server/index.js (routes: GET /api/data, POST /api/scan, PUT /api/our-models)

### Frontend
- [x] index.html (markup only)
- [x] src/styles.css
- [x] src/tiers.js
- [x] src/api.js
- [x] src/render.js
- [x] src/main.js

### Data + docs
- [x] db.json seeded with current tiers (migrated to new nomenclature: primary/economy/bench-*)
- [x] README.md

### Validate + cleanup
- [x] npm run dev → scan → ★ + tier → persistence
- [ ] Remove get-model-benchmark/ after validation (awaiting Barney's OK)


## Decisions Made During Execution
- 2026-06-17: Store = lowdb on a single versioned `db.json`. Benchmark computed on-the-fly in
  `GET /api/data` so tiers always reflect live edits without a re-scan.
- 2026-06-17: `/api/scan` refreshes only prices/scores (current → `*_prev` for the NEW/PROMO/delta
  diff); never touches `ourModels`.
- 2026-06-17: Tier editing uses a `<select>` of known tiers (selects OK for this app; old "no select"
  was about the static dashboard).
