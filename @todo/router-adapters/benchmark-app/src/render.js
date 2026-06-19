// Table renderers. Two tables:
//   - Models: unified price ∪ score union. Column GROUPS (Prices/Scores/Benchmark) toggle on/off,
//     and each toggle also filters which rows show (has_price / has_score / both).
//   - Embeddings: separate table (embedding models are a very different shape — no quality/score).
//
// Quality is the AA-index band (max/4): flagship/strong/mid/basic. Pure functions: each takes
// (data, state) and returns an HTML string. Event wiring lives in main.js.

import { tierSelect } from "./tiers.js";

// ---- formatters ----
export const fmt = (n) => (n == null ? "—" : "$" + (n < 1 ? n.toFixed(4) : n.toFixed(2)));
export const fmtCtx = (n) =>
  n == null ? "—" : n >= 1000 ? (n / 1000).toFixed(0) + "K" : String(n);
export const fmtDate = (ts) => (ts ? new Date(ts * 1000).toISOString().slice(0, 10) : "—");
export const fmtNum = (n, d = 1) => (n == null ? "—" : Number(n).toFixed(d));

const QUALITY_LABEL = { flagship: "Flagship", strong: "Strong", mid: "Mid", basic: "Basic" };
const qualityBadge = (q) =>
  q ? `<span class="quality ql-${q}">${QUALITY_LABEL[q]}</span>` : "—";

function deltaBadge(d) {
  if (d == null || d === 0) return "";
  const cls = d > 0 ? "delta-up" : "delta-down";
  const arrow = d > 0 ? "▲" : "▼";
  return ` <span class="${cls}">${arrow}${Math.abs(d).toFixed(1)}</span>`;
}

// sort helper
function sortRows(rows, key, dir) {
  return rows.sort((a, b) => {
    let x = a[key],
      y = b[key];
    if (x == null) x = -Infinity;
    if (y == null) y = -Infinity;
    if (typeof x === "string") return x.localeCompare(y) * dir;
    return (x - y) * dir;
  });
}

function header(cols, sortKey, sortDir, extraLead = "") {
  let html = "<table><thead><tr>" + extraLead;
  cols.forEach((c) => {
    const arrow = sortKey === c.k ? (sortDir === 1 ? " ▲" : " ▼") : "";
    html += `<th class="${c.num ? "num" : ""}" data-k="${c.k}">${c.label}${arrow}</th>`;
  });
  return html + "</tr></thead><tbody>";
}

// ---- MODELS (unified) ----
// Column groups, gated by state.groups { prices, scores, benchmark }.
// Always-on: Model · Quality · Tier. The ★ is a separate lead cell.
function modelCols(groups) {
  const cols = [
    { k: "name", label: "Model" },
    { k: "quality", label: "Quality" },
    { k: "tier", label: "Tier" },
  ];
  if (groups.prices) {
    cols.push(
      { k: "in_per_1m", label: "In /1M", num: true },
      { k: "out_per_1m", label: "Out /1M", num: true },
      { k: "avg_per_1m", label: "Avg /1M", num: true },
      { k: "ctx", label: "Ctx", num: true },
      { k: "created", label: "Released", num: true }
    );
  }
  if (groups.scores) {
    cols.push(
      { k: "aa_index", label: "AA Index", num: true },
      { k: "aa_coding", label: "AA Coding", num: true },
      { k: "aa_math", label: "AA Math", num: true }
    );
  }
  if (groups.benchmark) {
    cols.push(
      { k: "blended_per_1m", label: "Blended /1M", num: true },
      { k: "value_aa", label: "Value AA (idx/$)", num: true }
    );
  }
  return cols;
}

function modelCell(col, m) {
  switch (col.k) {
    case "quality":
      return qualityBadge(m.quality);
    case "in_per_1m":
      return fmt(m.in_per_1m);
    case "out_per_1m":
      return fmt(m.out_per_1m);
    case "avg_per_1m":
      return `<strong>${fmt(m.avg_per_1m)}</strong>`;
    case "ctx":
      return fmtCtx(m.ctx);
    case "created":
      return fmtDate(m.created);
    case "aa_index":
      return `<strong>${fmtNum(m.aa_index)}</strong>${deltaBadge(m.score_delta)}`;
    case "aa_coding":
      return fmtNum(m.aa_coding);
    case "aa_math":
      return fmtNum(m.aa_math);
    case "blended_per_1m":
      return fmt(m.avg_per_1m);
    case "value_aa":
      return `<strong>${fmtNum(m.value_aa, 1)}</strong>`;
    default:
      return "—";
  }
}

export function renderModels(data, state) {
  const { groups, filters, sortKey, sortDir, tiers } = state;
  const isOurs = (m) => m.id != null && Object.prototype.hasOwnProperty.call(tiers, m.id);

  let rows = (data.models?.rows || []).slice();

  // Group toggles drive which rows are eligible (OR across the active groups).
  rows = rows.filter((m) => {
    if (groups.prices && m.has_price) return true;
    if (groups.scores && m.has_score) return true;
    if (groups.benchmark && m.has_price && m.has_score) return true;
    return false;
  });

  // Filters
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((m) =>
      ((m.id || "") + " " + (m.aa_slug || "") + " " + (m.name || "")).toLowerCase().includes(q)
    );
  }
  if (filters.provider) rows = rows.filter((m) => m.provider === filters.provider);
  if (filters.quality) rows = rows.filter((m) => m.quality === filters.quality);
  if (filters.watch) rows = rows.filter((m) => isOurs(m));
  if (filters.noScore) rows = rows.filter((m) => m.has_score);
  if (filters.noPrice) rows = rows.filter((m) => m.has_price);
  if (filters.isNew) rows = rows.filter((m) => m.is_new_price || m.is_new_score);
  if (filters.promo) rows = rows.filter((m) => m.is_promo);

  rows = sortRows(rows, sortKey, sortDir);
  state.count = rows.length;
  if (!rows.length) return '<div class="empty">No models match the current toggles/filters.</div>';

  const cols = modelCols(groups);
  let html = header(
    cols,
    sortKey,
    sortDir,
    '<th class="star" title="★ add/remove from our models (priced models only)"></th>'
  );

  rows.forEach((m) => {
    const ours = isOurs(m);
    const t = m.id != null ? tiers[m.id] || null : null;
    let badges = "";
    if (m.is_new_price || m.is_new_score) badges += `<span class="badge b-new">NEW</span>`;
    if (m.is_promo) badges += `<span class="badge b-promo">PROMO</span>`;

    html += `<tr class="${ours ? "watch" : ""}">`;

    // ★ lead (only meaningful for priced models that have an OpenRouter id)
    if (m.id != null) {
      html += `<td class="star ${ours ? "on" : "off"}" data-star="${m.id}" title="${
        ours ? "Remove from our models" : "Add to our models"
      }">${ours ? "★" : "☆"}</td>`;
    } else {
      html += `<td class="star off" title="No price (score-only) — can't be added">·</td>`;
    }

    // Model name + id/slug
    const sub = m.id || m.aa_slug || "";
    html += `<td><strong>${m.name}</strong><br><span class="id">${sub}</span>${badges}</td>`;

    cols.slice(1).forEach((c) => {
      if (c.k === "tier") {
        html +=
          m.id != null
            ? `<td data-tier="${m.id}">${tierSelect(t)}</td>`
            : `<td>—</td>`;
      } else {
        html += `<td class="${c.num ? "num" : ""}">${modelCell(c, m)}</td>`;
      }
    });
    html += "</tr>";
  });
  return html + "</tbody></table>";
}

// ---- EMBEDDINGS (separate table) ----
export function renderEmbeddings(data, state) {
  const { filters, sortKey, sortDir } = state;
  let rows = (data.embeddings || []).slice();

  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((m) => (m.id + " " + (m.name || "")).toLowerCase().includes(q));
  }
  if (filters.provider) rows = rows.filter((m) => (m.id || "").split("/")[0] === filters.provider);

  rows = sortRows(rows, sortKey, sortDir);
  state.count = rows.length;
  if (!rows.length) return '<div class="empty">No embedding models match the filters.</div>';

  const cols = [
    { k: "name", label: "Model" },
    { k: "in_per_1m", label: "In /1M", num: true },
    { k: "ctx", label: "Ctx", num: true },
    { k: "created", label: "Released", num: true },
  ];

  let html = header(cols, sortKey, sortDir);
  rows.forEach((m) => {
    html += "<tr>";
    html += `<td><strong>${m.name || m.id}</strong><br><span class="id">${m.id}</span>${
      m.is_new ? '<span class="badge b-new">NEW</span>' : ""
    }</td>`;
    html += `<td class="num">${fmt(m.in_per_1m)}</td>`;
    html += `<td class="num">${fmtCtx(m.ctx)}</td>`;
    html += `<td class="num">${fmtDate(m.created)}</td>`;
    html += "</tr>";
  });
  return html + "</tbody></table>";
}
