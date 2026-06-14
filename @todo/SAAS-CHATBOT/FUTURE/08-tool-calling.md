# 08 — Tool calling (connect the bot to the customer's APIs)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term. Last updated: 2026-06-14.

## Concept

Let a customer register **their own APIs as tools** in the bot config, so the bot can fetch **live,
exact data** at answer time — product search, order tracking, stock availability, etc. The bot stops
being **RAG-only** and becomes **RAG + actions** (agent-lite): grounded answers from documents *plus*
real-time data from the customer's systems.

This is **function calling / tools** — already supported by our `llm-adapters` (function calling is a
first-class capability). The new part is a **per-bot tool registry** + a **safe executor**.

## Why embedding isn't enough here

Embeddings answer from a **static, semantic snapshot** — wrong for data that's **exact and
always-fresh** (an order status, a price, current stock). That's the boundary drawn in
`07-knowledge-sync.md`: **static/textual → embed; live/transactional/exact → tool/API (this file).**
"Where's my order #123?" can't be embedded — it must be **looked up live**.

## How it works

The customer registers a **tool** on the bot = an HTTP endpoint + an input/output **schema**
(ideally OpenAPI / JSON Schema) + auth (API key / header, **encrypted at rest**). At chat time:

```
user asks → "Where is my order #123?"
   → model decides it needs live data → emits a function call
       { tool: "trackOrder", args: { orderId: "123" } }
   → our API validates args against the tool schema
   → calls the customer's API (with stored auth, through the safe executor)
   → returns the result to the model
   → model composes the final answer with fresh, exact data
```

Same loop for `searchProducts`, `checkStock`, `getInvoice`, etc. The model only fills the args the
schema allows; **we** make the actual HTTP call (the customer's key never reaches the browser).

## Why it matters (strategic)

- **RAG + actions** is a real product jump — the bot answers *and* does useful lookups in the
  customer's systems, without the customer building a custom integration.
- **Reuses `llm-adapters` function calling** — the engine already does it; we add config + a safe
  executor, not a new AI core.
- **Deepens the moat** (`06-competitive-moat.md`) — the incumbents treat AI as a shallow add-on;
  configurable tool calling is exactly the "deep AI config" layer they don't offer.

## Security & guardrails (the hard part — design carefully)

Calling arbitrary customer-supplied URLs from our backend is risky. Minimum guardrails:

- **SSRF protection** — domain allowlist per tenant, block internal/private IP ranges, no redirects
  to internal hosts.
- **Timeouts + rate limits** — per tool / per tenant, so one slow/abusive API can't hang the chat.
- **Encrypted auth storage** — API keys/headers encrypted at rest (same posture as BYOK keys).
- **Schema-bounded args** — the model can only fill parameters the schema declares (no free-form
  injection into the URL/body).
- **Read-only first** — start with **GET/lookup** tools; defer write/mutating actions (that *charge*
  or *change* state) until there's a strong confirmation/approval design.
- **Observability** — log every tool call (args, status, latency) for debugging and abuse detection.

## Infra impact

Reuse-heavy (see `README.md` §5). A `tool` table per bot (endpoint, schema, encrypted auth) + a
**tool executor** in the API (outbound HTTP with the guardrails above). Cost: tool calls add **extra
tokens** (the call + the result go back through the model) and an **outbound round-trip latency** —
both bounded by timeouts/limits. No new always-on infra.

## Scope / limits

- ✅ Per-bot tool registry (endpoint + schema + encrypted auth), function-calling loop, safe
  executor, read-only lookups (product search, order tracking, stock).
- ✅ SSRF/timeout/rate-limit guardrails + tool-call logging.
- ❌ (initially) **Write/mutating actions** (place order, refund, change data) — needs an
  approval/confirmation design first; defer.
- ❌ A full no-code workflow/automation builder (that's suite territory — non-goal).

## Open unknowns

- Tool definition UX: paste an **OpenAPI spec** vs. a guided form per endpoint.
- How aggressively to let the model chain multiple tool calls (agent loop depth, cost ceiling).
- Auth variety: API key vs. OAuth vs. signed requests — how much to support at first.
- When (if) to allow **write** actions and what the human-confirmation gate looks like.
- Pricing gate: tool calling likely a Business/Enterprise feature — update `../PRICING.md` when mature.
