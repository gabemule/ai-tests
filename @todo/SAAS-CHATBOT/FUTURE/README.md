# SAAS-CHATBOT — Future / Market Opportunities

> Companion to `../PLAN.md` (roadmap/decisions), `../PRICING/market.md` (benchmark §2) and
> `../ARCHITECTURE.md` (components). This folder holds **market-adjacency and product-extension
> ideas** — strategic direction, **not committed scope**. One file per opportunity.
> Last updated: 2026-06-14
>
> **Strategic, not verified.** Competitor feature descriptions here come from general market
> knowledge, not live page-by-page capture. Validate before treating any as a hard fact.

---

## Index

| # | File | Opportunity | Horizon |
|---|---|---|---|
| 01 | [`01-channels.md`](./01-channels.md) | Channel-first delivery (WhatsApp & co) | 🟢 Short |
| 02 | [`02-agent-console.md`](./02-agent-console.md) | Human handoff + Agent Console + **Agent Copilot** | 🟡 Medium |
| 03 | [`03-ticketing.md`](./03-ticketing.md) | Lightweight ticket lifecycle (open → closed) | 🟡 Medium |
| 04 | [`04-quality-metrics.md`](./04-quality-metrics.md) | SLA, CSAT, NPS, response/resolution time | 🟡 Medium |
| 05 | [`05-embedded-ai-layer.md`](./05-embedded-ai-layer.md) | Pluggable AI layer inside Zenvia/Blip & peers | 🔵 Long / exploratory |
| 06 | [`06-competitive-moat.md`](./06-competitive-moat.md) | What separates us (moat vs. parity) + glossary | ⚪ Cross-cutting |
| 07 | [`07-knowledge-sync.md`](./07-knowledge-sync.md) | Connect sources (Drive/Notion/URL) + auto re-embed on change | 🟡 Medium |
| 08 | [`08-tool-calling.md`](./08-tool-calling.md) | Connect the bot to customer APIs (RAG + actions) | 🟡 Medium |
| 09 | [`09-bot-mode-availability.md`](./09-bot-mode-availability.md) | Bot mode (off/ai/human/hybrid) + availability schedule | 🟡 Medium |


---

## 1. Central thesis

- **Our core = a pluggable "knowledge brain" (RAG-on-docs).** We answer with grounding in the
  customer's own content, at a **simple, predictable per-message price** (Managed) or BYOK.
- **The BR incumbents' niche = omnichannel "central de atendimento".** Zenvia, Blip, Movidesk
  and Tallos sell a full operation: official channels + human agents + CRM (see `../PRICING/market.md` §2.3).
- **Strategy:** be the **best RAG brain** and **connect to the channels / human ops** — *not* become
  a heavyweight support suite. We harvest part of their larger ticket by **reusing our RAG engine on
  both sides** (the bot *and* the human agent), without inheriting telephony/CRM/ITSM cost.

---

## 2. Adjacency map (what they deliver beyond "a chatbot")

Why their ticket is higher: their value is **human operation + official channels**, not answer
generation. We're strong exactly where they're weak (grounded RAG) and absent where they're strong
(channels, human ops) — which is the gap this folder explores closing **selectively**.

| Value layer | Incumbents (Zenvia/Blip/Movidesk/Tallos) | Us (today) | Plan |
|---|---|---|---|
| **RAG over docs** (answer from the customer's content) | weak / partial | **strong core** | keep leading |
| **Official channels** (WhatsApp BSP, SMS, RCS, voice) | **strong core** | absent | `01-channels` |
| **Human handoff** (live agent, presence) | **strong core** | absent | `02-agent-console` |
| **Ticket lifecycle** (open→closed, assignment, history) | **strong core** | absent | `03-ticketing` (light) |
| **Quality metrics** (SLA, CSAT, NPS) | **strong core** | absent | `04-quality-metrics` |
| **CRM / marketing** (sales funnel, campaigns) | medium / strong | absent | ❌ non-goal |
| **Visual flow builder** | **strong core** | absent | ❌ (not now) |

> The money in the incumbents is **WhatsApp (official BSP) + human operation**. That's the source of
> both their high ticket *and* their high cost. We want the **connection point and the agent-side
> reuse of our RAG**, not the heavy operational tooling.

---

## 3. Extension vectors (phased by ambition)

- **🟢 Channel-first** (`01`) — deliver the RAG bot where the customer already is (WhatsApp first).
- **🟡 Human handoff + Agent Console** (`02`) — escalate to a human when needed *and* available; the
  agent works in a console where the **Agent Copilot** searches our base and drafts replies.
- **🟡 Ticketing** (`03`) — give each conversation a lifecycle so we know if it was resolved, who
  handled it, and keep the history. Light, not ITSM.
- **🟡 Quality metrics** (`04`) — SLA, CSAT, NPS, response/resolution time, derived from the ticket
  lifecycle.
- **🔵 Embedded AI layer** (`05`) — be pluggable *inside* Zenvia/Blip & peers (exploratory).
- **⚪ Competitive moat** (`06`) — cross-cutting framing: what's our real edge (RAG-first AI config)
  vs. what's just parity (queue/supervisor/tickets) + glossary (BSP/GTM/funil/broadcast).
- **🟡 Knowledge sync** (`07`) — connect a source (Drive/Notion/URL) once and **auto re-embed on
  change**, so the base stays current without manual re-uploads. (Static/textual content.)
- **🟡 Tool calling** (`08`) — register the customer's APIs as **tools** so the bot fetches **live,
  exact data** (order tracking, product/stock) at answer time: **RAG + actions**. (Live/exact data.)
- **🟡 Bot mode & availability** (`09`) — configure **who answers and when**: `off`/`ai`/`human`/
  `hybrid` (with `ai_first`/`human_first` priority) + a per-window **availability schedule**, with an
  **email fallback** when a human is needed but none is online. Builds on `02`/`03`.

> **Build order:** `02 → 03 → (04, 09)` — `04` (quality metrics) and `09` (bot mode &
> availability) both build on `02`/`03` but **not** on each other, so they can land in either
> order once `03` is in place. `01` (channels) is independent.
>
> **Note on 02 ↔ 03 (mutual coupling):** `02-agent-console` and `03-ticketing` reference each other —
> the console *consumes* the ticket lifecycle, and the lifecycle is *born from* the handoff flow. They
> co-evolve: **02 introduces the minimal ticket states** it needs (`queued`/`with_agent`/`closed`),
> and `03` then fleshes out the full lifecycle (reopen, tags, close reason, audit) that `04` derives
> metrics from. Read "02 → 03" as "start with 02 carrying minimal states, then complete 03", not as a
> strict one-way dependency.


---

## 4. Non-goals (for now)

We explicitly do **not** plan to become:
- ❌ A **heavy ITSM** suite (complex configurable workflows, contract/asset management).
- ❌ A **telephony / IVR (URA)** provider (voice).
- ❌ A **CRM / marketing-campaign** platform.

> Note: **lightweight ticketing** (`03`) and **quality metrics** (`04`) **are** in scope — they're
> cheap, derive naturally from human handoff, and add real value. What stays out is the heavy ITSM
> machinery around them.

---

## 5. Infra impact (do these blow up our cost?)

Short answer: **no — mostly reuse of the stack we already pay for.** The only genuinely *new*
component is real-time transport (WebSocket), and we've **decided to use Supabase Realtime** for it.
Anchored on `../PRICING/infrastructure.md` §1.2.

| Feature | New infra? | Where it fits | Incremental cost |
|---|---|---|---|
| Ticketing (`03`) | ❌ No | Supabase/Postgres tables we already have | ~$0 (just rows) |
| Quality metrics (`04`) | ❌ No | same tables + aggregation; dashboard on Vercel | ~$0 |
| Agent login/presence (`02`) | ❌ No | Supabase Auth (already) + a presence table | ~$0 |
| Agent Copilot (`02`) | ❌ No | **reuses the RAG core** (same embeddings + LLM) | tokens only (wallet/BYOK) |
| Live chat / WebSocket (`02`) | ✅ **Supabase Realtime** | persistent connections bot↔agent↔user | piggybacks on existing Supabase |

> **Decision: real-time runs on Supabase Realtime** (already part of the Supabase we pay for) instead
> of running our own WebSocket server on Railway. This keeps the real-time layer on existing infra —
> no new always-on service, no extra RAM/connection cost on Railway — at our scale (dozens/hundreds
> of online agents, not millions). Revisit only if Supabase Realtime limits become a bottleneck.

> **Bottom line:** these features weigh more on the **roadmap (build effort)** than on the **infra
> bill**. The ~94–96% margin profile in `../PRICING/plans.md` stays valid.

---

## 6. Open questions (cross-cutting)

- Which incumbents expose **open APIs / marketplaces** we could plug into (`05` embedded layer)?
- What partnership / revenue-share models are realistic per player?
- WhatsApp path: **Meta Cloud API** (direct) vs. **BSP** (Zenvia/Blip/Twilio/360dialog) — cost,
  approval friction, dependency.
- Pricing impact: which of these are **Business/Enterprise** gates (update `../PRICING/plans.md` when mature).
