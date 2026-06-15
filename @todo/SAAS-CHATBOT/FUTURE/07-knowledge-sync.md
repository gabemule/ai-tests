# 07 — Knowledge sync (connect sources, auto re-embed on change)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term. Last updated: 2026-06-14.

## Concept

Instead of the customer **manually re-uploading** a file every time it changes, they **connect a
source** (Google Drive, Notion, a URL, etc.) once. When the source changes, we **fetch only what
changed and re-embed just that document** — so the bot's knowledge stays in sync automatically.

This turns the knowledge base from a **static snapshot** into a **living, synced** one. The plumbing
reuses the ingestion path we already have (`ARCHITECTURE.md` §6): parse → chunk → embed → upsert in
pgvector. The new part is a **source connector** + a **change-detection trigger**.

## How change detection works (two mechanisms)

Verified live 2026-06-14 against Google Drive API docs (the `changes` collection):

- **Poll (delta token)** — simplest. Drive exposes `changes.getStartPageToken` → store the token →
  periodically call `changes.list` with it to get **only what changed** since last check (a delta,
  not a full scan). Same idea generalizes to other sources (Notion `last_edited_time`, HTTP
  `ETag`/`Last-Modified` for URLs).
- **Push (webhook, near real-time)** — Drive can send a **notification** to our endpoint when a
  watched resource changes; we then fetch just that file. Lower latency, more setup (a public
  webhook + channel renewal).

Either way the result is the same: **a list of changed files → re-ingest only those**.

## Flow (incremental re-embed)

```
source change (push webhook OR poll delta)
   → identify changed file(s)
   → fetch file content (connector + stored OAuth token)
   → re-parse + re-chunk
   → re-embed ONLY that document
   → replace its old chunks/embeddings in pgvector (delete old → upsert new)
   → bot answers with fresh content
```

It's **incremental** — we never re-index the whole base, only the changed document. Cost = the
re-embedding tokens for what changed (cheap; embeddings are ~$0.02/1M tokens — see `../PRICING/embeddings.md`
§1.3), reusing the existing Python ingestion worker + job queue.

> **Re-embed at the chunk level, not the document level** (`../PLAN.md` ADR #15). When a doc changes
> we diff per chunk (content hash), delete only the changed chunks' old vectors and embed only the
> new ones. A 2MB doc where one paragraph changed re-embeds ~a few KB, not 2MB — keeping the
> *effective* reingestion volume (K) at ~1–2 in real use.
>
> **This sync is bounded by the per-plan reingestion budget** (`../PRICING/plans.md` §6.1): `K × storage`
> per month, launched cautiously at **K=3** (ceiling 5×). The **min sync cadence** per plan (Pro 24h
> / Business 1h-webhook) is the front-line guard — it caps how often a source can trigger a re-embed,
> so the budget is rarely the binding limit. On hitting the budget we **degrade** (pause re-embeds
> for that doc until next cycle + alert), never block the live chat.


## ⚠️ Static content vs. live data (important boundary)

Embedding is **semantic and approximate** — great for prose/docs, **bad for exact, always-fresh
lookups**. A spreadsheet of **prices/stock that changes constantly** is the wrong fit for embeddings
(stale + imprecise). For that, the right tool is **`08-tool-calling.md`** (query a live API at
answer time), not sync+embed.

> **Rule of thumb:** **static/textual content → sync + embed (this file); live/transactional/exact
> data → tool/API (`08`).** Knowledge sync is for documents that change *occasionally* (a policy, a
> manual, an FAQ sheet), not for real-time transactional data.

## Candidate connectors

- **Google Drive** — OAuth + `changes` API (poll) or push notifications. Docs, Sheets (as text),
  PDFs, etc.
- **Notion** — pages/databases via API + `last_edited_time`.
- **URL / website crawl** — periodic re-crawl with `ETag`/`Last-Modified` (pairs with F4 URL crawl
  in `ARCHITECTURE.md` §11).
- **Cloud storage** (S3 / Dropbox) — bucket/folder sync.
- (later) **Databases** — but exact/live data usually belongs in `08`, not embedded.

## Why it matters (strategic)

- **Lower friction + always-current bot** — "connect once, stays in sync" beats "re-upload every
  edit". Strong reason to pick us over a static-upload tool.
- **Reuses the ingestion pipeline** — connectors + a change trigger on top of what we already built;
  little new core tech.
- Reinforces the **AI-config-depth moat** (`06-competitive-moat.md`) — the suites treat the
  knowledge base as a shallow add-on; a synced, multi-source base is product depth they lack.

## Infra impact

Mostly **reuse** (see `README.md` §5). Connectors + OAuth tokens (encrypted at rest) + a small
`sync_state` table (per-source delta token / channel id). Push needs a **public webhook endpoint**
(the API already is public) + **channel renewal** (Drive watch channels expire — a scheduled job).
Re-embedding runs on the existing worker; cost is tokens-only for changed docs.

## Scope / limits

- ✅ Connect a source, detect changes (poll or push), incremental re-embed of changed docs only.
- ✅ OAuth token storage (encrypted), per-source sync state, channel renewal for push.
- ❌ Real-time exact data (prices/stock/order status) — that's `08-tool-calling.md`, not embedding.
- ❌ Two-way sync / writing back to the source (read-only ingestion).

## Open unknowns

- Sync cadence for poll (per-minute vs. per-hour) vs. push complexity — which per connector.
- Deletion semantics: when a source file is deleted, do we purge its chunks automatically?
- OAuth scopes & consent friction (Drive read-only scope) and token refresh/expiry handling.
- Sheets/tabular: when is a sheet "document-like" (embed) vs. "data" (route to `08`)?
- Pricing gate: connectors likely a Business/Enterprise feature — update `../PRICING/plans.md` when mature.
