// Full model QUALITY catalog from Artificial Analysis → structured scores payload.
// Port of scores/fetch-model-scores.sh. Key read server-side from .env (never shipped to client).
//
// score_delta + is_new come from diffing the AA index by slug against the previous payload (prev).

const AA_API = "https://artificialanalysis.ai/api/v2/data/llms/models";

/**
 * @param {object} prev  previous scores payload (db.scores_prev) for score_delta/is_new
 * @returns scores payload
 */
export async function fetchScores(prev = {}) {
  const key = process.env.ARTIFICIAL_ANALYSIS_KEY || "";
  if (!key) {
    throw new Error(
      "ARTIFICIAL_ANALYSIS_KEY not set in .env — cannot fetch Artificial Analysis scores."
    );
  }

  const res = await fetch(AA_API, { headers: { "x-api-key": key } });
  if (!res.ok) throw new Error(`Artificial Analysis ${res.status}`);
  const aa = await res.json();

  const aalist = aa.data || aa.models || [];

  // previous snapshot: slug → aa index, for score_delta
  const prevCatalog = prev.aa_catalog || [];
  const hasPrev = prevCatalog.length > 0;
  const pmap = new Map(prevCatalog.map((s) => [s.slug, s.index ?? null]));

  const aa_catalog = aalist.map((m) => {
    const slug = String(m.slug || m.id || m.name || "").toLowerCase();
    const idx = m.evaluations?.artificial_analysis_intelligence_index ?? null;
    const prevIdx = pmap.get(slug);
    return {
      slug,
      name: m.name || m.slug || null,
      creator: m.model_creator?.slug || m.model_creator?.name || null,
      release_date: m.release_date || null,
      index: idx,
      coding: m.evaluations?.artificial_analysis_coding_index ?? null,
      math: m.evaluations?.artificial_analysis_math_index ?? null,
      aa_price_blended: m.pricing?.price_1m_blended_3_to_1 ?? null,
      score_delta: idx != null && prevIdx != null ? idx - prevIdx : null,
      is_new: hasPrev && !pmap.has(slug),
    };
  });

  return {
    fetched_at: new Date().toISOString(),
    source: "artificialanalysis.ai",
    note: "Full AA catalog (native Intelligence Index ~0-100). merge crosses this by normalized slug against the price catalog.",
    has_baseline: hasPrev,
    counts: {
      aa_total: aalist.length,
      aa_with_index: aa_catalog.filter((s) => s.index != null).length,
    },
    aa_catalog,
  };
}
