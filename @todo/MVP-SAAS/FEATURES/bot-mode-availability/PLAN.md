# Feature: bot-mode-availability

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** agent-console *(hard)* · ticketing *(soft)* · **ADRs:** — *(new)*

## Objective

Let a tenant configure **who answers and when**: mode `off` / `ai` / `human` / `hybrid` (with
`ai_first` / `human_first` priority) plus a per-window **availability schedule**, with an **email
fallback** when a human is needed but none is online.

## Scope

**In:**
- Per-bot mode setting: `off` / `ai` / `human` / `hybrid` (+ `ai_first` / `human_first`).
- Availability schedule (time windows) governing when human handoff is offered.
- Email fallback when a human is required but unavailable.

**Out:**
- The handoff/console mechanics themselves (→ `agent-console`).
- Channel delivery (→ `channels`) — orthogonal.

## Note

Sibling to `quality-metrics`: both build on `agent-console`/`ticketing` but not on each other, so they
can land in either order once the lifecycle exists.

## Done criterion

A tenant can set a bot to `hybrid` with a business-hours schedule; outside hours or with no agent
online, the user gets an AI answer or an email-fallback path as configured.
