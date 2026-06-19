# Feature: rbac

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** core-api *(hard)* · **ADRs:** 016

## Objective

Role-based access control inside an organization: owner / admin / editor / viewer, enforced on top of
the RLS tenant boundary, with room reserved for a future `agent` role.

## Scope

**In:**
- Roles: `owner`, `admin`, `editor`, `viewer`; membership on `MEMBER` (tenant-scoped).
- Authorization checks on API actions (who can manage bots/docs/keys/members).
- Forward-compatible enum (room for future `agent` role, FUTURE/02 agent-console).

**Out:**
- The agent console / human-handoff features themselves (backlog).
- API-key scopes (→ `api-keys`) — distinct axis from member roles.

## Done criterion

A `viewer` is denied write actions; an `admin` can manage bots/docs/keys; role checks compose with
RLS so a member never acts outside their tenant.
