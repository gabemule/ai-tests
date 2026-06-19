# PRICING — Sources & revalidation

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔁 **Re-audit monthly.** This file points to where prices/scores are sourced. See
> `../VALIDATION-PROMPTS.md` for the per-file re-validation prompts.

---

## §12 — Sources & revalidation

All model/token/embedding prices referenced in PRICING/ are **owned by `router-adapters`**, not here.
The live list of models, per-token prices and quality scores is maintained in the `benchmark-app`
catalog there; PRICING/ only consumes those numbers to reason about plans and margins. Prices drift
constantly — **re-audit periodically** (suggest monthly) at the source, then update the illustrative
numbers in `models.md` / `embeddings.md` if they moved materially.

**Revalidation procedure (lives in `router-adapters`):**

1. Open the `benchmark-app` (the catalog/curation tool) and run a **Scan** to refresh live OpenRouter
   prices + Artificial Analysis quality scores. It flags NEW/PROMO models and score deltas for human
   curation. See `router-adapters/benchmark-app/README.md`.
2. Confirm at the source:
   - **Our models** — tiers/prices for the anchor + the 80/15/5 mix (`models.md` §1.5).
   - **Embeddings** — the default (Qwen3 Embedding 8B) + fallback prices (`embeddings.md` §1.3).
   - **Newest / NEW-PROMO** — spot newly launched models and promos that may expire (we size margins
     on full price). Quality scores live in `router-adapters/ANALYSIS/model-benchmark.md`.
3. If a price moved materially, update the **illustrative anchors** in `models.md` / `embeddings.md`
   and recompute the blended cost + spread.

**Where the source of truth lives:**

- **Model/embedding prices + quality scores** → `router-adapters` (`benchmark-app` catalog +
  `ANALYSIS/model-benchmark.md`).
- **Self-host breakeven analysis** → `infra.md` (this folder) — infra cost is part of SAAS-CHATBOT.

**Reference links (canonical model pages):**

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
