# ADR 004 — Widget security = two layers

**Status:** Accepted · 2026-06-14

## Context

Anyone can copy a tenant's `<script>` tag and publishable key from page source. An `Origin`/`Referer`
check alone is forgeable outside a browser, so on its own the domain allowlist is decorative.

## Decision

Require **two barriers** before serving the widget chat:

1. **`Origin`/`Referer`** checked against the tenant's domain allowlist (weak alone).
2. **Domain ownership proof** — a DNS TXT record or a `/.well-known/<token>` file (Google Search
   Console style) — before a domain is trusted on the allowlist.

## Consequences

- A stolen publishable key can't be used to serve chat under a domain the attacker doesn't own.
- Ownership verification is a flow in the portal (F2): issue token → customer publishes it → verify.
- Runtime hardening to consider: issue a **short-lived widget session token** at chat start rather
  than relying on the long-lived publishable key for every request.

## Implementation contract (F2)

- On chat start (after the Origin + ownership checks pass) issue a **short-lived signed session
  token** (JWT, minutes-long TTL) scoped to that bot/origin; every subsequent message carries the
  session token, **not** the raw publishable key.
- **Rate-limit per publishable key / per session / per IP** so a leaked key can't be abused at
  volume (ties into F3 rate limiting).
- **Acceptance:** a stale/forged session token is rejected, and requests beyond the rate limit on
  one key are throttled.

