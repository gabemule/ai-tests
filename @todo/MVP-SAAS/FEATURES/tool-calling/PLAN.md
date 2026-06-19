# Feature: tool-calling

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** chat-sse *(hard)* · guardrails *(soft)* · **ADRs:** 006
**Source:** `@todo/SAAS-CHATBOT/FUTURE/08-tool-calling.md`

## Objective

Register the customer's APIs as **tools** so the bot fetches **live, exact data** at answer time
(order tracking, product/stock, etc.) — moving from RAG-only to **RAG + actions**.

## Scope

**In:**
- Per-tenant tool registry: declare an API (schema, auth, endpoint) the LLM can call.
- Tool-call loop inside chat: model requests a tool → we execute → feed result back → answer.
- **Outbound egress guard** (SSRF/allowlist) — calling tenant-declared external endpoints needs
  a hardened boundary; ties into `guardrails`.

**Out:**
- Auto re-embed of static sources (→ `knowledge-sync`) — different concern (live vs. stored data).
- Generic workflow/automation builder — non-goal.

## Done criterion

A tenant registers an order-tracking API; a user asking "where is my order #123?" triggers a tool call
that returns live data, answered through the same chat pipeline, with egress restricted to the
allowlisted endpoint.
