// ================================================================
// Supabase Admin (Service Role) — single source of truth.
// ================================================================
// Why this file exists:
//   Several routes used to fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY
//   when SUPABASE_SERVICE_ROLE_KEY was missing. That meant a missing
//   env var would silently degrade admin reads to RLS-limited anon
//   reads, producing empty arrays instead of an error — and nobody
//   would notice until a customer complained.
//
// Behavior:
//   - In production: throw IMMEDIATELY when service role is missing.
//   - In development: throw too (so misconfig surfaces during local work).
//   - Testing: a tolerant helper (`getSupabaseAdminOptional`) is exposed
//     for non-critical paths (e.g. cost logging) where degrading to a
//     no-op is preferable to crashing the whole request.
//
// Use `getSupabaseAdmin()` from API routes that legitimately need the
// service role (cross-tenant queries, RLS-bypassing inserts, etc.).
// Never import this in client components.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerEnv } from "@/lib/env";

// First touch of the admin client triggers the boot-time env audit.
// Putting it here (instead of at layout) keeps client bundles unaffected.
assertServerEnv();

let cached: SupabaseClient | null = null;
let warnedMissing = false;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "[supabase/admin] NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "This is a fatal misconfiguration — refusing to fall back."
    );
  }
  if (!key) {
    // Loud failure on purpose. Do not silently fall back to the anon key.
    throw new Error(
      "[supabase/admin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Admin operations cannot proceed safely. Configure the env var or call " +
        "getSupabaseAdminOptional() from a non-critical path."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Strict admin client. Throws if service role key is missing.
 * Use this for any route that mutates data, queries across users,
 * or bypasses RLS by design.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = buildClient();
  return cached;
}

/**
 * Soft-failing admin client. Returns null if service role is missing,
 * after logging a one-time warning. Only use this when degraded behavior
 * is acceptable (e.g. cost telemetry, best-effort notifications).
 */
export function getSupabaseAdminOptional(): SupabaseClient | null {
  if (cached) return cached;
  try {
    cached = buildClient();
    return cached;
  } catch (err) {
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn(`[supabase/admin] Optional admin client unavailable: ${(err as Error).message}`);
    }
    return null;
  }
}
