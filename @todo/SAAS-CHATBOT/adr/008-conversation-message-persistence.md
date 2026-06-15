# ADR 008 — Conversation/Message persisted from F1

**Status:** Accepted · 2026-06-14

## Context

Chat could be handled transiently (pass history in, throw it away). But several near-future needs —
chat history, per-message metering, and future ticketing/quality-metrics (`FUTURE/03`–`04`) — all
require a persisted conversation model. Retrofitting it later means a painful data-model migration.

## Decision

Persist chat as **`CONVERSATION` + `MESSAGE`** entities **from F1** (not just passed transiently).
`MESSAGE` carries `role`, `content`, and `tokens_in`/`tokens_out`; both entities carry `tenant_id`
(ADR 016).

## Consequences

- Gives history for the chat flow, the substrate for per-message metering (ADR 011; `PRICING/billing.md` §5),
  and the hook for future ticketing/quality-metrics without retrofitting.
- `CONVERSATION.status` (`open|closed`) is reserved now for future ticketing (`FUTURE/03`).
- Conversation history must be windowed before sending to the LLM (cost + context-limit control).

## Implementation contract (F1)

- Build each prompt from a **bounded window** of recent messages (by turn count or token budget).
- For long conversations, **summarize** the older turns into a running summary carried in place of
  the full transcript. The full history stays persisted (for ticketing/quality), but only the
  window + summary is sent to the model.
- **Acceptance:** a very long conversation still produces a prompt under the model's context budget,
  and the running summary preserves earlier context without replaying every message.

