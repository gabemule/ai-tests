# 01 — Channel-first delivery (WhatsApp & co)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟢 Short term. Last updated: 2026-06-14.

## Concept

Deliver the RAG bot **where the customer already is** — primarily **WhatsApp**, then other
channels (Telegram, Instagram/Messenger, SMS/RCS). The same bot that powers the web widget answers
on any channel through one normalized interface.

This is "RAG-on-docs **on the customer's channel**": the vector that gets us closest to the BR
atendimento niche **without** becoming a support suite.

## Why it matters (strategic)

- **WhatsApp is the dominant BR channel** — the single biggest reach lever locally.
- Channels are exactly where the incumbents' high ticket lives (being a WhatsApp BSP is core to
  Zenvia/Blip). Connecting to them harvests that reach **without** inheriting the BSP/operational
  cost.
- Lowest deviation from our RAG core — it's a transport/delivery layer, not a new product.

## Enabler

The **`channel-adapters`** library (see root `../../FUTURE.md`) — abstracts send/receive across
channels behind one interface, same Hexagonal pattern as `llm-adapters` / `embedding-adapters`.

## Scope / limits

- ✅ WhatsApp via **Meta Cloud API (direct)**, Telegram, normalized web widget.
- ✅ Inbound message → RAG answer → outbound reply, per tenant/bot.
- ⏭️ Instagram/Messenger, SMS/RCS — later.
- ❌ **Becoming a BSP** ourselves — explicitly out. We use the **Meta Cloud API directly**; being a
  Business Solution Provider is a heavy commercial/compliance relationship, a "scale-someday"
  marker, not roadmap (see `06-competitive-moat.md`). (BSP was only ever a curiosity, not a target.)
- ❌ Not a campaign/broadcast marketing tool (that's a CRM non-goal).

## Open unknowns

- **WhatsApp 24h customer-service window** + template-message rules — affects how/when the bot (and
  later a human agent, see `02-agent-console.md`) can reply.

- Per-tenant WhatsApp number provisioning & onboarding friction.
- Pricing: is channel delivery a paid add-on or bundled into higher tiers? (update `../PRICING/plans.md`).
