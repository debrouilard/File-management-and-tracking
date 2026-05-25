/**
 * Parses CLIENT_ORIGINS (comma-separated) or falls back to CLIENT_ORIGIN, then dev defaults.
 * Used by CORS so Next.js (:3000) and Vite (:5173) can both call the API when credentials are used.
 */
export function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "";
  const fromEnv = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];
  const merged = [...new Set([...fromEnv, ...defaults])];
  return merged;
}

export function corsOriginCallback(origin, callback) {
  const allowed = getAllowedOrigins();
  if (!origin) return callback(null, true);
  if (allowed.includes(origin)) return callback(null, true);
  callback(null, false);
}
