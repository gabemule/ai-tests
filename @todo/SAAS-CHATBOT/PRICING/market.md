# PRICING — Market benchmark (apples vs. apples)

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔁 **Re-audit monthly.** Competitor plans change often — these are live snapshots (2026-06-14),
> not contracts. See `VALIDATION-PROMPTS.md` (this folder) for the per-file re-validation prompt.

---

## §2 — Market benchmark (apples vs. apples)

Comparable "chatbot on your docs" tools. **Prices verified live on 2026-06-14** (monthly,
USD, standard/non-enterprise tiers). Treat as a snapshot — these vendors re-price often.

### §2.1 — Plans (verified)

| Tool | Free | Entry | Mid | Top (self-serve) | Billing cadence |
|---|---|---|---|---|---|
| **Chatbase** | $0 | Hobby $40 | Standard $150 | Pro $500 | monthly; annual ~−20% |
| **SiteGPT** | trial | Starter $39 | Growth $79 | Scale $259 | monthly; annual cheaper |
| **CustomGPT** | $0 trial | Standard $99 | — | Premium $499 | monthly; annual $89/$449 |
| **DocsBot** | $0 | Personal $49 | Standard $149 | Business $499 | monthly; annual ~2 mo free |
| **My AskAI** | trial | Pro $199 | — | Scale $499 | monthly; + per-resolution option |
| **Botpress** | $0 (100 conv) | Plus $189 | — | Team $939 | monthly ($150/$750 annual) + AI usage |
| **Voiceflow** | trial | usage-based | — | custom / demo | pay-as-you-go (no fixed self-serve tiers) |
| **Dante AI** | $0 | Starter $40 | — | Pro $400 | monthly ($33/$333 annual) |
| **Chatling** | $0 | Standard $40 | — | Plus $140 | monthly |
| **Intercom Fin** | — | seats $39–$139 | — | + $0.99 / resolution | per-seat + per-resolution |

### §2.2 — LLM billing model + payment methods

| Tool | LLM billing model | BYOK option? | Payment methods* |
|---|---|---|---|
| **Chatbase** | **Bundled** message credits + paid auto-recharge credits | no | card (Stripe) |
| **SiteGPT** | **Bundled** message credits | no | card (Stripe) |
| **CustomGPT** | **Bundled** query credits | no | card (Stripe) |
| **DocsBot** | **Bundled** message credits | **yes** (provide own OpenAI key) | card (Stripe) |
| **My AskAI** | **Bundled** + optional **per-resolution** (~$0.10/resolution) | no | card (Stripe) |
| **Botpress** | **Hybrid**: plan + **pay-as-you-go AI spend** (metered) | partial | card (Stripe) |
| **Voiceflow** | **Usage-based** + **BYOM** (bring your own model/provider) | **yes** (all major providers) | card (Stripe) / invoice |
| **Dante AI** | **Bundled** message credits | no | card (Stripe) |
| **Chatling** | **Bundled** message credits | no | card (Stripe) |
| **Intercom Fin** | **Pay-per-resolution** ($0.99/successful resolution) | no | card (Stripe) / invoice (annual) |

> *Payment methods reflect the standard self-serve checkout (card via Stripe is universal);
> enterprise/annual deals typically add **invoice / ACH / wire**. Methods were **not** deep-verified
> per-vendor checkout — confirm at purchase. **None advertise PIX/boleto** → a clear BR opening for us.

> **Key insight:** the mainstream pattern is **bundled** — the LLM token cost is baked into the
> plan price (and marked up invisibly), so vendors must meter messages tightly and cap hard. A
> minority break the mold: **Voiceflow** (usage-based + BYOM), **Botpress** (plan + pay-as-you-go
> AI), and **Intercom Fin** (pay-per-resolution). **DocsBot** is the rare one allowing **BYOK**.
> So comparing a bundled plan to our **BYOK** plan is apples-to-oranges (their token cost is
> *inside* the price; ours is on the customer's separate provider bill). The honest comparison is
> **TCO** (`README.md` §3), and the directly-comparable offer is **our Managed mode**.

### §2.3 — Concorrentes BR (visão local)

BR players verified live on **2026-06-14** (browser/site capture). Most are **atendimento/CX
suites** or **lead-gen**, not pure "chatbot-on-your-docs" RAG — but they set the **local price
anchors** and reveal how the BR market packages IA. The crucial column (per Barney) is **caps +
whether IA/LLM is bundled or charged à parte**: knowing only the headline price is a blind
comparison.

| Tool | Foco | Faixa (R$/mês) | Caps incluídos | IA/LLM incluído? | RAG-comparável? |
|---|---|---|---|---|---|
| **Blip** (Take Blip) | Atendimento/conversational | Sob consulta (enterprise) | atendentes ilimitados, conversas sob demanda | n/d (enterprise) | parcial |
| **Zenvia** | Omnichannel/CX | R$0 → R$600 → R$1.800 → R$3.900 | Starter: 1 usuário, **100 interactions, SEM IA**; Specialist: 10 usuários, 500 interactions; Expert: 30 usuários, 2.000 interactions | **À parte** — IA Generativa só do Specialist (R$600) p/ cima; "interactions" = créditos que escalam c/ tier | parcial |
| **Huggy** | Atendimento digital | R$0 → **a partir de R$579** → **a partir de R$989** | não públicos (anual −20%) | n/d | parcial |
| **Weni** (by VTEX) | Conversational AI (Agent Builder) | Sob consulta (só demo) | n/d | n/d (enterprise) | sim |
| **Leadster** | Geração de leads | R$0 → R$142 → R$154 | Free: **15 leads/mês**, 1 fluxo; Starter: leads ilimitados, 3 fluxos; Pro: tudo ilimitado · escala por acessos/mês | **À parte** — "Leadster AI" é recurso **exclusivo do tier Full** (acima de Free/Starter/Pro) | parcial |
| **Octadesk** (Locaweb) | Atendimento omnichannel | **a partir de R$2.100** (+ Octa Suíte sob proposta) | não públicos | n/d | parcial |
| **Tallos** (RD Station) | Atendimento/CRM | **R$989** (até 500 clientes) → R$2.699 (até 3.000) | escala por volume de clientes/mês; agentes de IA nativos inclusos | **Híbrido** — agentes inclusos, mas **IA generativa = saldo à parte (mín R$300, validade 12 meses)** | sim |
| **Movidesk** | Help desk/atendimento | **a partir de R$700** (10 usuários, 500 interactions) | modelo por agente: R$199,90/agente, **mín 5 agentes** + consultoria de implementação | n/d | parcial |
| **Botmaker** | Chatbot omnichannel | R$0 → R$600 → R$1.100 → R$2.250 | R$600: **até 900 conversas** (R$0,46 extra); R$1.100: até 1.800 (R$0,40); R$2.250: até 4.300 (R$0,31); 300 conversas grátis iniciais | **Bundled** — agentes de IA inclusos; custo/conversa cai com volume | sim |

> **Note:** payment methods (PIX/boleto) were **not** consistently verifiable across these
> SPA-heavy sites; left out rather than guessed. 9 players captured live; a 10th (JivoChat) was
> not confirmed, so it's omitted rather than invented.

> **Key insight (BR):** two patterns dominate locally. (1) **IA is frequently a separate cap/saldo,
> not bundled** — Zenvia gates IA Generativa above R$600 (and meters "interactions"), **Leadster**
> locks AI behind a higher **Full** tier, **Tallos** sells generative IA as a **prepaid saldo (mín
> R$300)** on top of the plan. (2) Several leaders are **enterprise / "sob consulta"** (Blip, Weni,
> Octadesk), so there's **no transparent self-serve price** at all. Entry tickets are also **much
> higher** than the global SaaS tools (R$579–R$2.100/mo vs. our R$99–R$599). This reinforces our
> positioning: a **transparent, self-serve** ladder with IA at a **simple, predictable per-message
> price** (Managed on every tier; BYOK only as an Enterprise add-on, `billing.md` §4.3) — plus
> **PIX/boleto**, which none of these advertise either.
> Market-adjacency / extension ideas born from this benchmark live in `../FUTURE/` (channels, agent
> console, ticketing, quality metrics, embedded AI layer).
