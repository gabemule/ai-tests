# Feature: knowledge-sync

**Layer:** ⚪ Future · **Status:** backlog
**depends_on:** incremental-reembed *(hard)* · **ADRs:** 015
**Source:** `@todo/SAAS-CHATBOT/FUTURE/07-knowledge-sync.md`

## Objective

Connect an external source (Drive / Notion / URL) once and **auto re-embed on change**, so the base
stays current without manual re-uploads.

## Scope

**In:**
- Source connectors for static/textual content (Drive, Notion, URL crawl).
- Change detection → trigger the existing chunk-level diff re-embed (reuses `incremental-reembed`).
- Per-source sync status / last-synced visibility in the portal.

**Out:**
- The chunk-diff re-embed mechanics themselves (→ `incremental-reembed`).
- Live/exact API data at answer time (→ `tool-calling`) — different concern.

## Done criterion

Connecting a Notion page (or Drive folder / URL) keeps its content embedded and current: editing the
source triggers a re-embed of only the changed chunks, with no manual upload.
