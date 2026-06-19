// Unified model table: OUTER JOIN of the price catalog (OpenRouter) ∪ the score catalog (AA).
// One row per model. A row may have price only, score only, or both (the cross / "benchmark").
//
// The join key is a normalized AA slug (see matchSlug). value_aa = AA index / blended $/1M, and is
// only defined where a model has BOTH a price and a score. Quality tier comes from the AA index.

import { matchSlug, canonProvider } from "./normalize.js";
import { classifyQuality } from "./quality.js";

const value = (num, den) =>
  num != null && den != null && den > 0 ? num / den : null;

/**
 * @param {object} prices     prices payload (uses all_models)
 * @param {object} scores     scores payload (uses aa_catalog)
 * @param {object} tiers      ourModels.tiers map (id → tier); null for non-project models
 * @param {object} quality    dynamic AA-index quality-band thresholds (or null)
 * @param {object} overrides  optional id → AA slug overrides for the matcher
 * @returns { generated_at, counts, rows } — rows is the priced ∪ scored union
 */
export function merge(prices = {}, scores = {}, tiers = {}, quality = null, overrides = {}) {
  const aamap = new Map((scores.aa_catalog || []).map((s) => [s.slug, s]));
  const aaSet = new Set(aamap.keys());
  const consumed = new Set(); // AA slugs already attached to a priced row
  const rows = [];

  // 1) Every priced model, matched to an AA score when possible.
  for (const p of prices.all_models || []) {
    const match = matchSlug(p.id, aaSet, overrides);
    const aa = match ? aamap.get(match.slug) : null;
    if (match) consumed.add(match.slug);
    const idx = aa?.index ?? null;
    rows.push({
      id: p.id,
      aa_slug: match?.slug ?? null,
      name: p.name || p.id,
      provider: canonProvider((p.id || "").split("/")[0]),
      tier: tiers[p.id] ?? null,
      quality: classifyQuality(idx, quality),
      in_per_1m: p.in_per_1m,
      out_per_1m: p.out_per_1m,
      avg_per_1m: p.avg_per_1m,
      ctx: p.ctx,
      created: p.created,
      is_new_price: p.is_new ?? false,
      is_promo: p.is_promo ?? false,
      aa_index: idx,
      aa_coding: aa?.coding ?? null,
      aa_math: aa?.math ?? null,
      score_delta: aa?.score_delta ?? null,
      is_new_score: aa?.is_new ?? false,
      value_aa: value(idx, p.avg_per_1m),
      has_price: true,
      has_score: aa != null,
    });
  }

  // 2) Score-only models — AA entries with an index that no priced model matched.
  for (const s of scores.aa_catalog || []) {
    if (consumed.has(s.slug) || s.index == null) continue;
    rows.push({
      id: null,
      aa_slug: s.slug,
      name: s.name || s.slug,
      provider: canonProvider(s.creator),
      tier: null, // can't be "ours" without an OpenRouter id
      quality: classifyQuality(s.index, quality),
      in_per_1m: null,
      out_per_1m: null,
      avg_per_1m: null,
      ctx: null,
      created: null,
      is_new_price: false,
      is_promo: false,
      aa_index: s.index,
      aa_coding: s.coding ?? null,
      aa_math: s.math ?? null,
      score_delta: s.score_delta ?? null,
      is_new_score: s.is_new ?? false,
      value_aa: null,
      has_price: false,
      has_score: true,
    });
  }

  return {
    generated_at: new Date().toISOString(),
    note: "Union of the price catalog ∪ score catalog, joined by normalized slug. value_aa = AA index per blended $/1M (defined only where a model has both). quality = AA-index band. tier = project tag.",
    counts: {
      total: rows.length,
      priced: rows.filter((r) => r.has_price).length,
      scored: rows.filter((r) => r.has_score).length,
      crossed: rows.filter((r) => r.has_price && r.has_score).length,
      ours: rows.filter((r) => r.tier != null).length,
    },
    rows,
  };
}
