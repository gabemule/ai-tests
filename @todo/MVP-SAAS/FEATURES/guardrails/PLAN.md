# Feature: guardrails

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** chat-sse *(hard)* · **ADRs:** 006

## Objective

Prompt security and content safety before opening to real external tenants: system-prompt scoping,
input/output filtering, and prompt-injection resistance — with heavy content moderation deferred.

## Scope

**In:**
- System-prompt scoping (the bot stays on its configured domain/role).
- Input/output filtering + prompt-injection pattern resistance.
- Per-bot configuration of the guardrail behavior.

**Out:**
- Full content moderation via `moderation-adapters` (future / GA).
- Rate limiting (covered by `widget-security` / plan limits).

## Done criterion

A prompt-injection attempt that tries to break the system prompt is resisted; off-scope requests are
handled per the bot's configured behavior; the filtering applies to both input and output.
