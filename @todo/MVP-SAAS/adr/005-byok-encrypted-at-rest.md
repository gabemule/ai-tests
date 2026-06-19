# ADR 005 — BYOK keys encrypted at rest

**Status:** Accepted · 2026-06-14 (carried into MVP-SAAS 2026-06-17)
**Features:** `chat-sse` (bootstrap), `managed-mode` (later positioning)

## Context

In BYOK mode (an Enterprise add-on, see ADR 009) a tenant stores their own LLM provider key on the
platform. A leaked provider key is a direct financial and security liability for that tenant.

## Decision

BYOK provider keys are **encrypted at rest**. They are **never logged**, and never leave the platform
except as the credential on the outbound LLM call via `llm-adapters`. In BYOK the platform never bills
the tenant's LLM usage.

## Consequences

- **Encryption at rest ships with `chat-sse`.** BYOK is the technical bootstrap for chat (ADR 009:
  BYOK first, no wallet yet), so the BYOK key is stored from the very first bot — which means the
  at-rest crypto must exist in the core chat feature, not be deferred. The core feature implements a
  concrete mechanism (envelope encryption with a platform master key); **key rotation** and a
  managed-KMS upgrade are the only parts deferred.
- Because BYOK is Enterprise-only at GA (ADR 009), the blast radius is a small number of contracted
  accounts.

## Implementation contract (feature `chat-sse`)

- Encrypt the BYOK provider key **before** it touches the database (envelope encryption: a
  per-key data key wrapped by a platform master key held outside the row).
- The plaintext key only ever exists **in memory** for the outbound `llm-adapters` call; it is
  **never logged** and never returned by any API (write-only from the tenant's perspective).
- **Acceptance:** the stored `byok_llm_key` column is ciphertext (no plaintext at rest); logs never
  contain the key; and a decrypt path exists only on the chat request path.
