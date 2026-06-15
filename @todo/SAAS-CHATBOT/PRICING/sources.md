# PRICING — Sources & revalidation

> Part of PRICING/. Companion to PRICING/README.md. Last updated: 2026-06-14.
>
> 🔁 **Re-audit monthly.** This file holds the revalidation procedure + per-model links. See
> `VALIDATION-PROMPTS.md` (this folder) for the per-file re-validation prompts.

---

## §12 — Sources & revalidation

All model/token prices in PRICING/ were re-validated **live on OpenRouter on 2026-06-14**. Prices
drift constantly — **re-audit periodically** (suggest monthly) via the procedure + links below and
update `models.md`, `embeddings.md` and the SSOT `openrouter-pricing.md` accordingly.

**Revalidation procedure (preferred — uses the tooling in `extract/`):**

1. Re-fetch live prices: `bash extract/fetch-openrouter-pricing.sh`
   (rewrites `extract/openrouter-pricing.json` + `.js`, saves a dated snapshot under
   `extract/snapshots/`, and diffs against the previous snapshot to flag NEW/PROMO).
2. Open `extract/openrouter-pricing.html` (works straight from `file://`) and review:
   - **Our models** — confirm tiers/prices for the anchor + the 80/15/5 mix.
   - **Newest** — spot models just launched that may not have a quality score yet
     (feed them to `../ANALYSIS/model-benchmark.md`; see PROMPT 3 in `../VALIDATION-PROMPTS.md`).
   - **Embeddings** — confirm the default (Qwen3 Embedding 8B) + fallback prices.
   - NEW/PROMO badges — note any promo that may expire (we size margins on full price).
3. Update the tables in `openrouter-pricing.md` (SSOT) → then `models.md` / `embeddings.md`.

**Companion analyses live in `../ANALYSIS/`** (`model-benchmark.md` = quality scores, `infra.md` =
self-host breakeven). The live per-token price data now lives **here in PRICING/** as the SSOT
`openrouter-pricing.md`.

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
