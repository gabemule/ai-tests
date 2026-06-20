# Feature: guardrails-min

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** chat-sse *(hard)* · **ADRs:** 006

## Objective

The **minimal** safety slice that must ship **before the public widget**: prompt-injection resistance
and input/output filtering. An embeddable LLM surface is a live injection/abuse target the moment it's
exposed, so this lands at recommended-queue step 2 (milestone M2), before any external user touches it.

> **Split from `guardrails-full`.** This is the cheap, must-have-before-public half. Per-bot
> system-prompt scoping + hardening lands later as `guardrails-full` (step 11), before broad rollout.
> Conceptually governance; kept in the 🟠 layer (no separate Governance layer defined).

## Scope

**In:**
- Input/output filtering (block obvious unsafe in/out).
- Prompt-injection pattern resistance (resist attempts to override the system prompt).

**Out:**
- Per-bot system-prompt scoping/configuration + hardening (→ `guardrails-full`).
- Full content moderation via `moderation-adapters` (future / GA).
- Rate limiting (covered by `widget-security` / plan limits).

## Done criterion

A prompt-injection attempt that tries to break the system prompt is resisted; the filtering applies to
both input and output. Ships before the widget is publicly embeddable.
