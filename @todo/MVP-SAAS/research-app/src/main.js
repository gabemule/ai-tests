// App bootstrap: fetch data, wire sections/column-groups/filters, Scan button, ★ toggle, tier <select>.
// All mutations go through the server (PUT /api/our-models, POST /api/scan) and re-render from the
// fresh payload — db.json stays the single source of truth.
//
// Two sections: Models (unified price ∪ score table) and Embeddings (separate table).

import "./styles.css";
import { getData, scan, putOurModels } from "./api.js";
import { renderModels, renderEmbeddings } from "./render.js";

const SECTIONS = [
  { key: "models", label: "Models" },
  { key: "embeddings", label: "Embeddings" },
];

// ---- state ----
let data = null;
const state = {
  section: "models",
  groups: { prices: true, scores: true, benchmark: true },
  sortKey: "aa_index",
  sortDir: -1,
  filters: {
    q: "",
    provider: "",
    quality: "",
    watch: false,
    noScore: false,
    noPrice: false,
    isNew: false,
    promo: false,
  },
  tiers: {}, // mirror of data.ourModels.tiers
  count: 0,
};

const $ = (id) => document.getElementById(id);

// ---- meta line ----
function updateMeta() {
  const c = data.models?.counts || {};
  const pf = data.meta?.prices_fetched_at;
  const sf = data.meta?.scores_fetched_at;
  $("meta").textContent =
    `prices ${pf ? pf.slice(0, 10) : "—"} · scores ${sf ? sf.slice(0, 10) : "—"} · ` +
    `${c.priced || 0} priced · ${c.scored || 0} scored · ${c.crossed || 0} crossed`;
}

function updateOurStatus() {
  const n = Object.keys(state.tiers).length;
  $("ourStatus").textContent = `★ ${n} ours`;
}

// ---- section chrome ----
function buildSections() {
  const el = $("sections");
  el.innerHTML = "";
  SECTIONS.forEach((s) => {
    const b = document.createElement("button");
    b.className = "sec" + (s.key === state.section ? " active" : "");
    b.textContent = s.label;
    b.onclick = () => {
      state.section = s.key;
      if (s.key === "models") (state.sortKey = "aa_index"), (state.sortDir = -1);
      if (s.key === "embeddings") (state.sortKey = "in_per_1m"), (state.sortDir = 1);
      buildSections();
      render();
    };
    el.appendChild(b);
  });
  // Column-group toggles only make sense for the Models table.
  $("groupControls").style.display = state.section === "models" ? "flex" : "none";
}

function buildProviders() {
  const set = new Set();
  (data.models?.rows || []).forEach((m) => m.provider && set.add(m.provider));
  (data.embeddings || []).forEach((m) => set.add((m.id || "").split("/")[0]));
  const sel = $("provider");
  sel.innerHTML = '<option value="">All providers</option>';
  [...set].filter(Boolean).sort().forEach((p) => {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = p;
    sel.appendChild(o);
  });
}

// ---- render + wire row-level events ----
function render() {
  const html =
    state.section === "models" ? renderModels(data, state) : renderEmbeddings(data, state);
  $("view").innerHTML = html;
  $("count").textContent = `${state.count} shown`;

  // column sort
  document.querySelectorAll("th[data-k]").forEach((th) => {
    th.onclick = () => {
      const k = th.dataset.k;
      if (state.sortKey === k) state.sortDir *= -1;
      else (state.sortKey = k), (state.sortDir = 1);
      render();
    };
  });

  // ★ toggle: add with default tier / remove (priced models only)
  document.querySelectorAll("td[data-star]").forEach((td) => {
    td.onclick = () => toggleOurs(td.dataset.star);
  });

  // tier <select>: set/clear a model's tier
  document.querySelectorAll("td[data-tier] .tier-select").forEach((sel) => {
    sel.onchange = (e) => setTier(e.target.closest("td").dataset.tier, e.target.value);
  });
}

// ---- mutations (persist via server, re-render from fresh payload) ----
const DEFAULT_TIER = "primary";

async function refreshFrom(payload) {
  data = payload;
  state.tiers = { ...(data.ourModels?.tiers || {}) };
  updateMeta();
  updateOurStatus();
  render();
}

async function toggleOurs(id) {
  const next = { ...state.tiers };
  if (Object.prototype.hasOwnProperty.call(next, id)) delete next[id];
  else next[id] = DEFAULT_TIER;
  await refreshFrom(await putOurModels(next));
}

async function setTier(id, tier) {
  const next = { ...state.tiers };
  if (tier) next[id] = tier;
  else delete next[id]; // blank = not ours
  await refreshFrom(await putOurModels(next));
}

async function runScan() {
  const btn = $("scan");
  btn.disabled = true;
  btn.textContent = "↻ Scanning…";
  try {
    await refreshFrom(await scan());
    buildProviders();
  } catch (err) {
    alert("Scan failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "↻ Scan";
  }
}

// ---- column-group + filter wiring ----
function toggleGroup(key, btn) {
  state.groups[key] = !state.groups[key];
  btn.classList.toggle("active", state.groups[key]);
  render();
}
$("grpPrices").onclick = (e) => toggleGroup("prices", e.target);
$("grpScores").onclick = (e) => toggleGroup("scores", e.target);
$("grpBenchmark").onclick = (e) => toggleGroup("benchmark", e.target);

$("q").oninput = (e) => ((state.filters.q = e.target.value), render());
$("provider").onchange = (e) => ((state.filters.provider = e.target.value), render());
$("quality").onchange = (e) => ((state.filters.quality = e.target.value), render());
$("onlyWatch").onclick = (e) => ((state.filters.watch = !state.filters.watch), e.target.classList.toggle("active"), render());
$("hideNoScore").onclick = (e) => ((state.filters.noScore = !state.filters.noScore), e.target.classList.toggle("active"), render());
$("hideNoPrice").onclick = (e) => ((state.filters.noPrice = !state.filters.noPrice), e.target.classList.toggle("active"), render());
$("onlyNew").onclick = (e) => ((state.filters.isNew = !state.filters.isNew), e.target.classList.toggle("active"), render());
$("onlyPromo").onclick = (e) => ((state.filters.promo = !state.filters.promo), e.target.classList.toggle("active"), render());
$("scan").onclick = runScan;

// ---- boot ----
(async () => {
  try {
    data = await getData();
    state.tiers = { ...(data.ourModels?.tiers || {}) };
    buildSections();
    buildProviders();
    updateMeta();
    updateOurStatus();
    render();
  } catch (err) {
    $("view").innerHTML = `<div class="empty">Failed to load: ${err.message}<br>Is the server running? (npm run dev)</div>`;
  }
})();
