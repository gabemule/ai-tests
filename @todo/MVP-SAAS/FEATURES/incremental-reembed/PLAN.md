# Feature: incremental-reembed

**Layer:** 🟡 Platform · **Status:** todo
**depends_on:** ingestion *(hard)* · **ADRs:** 015

## Objective

When a document changes, re-embed only the chunks that changed (diff by chunk content hash), bounding
the worst-case per-tenant embedding cost and unblocking future knowledge-sync.

## Scope

**In:**
- Chunk-level diff on re-upload: hash per chunk, delete changed chunks' old vectors, embed only the
  new ones, upsert.
- Per-plan reingestion budget = K × storage; launch at **K=3**, ceiling **5×**.
- On budget exhaustion: **degrade** (pause re-embeds) — never block live chat.

**Out:**
- External source connectors / auto re-embed triggers (future `knowledge-sync`).
- The initial ingestion pipeline (→ `ingestion`).

## Done criterion

Re-uploading a document with one changed section re-embeds only the affected chunks (effective K ~1–2,
verified); hitting the budget pauses re-embeds without interrupting chat.
