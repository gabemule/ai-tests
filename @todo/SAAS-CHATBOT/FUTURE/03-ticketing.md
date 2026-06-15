# 03 — Lightweight ticket lifecycle

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term. Last updated: 2026-06-14.

## Concept

Once we have human attendance (`02-agent-console.md`), each conversation needs a **lifecycle** so we
know whether it was resolved, **who handled it**, and can keep the **history**. A **conversation is a
ticket**. This is the lightweight backbone that the Agent Console consumes and the quality metrics
(`04-quality-metrics.md`) derive from.

Deliberately **light** — enough to track and audit attendance, **not** a configurable ITSM engine.

## Lifecycle (states)

```
open → bot → queued → with_agent → resolved → closed
                ↑__________________________________|
                          reopened (customer replies after close)
```

- **open / bot** — conversation active, handled by the bot.
- **queued** — escalated, waiting for an available agent.
- **with_agent** — claimed/assigned to a specific agent.
- **resolved** — agent marked it solved (awaiting confirmation / auto-close timer).
- **closed** — finished.
- **reopened** — customer replies after close → reopen or spawn a follow-up.

## What we track (per ticket)

- **Assignment:** which agent claimed it (`assigned_agent`), when claimed, when closed.
- **History/audit:** full transcript (bot + human), timestamps, **close reason**, simple tags/category.
- **Origin:** channel (widget / WhatsApp), tenant, bot.
- **Links:** to the metrics events (first response, resolution) in `04-quality-metrics.md`.

## Why it matters (strategic)

- Without it, human attendance is blind — we couldn't say if a case was solved or who owns it.
- It's the **data source** for SLA/CSAT/NPS (`04`) and for the unified history the agent sees (`02`).
- Cheap to build relative to its value; derives naturally from the handoff flow.

## Scope / limits

- ✅ Lifecycle states, assignment, transcript/history, close reason, simple tags, reopen.
- ❌ Configurable multi-step workflows, SLA-policy engines, contract/asset management, automations
  (that's heavy ITSM — non-goal).

## Infra impact

**~$0 new infra** (see `README.md` §5). Tickets are just rows in the Supabase/Postgres we already
pay for; no new service. The cost here is **build effort**, not servers.

## Open unknowns

- Auto-close policy (timeout after `resolved` with no reply?).
- Tagging taxonomy: free tags vs. tenant-defined categories.
- Retention/export of ticket history (compliance, LGPD) — tie to storage in `../PRICING/infrastructure.md`.
- Whether tickets are exposed via API for tenants who want to sync to their own systems.
