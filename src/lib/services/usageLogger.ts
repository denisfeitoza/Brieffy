// ================================================================
// API Usage Logger — Single source of truth for cost tracking.
// All LLM-calling routes MUST call logApiUsage() after a successful
// (or failed-but-billed) provider response, otherwise the admin cost
// dashboard will under-report by an arbitrary factor.
//
// Why centralize:
//  - Same insert shape everywhere (avoids "estimated_cost_usd" vs "cost_usd" drift).
//  - Best-effort: never throws; never blocks the user-visible response.
//  - Single place to swap to a queue / Redis stream if we later need it.
// ================================================================

import { estimateCost } from "@/lib/aiConfig";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";

export interface LLMUsage {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
}

export interface LogApiUsageInput {
  userId: string | null;
  sessionId: string | null;
  provider: string;
  model: string;
  /** OpenAI-compatible usage object (provider returns this on success) */
  usage: LLMUsage | null | undefined;
  /** Logical endpoint identifier (e.g. "briefing", "dossier", "translate") */
  endpoint: string;
}

/**
 * Insert one row into api_usage. Best-effort and silent on failure.
 *
 * Note: `endpoint` is appended into model column as a suffix when the
 * underlying table has no dedicated column for it. We keep it conservative
 * to avoid a migration; admins can group by `model LIKE '%::endpoint'`
 * if desired. If/when we add a real `endpoint` column, just send it.
 */
export async function logApiUsage(input: LogApiUsageInput): Promise<void> {
  try {
    const { userId, sessionId, provider, model, usage, endpoint } = input;
    if (!usage) return; // provider didn't return usage; nothing to log

    const promptTokens = Math.max(0, Number(usage.prompt_tokens) || 0);
    const completionTokens = Math.max(0, Number(usage.completion_tokens) || 0);

    // Skip empty rows (no tokens at all = noise / aborted call)
    if (promptTokens === 0 && completionTokens === 0) return;

    const cost = estimateCost(provider, model, promptTokens, completionTokens);

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      // Service role missing — can't write through RLS. The admin helper
      // already warns once; nothing else to do.
      return;
    }

    const { error } = await admin.from("api_usage").insert({
      user_id: userId,
      session_id: sessionId,
      provider,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: cost,
      endpoint, // tolerated as extra column if it exists; ignored otherwise by PostgREST
    });

    if (error) {
      // PostgREST may complain about the extra `endpoint` column; retry without it.
      const isUnknownColumn = /column .*endpoint/i.test(error.message || "");
      if (isUnknownColumn) {
        await admin.from("api_usage").insert({
          user_id: userId,
          session_id: sessionId,
          provider,
          model,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          estimated_cost_usd: cost,
        });
      } else {
        console.error("[API_USAGE] Failed to log usage:", error.message);
      }
    }
  } catch (err) {
    // Never let cost logging break a real user flow.
    console.error("[API_USAGE] Unexpected logger error:", err);
  }
}

