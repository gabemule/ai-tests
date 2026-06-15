# 02 — Human handoff + Agent Console (with Agent Copilot)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term. Last updated: 2026-06-14.

## Concept

When the bot can't resolve a conversation (or the user asks), **and a human agent is available**,
the conversation is **escalated to a human**. The agent works in an **Agent Console** where — beyond
chatting live with the end user — they use the **Agent Copilot** to query our knowledge base and get
AI-drafted replies. Same RAG engine as the bot, now as a **copilot for the human**.

## Components (minimal — not a full support suite)

1. **Agent users** — own login/auth, role `agent`, **presence** (online / busy / offline). Handoff
   only happens when an agent is available; otherwise → fallback (queue, "we'll get back to you", or
   bot keeps going).
2. **Bot → human routing** — triggers: low RAG confidence, explicit intent ("talk to a human"),
   tenant rule. Conversation states tie into the ticket lifecycle (see `03-ticketing.md`).
3. **Queue + simple inbox** — list of waiting conversations + claim/assign. **Not** ITSM ticketing —
   just enough for the flow.
4. **Live agent chat** — agent talks to the end user in real time, over the same transport as the
   channel (web widget / WhatsApp via `01-channels.md`).
5. **Unified history** — on takeover, the agent sees the full prior bot↔user context.
6. **Supervisor view** — a real-time operational panel (see below). **Parity, not a differentiator.**

## Supervisor view (table-stakes, not a differentiator)

Every BR incumbent ships this — verified live 2026-06-14: **Octadesk** has an inbox with "Não
atribuídas / Tempo excedido / Não respondidas / Conversas do bot" plus per-agent metrics (avg first
response, productivity/day); **Movidesk/Zenvia** sell "Relatórios e Análises", "Automações e Alertas
Inteligentes" and "Contratos de SLA" with a customizable panel. So a supervisor/queue dashboard is
**the minimum to compete**, not an edge — we include it as parity. The real moat lives elsewhere
(RAG-first AI config — see `06-competitive-moat.md`).

What the supervisor sees:

- **Online agents + status** (online / busy / offline) and **how many active conversations** each is
  handling right now.
- **What each agent is on** — which ticket/conversation (links to `03-ticketing.md`).
- **Queue thermometer** — waiting count + how long the oldest has waited.
- **Long-wait alert** — flag tickets waiting past a threshold, reusing the SLA breach flags from
  `04-quality-metrics.md` (no new metric engine, just surfacing it live).

## Auto-assign (light, opt-in — full distribution is future)

An agent can either just go **online**, or opt into **"auto-attend the next in queue when I finish"**
(a **pull** model — the agent stays in control, the system just feeds them the next one). Each agent
(or the tenant) sets a **simultaneous capacity** (e.g. handle up to N conversations at once); the
queue won't push past that.

- ✅ **Now:** opt-in pull ("auto-next on finish") + per-agent simultaneous capacity.
- 🔵 **Future:** full **automatic distribution** (skill/language/round-robin routing that *pushes*
  conversations to agents) — a heavier scheduling layer, marked as later, not initial scope.

## Agent Copilot (the differentiator)

The human agent uses our RAG as a copilot, in three modes — **always human-in-the-loop**:

- **(a) Manual base search** — agent types a query, gets the most relevant snippets/documents from
  the tenant's base (same semantic search as the bot), **with citations/sources**. A "semantic
  Ctrl+F" over the knowledge base.
- **(b) Suggested reply** — based on the conversation + the base, the AI generates a **draft reply**
  the agent **edits and approves before sending**. Never auto-sends — the human is the gate.
- **(c) Conversation summary** — on takeover, the AI gives a **summary** of the bot↔user exchange so
  the agent gets up to speed without reading everything.

> Bot vs. Agent Copilot: in the bot, the AI talks **directly to the end user**. In the Agent Copilot,
> the AI talks **to the agent** (searches/suggests) and the **human decides** what reaches the user.
> Same brain, different consumer.

## Why it matters (strategic)

- **Reuses the RAG core on both sides** (bot + agent) → little incremental tech, lots of value.
- Closes the "human attendance" gap the incumbents (Zenvia/Blip/Movidesk/Tallos) use to justify a
  high ticket — **without** inheriting CRM/telephony/ITSM.
- Agent Copilot is a natural **premium upsell** (Business / Enterprise tier).

## Scope / limits

- ✅ Agent login, presence, queue/inbox, live chat, Agent Copilot (search + suggested reply +
  summary), unified history.
- ✅ Consumes the **ticket lifecycle** from `03-ticketing.md` (who took it, when, resolution).
- ❌ Heavy ITSM (complex configurable workflows, contracts/assets), telephony/IVR, CRM/campaigns.

## Data-model note (decide early, implement later)

The core RBAC (`../ARCHITECTURE.md` §5 `MEMBER.role = owner|admin|editor|viewer`) has **no `agent`**
and no notion of a human operator distinct from an org member or an end user. Same reasoning as
persisting conversations early (ADR #8): acknowledging the identity axis now avoids a painful
data-model migration when this console lands. So when shaping the **F2 identity model**, leave room
for an `agent`/operator identity (even if unused at launch) rather than baking a 4-role enum that
later needs a migration. **Decision only — not built now;** acceptance is simply that introducing an
`agent` actor later requires **no migration**.

## Infra impact

Mostly **reuse** of what we already pay for (see `README.md` §5). Agent login uses Supabase Auth;
presence/queue/tickets are Postgres rows; the Agent Copilot reuses the RAG core (tokens only). The
only genuinely new piece is real-time transport — **decided: Supabase Realtime** (already part of
our Supabase), so live chat piggybacks on existing infra instead of a new WebSocket server on Railway.

## Open unknowns

- WhatsApp: how the agent's outbound reply respects Meta's **24h window** (see `01-channels.md`).
- Where to gate Agent Copilot in pricing (likely Business/Enterprise) — update `../PRICING/plans.md`.
- Concurrency: how many conversations one agent handles at once; assignment fairness.
