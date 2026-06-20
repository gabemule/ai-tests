// Plain Node http server (no Express). Owns lowdb + the "scan".
// Routes:
//   GET  /api/data        → { ourModels, models, embeddings, meta } (models union built on-the-fly)
//   POST /api/scan        → fetch prices + scores, current→prev, write db, return fresh data
//   PUT  /api/our-models  → write ourModels (★ selection + per-model tier) to db
//
// Dev: Vite proxies /api → http://localhost:3001 (see vite.config.js).

import "dotenv/config";
import { createServer } from "node:http";
import { db } from "./db.js";
import { fetchPrices } from "./services/fetch-prices.js";
import { fetchScores } from "./services/fetch-scores.js";
import { merge } from "./services/merge.js";
import { qualityThresholds } from "./services/quality.js";

const PORT = 3001;

// Compose the client payload. The unified `models` table (price ∪ score) + quality thresholds are
// recomputed every read so they reflect live edits and the current catalog (quality bands = max/4
// of the AA index). Embeddings are kept separate (very different shape — no quality/score).
function buildData() {
  const tiers = db.data.ourModels.tiers || {};
  const quality = qualityThresholds(
    (db.data.scores?.aa_catalog || []).map((s) => s.index)
  );
  const models = merge(db.data.prices, db.data.scores, tiers, quality);
  return {
    ourModels: db.data.ourModels,
    models,
    embeddings: db.data.prices?.embeddings_all || [],
    meta: {
      ...db.data.meta,
      quality,
      prices_fetched_at: db.data.prices?.fetched_at ?? null,
      scores_fetched_at: db.data.scores?.fetched_at ?? null,
    },
  };
}



function sendJSON(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    const { method, url } = req;

    if (method === "GET" && url === "/api/data") {
      return sendJSON(res, 200, buildData());
    }

    if (method === "POST" && url === "/api/scan") {
      // Move current → prev for the NEW/PROMO/score_delta diff, then refresh.
      const prevPrices = db.data.prices || {};
      const prevScores = db.data.scores || {};
      const tiers = db.data.ourModels.tiers || {};

      const [prices, scores] = await Promise.all([
        fetchPrices(prevPrices, tiers),
        fetchScores(prevScores),
      ]);

      db.data.prices_prev = prevPrices;
      db.data.scores_prev = prevScores;
      db.data.prices = prices;
      db.data.scores = scores;
      db.data.meta = {
        last_scan: new Date().toISOString(),
        prices_fetched_at: prices.fetched_at,
        scores_fetched_at: scores.fetched_at,
      };
      await db.write();

      return sendJSON(res, 200, buildData());
    }

    if (method === "PUT" && url === "/api/our-models") {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return sendJSON(res, 400, { error: "Invalid JSON body" });
      }
      const tiers = parsed?.tiers;
      if (tiers == null || typeof tiers !== "object") {
        return sendJSON(res, 400, { error: "Body must be { tiers: { id: tier } }" });
      }
      db.data.ourModels = { ...db.data.ourModels, tiers };
      await db.write();
      return sendJSON(res, 200, buildData());
    }

    sendJSON(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { error: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`research-app server on http://localhost:${PORT}`);
});
