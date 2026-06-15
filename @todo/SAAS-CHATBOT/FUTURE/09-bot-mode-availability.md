# 09 — Bot mode & availability (who answers, and when)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic opportunity, **not committed scope**.
> Horizon: 🟡 Medium term (pairs with `02-agent-console`). Last updated: 2026-06-14.

## Concept

Two new config axes on a bot that decide **who answers and when**:

1. **Bot mode** — is the chat AI-driven, human-only, hybrid, or off entirely?
2. **Availability schedule** — *which* mode is active per time window (e.g. AI at night/weekends,
   humans during business hours), in the tenant's timezone.

Together they let a tenant run the chat exactly how their operation works: pure self-serve AI,
a staffed human desk, an AI-triage-then-human flow, or a human-first desk with AI as overflow —
and switch between those automatically by the clock.

This builds directly on `02-agent-console.md` (human handoff, presence) and `03-ticketing.md`
(conversation states). It's mostly **config + a runtime resolver**, not new core tech.

## Bot modes (4)

| Mode | Behaviour | Requires a logged-in agent? |
|---|---|---|
| **`off`** | Widget **does not render** — no chat on the page at all. | — |
| **`ai`** | Only the AI-agent answers (RAG core). | no |
| **`human`** | Only humans answer — straight to the queue (`02`). | **yes** (else → email fallback) |
| **`hybrid`** | AI **and** humans, ordered by a **priority** sub-option (below). | depends on priority |

### `hybrid` priority sub-option

- **`ai_first`** (triage) — the AI answers first; it escalates to a human **only when the user asks**
  (or a low-confidence rule fires). This is the flow `02-agent-console.md` already describes.
- **`human_first`** — a human answers first; the **AI is the fallback/overflow** when there's a
  queue or no free agent. The AI holds the conversation until a human takes over.

## Availability schedule

- **Time windows** (in the **tenant's timezone**) pick **which mode is active** in each band —
  e.g. business hours → `hybrid/human_first`; nights/weekends → `ai`.
- **Outside any window** → a configurable **`default_mode`** applies.
- **Scope (initial): simple** — one window-per-weekday range. Holidays / one-off exceptions / per-
  channel schedules are deferred (open unknowns).

## Support email (required platform config)

A **support email** (configurable at **org** and/or **bot** level) is **required** to enable any
mode that can depend on a human — it's the destination of the **email fallback**. Without it, the
human-dependent modes can't be activated (nowhere to send the "we're unavailable" handoff).

## Resolution matrix (the heart of the feature)

"Who answers right now" = **effective mode (from schedule)** × **priority (if hybrid)** ×
**is a human available? (presence from `02`)**:

| Effective mode | Priority | Human available? | Result |
|---|---|---|---|
| `off` | — | — | **Chat doesn't render** |
| `ai` | — | — | Chat renders, **AI answers** |
| `human` | — | ✅ yes | Chat → **human queue** |
| `human` | — | ❌ no | Chat renders, **"human unavailable" → email** |
| `hybrid` | `ai_first` | ✅ yes | AI answers; on ask/escalate → **human queue** |
| `hybrid` | `ai_first` | ❌ no (at escalation) | **"human unavailable" → email** |
| `hybrid` | `human_first` | ✅ yes | **Human first**; AI covers queue/overflow |
| `hybrid` | `human_first` | ❌ no | **AI answers as fallback**; if user asks for a human → "unavailable" + email |

> **Fallback rule (consistent):** whenever a mode **needs a human and none is logged in/available**,
> the chat shows a **"human attendance unavailable"** notice and points the user to the **support
> email**. In `human_first` with no human, the **AI works** in the meantime; the email fallback only
> triggers when the user **explicitly requests a human** and there's still none.

## Data model (ties into `ARCHITECTURE.md` §5 ER)

New fields on `BOT` (and a support-email on `ORGANIZATION`/`BOT`):

```
BOT {
  string mode             "off | ai | human | hybrid"
  string hybrid_priority  "ai_first | human_first"   // only when mode = hybrid
  string default_mode     "off | ai | human | hybrid" // applies outside any schedule window
  string timezone         // IANA tz for the schedule
  string support_email    // fallback target (or inherit from ORGANIZATION)
}
SCHEDULE_WINDOW {
  uuid   id PK
  uuid   bot_id FK
  int    weekday           // 0-6
  time   start, end        // local to bot.timezone
  string mode              // which mode this window activates
}
```

## Why it matters (strategic)

- **Operational fit** — tenants run very different desks (self-serve AI, staffed humans, mixed).
  Letting them configure *who answers and when* makes the product fit their reality instead of
  forcing one flow.
- **Reuses presence + handoff + tickets** (`02`/`03`) — almost no new core tech; a config surface
  and a runtime resolver on top of what those features already provide.
- **Deepens the AI-config moat** (`06-competitive-moat.md`) — fine-grained control over the AI's
  role (off / triage / overflow / always-on) is exactly the "deep AI configurability" edge the
  suites lack.

## Infra impact

**~$0 new infra** (see `README.md` §5). It's config rows (`BOT` fields + a `SCHEDULE_WINDOW`
table) plus a **runtime resolver** (evaluate schedule → effective mode → check agent presence →
pick branch). Presence already comes from `02` (Supabase Realtime). The only outbound piece is the
**email fallback** (a transactional email send), which is negligible.

## Scope / limits

- ✅ 4 modes (`off/ai/human/hybrid`), hybrid `ai_first`/`human_first`, weekly schedule + timezone,
  default mode, required support email, the resolution matrix + email fallback.
- ✅ Consumes presence (`02`) and conversation states (`03`).
- ❌ Holiday calendars / one-off date exceptions (initial: weekly windows only).
- ❌ Per-channel schedules (one schedule per bot at first; revisit with `01-channels`).
- ❌ Skill/language-based routing of *which* human (that's the `02` auto-distribution future).

## Open unknowns

- **Per-channel** schedules — does a WhatsApp bot (`01`) need a different schedule than the widget?
- **Holidays / exceptions** — calendar support vs. manual one-off overrides.
- **Mid-conversation mode switch** — if the schedule flips (e.g. business hours end) while a chat is
  live, does the active conversation keep its mode or transition? (lean: finish in current mode.)
- **Email fallback UX** — inline form (capture message + send for the user) vs. just showing the
  address; tie to lead/contact capture.
- **Pricing gate** — scheduling + hybrid priority likely a **Business/Enterprise** feature; `ai`/
  `off` available to all. Update `../PRICING/plans.md` when mature.
