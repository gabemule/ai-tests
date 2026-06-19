# Feature: chat-sse

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** retrieval *(hard)* · **ADRs:** 008, 009, 005, 011

## Objective

RAG chat over SSE: retrieve → build a windowed prompt → stream a grounded answer via `llm-adapters`,
with BYOK as the bootstrap key mode and persisted conversation history from day one.

## Scope

**In:**
- SSE chat endpoint: retrieve top-k (`retrieval`) → assemble prompt → stream tokens.
- `CONVERSATION` + `MESSAGE` persisted (role, content, `tokens_in`/`tokens_out`, `tenant_id`);
  `status` as a forward-compatible `open|closed` enum (ADR 008).
- Bounded prompt window + running summary for long conversations.
- **BYOK** provider key, **encrypted at rest** (envelope encryption), never logged, in-memory only
  on the outbound call (ADR 005).
- Token counts captured locally from `llm-adapters` (ADR 011) — substrate for later metering.

**Out:**
- Managed mode / wallet / routing (→ revenue features).
- Confidence gate, reranking (→ RAG quality features).
- Guardrails (→ `guardrails`).

## Done criterion

A grounded answer streams over SSE for a tenant's docs; the conversation is persisted with token
counts; the stored BYOK key is ciphertext at rest and never appears in logs; a very long conversation
still produces a prompt under the model's context budget.
