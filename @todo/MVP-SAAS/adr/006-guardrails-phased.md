# ADR 006 — Guardrails, phased

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `guardrails`

## Context

Prompt security and content safety are necessary before opening to real tenants, but a full
moderation stack is heavy and not needed to prove the loop.

## Decision

Phase guardrails:

1. **First:** system-prompt scoping + input/output filtering + prompt-injection patterns.
2. **Later:** integrate `moderation-adapters` (FUTURE) for content safety.

## Consequences

- The core loop and platform surface ship without heavy moderation; acceptable while the user base
  is internal/beta.
- Content moderation is tied to the future `moderation-adapters` library.
- Sequenced before opening to real external tenants (see `FEATURES/README.md` queue).
