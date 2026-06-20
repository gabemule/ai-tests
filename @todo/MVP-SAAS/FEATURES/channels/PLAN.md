# Feature: channels

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** chat-sse *(hard)* · **ADRs:** — *(new)*

## Objective

Deliver the RAG bot where the customer already is — official messaging channels, **WhatsApp first** —
so the same grounded answer engine reaches users outside the embeddable widget.

## Scope

**In:**
- A channel adapter boundary so the chat core stays transport-agnostic (widget vs. WhatsApp vs. others).
- WhatsApp delivery via **Meta Cloud API** (direct) or a **BSP** (Zenvia/Blip/Twilio/360dialog) — to be decided.
- Inbound → RAG answer → outbound, reusing the existing chat-sse pipeline and metering.

**Out:**
- Telephony / IVR (URA), voice — explicit non-goal.
- Visual flow builder, campaigns/broadcast (CRM territory) — non-goal.

## Open questions

- **Meta Cloud API (direct)** vs. **BSP**: cost, approval friction, dependency.
- Per-channel session/identity mapping to a conversation.

## Done criterion

A message sent to a connected WhatsApp number is answered by the bot with the same grounded RAG
response the widget would give, metered the same way.
