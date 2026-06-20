// Known project tiers. A model becomes "ours" by getting one of these (or a blank = not ours).
//
// Three product tiers (economy / principal / premium), each on three axes:
//   - use   : models we actually deploy (titular = default, -alt = backup)
//   - bench-price : price anchor for that tier (a ceiling we don't want to cross)
//   - bench-score : score target for that tier (quality we want to reach)
//
// The premium tier doubles as the pricing anchor: the customer pays the premium price, the router
// runs principal/economy under the hood, the spread is the margin (see ../../PRICING/models.md).

export const TIERS = [
  "economy",
  "economy-alt",
  "principal",
  "principal-alt",
  "premium",
  "premium-alt",
  "bench-price-economy",
  "bench-price-principal",
  "bench-price-premium",
  "bench-score-economy",
  "bench-score-principal",
  "bench-score-premium",
];

// Human-readable descriptions, used by the in-app legend.
export const TIER_DESCRIPTIONS = {
  economy: "Economy production model for simple queries (default)",
  "economy-alt": "Economy backup model",
  principal: "Principal production workhorse — handles the bulk of queries (default)",
  "principal-alt": "Principal backup model",
  premium: "Premium model + pricing anchor — hard queries; the price the customer pays",
  "premium-alt": "Premium backup model",
  "bench-price-economy": "Price anchor for the economy tier (ceiling to stay under)",
  "bench-price-principal": "Price anchor for the principal tier (ceiling to stay under)",
  "bench-price-premium": "Price anchor for the premium tier (ceiling to stay under)",
  "bench-score-economy": "Score target for the economy tier (quality to reach)",
  "bench-score-principal": "Score target for the principal tier (quality to reach)",
  "bench-score-premium": "Score target for the premium tier (quality to reach)",
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
