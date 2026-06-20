// Thin client for the server API (Vite proxies /api → http://localhost:3001).

async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// GET /api/data → { ourModels, prices, scores, benchmark, meta }
export const getData = () => fetch("/api/data").then(json);

// POST /api/scan → refresh prices + scores, returns fresh data
export const scan = () => fetch("/api/scan", { method: "POST" }).then(json);

// PUT /api/our-models → persist { tiers }, returns fresh data
export const putOurModels = (tiers) =>
  fetch("/api/our-models", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tiers }),
  }).then(json);
