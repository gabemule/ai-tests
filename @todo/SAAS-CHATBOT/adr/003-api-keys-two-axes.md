# ADR 003 — API keys on two axes (environment × scope)

**Status:** Accepted · 2026-06-14

## Context

The product is consumed two ways: server-side (full trust) and from the public widget (untrusted,
runs in the visitor's browser). A single flat key type can't safely serve both, and there must be a
way to test without touching billing or production data.

## Decision

API keys carry **two independent axes**:

- **Environment:** `sandbox` (no billing, ephemeral) | `production`.
- **Scope:** `secret` (server-side, full access) | `publishable` (widget, read-only chat,
  domain-locked).

The "dev" idea = `sandbox` + `secret`.

## Consequences

- The widget only ever holds a `publishable` key → it can't perform admin actions even if copied.
- `publishable` keys still need a second barrier against impersonation — see ADR 004 (domain
  ownership proof), since a publishable key + script is, by design, public.
- Keys support rotation + revocation (F2).
