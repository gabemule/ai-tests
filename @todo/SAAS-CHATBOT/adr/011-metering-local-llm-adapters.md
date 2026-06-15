# ADR 011 — Metering is local in `llm-adapters` (source of truth)

**Status:** Accepted · 2026-06-14

## Context

Managed billing (ADR 009) needs a meter that is immediate (to enforce a real-time hard cap) and
uniform across providers. Provider usage APIs are delayed and provider-specific, so they can't be the
primary meter.

## Decision

**Local metering in `llm-adapters` is the source of truth.** Every request counts input/output tokens
from the provider response and writes `usage` per tenant/bot/message — **immediate** (enables
real-time hard cap) and **uniform** (same code across all providers, Managed or BYOK).

A **per-tenant provider sub-key** (where supported, e.g. OpenAI Projects) is a **secondary** layer
only: blast-radius isolation + monthly reconciliation against the provider invoice. Not the meter.

## Consequences

- Elevates `llm-adapters` from "a wrapper" to the platform's **governance/metering point**.
- Enables the wallet hard cap to block the *next* request the instant balance/cap is reached
  (`PRICING.md` §4.1 / §5).
