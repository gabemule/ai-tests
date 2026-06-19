# Feature: agent-console

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** chat-sse *(hard)* · rbac *(soft, future `agent` role)* · **ADRs:** — *(new)*
**Source:** `@todo/SAAS-CHATBOT/FUTURE/02-agent-console.md`

## Objective

Escalate a conversation to a human when needed *and available*, in a console where the agent works the
live chat with an **Agent Copilot** that reuses our RAG core to search the base and draft replies.

## Scope

**In:**
- Human handoff flow: bot → queue → human agent, with presence (who's online).
- Agent console UI: live conversation, history, take/release.
- **Agent Copilot**: same embeddings + LLM reused to suggest grounded replies to the human.
- Minimal ticket states introduced here (`queued` / `with_agent` / `closed`) — full lifecycle in `ticketing`.
- Real-time transport on **Supabase Realtime** (no new always-on service).

**Out:**
- Full ticket lifecycle (reopen, tags, audit) → `ticketing`.
- Quality metrics → `quality-metrics`.
- CRM / heavy ITSM — non-goal.

## Done criterion

A user conversation can be escalated to an online human agent, who answers in the console with Copilot
suggestions drawn from the tenant's RAG base; the conversation carries a minimal state through handoff.
