# 06 — Competitive moat (what actually separates us)

> Part of `SAAS-CHATBOT/FUTURE/` — strategic framing, **not committed scope**.
> Horizon: cross-cutting (informs all other files). Last updated: 2026-06-14.

## Concept

A clear-eyed read of **where we win, where the BR incumbents win, and what is just table-stakes**.
The thesis: our moat is **"inteligência customizável de chatbot acima de tudo"** — a RAG-first
product with deep, configurable AI layers. The operational tooling (queue, supervisor view,
tickets, SLA dashboards) is **parity we must have, not the thing that sets us apart**.

## Glossary (terms that recur in this folder)

- **BSP (Business Solution Provider)** — an official Meta partner authorized to provide WhatsApp
  Business API at scale (onboarding, numbers, templates, billing). Incumbents like Zenvia/Blip are
  BSPs; being a BSP is a heavy commercial/compliance relationship, **not** a feature we ship.
- **GTM (Go-To-Market)** — the sales/distribution/brand motion: how you reach and close customers
  (self-serve vs. enterprise sales, channel partners, marketing). The incumbents' GTM is
  enterprise/field-sales heavy; ours is **self-serve + transparent pricing**.
- **Funil (sales funnel / mini-CRM)** — lead capture → qualification → conversion tracking. Part of
  what suites bundle (Leadster is lead-gen-first). **Non-goal** for us (see `README.md` §4).
- **Disparo em massa / broadcast** — proactive mass outbound messaging (needs Meta-approved
  templates + opt-in). A channel/CRM capability tied to BSP, **not** RAG. Out of scope.

## What separates us (honest two-sided read)

### In their favor (where the incumbents are genuinely ahead)

- **Channel scale via BSP** — official WhatsApp at volume, SMS/RCS, voice; template approval and
  number management as a managed relationship. We connect to channels (`01-channels.md`) but we are
  **not** a BSP.
- **Enterprise contact-center depth** — large agent operations, complex routing, telephony/IVR,
  workforce management. We deliberately stay light (`README.md` §4 non-goals).
- **CRM / campaigns / funnel** — sales pipelines, mass campaigns, marketing automation. Non-goal.
- **Installed base + enterprise GTM** — years of enterprise contracts and field sales we don't have.

### In our favor (the actual moat)

- **RAG-first, grounded answers** — answering from the customer's own content is our **core**, not a
  shallow add-on. In the suites, AI is a bolt-on (often a separate paid saldo — see `../PRICING.md`
  §2.3: Zenvia gates IA above R$600, Tallos sells it as prepaid saldo, Leadster locks it behind a
  higher tier).
- **Deep AI configurability** — knowledge base management, prompt modes, scoring/RAG tuning, BYOK vs.
  Managed, multi-bot, **synced multi-source knowledge** (`07-knowledge-sync.md`) and **tool calling /
  RAG + actions** (`08-tool-calling.md`). This config surface is the product, and it's where the
  suites are thin (they treat AI as a shallow add-on).
- **Managed/BYOK pricing** — IA at a **simple, predictable per-message price** (Managed) or owned by
  the customer (BYOK), with a **transparent consumption dashboard**. The incumbents bury or meter AI
  opaquely (separate saldo / higher tiers — see `../PRICING.md` §2.3).
- **Self-serve + price** — transparent ladder **R$49–R$449** vs. their entry tickets **R$579–R$2.100**
  and "sob consulta" enterprise gating (`../PRICING.md` §2.3).
- **PIX** (1.19%, ADR #12) — a BR margin/conversion lever none of the benchmarked tools advertise.

## Parity, not moat (the minimum to compete)

These exist in every incumbent (verified live 2026-06-14: Octadesk, Movidesk/Zenvia) — we ship them
to **not lose on basics**, but they are **not** what differentiates us:

- Supervisor view / queue dashboard (`02-agent-console.md`).
- Ticket lifecycle + assignment + history (`03-ticketing.md`).
- SLA / CSAT / NPS / response-time metrics (`04-quality-metrics.md`).
- Human handoff + agent inbox (`02-agent-console.md`).

> Framing rule: in any pitch, lead with the **AI config moat**, treat supervision/queue/tickets as
> "yes, of course we have that too" — never as the headline.

## Scale-someday horizon (explicitly NOT roadmap)

Things that would only make sense at a much larger scale, listed so we don't confuse them with
near-term scope:

- **Becoming a BSP** ourselves (official WhatsApp at scale) — heavy compliance/commercial lift.
- **Enterprise auto-distribution** (skill/language routing, workforce management) — the "future"
  half of `02-agent-console.md` auto-assign.
- **Telephony / IVR**, **CRM / campaign** suites — permanent non-goals (`README.md` §4).

> These are **horizon markers, not commitments**. If we ever pursue them it's a deliberate strategic
> shift, not a backlog item.

## Open unknowns

- How far the "AI config depth" message lands with buyers who currently equate "chatbot" with
  "atendimento suite" — positioning/education challenge, not a product gap.
- Whether any parity gap (e.g. a missing report) becomes a real deal-blocker vs. a nice-to-have.
- Partnership angle: instead of competing on channels, plug **into** their base (`05-embedded-ai-layer.md`).
