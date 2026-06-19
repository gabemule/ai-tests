# PRICING — Managed embeddings (our only real fixed AI cost)

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔁 **Re-audit monthly.** Embedding prices/models come from the **router-adapters catalog** (the
> `benchmark-app` tracks live OpenRouter embedding prices). Re-check there before trusting the list
> below. This file owns the **business decision** (which embedding is the default + why) — not the
> catalog. See `../VALIDATION-PROMPTS.md` for the per-file re-validation prompt.

---

## §1.3 — Managed embeddings (our only real fixed AI cost)

We generate embeddings (decision: embeddings are always managed, never BYOK). Cost is small.

**Decision (2026-06-14): default = Qwen3 Embedding 8B; OpenAI = fallback only.** Qwen3 Embedding 8B
is the most-popular embedding on OpenRouter, multilingual + long-text, at **half** the price of
OpenAI `text-embedding-3-small`. OpenAI stays as a **fallback** for availability/compliance, not the
default.

**Default + fallback (the only choice that's business logic — full embedding catalog lives in the
router-adapters `benchmark-app`):**

| Model | Price /1M | Context | Provider | Role |
|---|---|---|---|---|
| **Qwen3 Embedding 8B** ⭐ | **$0.01** | 32K | qwen | **default** — multilingual, top popularity |
| OpenAI `text-embedding-3-small` | $0.02 | 8K | openai | **fallback** (former default) |

> The wider list of candidate embeddings (Gemini, bge-m3, Mistral Embed, free tiers, etc.) and their
> live prices are tracked in the **router-adapters catalog**, not here — this file only records which
> one we picked as the default and why. SentenceTransformers (self-host) remains an option
> (compute-only, "free" if we run it) for a future zero-API-cost tier.

Embedding is a **one-time cost per document** (re-embed only on change) + a tiny per-query cost.
Example: ingesting a 200-page PDF (~100k tokens) with Qwen3 8B (`$0.01/1M`) ≈ **$0.001**. Negligible.

> **Two embedding cost surfaces, both covered by the plan:**
> 1. **Ingestion embedding** — document → vectors. One-time per doc, **plus re-embeds when content
>    changes** (knowledge-sync, `../FUTURE/07`). This is the **only embedding cost that can grow** with
>    a tenant, so it's bounded by a **reingestion budget** per plan (see `plans.md` §6 / §7.3).
> 2. **Query-time embedding** — every chat question is embedded before retrieval. Tiny: e.g. Pro at
>    2,000 msgs/mo × ~50 tokens ≈ 100k tokens ≈ **$0.000002/mo**. Folded into the plan/per-message
>    price; never billed separately.
>
> **Rule of thumb:** at **$0.02/1M tokens**, embedding costs **~$0.005 per MB of text** (1MB ≈ 250k
> tokens). So a tenant's max embedding cost ≈ `storage_MB × K × $0.005`, where **K = how many times
> per month the base is reprocessed** (see `plans.md` §7.3). K is the only real AI cost lever per
> tenant.
