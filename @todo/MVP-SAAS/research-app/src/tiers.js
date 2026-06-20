// Known project tiers. A model becomes "ours" by getting one of these (or a blank = not ours).
//
// Two product tiers (primary / economy), each on three axes:
//   - use   : models we actually deploy (titular = default, -alt = backup)
//   - bench-price : price anchor for that tier (a ceiling we don't want to cross)
//   - bench-score : score target for that tier (quality we want to reach)

export const TIERS = [
  "primary",
  "primary-alt",
  "economy",
  "economy-alt",
  "bench-price-primary",
  "bench-price-economy",
  "bench-score-primary",
  "bench-score-economy",
];

// Human-readable descriptions, used by the in-app legend.
export const TIER_DESCRIPTIONS = {
  primary: "Primary production model (default)",
  "primary-alt": "Primary backup model",
  economy: "Cost-cutting model for simple queries (default)",
  "economy-alt": "Economy backup model",
  "bench-price-primary": "Price anchor for the primary tier (ceiling to stay under)",
  "bench-price-economy": "Price anchor for the economy tier (ceiling to stay under)",
  "bench-score-primary": "Score target for the primary tier (quality to reach)",
  "bench-score-economy": "Score target for the economy tier (quality to reach)",
};

// Build a <select> for a model's tier. `current` is the tier (or null = not ours).
// The blank option means "not ours" (removing it from the set).
export function tierSelect(current) {
  const opts = ['<option value="">— not ours —</option>'];
  for (const t of TIERS) {
    const sel = t === current ? " selected" : "";
    opts.push(`<option value="${t}"${sel}>${t}</option>`);
  }
  return `<select class="tier-select">${opts.join("")}</select>`;
}
