# REVIEW-FIXES-2 — Technical hardening (Type B)

> Real engineering fixes (correctness / safety / margin-integrity), not doc wording. Each item is a
> **decision already implied by an ADR** that needs an explicit implementation contract + an
> acceptance test before the relevant phase ships. **Source of truth = `adr/`** (decisions) and
> **`PRICING.md`** (economics).
> Last updated: 2026-06-14
>
> **Context (2026-06-14):** during the ADR extraction several ADRs left an explicit "validate this
> with a test / store this column / harden this seam" note in their *Consequences* (016, 017, 007,
> 004, 008, 011). This doc turns those notes into concrete, testable fixes so they don't get lost
> between "decided" and "built". Items are ordered by severity, then by the phase they gate.

## Summary

| ID | What | Severity | Phase | ADR / ref | Status |
|---|---|---|---|---|---|
| C1 | RLS survives connection pooling (transaction-local `tenant_id` + pooler in tx mode) | 🔴 | F1 | `adr/016` | [ ] |
| C2 | Embedding identity/version columns on the vector row (+ migration on mismatch) | 🔴 | F1 | `adr/017` | [ ] |
| C3 | Real-time hard cap on the **streaming** response (`max_tokens` derived from balance) | 🔴 | F4 | `adr/011`, PRICING §4.1 | [ ] |
| M1 | Wallet ledger: append-only + idempotency + reserve/hold with TTL & reaper | 🟡 | F4 | PRICING §4.1/§4.2 | [ ] |
| M2 | Metering in **shadow mode** in F2 (validate the meter before money depends on it) | 🟡 | F2 | `adr/011` | [ ] |
| M3 | Validate the routing classifier (the 80/15/5 mix) **before** F4 prices on it | 🟡 | pre-F4 | `adr/014`, PRICING §8 | [ ] |
| M4 | Signed short-lived widget **session token** + rate-limit per key | 🟡 | F2 | `adr/004` | [ ] |
| M5 | Ingestion idempotency + DLQ + QStash signature verification | 🟡 | F1 | `adr/007` | [ ] |
| M6 | Conversation history **windowing/summarization** before the LLM call | 🟡 | F1 | `adr/008` | [ ] |
| M7 | Reserve the `agent` identity axis early (RBAC has no `agent` today) | 🟢 | F2 (data model) | `FUTURE/02` | [ ] |
| M8 | Cross-cutting outbound **egress posture** (SSRF/allowlist) for tools & webhooks | 🟢 | F4 | `FUTURE/08` | [ ] |

> **Dropped during validation (2026-06-14):** *C4 (FUTURE build order)* — duplicates **A7** in
> `REVIEW-FIXES-1`; *M10 (incoherence in FUTURE/05)* — reread the doc, it's internally consistent,
> no incoherence found.

---

## C1 — RLS must survive connection pooling 🔴

**The problem (didactic):** `adr/016` makes tenant isolation *physical* via Postgres RLS scoped by
`tenant_id`. RLS reads the tenant from a **session variable** (e.g. `current_setting('app.tenant_id')`).
But our API runs behind a **connection pooler** and reuses connections across requests. If we set the
variable with plain `SET` (session-level) it **leaks into the next request** that grabs the same
pooled connection — tenant B suddenly sees tenant A's `tenant_id`. This is the single highest-risk
correctness bug in the whole platform: it silently defeats the isolation we designed.

**The fix (technical):**
- Set the tenant **transaction-locally**: `SET LOCAL app.tenant_id = $1` (or
  `set_config('app.tenant_id', $1, true)` — the `true` = local to the current transaction) at the
  start of every request's transaction, so it's gone when the tx ends.
- Run the pooler in **transaction mode** (e.g. Supabase/PgBouncer transaction pooling) so a connection
  is only held for the duration of a transaction, never across requests.
- Wrap every tenant-scoped request in a transaction that sets the var **before** any query runs.
- Add a default-deny RLS policy: if `app.tenant_id` is unset, the policy matches **zero** rows (fail
  closed, never fail open).

**Acceptance:** a **leak test** — fire two interleaved requests for tenant A and tenant B over the
**same pooled connection** and assert neither ever reads the other's rows; and a test asserting that a
query with **no** `app.tenant_id` set returns **zero** rows (not all rows). `adr/016` explicitly
calls for this leak test.

---

## C2 — Embedding identity/version on the vector row 🔴

**The problem (didactic):** `adr/017` says embedding parity is a *runtime invariant* — ingestion
(Python) and query (Node) must use the **same provider/model/dimension/normalization** or vectors
don't share a space and retrieval degrades **silently**. Today the `EMBEDDING` entity in
`ARCHITECTURE.md` §5 only stores `id, chunk_id, embedding, tenant_id`. So when we eventually change
the default embedding model (e.g. Qwen3 8B → a newer one), we have **no way to know which rows were
embedded with which model** — we can't detect the mismatch or migrate safely. The invariant is
asserted but not *recorded*.

**The fix (technical):**
- Add columns to the vector row: `embedding_model`, `embedding_dim`, `embedding_normalized` (bool),
  and an `embedding_version` (monotonic int or the model-config hash).
- At query time, the retrieval reads the **active** embedding config and only matches rows with the
  **same** identity (or refuses + flags a mismatch) — never silently compares across spaces.
- Migration strategy on a model change: bump `embedding_version`, **re-embed on mismatch** (reuses the
  chunk-level re-embed pipeline, `adr/015`), backfilling rows lazily or in a batch job.

**Acceptance:** a **parity test** (`adr/017`) that fails if ingestion and query resolve to different
model/dim/normalization; and a migration test proving rows with an old `embedding_version` are
detected and re-embedded rather than queried against the new space.

---

## C3 — Real-time hard cap on the streaming response 🔴

**The problem (didactic):** `adr/011` + `PRICING.md` §4.1 promise a **real-time hard cap** — we block
the *next* request the instant the wallet hits zero / the monthly cap. That protects against the
*next* message, but a **single streaming answer** is generated *after* we admit the request and can
run long (thousands of output tokens over SSE). A heavy or adversarial prompt can push the wallet
**negative within one response** — the "next-request" cap never gets a chance to fire mid-stream.

**The fix (technical):**
- Before each Managed generation, compute an **affordable token budget** from the remaining balance at
  the anchor price and pass it as `max_tokens` (a hard ceiling the provider enforces), so no single
  response can exceed what the wallet can pay.
- Pair it with the **reserve/hold** (M1): reserve the estimated cost up front, reconcile to actual on
  completion; the `max_tokens` ceiling bounds the worst case the reserve must cover.
- On a stream that would exceed the budget mid-flight, stop cleanly at the cap with a user-facing
  "limit reached" rather than letting it overrun.

**Acceptance:** a test where a tenant with a tiny remaining balance issues a prompt that *would*
generate a long answer, and the response is truncated at the affordable `max_tokens` with the wallet
never going negative.

---

## M1 — Wallet ledger: append-only + idempotency + reserve/hold TTL 🟡

**The problem (didactic):** `PRICING.md` §4.1/§4.2 describe a prepaid wallet with auto-recharge,
idempotent charges and a reserve/hold. Implemented naively (a single mutable `balance` column updated
in place) this is fragile: concurrent messages race on the balance, a retried Stripe webhook can
double-credit, and a **reserve that's never released** (request crashes after holding) silently locks
funds forever. Money state needs to be **auditable and crash-safe**, not a mutable counter.

**The fix (technical):**
- Model the wallet as an **append-only ledger** (`wallet_entries`: credit/debit/hold/release, each
  with `idempotency_key`, `amount`, `reason`, `created_at`); balance = a derived sum (or a cached
  projection reconciled from the ledger).
- **Idempotency keys** on every Stripe charge *and* every ledger write, so a retried webhook/charge is
  a no-op (`PRICING.md` §4.2).
- **Reserve/hold with a TTL + reaper:** a hold expires and is auto-released if the request that placed
  it never reconciles (crash/timeout), so funds can't be stranded.
- Anti-loop recharge cap (`PRICING.md` §4.2, e.g. max 3/day) enforced against the ledger, not a flag.

**Acceptance:** tests for (a) a double-delivered Stripe webhook crediting **once**; (b) concurrent
debits never driving the balance negative; (c) an orphaned hold being reaped after its TTL.

---

## M2 — Metering in shadow mode in F2 🟡

**The problem (didactic):** Managed billing (F4) trusts the local meter (`adr/011`) as the source of
truth for real money. If the meter is wrong (miscounts tokens, double-counts retries, misses a
provider), customers get mischarged the moment billing goes live. We shouldn't discover meter bugs
*after* money depends on them.

**The fix (technical):** turn on local metering in **F2 already** (usage counters exist in F2 per
`PROGRESS.md`), but in **shadow mode** — it records `usage` and we **reconcile** it against the
provider's invoice/usage API monthly (the secondary layer in `adr/011`) **without** charging anyone.
By F4 the meter has months of validated accuracy before it gates the wallet.

**Acceptance:** a reconciliation report (meter vs. provider invoice) within an agreed tolerance for
≥1 month before F4 billing flips on.

---

## M3 — Validate the routing classifier before F4 prices on it 🟡

**The problem (didactic):** the whole margin model (`adr/014`, `PRICING.md` §8) assumes the router
sends ~80% Qwen3.7 Plus / ~15% DeepSeek V4 Pro / ~5% Sonnet and that the cheap models are *good
enough* on the queries they get — yielding the blended ~$1.35/1M (~85% spread). If the classifier
misroutes (sends hard queries to the cheap tier → bad answers, or everything to Sonnet → no margin),
the economics the F4 price is calibrated on are wrong.

**The fix (technical):** before F4 sets the per-message price, run the classifier in **measurement
mode** on real traffic: log the intended route + a quality signal (and/or shadow-run the premium model
on a sample to compare). Confirm the **actual** mix and answer quality match the planned 80/15/5
before pricing depends on it. `PRICING.md` §11 already lists "real routing-mix monitoring" as an open
question — this makes it a gate, not a hope.

**Acceptance:** a measured routing distribution + quality delta on real/representative traffic that
confirms the blended cost lands near plan (~$1.35/1M) before the F4 anchor price is locked.

---

## M4 — Signed short-lived widget session token + rate-limit 🟡

**The problem (didactic):** `adr/004` secures the widget with Origin + domain-ownership proof, but
notes a runtime gap: every chat request today would carry the **long-lived publishable key**, which is
public (it's in the page source). An attacker who copies it can hammer the chat endpoint from a
verified origin and burn a Managed tenant's wallet, or just DoS them.

**The fix (technical):**
- On chat start (after Origin + ownership checks pass), issue a **short-lived signed session token**
  (e.g. JWT, minutes-long TTL) scoped to that bot/origin; subsequent messages use the session token,
  not the raw publishable key (`adr/004` Consequences).
- **Rate-limit per publishable key / per session / per IP** so a leaked key can't be abused at volume
  (ties into F3 rate limiting in `PROGRESS.md`).

**Acceptance:** a test proving a stale/forged session token is rejected, and that requests beyond the
rate limit on one key are throttled.

---

## M5 — Ingestion idempotency + DLQ + QStash signature 🟡

**The problem (didactic):** `adr/007` makes `/ingest` async over Upstash QStash, and notes the queue
is **at-least-once** — the same job can be delivered twice (duplicate chunks/embeddings = wasted cost
+ polluted retrieval), a poison job can retry forever, and an **unsigned** webhook means anyone who
learns the worker URL can inject fake jobs.

**The fix (technical):**
- **Idempotent job handling:** key each job by `document_id` + content hash; a redelivery upserts
  (no duplicate chunks) instead of re-inserting.
- **DLQ:** after N failed attempts, route the job to a dead-letter queue + mark the document
  `failed`, instead of retrying indefinitely.
- **Verify the QStash signature** on every incoming job at the worker before processing (reject
  unsigned/forged payloads).

**Acceptance:** tests for (a) a redelivered job producing **no** duplicate chunks; (b) a permanently
failing job landing in the DLQ + document `failed`; (c) an unsigned payload being rejected.

---

## M6 — Conversation history windowing/summarization 🟡

**The problem (didactic):** `adr/008` persists `CONVERSATION` + `MESSAGE` from F1 and explicitly notes
history must be **windowed before sending to the LLM**. If we naively replay the *entire* conversation
into each prompt, long chats blow the model's context limit and inflate token cost (which, in Managed,
is our spread eroding) — and eventually error out.

**The fix (technical):** before each generation, build the prompt from a **bounded window** of recent
messages (by turn count or token budget), and for long conversations **summarize** the older turns
into a running summary that's carried instead of the full transcript. Keep the full history persisted
(for ticketing/quality), but only send the window + summary to the model.

**Acceptance:** a test where a very long conversation still produces a prompt under the model's context
budget, and the running summary preserves earlier context without replaying every message.

---

## M7 — Reserve the `agent` identity axis early 🟢 (decide early, implement later)

**Why now:** `FUTURE/02` (agent console) introduces an `agent` user with **presence**, but the core
RBAC (`ARCHITECTURE.md` §5 `MEMBER.role = owner|admin|editor|viewer`) has no `agent` and no notion of
a human operator distinct from an org member or an end user. Same reasoning as `adr/008`: acknowledging
the identity axis early avoids a painful data-model migration when the agent console lands.

**The fix:** when shaping the F2 data model, leave room for an `agent`/operator identity (even if
unused at launch) rather than baking a 4-role enum that later needs a migration. **Decision only —
not built now.**

**Acceptance:** the F2 identity model doesn't hard-block adding an `agent` actor later (documented
note, no migration required to introduce it).

---

## M8 — Cross-cutting outbound egress posture 🟢 (decide early, implement later)

**Why now:** several features make **outbound HTTP calls from our backend** — tool calling
(`FUTURE/08`, already has solid SSRF/allowlist/timeout guardrails), QStash webhooks (M5), and future
knowledge-sync polling. These share the same risk surface (SSRF, calling internal/private IPs, no
timeouts). Worth naming a **single egress posture** so each feature doesn't reinvent (or forget) it.

**The fix:** a shared outbound-HTTP policy (per-tenant domain allowlist, block internal/private IP
ranges, no internal redirects, timeouts + rate limits, audit log) reused by the tool executor and any
other outbound caller. `FUTURE/08` §"Security & guardrails" is the reference spec. **Posture decision —
implemented per-feature when each lands (tools = F4).**

**Acceptance:** when the tool executor (or any outbound caller) ships, it goes through the shared
egress guard (SSRF + allowlist + timeout), not an ad-hoc fetch.

---

## How to execute

1. **F1 blockers first:** **C1** (RLS pooling — highest risk), **C2** (embedding columns; cheap to add
   to the schema now, expensive to retrofit), **M5** (ingestion idempotency/DLQ/signature), **M6**
   (history windowing). These shape the F1 data model + ingestion loop.
2. **F2:** **M2** (shadow metering), **M4** (widget session token + rate-limit), **M7** (reserve the
   agent axis in the data model).
3. **Pre-F4 / F4:** **M3** (validate the router *before* pricing), then **C3** + **M1** (streaming hard
   cap + wallet ledger) together — they're interdependent (the reserve bounds the `max_tokens` cap).
   **M8** lands with the tool executor (F4).
4. Tick each Summary checkbox once its acceptance test passes.
