# Feature: ticketing

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** agent-console *(soft, co-evolves)* · **ADRs:** — *(new)*
**Source:** `@todo/SAAS-CHATBOT/FUTURE/03-ticketing.md`

## Objective

Give each conversation a **lightweight lifecycle** (open → closed) so we know if it was resolved, who
handled it, and keep the history — without becoming a heavy ITSM suite.

## Scope

**In:**
- Full lifecycle on top of the minimal states `agent-console` introduces: reopen, assignment, tags,
  close reason, audit trail.
- History per conversation/ticket; reuses existing Postgres tables (~$0 incremental infra).

**Out:**
- Heavy ITSM (complex configurable workflows, contract/asset management) — non-goal.
- SLA/CSAT/NPS aggregation → `quality-metrics`.

## Note on coupling (02 ↔ 03)

`agent-console` is born with minimal states (`queued`/`with_agent`/`closed`); this feature completes the
lifecycle that `quality-metrics` later derives from. They co-evolve — not a strict one-way dependency.

## Done criterion

A handed-off conversation can be assigned, tagged, closed with a reason, and reopened, with a complete
auditable history — all from light tables, no ITSM machinery.
