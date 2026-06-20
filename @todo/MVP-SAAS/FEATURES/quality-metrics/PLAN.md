# Feature: quality-metrics

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** ticketing *(hard)* · **ADRs:** — *(new)*

## Objective

Derive operational quality metrics — **SLA, CSAT, NPS, response/resolution time** — from the ticket
lifecycle, so tenants can measure their support quality.

## Scope

**In:**
- Aggregations over the ticket lifecycle: first-response time, resolution time, SLA compliance.
- CSAT / NPS capture (post-conversation survey) and reporting.
- Dashboards (Vercel) over the same tables — ~$0 incremental infra.

**Out:**
- The ticket lifecycle itself (→ `ticketing`).
- Bot mode / availability scheduling (→ `bot-mode-availability`) — sibling, not a dependency.

## Done criterion

A tenant can see SLA compliance, average response/resolution time, and CSAT/NPS for a period, computed
from real ticket data.
