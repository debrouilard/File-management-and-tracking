import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger.js";

let adminClient = null;
let warnedMissing = false;

/**
 * Returns a Supabase client with the service role key, or null if not configured.
 * Never throws; callers must handle a null client.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    if (!warnedMissing) {
      warnedMissing = true;
      logger.info("Supabase admin client disabled (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable).");
    }
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    logger.info("Supabase admin client initialized.");
  }
  return adminClient;
}

/**
 * Runs an async callback with the admin client; catches errors and returns a result object.
 * Use this from route handlers so failed Supabase calls never crash the process.
 */
export async function withSupabaseAdmin(fn) {
  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, skipped: true, reason: "supabase_not_configured" };
  }
  try {
    const data = await fn(client);
    return { ok: true, data };
  } catch (err) {
    logger.error("Supabase operation failed:", err?.message || err);
    return { ok: false, error: err?.message || "supabase_error" };
  }
}
