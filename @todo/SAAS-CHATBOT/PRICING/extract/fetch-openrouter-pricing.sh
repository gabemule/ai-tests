#!/usr/bin/env bash
# Fetches live OpenRouter pricing → structured JSON. Source of truth for openrouter-pricing.md.
#
# Usage:  bash fetch-openrouter-pricing.sh [output.json]
# Default output: openrouter-pricing.json (next to this script)
#
# Produces these arrays (each row: id/name/ctx/created + in/out/avg price per 1M tokens):
#   - project_models    : our explicit generation set (pulled by id; tagged with `tier` + `watchlist`)
#   - programming_top20 : the live top-20 ranked "programming" category models
#   - embeddings_all    : the FULL embeddings catalog (to spot new contenders over time)
#   - newest            : whole catalog sorted by `created` desc, top 30 (see what's launching)
#   - all_models        : whole catalog normalized + sorted by avg price (the HTML filters this)
#
# NEW / PROMO detection (snapshot diff):
#   On each run we read the most recent snapshot in ./snapshots/ and compare prices by id:
#     - id absent in the previous snapshot  → is_new=true   (badge NEW)
#     - in/out price dropped vs. previous   → is_promo=true (badge PROMO)
#   After writing, we save a dated copy under ./snapshots/YYYY-MM-DD.json (history for trend/diff).

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/openrouter-pricing.json}"
SNAPDIR="$HERE/snapshots"
API="https://openrouter.ai/api/v1/models"

# Our project generation set → tier. Edit when the mix changes.
# tiers: anchor | premium-expensive (above our anchor — breaks pricing) | principal | economy | reference
TIERS='{
  "anthropic/claude-sonnet-4.6": "anchor",
  "anthropic/claude-sonnet-4.5": "anchor-alt",
  "anthropic/claude-opus-4.8":   "premium-expensive",
  "anthropic/claude-opus-4.7":   "premium-expensive",
  "anthropic/claude-opus-4.6":   "premium-expensive",
  "openai/gpt-5.5":              "premium-expensive",
  "openai/gpt-5":                "premium-expensive",
  "openai/gpt-4o":               "reference",
  "openai/gpt-4o-mini":          "reference",
  "openai/gpt-4":                "reference",
  "qwen/qwen3.7-plus":           "principal",
  "qwen/qwen3.7-max":            "principal-alt",
  "qwen/qwen3.6-plus":           "principal-alt",
  "deepseek/deepseek-v4-pro":    "economy",
  "deepseek/deepseek-v3.2":      "economy-alt",
  "moonshotai/kimi-k2.6":        "economy-alt"
}'

mkdir -p "$SNAPDIR"
PREV_FILE="$(ls "$SNAPDIR"/*.json 2>/dev/null | sort | tail -n1 || true)"
if [ -n "${PREV_FILE:-}" ]; then
  echo "Diffing against snapshot: $(basename "$PREV_FILE")" >&2
  prev="$(cat "$PREV_FILE")"
else
  echo "No previous snapshot — first run, NEW/PROMO baseline starts now." >&2
  prev='{}'
fi

echo "Fetching programming top-20…" >&2
prog=$(curl -s "$API?category=programming")

echo "Fetching full catalog…" >&2
all=$(curl -s "$API")

echo "Fetching embeddings catalog…" >&2
emb=$(curl -s "$API?output_modalities=embeddings")

jq -n \
  --argjson prog "$prog" \
  --argjson all "$all" \
  --argjson emb "$emb" \
  --argjson prev "$prev" \
  --argjson tiers "$TIERS" '
  # --- normalize one API model into a price row ---
  # OpenRouter returns "-1" for dynamic/auto-router pricing → treat as null (unknown).
  def px($f): ($f // "0") | tonumber | (if . < 0 then null else . * 1000000 end);
  def row:
    (px(.pricing.prompt))     as $in |
    (px(.pricing.completion)) as $out |
    { id: .id,
      name: .name,
      ctx: .context_length,
      created: (.created // null),
      in_per_1m:  $in,
      out_per_1m: $out,
      avg_per_1m: (if ($in == null or $out == null) then null else ($in + $out) / 2 end) };


  # --- previous-snapshot price map (by id) for the diff ---
  ($prev.all_models // []) as $prevmodels |
  ($prevmodels | length > 0) as $has_prev |
  ($prevmodels | map({ key: .id, value: { in: .in_per_1m, out: .out_per_1m } }) | from_entries) as $pmap |

  # --- enrich a row with NEW/PROMO flags vs. the snapshot ---
  # promo = a known price dropped vs. the snapshot (both sides must be real numbers).
  def dropped($now; $was): ($now != null) and ($was != null) and ($now < $was);
  def flags:
    . as $r | (.id // "") as $i | ($pmap[$i]) as $p |
    $r + { is_new:   ($has_prev and ($p == null)),
           is_promo: (($p != null) and (dropped($r.in_per_1m; $p.in) or dropped($r.out_per_1m; $p.out))) };


  # --- tag a row with our project tier + watchlist ---
  def tag:
    (.id // "") as $i |
    . + { tier: ($tiers[$i] // null), watchlist: ($tiers | has($i)) };


  ($tiers | keys) as $idlist |

  { fetched_at: (now | todate),
    source: "https://openrouter.ai/api/v1/models",
    note: "Prices are live (may include temporary promos). avg = (in+out)/2 per 1M tokens. is_promo/is_new come from the snapshot diff.",
    has_baseline: $has_prev,
    counts: { all: ($all.data | length), embeddings: ($emb.data | length), project: ($idlist | length) },
    project_models:    [ $all.data[] | select(.id as $i | $idlist | index($i)) | row | tag | flags ],
    programming_top20: [ $prog.data[] | row | flags ],
    embeddings_all:    ([ $emb.data[] | row | flags ] | sort_by(.in_per_1m)),
    newest:            ([ $all.data[] | row | flags ] | sort_by(.created // 0) | reverse | .[0:30]),
    all_models:        ([ $all.data[] | row | tag | flags ] | sort_by(.avg_per_1m))
  }' > "$OUT"

echo "wrote $OUT" >&2

# Also emit a JS companion so openrouter-pricing.html works straight from file://
# (a file:// fetch() is blocked by CORS; a <script src> is not).
JS="${OUT%.json}.js"
{ printf 'window.OPENROUTER_DATA = '; cat "$OUT"; printf ';\n'; } > "$JS"
echo "wrote $JS" >&2

# Save a dated snapshot for history + next run's diff baseline.
SNAP="$SNAPDIR/$(date +%F).json"
cp "$OUT" "$SNAP"
echo "snapshot saved → $SNAP" >&2

