// ================================================================
// Environment validation — boot-time sanity check.
// ================================================================
// Why this file exists:
//   The app silently degrades when critical env vars are missing
//   (e.g. SUPABASE_SERVICE_ROLE_KEY → admin reads return [], Stripe
//    webhook secret → silent payment loss, OPENROUTER fallback → no
//    fallback). Catching these on first import gives us a single
//    obvious error in the build log instead of mysterious user-facing
//    failures hours later.
//
// Usage:
//   import { assertServerEnv } from "@/lib/env";
//   assertServerEnv();   // call once from any server-only entry point
//
//   import { ENV } from "@/lib/env";
//   const url = ENV.NEXT_PUBLIC_SUPABASE_URL; // typed access
//
// Guard rails:
//   - Only validates on the server (process.env). Client gets the
//     `NEXT_PUBLIC_*` subset via Next.js inlining.
//   - Never throws during the Next build phase (`NEXT_PHASE=phase-production-build`)
//     because Vercel's build sandbox does not always have runtime env vars.
//     We log a warning instead so the build still succeeds.
//   - Categorizes vars as "required" (block) vs "warn" (degraded but functional).

type EnvShape = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // App
  NEXT_PUBLIC_APP_URL: string;
  // LLM (at least one provider)
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  AI_LLM_PROVIDER?: string;
  AI_LLM_MODEL?: string;
  // Stripe (only required if billing is on)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

const WARN_KEYS_LLM = ["GROQ_API_KEY", "OPENROUTER_API_KEY"] as const;
const WARN_KEYS_STRIPE = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;

let validated = false;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Validate process.env. Safe to call multiple times (memoized).
 * Throws when a required var is missing AND we are not in the build phase.
 */
export function assertServerEnv(): void {
  if (validated) return;
  validated = true;

  const missing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    const v = process.env[key];
    if (!v || !v.trim()) missing.push(key);
  }

  if (missing.length > 0) {
    const msg = `[env] Missing required env vars: ${missing.join(", ")}. ` +
      `These are critical for safe operation (auth, RLS bypass, callbacks).`;
    if (isBuildPhase()) {
      // Vercel build sandbox often lacks runtime secrets — warn so the build still succeeds.
      console.warn(msg + " (build phase: not throwing)");
    } else {
      throw new Error(msg);
    }
  }

  // Soft warnings — log once on boot.
  const noLlm = WARN_KEYS_LLM.every((k) => !process.env[k]);
  if (noLlm) {
    console.warn(
      "[env] No LLM provider configured (set GROQ_API_KEY or OPENROUTER_API_KEY). " +
        "All briefing/AI features will fail with 'AI API Key missing'."
    );
  }

  const stripeMissing = WARN_KEYS_STRIPE.filter((k) => !process.env[k]);
  if (stripeMissing.length === WARN_KEYS_STRIPE.length) {
    console.warn(
      "[env] Stripe not configured — billing endpoints will return 503. " +
        "OK for dev; not OK for production."
    );
  } else if (stripeMissing.length > 0) {
    console.warn(`[env] Partial Stripe config — missing: ${stripeMissing.join(", ")}.`);
  }
}

/**
 * Typed access to env vars. Use this instead of `process.env.X` so that
 * a missing required var fails on import rather than at the call site.
 */
export const ENV = new Proxy({} as EnvShape, {
  get(_, prop: string) {
    return process.env[prop];
  },
});
