# Feature: widget-security

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** widget-v0 *(hard)*, api-keys *(hard)* · **ADRs:** 004

## Objective

Harden the widget from a single-domain proof of concept into a safely public surface: domain-ownership
proof, short-lived session tokens, and abuse rate-limiting.

## Scope

**In:**
- **Origin/Referer** check against the tenant's domain allowlist.
- **Domain ownership proof** — DNS TXT or `/.well-known/<token>` — before a domain is trusted
  (portal flow: issue token → customer publishes → verify).
- **Short-lived signed session token** (JWT, minutes TTL) issued at chat start; subsequent messages
  carry the session token, not the raw publishable key.
- **Rate-limit** per publishable key / per session / per IP.

**Out:**
- The base widget UI (→ `widget-v0`).
- Plan-level quotas (→ revenue/governance).

## Done criterion

A stolen publishable key can't serve chat under a domain the attacker doesn't own; a stale/forged
session token is rejected; requests beyond the rate limit on one key are throttled.
