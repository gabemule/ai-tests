# PRICING — Infrastructure

> Part of `PRICING/`. Companion to `PRICING/README.md`. Last updated: 2026-06-14.
> 🔁 Volatile — re-audit monthly (see `VALIDATION-PROMPTS.md` → infrastructure prompt).

## §1.1 — Fixed infra — per-service tier tables

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

## §1.2 — Infra by scale stage (which tiers each load needs)

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
> margin per tenant **improves** as we climb (see the cost × revenue scenarios in `plans.md` §7).
