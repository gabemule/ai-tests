// lowdb setup on a single versioned db.json.
// The JSON file IS the store AND the git-tracked artifact — that's the whole point of lowdb here.

import { JSONFilePreset } from "lowdb/node";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "db.json");

// Default schema. `*_prev` hold the previous scan's payload for the NEW/PROMO/score_delta diff.
const defaultData = {
  ourModels: { tiers: {} },
  prices: {},
  scores: {},
  prices_prev: {},
  scores_prev: {},
  meta: {},
};

// Single shared instance.
export const db = await JSONFilePreset(DB_PATH, defaultData);

// Ensure required keys exist even if db.json was hand-edited.
db.data.ourModels ??= { tiers: {} };
db.data.ourModels.tiers ??= {};
db.data.prices ??= {};
db.data.scores ??= {};
db.data.prices_prev ??= {};
db.data.scores_prev ??= {};
db.data.meta ??= {};
