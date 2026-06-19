# Feature: portal

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** core-api *(hard)*, rbac *(soft)*, api-keys *(soft)* · **ADRs:** —

## Objective

Next.js admin UI: the human surface for managing organizations, bots, documents, API keys, domains,
and basic usage dashboards. Unifies the TS stack with the API and widget.

## Scope

**In:**
- Auth + org/bot management.
- Document upload + ingestion status surface (`pending|processing|ready|failed`).
- API-key management UI (issue/rotate/revoke) — consumes `api-keys`.
- Domain management + ownership-verification flow — consumes `widget-security`.
- Basic usage dashboards.
- Role-aware UI — consumes `rbac` (soft: usable single-role before full RBAC).

**Out:**
- Billing/wallet UI (→ revenue features).
- Agent console / ticketing UIs (backlog).

## Done criterion

An admin can, end-to-end in the portal: create a bot, upload a doc and watch it reach `ready`, issue a
publishable key, verify a domain, and embed the widget — without touching the API directly.
