// Dynamic quality tiers anchored to the AA Intelligence Index TOP score.
// No fixed cuts — the range [0, max] is split into 4 equal bands, so tiers track the frontier:
// each band is max/4 wide. As a stronger model raises the ceiling, the cuts scale with it.
// Tiers (top → bottom): flagship (≥75% of max), strong (≥50%), mid (≥25%), basic (<25%).

export const QUALITY_TIERS = ["flagship", "strong", "mid", "basic"];

// Band thresholds (q25/q50/q75) as fractions of the catalog's max index (nulls ignored).
// Returns null when there's no usable index to anchor on.
export function qualityThresholds(indices) {
  const xs = (indices || []).filter((n) => n != null);
  if (!xs.length) return null;
  const max = Math.max(...xs);
  const band = max / 4;
  return { q25: band, q50: band * 2, q75: band * 3 };
}

// Classify one index against thresholds → quality tier (null if no index/thresholds).
export function classifyQuality(index, t) {
  if (index == null || t == null) return null;
  if (index >= t.q75) return "flagship";
  if (index >= t.q50) return "strong";
  if (index >= t.q25) return "mid";
  return "basic";
}
