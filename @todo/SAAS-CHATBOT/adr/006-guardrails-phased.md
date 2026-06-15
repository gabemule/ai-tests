# ADR 006 — Guardrails, phased

**Status:** Accepted · 2026-06-14

## Context

Prompt security and content safety are necessary before opening to real tenants, but a full
moderation stack is heavy and not needed to prove the loop.

## Decision

Phase guardrails:

1. **First (F3):** system-prompt scoping + input/output filtering + prompt-injection patterns.
2. **Later (F4):** integrate `moderation-adapters` (FUTURE) for content safety.

## Consequences

- F1/F2 ship without heavy moderation; acceptable while the user base is internal/beta.
- Content moderation is a GA item tied to the `moderation-adapters` library.
