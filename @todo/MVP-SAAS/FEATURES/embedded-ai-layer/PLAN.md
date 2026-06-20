# Feature: embedded-ai-layer

**Layer:** ⚪ Future · **Status:** backlog *(exploratory)*
**depends_on:** chat-sse *(hard)* · **ADRs:** — *(new)*

## Objective

Be a **pluggable AI layer inside** incumbent platforms (Zenvia / Blip & peers): instead of competing
with their omnichannel suite, embed our RAG brain into theirs via their open APIs / marketplaces.

## Scope

**In:**
- Investigate which incumbents expose open APIs / marketplaces we could plug into.
- A thin integration surface exposing our RAG answer engine to a host platform.
- Partnership / revenue-share modeling per player.

**Out:**
- Building our own omnichannel / CRM suite — explicit non-goal.
- Committed delivery — this is **exploratory**, validate market fit before investing.

## Open questions

- Which incumbents have usable open APIs / marketplaces?
- What partnership / revenue-share models are realistic per player?

## Done criterion

A documented integration path (or a working spike) where our RAG engine answers inside at least one
host platform, plus a go/no-go on the partnership model.
