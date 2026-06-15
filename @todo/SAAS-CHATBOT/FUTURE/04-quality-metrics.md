# 04 — Quality metrics (SLA, CSAT, NPS, response time)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term. Last updated: 2026-06-14.

## Concept

Measure **how good the attendance is** — both bot and human. These metrics derive naturally from the
ticket lifecycle (`03-ticketing.md`): we already have the timestamps and state transitions, so the
metrics are mostly aggregation + a couple of post-conversation surveys.

Light and valuable — **not** the heavy SLA-policy engine of an ITSM.

## Metrics

- **Time-based (automatic, from the ticket):**
  - **First response time** — queued → first agent/bot reply.
  - **Resolution time** — open → resolved.
  - **Handle time** — with_agent → closed.
- **Satisfaction (post-conversation surveys):**
  - **CSAT** — "How satisfied were you?" (e.g. 1–5) right after close.
  - **NPS** — periodic "How likely are you to recommend?" (0–10).
- **SLA (light):** target thresholds (e.g. first response < X min) with **breach flags** —
  monitoring/alerting, **not** a configurable multi-policy SLA engine.

## Why it matters (strategic)

- Lets tenants **prove and improve** their support quality — a real reason to choose us over a bare
  chatbot tool.
- Closes another gap vs. incumbents (Zenvia/Movidesk/Tallos sell dashboards/CSAT) — cheaply, because
  the data already exists in the ticket lifecycle.
- Feeds product signals: low CSAT on bot answers → candidates for base/content improvement.

## Scope / limits

- ✅ Automatic time metrics, CSAT/NPS surveys, light SLA thresholds + breach flags, basic dashboard.
- ❌ Configurable SLA-policy engines, contract-bound SLAs, advanced BI/custom report builder
  (heavy ITSM/BI — non-goal).

## Open unknowns

- Survey delivery: in-channel (widget/WhatsApp) timing and response rates.
- How CSAT/NPS are attributed when both bot and human touched the ticket.
- Whether metrics are a paid/dashboard feature gate (likely Business/Enterprise) — `../PRICING/plans.md`.
- Benchmark/aggregate across tenants (anonymized) as a future product signal.
