# Feature: widget-v0

**Layer:** 🔵 Core · **Status:** todo
**depends_on:** chat-sse *(hard)* · **ADRs:** 003

## Objective

An embeddable `<script>` + chat UI that talks to the SSE chat endpoint using a publishable key —
the first end-to-end proof of the loop working on a real page (closes milestone M1). Single hardcoded
domain for now.

## Scope

**In:**
- Embeddable script tag + minimal chat UI (open/close, message list, streaming render).
- Uses a `publishable` key (ADR 003), read-only chat scope.
- Connects to the `chat-sse` endpoint; renders streamed tokens.
- One hardcoded allowed domain (proof of concept).

**Out:**
- Domain-ownership proof, session tokens, abuse rate-limiting (→ `widget-security`).
- Theming/customization surface (later / portal).
- Multi-domain management (→ `widget-security` / `portal`).

## Done criterion

The script embedded on the hardcoded domain renders the widget and streams a grounded answer from a
tenant's docs end-to-end, using only a publishable key.
