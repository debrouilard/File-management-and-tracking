/**
 * Validates required environment variables at process startup.
 * Call `loadAndValidateEnv()` before importing routes or Prisma-heavy modules.
 */

const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

export function loadAndValidateEnv() {
  const missing = REQUIRED.filter((key) => {
    const v = process.env[key];
    return v == null || String(v).trim() === "";
  });

  if (missing.length > 0) {
    console.error("[FATAL] Missing required environment variables:", missing.join(", "));
    console.error("[FATAL] Copy server/.env.example to server/.env and set values.");
    process.exit(1);
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  const jwtSecret = String(process.env.JWT_SECRET);

  if (nodeEnv === "production" && jwtSecret.length < 32) {
    console.error("[FATAL] JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
  }

  if (nodeEnv !== "production" && jwtSecret.length < 8) {
    console.warn("[warn] JWT_SECRET is very short; use a strong secret before production.");
  }

  const dbUrl = String(process.env.DATABASE_URL);
  if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
    console.warn("[warn] DATABASE_URL does not look like a PostgreSQL connection string.");
  }

  const supUrl = process.env.SUPABASE_URL;
  const supKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supUrl && !supKey) {
    console.warn("[warn] SUPABASE_URL is set but neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.");
  }
  if (supKey && !supUrl) {
    console.warn("[warn] Supabase key is set but SUPABASE_URL is missing.");
  }

  console.log("[info] Environment validated (NODE_ENV=%s)", nodeEnv);
}

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
  get isProduction() {
    return (process.env.NODE_ENV || "development") === "production";
  },
  get port() {
    return Number(process.env.PORT) || 4000;
  },
  get databaseUrl() {
    return process.env.DATABASE_URL;
  },
  get jwtSecret() {
    return process.env.JWT_SECRET;
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
};
