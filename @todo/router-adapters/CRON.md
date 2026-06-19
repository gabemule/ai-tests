# router-adapters — CRON ideas (notify-only)

> Ideas only — none of these auto-mutate the catalog. They **surface** signals for a human to act on.
> The catalog (`benchmark-app/db.json`) is curated by a person; crons just keep it from going stale.

## Guiding principle

**Notify, don't promote.** A cron may discover a cheaper or newer model, but it never edits tiers on
its own. It raises a flag; a human curates. Auto-promotion is deliberately deferred (see Future).

## Candidate jobs

### `scan-new` — surface new models
- **Trigger:** scheduled (e.g. daily/weekly).
- **Does:** runs the existing scan, diffs against `*_prev`, and lists models that are **NEW** to the
  OpenRouter/AA catalog.
- **Output:** a notification ("N new models since last scan") for human review — candidates that might
  deserve a tier.
- **Never:** assigns a tier automatically.

### `scan-promos` — alert margin opportunities
- **Trigger:** scheduled.
- **Does:** detects **price drops** (PROMO / Δ-price) on already-curated or candidate models.
- **Output:** an alert ("model X dropped to $Y/1M") — a margin opportunity worth re-curating toward.
- **Never:** swaps the curated model automatically.

### `health` — provider availability (optional)
- **Trigger:** scheduled / on-demand.
- **Does:** pings curated models' providers to confirm availability.
- **Output:** flags a curated model that's down, so the human knows `-alt` is carrying the category.
- **Note:** runtime `-alt` fallback is the router's job; this cron only reports persistent outages.

## Future exploration (not now)

- **Auto-promotion** — letting a cron move a model into a tier when it clears the floor *and* beats the
  current pick on price *and* passes health. Powerful but risky (a bad auto-pick degrades every answer);
  needs guardrails (canary %, rollback, score re-validation) before it's safe. Explicitly out of scope
  for the first pass.
