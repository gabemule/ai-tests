// Live OpenRouter pricing → structured prices payload.
// Port of prices/fetch-openrouter-prices.sh. Public API, no key.
//
// Produces: project_models, embeddings_all, newest, all_models.
// NEW/PROMO flags come from diffing against the previous payload (prev), passed in by the caller.

import { px, avgPer1m } from "./normalize.js";

const API = "https://openrouter.ai/api/v1/models";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenRouter ${res.status} for ${url}`);
  return res.json();
}

// Normalize one API model into a price row.
function row(m) {
  const inPer1m = px(m.pricing?.prompt);
  const outPer1m = px(m.pricing?.completion);
  return {
    id: m.id,
    name: m.name,
    ctx: m.context_length ?? null,
    created: m.created ?? null,
    in_per_1m: inPer1m,
    out_per_1m: outPer1m,
    avg_per_1m: avgPer1m(inPer1m, outPer1m),
  };
}

const dropped = (now, was) => now != null && was != null && now < was;

/**
 * @param {object} prev   previous prices payload (db.prices_prev) for the NEW/PROMO diff
 * @param {object} tiers  ourModels.tiers map (id → tier) to tag/flag project rows
 * @returns prices payload
 */
export async function fetchPrices(prev = {}, tiers = {}) {
  const [all, emb] = await Promise.all([
    getJSON(API),
    getJSON(`${API}?output_modalities=embeddings`),
  ]);

  // previous-snapshot price map (by id) for the diff
  const prevModels = prev.all_models || [];
  const hasPrev = prevModels.length > 0;
  const pmap = new Map(
    prevModels.map((m) => [m.id, { in: m.in_per_1m, out: m.out_per_1m }])
  );

  // enrich a row with NEW/PROMO flags vs. the previous payload
  const flags = (r) => {
    const p = pmap.get(r.id);
    const p0 = p ?? null;
    return {
      ...r,
      is_new: hasPrev && p0 == null,
      is_promo:
        p0 != null && (dropped(r.in_per_1m, p0.in) || dropped(r.out_per_1m, p0.out)),
    };
  };

  // tag a row with our project tier + watchlist
  const tag = (r) => ({
    ...r,
    tier: tiers[r.id] ?? null,
    watchlist: Object.prototype.hasOwnProperty.call(tiers, r.id),
  });

  const idset = new Set(Object.keys(tiers));

  const byNum = (key) => (a, b) => (a[key] ?? 0) - (b[key] ?? 0);

  return {
    fetched_at: new Date().toISOString(),
    source: API,
    note: "Prices are live (may include temporary promos). avg = (in+out)/2 per 1M tokens. is_promo/is_new come from the previous-scan diff.",
    has_baseline: hasPrev,
    counts: {
      all: (all.data || []).length,
      embeddings: (emb.data || []).length,
      project: idset.size,
    },
    project_models: (all.data || [])
      .filter((m) => idset.has(m.id))
      .map((m) => flags(tag(row(m)))),
    embeddings_all: (emb.data || []).map((m) => flags(row(m))).sort(byNum("in_per_1m")),
    newest: (all.data || [])
      .map((m) => flags(row(m)))
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
      .slice(0, 30),
    all_models: (all.data || [])
      .map((m) => flags(tag(row(m))))
      .sort(byNum("avg_per_1m")),
  };
}
