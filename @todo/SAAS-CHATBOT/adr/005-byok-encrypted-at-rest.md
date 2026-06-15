# ADR 005 — BYOK keys encrypted at rest

**Status:** Accepted · 2026-06-14

## Context

In BYOK mode (an Enterprise add-on, see ADR 009) a tenant stores their own LLM provider key on the
platform. A leaked provider key is a direct financial and security liability for that tenant.

## Decision

BYOK provider keys are **encrypted at rest**. They are **never logged**, and never leave the platform
except as the credential on the outbound LLM call via `llm-adapters`. In BYOK the platform never bills
the tenant's LLM usage.

## Consequences

- The concrete crypto mechanics (KMS vs. envelope encryption, key rotation) are a **deferred gap**
  resolved when the BYOK key endpoint is built (F2) — see `PLAN.md` → Known Gaps.
- Because BYOK is Enterprise-only (ADR 009), the blast radius is a small number of contracted
  accounts.
