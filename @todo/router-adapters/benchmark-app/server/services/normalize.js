// Shared normalization helpers, ported from the bash/jq pipeline.

// OpenRouter price field → $/1M tokens.
// API returns a per-token string; "-1" means dynamic/auto-router pricing → treat as null (unknown).
export function px(field) {
  const n = Number(field ?? "0");
  if (Number.isNaN(n)) return null;
  if (n < 0) return null;
  return n * 1_000_000;
}

// Average of in/out per 1M (null if either side is unknown).
export function avgPer1m(inPer1m, outPer1m) {
  if (inPer1m == null || outPer1m == null) return null;
  return (inPer1m + outPer1m) / 2;
}

// Provider canonicalization. The price catalog (OpenRouter) and the score catalog (Artificial
// Analysis) name the same maker differently — OR uses the id prefix ("mistralai"), AA uses the
// `creator` field ("mistral"). We fold the AA names onto the OpenRouter name so a maker shows up
// as a single provider in the filter/column. Keys are lowercase AA creators → OpenRouter provider.
const PROVIDER_ALIASES = {
  mistral: "mistralai",
  meta: "meta-llama",
  xai: "x-ai",
  zai: "z-ai",
  "nous-research": "nousresearch",
  "reka-ai": "rekaai",
  liquidai: "liquid",
  "ai21-labs": "ai21",
  arcee: "arcee-ai",
  bytedance_seed: "bytedance-seed",
  ibm: "ibm-granite",
  alibaba: "qwen",
  kimi: "moonshotai",
  ai2: "allenai",
};

export function canonProvider(p) {
  const k = String(p || "").toLowerCase();
  if (!k) return null;
  return PROVIDER_ALIASES[k] || k;
}

// Normalize an OpenRouter id → AA slug:
//   strip the "provider/" prefix → lowercase → replace "." with "-".
export function toSlug(id) {
  return String(id || "")
    .replace(/^[^/]+\//, "")
    .toLowerCase()
    .replace(/\./g, "-");
}

// Variant suffixes that AA generally folds into the base model (same quality tier).
// Conservative on purpose: we do NOT strip mini/nano/pro/codex/image (those are different models).
const VARIANT_SUFFIXES = [
  "fast",
  "adaptive",
  "non-reasoning",
  "thinking",
  "preview",
  "latest",
];

// Move the numeric version run right after the first token.
//   claude-sonnet-4-5 → claude-4-5-sonnet   (AA sometimes puts the version before the name)
function permuteVersion(slug) {
  const toks = slug.split("-");
  if (toks.length < 3) return null;
  const nums = toks.filter((t) => /^\d+$/.test(t));
  const words = toks.filter((t) => !/^\d+$/.test(t));
  if (nums.length === 0 || words.length < 2) return null;
  const candidate = [words[0], ...nums, ...words.slice(1)].join("-");
  return candidate === slug ? null : candidate;
}

// Strip one known variant suffix, if present.
function stripVariant(slug) {
  for (const v of VARIANT_SUFFIXES) {
    if (slug.endsWith("-" + v)) return slug.slice(0, -(v.length + 1));
  }
  return null;
}

/**
 * Resolve an OpenRouter id to an AA slug present in `aaSet`, trying progressively looser strategies.
 * Returns { slug, method } or null. `overrides` (id → slug) wins first.
 *   method: "override" | "exact" | "permuted" | "variant" | "variant-permuted"
 */
export function matchSlug(id, aaSet, overrides = {}) {
  if (overrides[id] && aaSet.has(overrides[id])) {
    return { slug: overrides[id], method: "override" };
  }
  const base = toSlug(id);
  if (aaSet.has(base)) return { slug: base, method: "exact" };

  const perm = permuteVersion(base);
  if (perm && aaSet.has(perm)) return { slug: perm, method: "permuted" };

  const stripped = stripVariant(base);
  if (stripped) {
    if (aaSet.has(stripped)) return { slug: stripped, method: "variant" };
    const sp = permuteVersion(stripped);
    if (sp && aaSet.has(sp)) return { slug: sp, method: "variant-permuted" };
  }
  return null;
}

