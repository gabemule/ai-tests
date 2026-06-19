# Feature: api-keys

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** core-api *(hard)* · **ADRs:** 003

## Objective

Issue and manage API keys on two independent axes — environment (`sandbox`|`production`) × scope
(`secret`|`publishable`) — with rotation and revocation.

## Scope

**In:**
- Key model with both axes; secure generation + hashed storage.
- `secret` (server-side, full access) vs `publishable` (widget, read-only chat, domain-locked).
- `sandbox` (no billing, ephemeral) vs `production`.
- Rotation + revocation flows.

**Out:**
- Widget domain-ownership proof / session tokens (→ `widget-security`).
- Billing/metering tied to keys (→ revenue features).

## Done criterion

A publishable key cannot perform admin actions; a revoked key is rejected; a rotated key invalidates
the old secret; sandbox keys never touch billing/production data.
