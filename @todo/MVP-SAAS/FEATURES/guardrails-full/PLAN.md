# Feature: guardrails-full

**Layer:** 🟠 Revenue · **Status:** todo
**depends_on:** guardrails-min *(hard)* · **ADRs:** 006

## Objective

The **full** prompt-security half: per-bot system-prompt scoping and hardening, layered on top of the
minimal injection/filtering slice (`guardrails-min`). Lands at recommended-queue step 11, before broad
external rollout.

> **Split from `guardrails-min`.** The minimal slice (injection resistance + I/O filtering) already
> shipped before the public widget (M2). This feature adds the per-bot configuration + hardening that a
> wide external rollout needs (M4). Conceptually governance; kept in the 🟠 layer.

## Scope

**In:**
- System-prompt scoping (the bot stays on its configured domain/role).
- Per-bot configuration of the guardrail behavior.
- Hardening of the injection/filtering rules beyond the minimal slice.

**Out:**
- The minimal injection/IO filter (→ `guardrails-min`, already shipped).
- Full content moderation via `moderation-adapters` (future / GA).
- Rate limiting (covered by `widget-security` / plan limits).

## Done criterion

Off-scope requests are handled per the bot's configured behavior; per-bot system-prompt scoping holds
under adversarial attempts; hardening measurably reduces successful injections vs the minimal slice.
