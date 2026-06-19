# BENCHMARK-PLAN — `get-model-benchmark/` (price × score)

> Plan + embedded progress for consolidating model **prices** and **quality scores** into one
> tool, so we choose the routing mix (anchor/principal/economy) from **evidence**, not hand-set
> snapshot numbers. Feeds `model-routing` (ADR 014) and the tiers in `models.md`.
> Last updated: 2026-06-17

---

## Why

`models.md` already *promises* "live per-1M-token prices **+ quality scores** live in the tooling"
and describes tiers by score (~97 anchor, 99–100 frontier) — but today the scraper only fetches
**price**; the quality numbers are our guess. This tool closes that gap: cross **price × score** to
pick tiers with data.

## Locked decisions

1. **Source: Artificial Analysis (AA) only.** Single quality scale = AA Intelligence Index (~0–100).
   Higher index = smarter; higher `value_aa` = more intelligence per dollar. (LMArena was dropped —
   see "Decisions during execution".)
2. **Umbrella folder `get-model-benchmark/`** with `prices/` and `scores/` subfolders.
3. **Single native scale, no normalization needed.** AA stays in its native Intelligence Index
   (~0–100). "Value" is `value_aa = aa_index / blended_per_1m` — one scale, one value column.
4. **Graceful degradation:** if a source fetch fails, its field is `null` — the merge does not break.
5. **Secret hygiene:** `get-model-benchmark/.env` holds `ARTIFICIAL_ANALYSIS_KEY`; it is git-ignored
   and the `.js` companions never embed the key (public data only).


## Target structure

```
PRICING/
  .env                              # ARTIFICIAL_ANALYSIS_API_KEY=... (exists)
  .gitignore                        # ignores .env
  get-model-benchmark/
    README.md                       # how to run, sources, JSON contracts
    run.sh                          # orchestrates: prices → scores → merge
    model-map.json                  # override-only: openrouter_id → aa_slug (empty by default)
    prices/
      fetch-openrouter-prices.sh    # the current script, moved here
      prices.json / prices.js
      snapshots/AAAA-MM-DD.json     # carries the existing 2026-06-14 snapshot
    scores/
      fetch-model-scores.sh         # AA (API), full catalog
      scores.json / scores.js
      snapshots/AAAA-MM-DD.json
    benchmark.json / benchmark.js   # merge output (price + AA score + value_aa)
    index.html                      # single dashboard reading the 3 .js
```


## Data contracts

**`scores.json`** — the full AA catalog (~540), keyed downstream by `slug`:
```
{ fetched_at, source:"artificialanalysis.ai", has_baseline,
  counts: { aa_total, aa_with_index },
  aa_catalog: [ { slug, name, creator, release_date,
                  index, coding, math, aa_price_blended,
                  score_delta, is_new } ] }       # delta vs previous snapshot (by slug)
```

**`benchmark.json`** — the cross (where the value is), sorted by `value_aa` desc:
```
{ id, aa_slug, tier, name,
  in_per_1m, out_per_1m, blended_per_1m,          # from prices
  aa_index, aa_coding, aa_math,                    # from scores (native AA Index ~0-100)
  value_aa: aa_index / blended_per_1m,             # "index per dollar"
  score_delta, is_new_price, is_promo }
```
One value column on a single scale = the **value frontier** for picking anchor/principal/economy.

## Sources (honest notes)

- **AA:** API with the key from `.env`. Single, clean quality source (~540 models, ~531 with index).
- **`model-map.json`:** override-only. The normalization rule auto-resolves ~all slugs; the map is
  empty by default and only carries manual `{openrouter_id → aa_slug}` fixups when AA renamed a model.


## Inherited mechanics

Dated snapshots + diff. Beyond price NEW/PROMO, **score up/down** becomes a signal (`score_delta`).

## Dashboard `index.html`

Reuses the current dark theme. Tabs:
- **Prices** — as today.
- **Scores** — full AA catalog (index + coding + math), with delta badges.
- **Benchmark** — the crossed table with the `value_aa` column, sortable; highlights our
  `project_models`.

## Docs to update (after the tool works)

- `models.md` — scores stop being hardcoded → "come from `get-model-benchmark/`".
- `REVALIDATION.md` — score re-fetch cadence; refs `get-model-prices/` → `get-model-benchmark/prices/`.
- `PRICING/README.md` — point to the new umbrella.
- `PROGRESS.md` (MVP-SAAS) — decision log line.
- All old `get-model-prices/` refs in the 4 `.md` → `get-model-benchmark/prices/` (sed).

---

## Progress

**Status:** 8/9 · Phase: tool built (AA-only), docs pending

### Build
- [x] Create `get-model-benchmark/` + move `prices/` (script + json/js + snapshots)
- [x] `model-map.json` — override-only (`openrouter_id → aa_slug`), empty by default
- [x] `scores/fetch-model-scores.sh` — full AA catalog via `.env` + snapshot diff
- [x] `merge.sh` → `benchmark.json` / `benchmark.js` (`value_aa`)
- [x] `index.html` — single dashboard (Prices · Scores · Benchmark)
- [x] `run.sh` — orchestrate prices → scores → merge
- [x] `PRICING/.gitignore` — ignore `.env`
- [x] `get-model-benchmark/README.md`

### Docs
- [ ] Update `models.md` + `REVALIDATION.md` + `PRICING/README.md` (refs + score = live)
- [ ] `PROGRESS.md` decision-log line

## Decisions during execution
- 2026-06-17: Plan approved (umbrella `get-model-benchmark/`).
- 2026-06-17: **Catalog × catalog cross.** Instead of a 16-model hand map, pull the *whole* catalogs
  (OpenRouter ~337 priced, AA ~540) and join by a normalized slug
  (`strip provider/ → lowercase → "." → "-"`). Result: **126 matched**, **15** of them our
  tier-tagged `project_models`. Only `claude-sonnet-4.5` (a project_model) has no AA entry → absent.
- 2026-06-17: **`model-map.json` demoted to override-only.** The rule resolves ~all slugs; the map is
  empty by default and only holds manual fixups when an AA slug drifts.
- 2026-06-17: **LMArena dropped — AA only.** No stable public API (always returned null), and a single
  native scale removes cross-scale ambiguity. `value` is now one column (`value_aa = idx / blended`).
- 2026-06-17: **Tier hierarchy questioned by real data.** With live numbers, anchor
  `claude-sonnet-4.6` (AA ~35.9, ~$9) sits *below* principal `qwen3.7-max` (~46, ~$2.5) and economy
  `deepseek-v4-pro` (~44.3, ~$0.65). Re-tiering is a separate decision for Barney — flagged, not acted on.
