# SAAS-CHATBOT — Pricing & Infra Cost

> Infra cost model + plan/pricing design for the whitelabel RAG chatbot platform.
> Companion to `PLAN.md` (roadmap/decisions) and `ARCHITECTURE.md` (components).
> Last updated: 2026-06-14
>
> **Estimates, not quotes.** Provider prices drift; treat all numbers as order-of-magnitude
> anchors to reason about plans and margins, not as a billing source of truth.
>
> **Basis:** the model/pricing strategy here is grounded on three companion analyses in
> `ANALYSIS/` — `model-benchmark.md` (quality scores), `openrouter-pricing.md` (per-token cost)
> and `infra.md` (local/self-host breakeven) — with **all model prices re-validated live on
> OpenRouter on 2026-06-14** (see §1.5 and the revalidation links in §12).

---

## 1. Cost model — what *we* actually pay

The biggest variable cost of RAG is **generation tokens**. We support two billing modes:
**Managed** (default, all tiers — we hold the key and bill the customer) and **BYOK** (an
Enterprise-only paid add-on, §4.3 — the customer brings their own key). In Managed, the customer pays **our own per-message price
anchored on the cost of the premium model** (Sonnet 4.6 — our chosen sweet spot, §1.5), charged
**with no explicit markup**. The margin is generated **structurally by our routing intelligence**:
a cheaper near-premium model (Qwen3.7 Plus) runs under the hood for the vast majority of queries,
and the spread `anchor cost − real blended cost ≈ 85%` is ours (see §8). In BYOK the token cost
isn't ours at all. Either way our *own* fixed cost structure stays lean: **fixed infra** +
**managed embeddings**.
> **Why no markup (changed 2026-06-14):** we used to model a ~20% markup on top of cost. The
> analyses showed that's noise next to the real lever — **model substitution**. By anchoring the
> *price* on the premium model's cost (Sonnet 4.6, $9/1M) and *running* a blended mix at ~$1.35/1M,
> the routing spread alone is **~85% margin** — far larger and more durable than any markup. So we
> **drop the markup entirely**: price = premium-model cost, margin = routing (§1.5, §8).
> **Internal vs. public:** the routing spread is an **internal margin mechanism, not public
> material.** Publicly we present a single **per-message price** and a **consumption dashboard** —
> never the "provider cost + spread" breakdown.

### 1.1 Fixed infra — per-service tier tables

**All prices verified live on 2026-06-14** (snapshot — providers re-price often). We list each
service's *real tiers* because **as we scale we move up tiers** and recompute infra accordingly
(see §1.2 for the per-scale-stage mapping).

**Supabase** — Postgres + pgvector + Storage + Auth

| Tier | Cost/mo | What you get |
|---|---|---|
| Free | $0 | 500MB DB, 1GB file storage, 5GB egress, 50k MAU · **pauses after 1 week idle** (max 2 projects) |
| **Pro** | **$25** | 8GB DB, 250GB egress, 100GB file storage, 100k MAU, daily backups (7d), **incl. $10 compute credit (1 Micro free)** |
| + DB overage | $0.125/GB disk · $0.09/GB egress · $0.0213/GB storage | beyond included |
| + Compute Small / Medium | $15 / $60 | 2GB / 4GB RAM DB instance |
| + Compute Large / XL / 2XL | $110 / $210 / $410 | 8GB / 16GB / 32GB RAM |
| Team | $599 | SOC2/ISO, SSO, 14d backups |

**Railway** — NestJS API + Python worker (always-on containers)

| Tier | Cost/mo | What you get |
|---|---|---|
| Trial | — | one-time $5 grant · **no real free tier** |
| **Hobby** | **$5** | includes $5 usage, then metered |
| **Pro** | **$20** | includes $20 usage, then metered by RAM/CPU/network |
| Beyond included | metered | RAM/CPU/egress overage on top of the plan |

**Vercel** — Next.js admin portal

| Tier | Cost/mo | What you get |
|---|---|---|
| Hobby | $0 | **non-commercial only** (can't use for the SaaS) |
| **Pro** | **$20 / developer seat** | includes $20 usage credit (viewer seat $10), then metered |

**Cloudflare** — Widget (Pages + R2 + CDN)

| Item | Cost | What you get |
|---|---|---|
| Pages | $0 | generous free tier for static widget hosting |
| R2 storage (free) | $0 | first 10GB-month |
| R2 storage (paid) | $0.015 / GB-mo | beyond 10GB |
| **R2 egress** | **FREE** | the standout — global widget serving costs ~only storage |
| R2 Class A / B ops | $4.50 / $0.36 per M | writes / reads |

**Upstash QStash** — job queue (API ↔ worker)

| Tier | Cost/mo | What you get |
|---|---|---|
| Free | $0 | hobby/prototype volume (daily message limit) |
| Pay-as-you-go | $1 / 100k msg | 1M messages free, then metered |
| Fixed | $180 | 10M messages included |
| + Enterprise SLA | +$200 | uptime SLA, SOC2 |

**Stripe** — payments (subscriptions + Managed wallet)

| Method | Fee | Note |
|---|---|---|
| US card (online) | 2.9% + $0.30 | standard |
| BR card | 3.99% + R$0.39 | national cards |
| Intl card (in BR) | 9.99% | foreign cards billed in BR |
| **PIX** | **1.19%** | no fixed fee · **invite-only** for now · real BR margin lever (ADR #12) |
| Boleto | R$3.45 / paid boleto | available for BR |


> **Correction vs. earlier draft:** Railway **no longer has a real free tier** (it's $5/mo Hobby
> minimum now), and Supabase pauses Free projects after ~1 week idle. R2's **zero egress** is the
> standout — serving the widget globally costs basically only storage. **Stripe PIX at 1.19%** (BR)
> is dramatically cheaper than card (3.99% + R$0.39) — a real margin lever once we add it (ADR #12).

### 1.2 Infra by scale stage (which tiers each load needs)

As tenant count and data grow we **graduate up tiers**. The mapping below ties a load stage to a
concrete per-service config and the resulting monthly infra cost. **Tenant counts are estimates**
(marked as such); the per-service tiers come from the verified §1.1 tables.

| Stage | Tenants *(est.)* | Supabase | Railway | Vercel | R2 + QStash | **~Total/mo** |
|---|---|---|---|---|---|---|
| **MVP** | 1–5 free/test | Free $0 | Hobby $5 | Hobby $0 | free | **~$5** |
| **Early** | ~10–25 paid | Pro $25 | Pro $20 (API) + Hobby $5 (worker) | Pro $20 | ~$1 | **~$71** |
| **Growth** | ~50–100 | Pro $25 + Small compute $15 | Pro $20 ×2 | Pro $20 | ~$5 | **~$105** |
| **Scale** | ~200–500 | Pro $25 + Medium $60 + extra storage | Pro $20 ×2 + metered ~$40 | Pro $20 + extra seat | ~$15 | **~$220** |

> The jump from **MVP (~$5)** to **Early (~$71)** is the steepest *relative* step — it's where the
> first paying tenants force always-on Railway Pro + Supabase Pro. After that, infra grows
> **sub-linearly** with tenants (Growth ~$105 for ~10× the MVP load, Scale ~$220 for ~100×), so
> margin per tenant **improves** as we climb (see the cost × revenue scenarios in §7).

### 1.3 Managed embeddings (our only real fixed AI cost)

We generate embeddings (decision: embeddings are always managed, never BYOK). Cost is small.

**Decision (2026-06-14): default = Qwen3 Embedding 8B; OpenAI = fallback only.** Qwen3 Embedding 8B
is the most-popular embedding on OpenRouter, multilingual + long-text, at **half** the price of
OpenAI `text-embedding-3-small`. OpenAI stays as a **fallback** for availability/compliance, not the
default.

**Top embedding options — verified live on OpenRouter 2026-06-14** (sorted by popularity; see §12
for revalidation links):

| # | Model | Price /1M | Context | Provider | Role / Note |
|---|---|---|---|---|---|
| 1 | **Qwen3 Embedding 8B** ⭐ | **$0.01** | 32K | qwen | **new default** — multilingual, top popularity (209B tok) |
| 2 | OpenAI `text-embedding-3-small` | $0.02 | 8K | openai | **fallback** (former default) |
| 3 | Google Gemini Embedding 001 | $0.15 | 20K | google | MTEB multilingual leader |
| 4 | OpenAI `text-embedding-3-large` | $0.13 | 8K | openai | higher quality |
| 5 | Qwen3 Embedding 4B | $0.02 | 33K | qwen | smaller sibling |
| 6 | Perplexity Embed V1 0.6B | **$0.004** | 32K | perplexity | cheapest paid; low-latency |
| 7 | BAAI bge-m3 | $0.01 | 8K | baai | open, multilingual |
| 8 | Google Gemini Embedding 2 | $0.20 | 8K | google | multimodal |
| 9 | Mistral Embed 2312 | $0.10 | 8K | mistralai | RAG-focused |
| 10 | NVIDIA Llama Nemotron Embed VL 1B V2 | **$0 (free)** | 131K | nvidia | free, multimodal |

> SentenceTransformers (self-host) remains an option (compute-only, "free" if we run it) for a
> future zero-API-cost tier.

Embedding is a **one-time cost per document** (re-embed only on change) + a tiny per-query cost.
Example: ingesting a 200-page PDF (~100k tokens) with Qwen3 8B (`$0.01/1M`) ≈ **$0.001**. Negligible.


> **Two embedding cost surfaces, both covered by the plan:**
> 1. **Ingestion embedding** — document → vectors. One-time per doc, **plus re-embeds when content
>    changes** (knowledge-sync, `FUTURE/07`). This is the **only embedding cost that can grow** with a
>    tenant, so it's bounded by a **reingestion budget** per plan (see §6 / §7.3).
> 2. **Query-time embedding** — every chat question is embedded before retrieval. Tiny: e.g. Pro at
>    2,000 msgs/mo × ~50 tokens ≈ 100k tokens ≈ **$0.000002/mo**. Folded into the plan/per-message
>    price; never billed separately.
>
> **Rule of thumb:** at **$0.02/1M tokens**, embedding costs **~$0.005 per MB of text** (1MB ≈ 250k
> tokens). So a tenant's max embedding cost ≈ `storage_MB × K × $0.005`, where **K = how many times
> per month the base is reprocessed** (see §7.3). K is the only real AI cost lever per tenant.


### 1.4 What the **customer** pays

- **Managed mode (default):** the customer pays **our own per-message price** out of a prepaid
  wallet. That price is **anchored on the cost of the premium model** (Sonnet 4.6 — §1.5), so it
  covers cost no matter what runs, while our **router** picks a cheaper near-premium model under the
  hood — the spread (~85%) is ours (see §8). Publicly the customer sees **a single per-message price
  + a consumption dashboard** ("you used N messages → R$ X"), never the provider cost or the spread.
- **BYOK mode (Enterprise-only add-on, §4.3):** the customer's own LLM generation tokens, billed by
  their provider — **never on our bill**.

> **Consumption transparency ≠ cost transparency.** We give customers full visibility into *what
> they used and will pay* (the consumption dashboard); we owe them **nothing** about *what we paid
> the provider* or our margin — exactly like AWS/Twilio/Vercel publish their own unit price, not
> "supplier cost + X%". Three caveats we keep in mind:
> 1. **BYOK makes the spread deducible** — a BYOK customer comparing their own provider bill to our
>    Managed per-message price can infer the routing margin. So Managed is never sold as "no markup";
>    it's sold on **convenience + predictable price** (no provider account to manage; our price
>    doesn't swing when token prices do). **Restricting BYOK to Enterprise** (few accounts, under
>    contract/NDA — see §4.3) keeps this deduction out of the self-serve tiers entirely.
> 2. **Avoid "transparent / no hidden markup" copy** — it contradicts the model. Say **"preço
>    simples e previsível"** + **"acompanhe seu consumo"**.
> 3. **The anchor is the premium-model cost** — calibrated on Sonnet 4.6 today; revisit with real
>    usage data before lowering it (lower = a competitive lever we *choose* to pull, not a default).

### 1.5 Model layer & routing intelligence (the margin engine)

This is where the margin comes from. We **anchor the per-message price on the cost of the premium
model** and let the **router** run a cheaper blended mix under the hood. **All prices re-validated
live on OpenRouter 2026-06-14** (avg = (input+output)/2 per 1M tokens; §12 for links).

| Role | Model | Score* | In $/1M | Out $/1M | **Avg $/1M** | Note |
|---|---|---|---|---|---|---|
| **Anchor (price)** ⭐ | **Sonnet 4.6** | 97 | $3 | $15 | **$9.00** | the price the customer pays; the sweet spot |
| Premium alt | Opus 4.8 | 100 | $5 | $25 | $15.00 | top quality; pricier anchor option |
| Premium alt | GPT-5.5 | 99 | $5 | $30 | $17.50 | most expensive |
| **Principal (80%)** ⭐ | **Qwen3.7 Plus** | n/d | $0.40 | $1.60 | **$1.00** | new main workhorse (promo: $0.32/$1.28 = $0.80) |
| Principal alt | Qwen3.6 Plus | 96 | $0.50 | $1.75 | $1.1375 | prior analysis main (promo: $0.325/$1.95) |
| Principal alt | Qwen3.7 Max | n/d | $2.50 | $7.50 | $5.00 | flagship Qwen (promo: $1.25/$3.75 = $2.50) |
| **Econômico (15%)** ⭐ | **DeepSeek V4 Pro** | 89 | $0.435 | $0.87 | **$0.6525** | best-ROI cheap tier |
| Econômico alt | Kimi K2.6 | 90 | $0.68 | $3.41 | $2.045 | strong coding/UI |
| Econômico alt | DeepSeek V3.2 | 84 | $0.2288 | $0.3432 | $0.286 | cheapest competent |

> *Quality score from `ANALYSIS/model-benchmark.md` (100 = best). Qwen3.7 Max/Plus are newer than
> the benchmark, so no score yet — placed by price/positioning.

**Chosen routing mix (Option B — "optimized"):**

| Share | Model | Avg $/1M |
|---|---|---|
| 80% | Qwen3.7 Plus | $1.00 |
| 15% | DeepSeek V4 Pro | $0.6525 |
| 5% | Sonnet 4.6 (hard queries) | $9.00 |

- **Blended cost (full price, conservative)** = `0.80×$1.00 + 0.15×$0.6525 + 0.05×$9.00` ≈ **$1.35/1M**
- **Margin vs. anchor** = `($9.00 − $1.35) / $9.00` ≈ **85%**
- With **launch promos** still active the blend drops to ~**$1.26/1M** (~86%) — but we size margins
  on **full price** so a promo expiry never breaks the model.

> **Why Sonnet 4.6 as the anchor (not Opus/GPT-5.5):** at score 97 it's ~1 point below the
> 99–100 frontier while costing **40–49% less** ($9 vs $15–17.5/1M). The quality gap a customer
> *perceives* is negligible; the cost gap is not. It's the sweet spot — premium-grade price the
> customer trusts, with the most headroom for the routing spread underneath.

---

## 2. Market benchmark (apples vs. apples)

Comparable "chatbot on your docs" tools. **Prices verified live on 2026-06-14** (monthly,
USD, standard/non-enterprise tiers). Treat as a snapshot — these vendors re-price often.

### 2.1 Plans (verified)

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

### 2.2 LLM billing model + payment methods

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
> **TCO** (§3), and the directly-comparable offer is **our Managed mode**.

### 2.3 Concorrentes BR (visão local)

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
> price** (Managed on every tier; BYOK only as an Enterprise add-on, §4.3) — plus **PIX/boleto**,
> which none of these advertise either.
> Market-adjacency / extension ideas born from this benchmark live in `FUTURE/` (channels, agent
> console, ticketing, quality metrics, embedded AI layer).

---

## 3. TCO — the fair comparison

For a customer, the real number is **Total Cost of Ownership** = platform price + LLM cost.

```
Competitor (bundled)   = plan price (token cost already inside, marked up ~hidden)
Our BYOK               = our plan price + customer's own provider bill
Our Managed            = our plan price + prepaid wallet spend (our per-message price)
```

**Worked example** — a tenant running ~3,000 chats/mo, ~1.5k tokens each (gpt-4o-mini-class):

| Path | Platform | LLM cost | TCO / mo |
|---|---|---|---|
| Competitor bundled | ~$99 | (included, opaque) | **~$99** but hard message cap |
| **Our BYOK** | $39 (Pro) | ~$3–8 on customer's own OpenAI bill | **~$42–47** |
| **Our Managed** | $39 (Pro) | ~$5–12 wallet (our per-message price) | **~$44–51** |

> Our **Managed** mode is the like-for-like competitor: a **single, predictable per-message price**
> (not a per-token bill the customer has to model) vs. their embedded/opaque markup — at a **lower
> platform base price** and with **higher message ceilings** (we don't have to cap hard to protect a
> bundled token budget). The per-message price is anchored on the premium model (Sonnet 4.6); our
> router keeps the real cost below it via the cheaper blended mix (the spread is our margin, see §8).
> The **BYOK** row above is kept only to illustrate TCO — on the live ladder BYOK is **Enterprise-only**
> (§4.3), so for self-serve tiers the real comparison is **Managed vs. competitor bundled**.

---

## 4. LLM billing modes

Two ways a tenant can power chat generation:

| Mode | How it works | Best for | Our financial risk |
|---|---|---|---|
| **Managed** (default, all tiers) | We use our key, **meter usage locally**, bill via a **prepaid wallet** at **our per-message price** (anchored on the premium model, Sonnet 4.6; router runs a cheaper blended mix, the spread is our margin) | Every customer, Free → Enterprise | Controlled via prepaid + caps |
| **BYOK** (Enterprise add-on) | Tenant brings their LLM key; we never touch their billing | Enterprise accounts with compliance/data-residency/dedicated-key needs | **None** (but **forgoes our spread** — priced as a paid add-on, §4.3) |

> **Managed-first positioning:** Managed is the **default mode on every tier** — it's where our
> **routing spread (~85%, §8)** is earned, and the spread now exists **across the whole ladder**
> (Free → Enterprise), not just from Pro up. Pricing is directly comparable to competitors (§3).
> **BYOK is no longer a self-serve option** on the paid ladder — it became an **Enterprise add-on**
> (§4.3), because every BYOK tenant is a tenant where we earn **$0 on tokens** (no spread) *and*
> can deduce our margin (§1.4).

> **Phasing:** BYOK ships first in F1–F2 as the **technical** bootstrap (zero financial risk, no
> wallet needed yet). **Managed** ships in **F4 (GA)** alongside billing-lite and becomes the
> **default for all tiers**; from GA onward, **BYOK is offered only as a paid Enterprise add-on**
> (§4.3), not as a self-serve mode.

### 4.1 Managed = Prepaid Wallet + Auto-Recharge

Each Managed tenant has a **credit wallet** (USD/BRL balance) — **on every tier, Free → Enterprise**
(Free runs on a small included starter balance; see §6.2). Every Managed message debits **our
per-message price** from the balance (anchored on the premium model, Sonnet 4.6; the
router keeps the real cost below it, so the spread is our margin — §8). The customer sees the
**per-message price and their consumption**, not the underlying cost or spread.

Customer-configurable controls:

| Setting | Example | Purpose |
|---|---|---|
| Manual top-up | buy $50 | initial / ad-hoc credit |
| Auto-recharge trigger | "when balance < $5" | low-balance threshold |
| Auto-recharge amount | "buy $50" | how much to re-buy |
| Monthly spend cap | "max $200 / month" | hard ceiling per period |
| Payment method | saved card (Stripe) | source of charges |

**Auto-recharge flow:**

```
chat consumes credit → balance drops below trigger ($5)
   → month spend < cap?  → YES: charge $50 on card (Stripe) → credit wallet
                         → NO  (cap reached): do NOT recharge → Managed service pauses
                               (alert customer; they can raise the cap or top up manually)
```

**Hard cap is real-time** because metering is **local and immediate** (see §5): we block the
*next* request the instant the balance hits zero or the monthly cap is reached — no dependence
on the provider's delayed usage API.

### 4.2 Safeguards (the tricky corners)

- **Anti-loop recharge:** cap auto-recharges per window (e.g. **max 3/day**) — protects the
  customer's card against a bug or abuse spiral.
- **Idempotent charges:** every Stripe charge uses an idempotency key (never double-charge one trigger).
- **Reserve/hold:** debit an *estimate* before the request, reconcile to actual cost after —
  prevents a negative balance under concurrent requests.
- **No credit expiration:** purchased credit doesn't expire (friendlier, simpler).
- **Alerts:** email/webhook on *low balance*, *auto-recharge done*, *cap reached / service paused*.

### 4.3 BYOK as a paid Enterprise add-on

In the new margin model the business runs on the **routing spread** (~85%) earned in **Managed**
(§8). Every BYOK tenant is therefore a tenant where we earn **$0 on tokens** *and* who can deduce
our margin (§1.4). So BYOK is **no longer a self-serve mode** — it's an **Enterprise-only add-on**,
repositioned and **priced**:

- **What it's sold as (value):** governance, not savings — **own provider key**, **data residency /
  compliance**, **dedicated capacity**, contractual control over the model relationship. This is
  exactly what Enterprise buyers ask for; the per-token economics are a side effect, not the pitch.
- **What it's *not* sold as:** "bring your own key to save money / avoid our markup". That framing
  invites the exact spread-deduction we want to avoid (§1.4) and trains the customer to see our
  Managed price as a markup.
- **How it's priced — negotiated case-by-case, with a floor:** Enterprise is already "custom / sob
  consulta", so BYOK enters as a **negotiated add-on** with **no public number**. Internally we set
  a **floor referenced on the spread we forgo**: a BYOK tenant projected at ~1B tokens/mo is giving
  up ~**$7.6k/mo** of spread (§8.2), so the governance fee must recapture a meaningful share of that
  — we never sell BYOK below the floor where it becomes cheaper for us to just run Managed.

> **Net effect:** Managed stays the universal default (margin across the whole ladder); BYOK becomes
> a deliberate, paid Enterprise lever for accounts that genuinely need it — priced so it never
> quietly erodes the spread that funds the business.

---

## 5. Metering (the source of truth)

- **Local metering in `llm-adapters` is the source of truth.** Every request counts input/output
  tokens from the provider response and writes `usage` per tenant/bot/message. It is **immediate**
  (enables real-time hard cap) and **uniform** (same code across all providers, BYOK or Managed).
- **Per-tenant provider sub-key (where supported, e.g. OpenAI Projects)** is a **secondary layer**:
  isolates blast radius (a leaked key affects one tenant) and lets us **reconcile** our numbers
  against the provider invoice monthly to detect drift. It is **not** the primary meter.

> This also elevates `llm-adapters` from "a wrapper" to the platform's **governance/metering point**.

---

## 6. Plans

Prices shown in **USD + BRL** (psychological pricing per currency, not a raw FX conversion).
**Managed is the default mode on every tier**; **BYOK is an Enterprise-only paid add-on** (§4.3).
"Messages/mo" measures **platform usage**, not LLM cost (the wallet covers generation),
so we can be generous vs. competitors that bake the token into the price.

| Plan | USD | BRL | Bots | Docs / Storage | Messages/mo | Members | Domains | Doc types | LLM modes |
|---|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | R$0 | 1 | 20 / 25 MB | 100 | 1 | 1 | txt/md/html/pdf | **Managed** |
| **Starter** | $19 | R$99 | 1 | 50 / 100 MB | 500 | 1 | 1 | + docx/csv | **Managed** |
| **Pro** | $39 | R$199 | 3 | 200 / 250 MB | 2,000 | 3 | 3 | + docx/csv/xlsx | **Managed** |
| **Business** | $119 | R$599 | 10 | 1,000 / 2 GB | 10,000 | 10 | 10 | all + OCR | **Managed** |
| **Enterprise** | custom | custom | ∞ | custom | custom | custom | custom | all + OCR | **Managed** + BYOK *(paid add-on)* |

> **Price change (2026-06-14):** Starter $10→**$19** and Business $89→**$119** (BRL adjusted to
> R$99 / R$599). Rationale: the worst-case **reingestion** cost (storage × K, see §7.3) compresses
> margin on the larger tiers; the new prices keep every plan comfortably ≥45% margin even at the
> usage ceiling. Pro stays $39 (its worst case is already healthy).

### 6.1 Reingestion budget (per plan)

Embedding is the only AI cost that grows per tenant (§1.3). It's bounded by a **reingestion
budget** = how many times per month a tenant may reprocess their whole base. Expressed as a
multiple **K** of storage: `monthly reingest volume ≤ K × storage`.

| Plan | Storage | **K (launch)** | Reingest budget/mo | Knowledge-sync (`FUTURE/07`) | Min sync cadence |
|---|---|---|---|---|---|
| **Free** | 25 MB | 3× | 75 MB | ❌ manual upload | — |
| **Starter** | 100 MB | 3× | 300 MB | ❌ manual upload | — |
| **Pro** | 250 MB | 3× | 750 MB | ✅ 1 source | every **24h** (poll) |
| **Business** | 2 GB | 3× | 6 GB | ✅ up to 5 sources | every **1h** / webhook |
| **Enterprise** | custom | custom | custom | ✅ unlimited | near-real-time (push) |

- **Launch K = 3, approved ceiling = 5×.** We start **cautious** (K=3) and only loosen toward 5×
  once real usage data justifies it (deliberate move, not a default — same posture as the Managed
  anchor price, §1.4).
- **K is uniform across tiers** (never lower on a bigger plan — that would be incoherent). The
  *absolute* budget still grows because storage grows.
- **Incremental re-embed by chunk** (decision, see `PLAN.md` ADR) makes the *effective* K ~1–2 in
  real use: when a doc changes we re-embed **only the changed chunks**, not the whole file. So the
  nominal budget can be generous while the real cost stays far below the worst case.
- **On hitting the budget: degrade, don't block.** Pause re-embeds for that doc until the next
  cycle + alert — never block the live chat (the existing base keeps answering).
- A secondary **per-doc re-embed counter** is kept for **observability** (isolate a pathological
  doc), not as the billing cap — the volume budget above is the cap.

### 6.2 Limit rationale

- **Bots / domains / members** — near-zero marginal cost; they're *product* gates that map to
  customer size, not infra cost. Cheap to be generous, but they anchor plan value.
- **Docs / storage** — real (small) cost driver; main lever that scales with tenant data.
- **Reingestion (K × storage)** — a **guardrail against runaway re-embed loops** (e.g. a synced
  doc changing 50×/day), **not** a revenue line: embedding is ~$0.005/MB, so this exists to cap
  worst-case exposure (§7.3), not to bill ingestion. Query-time embedding is folded into the plan.
- **Messages/mo** — proxy for compute + query-embedding load; soft cap with overage or upgrade prompt.
- **Doc types** — advanced loaders (docx/csv/xlsx, OCR) gated up the ladder (more to build/run).
- **Managed LLM** — default on **every tier** (Free → Enterprise): it's where the routing spread
  (~85%, §8) is earned, so we want margin across the whole ladder, not just from Pro up. **Free runs
  100% on the economy tier** (Qwen3.7 Plus / DeepSeek V4 Pro) on a small included starter balance —
  its token cost is negligible (100 msgs/mo ≈ ~150k tokens ≈ ~$0.0002 on the mix) and a hard wallet
  cap keeps it at zero risk.
- **BYOK** — **Enterprise-only paid add-on** (§4.3), sold on governance/compliance, never as a
  cost-saving option; priced (negotiated, with a floor) so it never erodes the Managed spread.


---

## 7. Net margin analysis

Every paid tier is **Managed** now (BYOK is an Enterprise-only add-on, §4.3), so per tenant the
token cost is **covered by the wallet** and the routing spread (~85%, §8) is pure upside on top —
only a few cents of embeddings/storage are actually ours. So plan price is almost pure margin
against fixed infra. After **Stripe fees** (US ~2.9% + $0.30; BR ~3.99% + R$0.39):

> **Margins below assume typical usage** (effective K ~1–2 thanks to chunk-level re-embed). For the
> **worst-case** ceiling (storage full × K=5 × full monthly reprocess) see **§7.3**.

**USD**

| Plan | Price | Stripe fee | Net after fee | ~Margin |
|---|---|---|---|---|
| Starter | $19 | ~$0.85 | ~$18.15 | ~95% |
| Pro | $39 | ~$1.43 | ~$37.57 | ~96% |
| Business | $119 | ~$3.75 | ~$115.25 | ~97% |

**BRL** (card 3.99% + R$0.39 — verified 2026-06-14)

| Plan | Price | Stripe fee (card) | Net (card) | Net (**PIX** 1.19%) | ~Margin |
|---|---|---|---|---|---|
| Starter | R$99 | ~R$4.34 | ~R$94.66 | ~R$97.82 | ~96–99% |
| Pro | R$199 | ~R$8.33 | ~R$190.67 | ~R$196.63 | ~96–99% |
| Business | R$599 | ~R$24.29 | ~R$574.71 | ~R$591.87 | ~96–99% |


> **PIX is a real margin lever in BR:** at **1.19%** (no fixed fee) it nets meaningfully more than
> card (3.99% + R$0.39) — e.g. Pro keeps ~R$6 more per charge. Adding PIX via the `PaymentProvider`
> abstraction (ADR #12) pays for itself fast on BR volume.

> **Break-even ≈ 3 Pro subscribers.** ~3 × $37.57 ≈ $113/mo net covers the entire **~$5–50/mo**
> fixed infra (Railway's $5 Hobby floor + Supabase Pro once you outgrow Free) with room to spare.
> Everything past that is margin. (Managed adds the **~85% routing spread** *on top* of wallet
> spend, so it's incremental margin, not a cost center.)

### 7.1 Cost × revenue per plan

Per-tenant economics (USD). **Marginal cost/tenant** = embeddings + storage + amortized
compute/queue (a few cents). The **Managed spread** column is the incremental margin from the
**~85% routing spread** on wallet spend (§8) — it now applies to **every paid tier** (all Managed),
and it's **pure upside on top** of the plan margin (the token cost itself is covered by the wallet).

| Plan | Price | Stripe fee | Marginal cost/tenant *(est.)* | **Net (plan)** | **+ Managed spread** *(est. ~85% on ~$5–25 wallet)* | Effective net |
|---|---|---|---|---|---|---|
| Starter | $19 | ~$0.85 | ~$0.05 | **~$18.10** | ~$1–4 | ~$19–22 |
| Pro | $39 | ~$1.43 | ~$0.10 | **~$37.47** | ~$4–21 | ~$41–58 |
| Business | $119 | ~$3.75 | ~$0.20 | **~$115.05** | ~$13–64 | ~$128–179 |


> The plan price alone is ~94–96% margin (fixed infra is shared across all tenants, not per-tenant).
> **Managed** adds a second, usage-proportional margin stream on top — the heavier a tenant chats,
> the bigger its wallet spend and the bigger our **~85% routing spread** (§8), with **zero token
> risk** (prepaid). A $25 wallet at the anchor price runs at ~$3.75 real cost → ~$21 is ours.

### 7.2 Cost × revenue by scale scenario

Ties a realistic tenant mix to the **correct infra stage** from §1.2 (so the infra cost reflects
the tier that load actually needs). Revenue is net-of-Stripe (card); **tenant counts are estimates**.

| Scenario *(est. mix)* | Infra stage (§1.2) | Infra/mo | Gross rev (net of fee) | **Result/mo** | Notes |
|---|---|---|---|---|---|
| 5× Starter | MVP ~$5 | ~$5 | ~$47 | **~+$42** | first paid tenants, infra still on free/hobby |
| 3× Pro | Early ~$71 | ~$71 | ~$112 | **~+$41** | break-even zone — infra (always-on) weighs most here |
| 10× Pro | Early ~$71 | ~$71 | ~$375 | **~+$304** | same infra tier, ~3× the revenue → margin jumps |
| 20× Pro + 5× Business | Growth ~$105 | ~$105 | ~$1,180 | **~+$1,075** | infra grew ~1.5×, revenue grew ~10× |
| 50× Pro + 20× Business | Scale ~$220 | ~$220 | ~$3,593 | **~+$3,373** | sub-linear infra; Managed extra (not shown) is pure upside on top |

> **The shape that matters:** infra is **near-fixed per stage**, so each additional tenant on the
> same tier is almost pure margin. The tight spot is the **Early stage** (~$71 infra for ~3–10
> tenants) — once you're past ~3 Pro you're firmly positive, and every tenant after that widens the
> gap fast. **Managed-mode wallets (§7.1) stack additional margin on top** of every scenario above.

### 7.3 Worst-case cost per tenant (the exposure ceiling)

The question this answers: **at the absolute usage ceiling, how much can one tenant cost us?** The
only AI cost that scales per tenant is **embedding** (§1.3): `embed_cost = storage_MB × K × $0.005`.
Everything else (query-embed, file storage) is rounding error. Below, the **embedding knob K** swept
across values — K is *the* lever (launch = 3, ceiling = 5).

| Plan | Storage | K=1 *(initial only)* | K=3 *(launch)* | K=5 *(ceiling)* | K=10 | K=30 |
|---|---|---|---|---|---|---|
| Free | 25 MB | $0.13 | $0.38 | $0.63 | $1.25 | $3.75 |
| Starter | 100 MB | $0.50 | $1.50 | $2.50 | $5.00 | $15.00 |
| Pro | 250 MB | $1.25 | $3.75 | $6.25 | $12.50 | $37.50 |
| Business | 2 GB | $10.24 | $30.72 | $51.20 | $102.40 | $307.20 |

> This is a **theoretical ceiling**: storage 100% full of text **and** the entire base re-embedded
> K times in one month. **Chunk-level re-embed** (`PLAN.md` ADR) keeps the *effective* K at ~1–2 in
> real use (edits touch a few chunks, not the whole file), so real cost lands near the **K=1–2**
> columns even when the nominal budget allows K=5.

**Total worst-case cost per tenant** — embedding (K=5 ceiling) **+ amortized infra/tenant + Stripe**.
Infra/tenant is highest at **Early** (~$71 spread over ~10 tenants ≈ $7.10) and falls fast as we scale
(Scale ≈ $0.88). This is the pessimistic envelope; typical tenants cost a fraction.

| Plan | Price | Infra/tenant *(Early ~$7.10)* | Embed (K=5) | Stripe | **Total cost** | **Worst-case margin** |
|---|---|---|---|---|---|---|
| Starter | $19 | $7.10 | $2.50 | $0.85 | **~$10.45** | **~45%** |
| Pro | $39 | $7.10 | $6.25 | $1.43 | **~$14.78** | **~62%** |
| Business | $119 | $7.10 | $51.20 | $3.75 | **~$62.05** | **~48%** |

> At **Scale** (infra/tenant ≈ $0.88) every worst-case margin above climbs ~10pp (Starter ~78%, Pro
> ~84%, Business ~53%). So the **worst time × worst usage** combo — few tenants *and* all of them
> maxing reingestion — is the only place margins compress, and even then the floor is **~45%**. The
> price bump (Starter $19, Business $119) was sized precisely to hold that floor.
>
> **Why this matters:** it bounds our downside. Even a pathological tenant on the biggest plan,
> abusing reingestion at the ceiling, during our most infra-fragile stage, still leaves ~48% margin —
> and chunk-level re-embed means almost nobody actually reaches it.

---

## 8. Managed cost optimization — router as a margin lever (F4+)


We price Managed **per message, anchored on the premium model (Sonnet 4.6, $9/1M)**, and the
customer pays that fixed price regardless of which model actually runs. So when our **router** sends
a query to a cheaper model (Qwen3.7 Plus at ~$1/1M as the principal, DeepSeek V4 Pro at ~$0.65/1M
for the economy tier), the difference (anchor price − real cost) is **ours** — the router isn't
"savings passed to the customer", it **is the margin** (the blended mix runs ~$1.35/1M vs the $9
anchor → ~85%, §1.5). The better the router, the bigger that stream → a direct incentive to keep
improving it.

- **Model routing / cascading** — classify each query's intent/complexity and route simple
  questions to the principal/economy models (Qwen3.7 Plus / DeepSeek V4 Pro), hard ones to the
  premium anchor (Sonnet 4.6). Customer pays the **anchor price** either way; the cheaper real cost
  is our spread. Works **in aggregate** (law of large numbers across many chats) — we don't throttle
  individual users to the cheap model, which would hurt quality; we route by complexity and let the
  mix average out. (See ADR #14; future `router-adapters` in `FUTURE.md`.)
- **Pricing posture (start safe):** charge the **premium-model (anchor) price** from day one; once
  we have real mix data, the average cost is known and we *can choose* to lower the anchor as a
  competitive lever — but that's a deliberate move, never the default.
- **Self-hosted Ollama (future exploration)** — run an open-source model on our own server with
  **no per-token cost**. Trades variable token cost for **fixed infra/GPU cost** — a 4th
  zero-token-cost routing tier that the `infra.md` analysis shows arrives **sooner than expected**:
  an **RTX 5090 (~R$18k)** running a Qwen3.6/DeepSeek-class model pays back in **~3.6 months** at
  just **100M Sonnet-equivalent tokens/mo** (and in **~15 days** at 1B tokens/mo). At our volumes
  this becomes a real lever — evaluate it as a zero-token-cost tier inside routing.

### 8.1 Managed billing variant — chosen: (b) Fixed per message

| Variant | How customer is billed | Pros | Cons |
|---|---|---|---|
| **(b) Fixed per message** ✅ **chosen** | flat per-message price, anchored on the premium model (Sonnet 4.6) | routing savings are **100% ours**; predictable bill; margin & router invisible | risk if a query is unusually heavy (absorbed in aggregate) |
| (a) Metered + markup | actual metered cost + ~20% | transparent, fair | **rejected** — hands the routing savings to the customer, killing the margin |
| (c) Prepaid credit + markup | generic credit balance + ~20% | simplest mental model | "credit" abstraction can feel opaque; same margin shape as (a) |

> **Decision:** go with **(b) Fixed per message** so the router becomes a real margin lever (§8),
> not just savings we give away. Heavy-query risk is absorbed **in aggregate** (law of large
> numbers); we calibrate the anchor with a buffer and monitor real mix before ever lowering it.
> The exact per-message price is set in **F4 (billing-lite)** once we have usage data.

### 8.2 Per-client simulation (the spread, by volume)

What a single Managed tenant earns us across realistic monthly token bands. **Revenue** = the
anchor price (Sonnet 4.6, $9/1M) the customer pays; **cost** = our blended routing mix (Option B,
$1.35/1M, full price — §1.5). The spread is the margin. (Per-token figures from
`ANALYSIS/openrouter-pricing.md`, re-validated 2026-06-14.)

| Tokens/mo | Revenue *(anchor $9/1M)* | Our cost *(mix $1.35/1M)* | **Spread (ours)** | Margin |
|---|---|---|---|---|
| 100M | $900 | $135 | **$765** | ~85% |
| 500M | $4,500 | $674 | **$3,826** | ~85% |
| 1B | $9,000 | $1,348 | **$7,652** | ~85% |
| 1.5B | $13,500 | $2,022 | **$11,478** | ~85% |
| 2B | $18,000 | $2,696 | **$15,304** | ~85% |

> **Reference points (single-model, no routing — from `ANALYSIS/openrouter-pricing.md`):** at 1B
> tokens/mo, pure Sonnet 4.6 = **$9,000**, pure Qwen3.6 Plus = **$1,138**, pure DeepSeek V4 Pro =
> **$652**. Our Option B blend (**$1,348**) sits just above the cheapest tiers while we charge the
> full Sonnet anchor — that gap is the whole business model.
>
> **The margin is volume-linear** (a fixed ~85% of revenue), so heavier tenants don't compress it —
> they *scale* it. This is why **Managed-first** (§4) and the **prepaid wallet** (§4.1) matter: every
> token a Managed tenant burns widens the spread, with zero token risk to us.

---

## 9. Payments & gateway

- **Stripe is the primary gateway** — off-session charges + card vault (needed for wallet
  auto-recharge), subscriptions for plans, USD & BRL, global reach, idempotency keys.
- **`PaymentProvider` abstraction** — all payment logic sits behind an interface so we can plug
  **Mercado Pago / Pagar.me (Stone) + PIX** for the BR market later without touching billing logic.
  (See ADR #12.) PIX in particular is a strong BR conversion lever (low fee, instant).

---

## 10. Billing roadmap (aligned with F4 billing-lite)

| Stage | Billing posture |
|---|---|
| **MVP (F1)** | No billing. Single tenant, BYOK only. |
| **Beta (F2–F3)** | Manual plans (invoice/Stripe Checkout), BYOK only. Usage counters live. |
| **GA (F4)** | Automated metering → Stripe subscriptions for plans; **Managed becomes the default on every tier** (prepaid wallet + auto-recharge + spend cap; pick a Managed billing variant §8.1); reconciliation against provider invoices; `PaymentProvider` ready for BR gateways. **BYOK is retired from self-serve and offered only as a paid Enterprise add-on** (§4.3). |

---

## 11. Open questions

- FX policy for BRL vs USD over time (fixed table vs. periodic review).
- Overage handling on `Messages/mo` (block vs. soft overage charge vs. upgrade nudge).
- Anchor calibration for Managed (anchored on the premium-model cost, Sonnet 4.6 $9/1M; revisit
  only as a deliberate competitive lever, never as a default).
- Real routing-mix monitoring: track the actual 80/15/5 split vs. plan and recompute the blended
  cost (~$1.35/1M) as model prices and query difficulty drift.
- Per-message price calibration (the anchor on the premium model + buffer) once F4 usage data lands.
- **BYOK Enterprise add-on floor** (§4.3): how to set the negotiated minimum — fixed monthly fee vs.
  a % of the forgone spread (~$7.6k/mo per 1B tokens) — and how to present it as governance, not
  cost-saving.
- Whether a higher-quality embedding (e.g. Gemini Embedding 001 or `text-embedding-3-large`) becomes
  a paid-tier upgrade, now that **Qwen3 Embedding 8B is the default** and OpenAI is fallback (§1.3).
- When (if ever) self-hosted Ollama volume justifies the fixed GPU cost vs. API tokens — `infra.md`
  suggests the RTX 5090 breakeven (~3.6 mo @ 100M tok/mo) arrives sooner than expected (§8).

---

## 12. Sources & revalidation

All model/token prices in this doc were re-validated **live on OpenRouter on 2026-06-14**. Prices
drift constantly — **re-audit periodically** (suggest monthly) via the links below and update §1.3,
§1.5 and §8.2 accordingly. Companion analyses live in `ANALYSIS/` (`model-benchmark.md`,
`openrouter-pricing.md`, `infra.md`).

**Generation models (avg = (input+output)/2):**

- Sonnet 4.6 (anchor) — https://openrouter.ai/anthropic/claude-sonnet-4.6
- Opus 4.8 — https://openrouter.ai/anthropic/claude-opus-4.8
- GPT-5.5 — https://openrouter.ai/openai/gpt-5.5
- Qwen3.7 Max — https://openrouter.ai/qwen/qwen3.7-max
- Qwen3.7 Plus (principal) — https://openrouter.ai/qwen/qwen3.7-plus
- Qwen3.6 Plus — https://openrouter.ai/qwen/qwen3.6-plus
- DeepSeek V4 Pro (econômico) — https://openrouter.ai/deepseek/deepseek-v4-pro
- DeepSeek V3.2 — https://openrouter.ai/deepseek/deepseek-v3.2
- Kimi K2.6 — https://openrouter.ai/moonshotai/kimi-k2.6

**Embeddings:**

- Qwen3 Embedding 8B (default) — https://openrouter.ai/qwen/qwen3-embedding-8b
- Full embeddings list (by popularity) —
  https://openrouter.ai/models?output_modalities=embeddings&order=most-popular
