// ================================================================
// AI Provider Configuration — Centralized config for LLM & Voice
// Supports: env vars (.env.local) + DB overrides (app_settings)
// ================================================================

export type LLMProvider = "groq" | "openrouter";
export type VoiceProvider = "groq" | "openai";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
  headers: Record<string, string>;
  temperature: number;
  maxTokens: number;
  /** Nucleus sampling. 0.9 is a good default for varied yet on-task outputs. */
  topP: number;
  /** Penalize tokens already present (anti-repetition). 0..2. */
  presencePenalty: number;
  /** Penalize frequent tokens (anti-loop). 0..2. */
  frequencyPenalty: number;
}

interface VoiceConfig {
  provider: VoiceProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
  language: string;
}

export interface SettingsOverride {
  ai_llm_provider?: string;
  ai_llm_model?: string;
  ai_llm_temperature?: string;
  ai_llm_max_tokens?: string;
  ai_llm_top_p?: string;
  ai_llm_presence_penalty?: string;
  ai_llm_frequency_penalty?: string;
  ai_voice_provider?: string;
  ai_voice_model?: string;
  ai_voice_language?: string;
  ai_vision_model?: string;
  ai_vision_max_tokens?: string;
  ai_vision_temperature?: string;
  briefing_max_history?: string;
  briefing_timeout_ms?: string;
  briefing_basal_threshold?: string;

  // Question Format Toggles
  briefing_format_single_choice?: string;
  briefing_format_multiple_choice?: string;
  briefing_format_boolean_toggle?: string;
  briefing_format_card_selector?: string;
  briefing_format_slider?: string;
  briefing_format_multi_slider?: string;
  briefing_format_color_picker?: string;
  briefing_format_file_upload?: string;
  briefing_format_font?: string;
}

// ================================================================
// Format Configuration
// ================================================================
export interface FormatConfig {
  single_choice: boolean;
  multiple_choice: boolean;
  boolean_toggle: boolean;
  card_selector: boolean;
  slider: boolean;
  multi_slider: boolean;
  color_picker: boolean;
  file_upload: boolean;
  font: boolean;
}

export function getFormatConfig(overrides?: SettingsOverride): FormatConfig {
  const getBool = (val: string | undefined, defaultVal: boolean = true): boolean => val !== undefined ? val === "true" : defaultVal;
  return {
    single_choice: getBool(overrides?.briefing_format_single_choice, true),
    multiple_choice: getBool(overrides?.briefing_format_multiple_choice, true),
    boolean_toggle: getBool(overrides?.briefing_format_boolean_toggle, true),
    card_selector: getBool(overrides?.briefing_format_card_selector, true),
    slider: getBool(overrides?.briefing_format_slider, false),
    multi_slider: getBool(overrides?.briefing_format_multi_slider, false),
    color_picker: getBool(overrides?.briefing_format_color_picker, true),
    file_upload: getBool(overrides?.briefing_format_file_upload, true),
    font: getBool(overrides?.briefing_format_font, false),
  };
}

// ================================================================
// LLM Configuration
// Priority: DB settings > ENV vars > defaults
// ================================================================
/**
 * Safely coerce a string/number to a finite number; falls back to default.
 * Also clamps to [min, max] when provided. Prevents NaN/Infinity from leaking
 * into LLM payloads (which yields undefined provider behavior).
 */
function toFiniteNumber(
  raw: unknown,
  fallback: number,
  opts: { min?: number; max?: number; integer?: boolean } = {}
): number {
  let n: number;
  if (typeof raw === 'number') n = raw;
  else if (typeof raw === 'string') n = opts.integer ? parseInt(raw, 10) : parseFloat(raw);
  else n = NaN;
  if (!Number.isFinite(n)) n = fallback;
  if (opts.min !== undefined) n = Math.max(opts.min, n);
  if (opts.max !== undefined) n = Math.min(opts.max, n);
  return n;
}

export function getLLMConfig(overrides?: SettingsOverride): LLMConfig {
  const provider = (overrides?.ai_llm_provider || process.env.AI_LLM_PROVIDER || "groq") as LLMProvider;
  const model = overrides?.ai_llm_model || process.env.AI_LLM_MODEL || "openai/gpt-oss-120b";
  const temperature = toFiniteNumber(overrides?.ai_llm_temperature, 0.35, { min: 0, max: 2 });
  const maxTokens = toFiniteNumber(overrides?.ai_llm_max_tokens, 2500, { min: 64, max: 32000, integer: true });
  // Sampling defaults tuned for the briefing motor:
  //   topP 0.9        → keeps answers focused while allowing creative phrasing
  //   presence 0.4    → discourages reusing the same topic ad nauseam
  //   frequency 0.3   → discourages repeating the same words across questions
  const topP = toFiniteNumber(overrides?.ai_llm_top_p, 0.9, { min: 0, max: 1 });
  const presencePenalty = toFiniteNumber(overrides?.ai_llm_presence_penalty, 0.4, { min: -2, max: 2 });
  const frequencyPenalty = toFiniteNumber(overrides?.ai_llm_frequency_penalty, 0.3, { min: -2, max: 2 });

  switch (provider) {
    case "groq":
      return {
        provider,
        model,
        apiKey: process.env.GROQ_API_KEY || "",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        headers: { "Content-Type": "application/json" },
        temperature,
        maxTokens,
        topP,
        presencePenalty,
        frequencyPenalty,
      };

    case "openrouter":
      return {
        provider,
        model,
        apiKey: process.env.OPENROUTER_API_KEY || "",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
        temperature,
        maxTokens,
        topP,
        presencePenalty,
        frequencyPenalty,
      };

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Last-resort LLM config used when the primary provider fails repeatedly
 * (timeout, 5xx, etc). Always points at OpenRouter (most diverse provider
 * pool) so we have a real alternative to Groq.
 *
 * Returns null if OpenRouter is not configured — caller should fail loudly
 * rather than silently retrying the broken primary.
 */
export function getLLMFallbackConfig(): LLMConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return {
    provider: "openrouter",
    model: process.env.AI_LLM_FALLBACK_MODEL || "openai/gpt-4o-mini",
    apiKey,
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    temperature: 0.4,
    maxTokens: 2500,
    topP: 0.9,
    presencePenalty: 0.4,
    frequencyPenalty: 0.3,
  };
}

// ================================================================
// Voice/STT Configuration
// ================================================================
export function getVoiceConfig(overrides?: SettingsOverride): VoiceConfig {
  const provider = (overrides?.ai_voice_provider || process.env.AI_VOICE_PROVIDER || "groq") as VoiceProvider;
  const model = overrides?.ai_voice_model || process.env.AI_VOICE_MODEL || "whisper-large-v3-turbo";
  const language = overrides?.ai_voice_language || "pt";

  switch (provider) {
    case "groq":
      return {
        provider,
        model,
        apiKey: process.env.GROQ_API_KEY || "",
        baseUrl: "https://api.groq.com/openai/v1/audio/transcriptions",
        language,
      };

    case "openai":
      return {
        provider,
        model,
        apiKey: process.env.OPENAI_API_KEY || "",
        baseUrl: "https://api.openai.com/v1/audio/transcriptions",
        language,
      };

    default:
      throw new Error(`Unsupported voice provider: ${provider}`);
  }
}

// ================================================================
// Fetch DB Settings (server-side only)
// Caches for 60s to avoid DB hits on every request
// ================================================================
let settingsCache: SettingsOverride | null = null;
let cacheTimestamp = 0;
// BUG-10 FIX: Reduced TTL from 60s to 10s to limit stale config window.
// Also export invalidateSettingsCache() so /api/settings PUT can immediately bust it.
const CACHE_TTL = 10_000; // 10 seconds

/**
 * Force-invalidates the settings cache.
 * Call this after an admin updates app_settings via PUT /api/settings.
 */
export function invalidateSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}

export async function getDBSettings(): Promise<SettingsOverride> {
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) return {};

    const res = await fetch(`${supabaseUrl}/rest/v1/app_settings?select=key,value`, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return {};

    const rows: { key: string; value: string }[] = await res.json();
    const map: SettingsOverride = {};
    for (const row of rows) {
      map[row.key as keyof SettingsOverride] = row.value;
    }

    settingsCache = map;
    cacheTimestamp = now;
    return map;
  } catch {
    return {};
  }
}

// ================================================================
// Performance Settings
// ================================================================
export function getPerformanceConfig(overrides?: SettingsOverride) {
  return {
    // Context window is UNLIMITED — the AI needs full conversation to make intelligent decisions.
    // maxHistory is kept for legacy admin UI but no longer limits the actual context sent.
    maxHistory: toFiniteNumber(overrides?.briefing_max_history, 999, { min: 1, max: 9999, integer: true }),
    timeoutMs: toFiniteNumber(overrides?.briefing_timeout_ms, 30000, { min: 1000, max: 120000, integer: true }),
    basalThreshold: toFiniteNumber(overrides?.briefing_basal_threshold, 0.70, { min: 0, max: 1 }),
  };
}

// ================================================================
// Cost Estimation (Based on Groq / OpenRouter Pricing per 1M tokens)
// Pricing in USD
// ================================================================
export function estimateCost(provider: string, model: string, promptTokens: number, completionTokens: number): number {
  let promptCostPer1M = 0;
  let completionCostPer1M = 0;

  if (provider === "groq") {
    // Groq Pricing approximations (per 1M tokens)
    if (model.includes("70b") || model.includes("70B")) {
      promptCostPer1M = 0.59;
      completionCostPer1M = 0.79;
    } else if (model.includes("8b") || model.includes("8B")) {
      promptCostPer1M = 0.05;
      completionCostPer1M = 0.08;
    } else if (model.includes("mixtral") || model.includes("8x7b")) {
      promptCostPer1M = 0.24;
      completionCostPer1M = 0.24;
    } else {
      // Default fallback for Groq if unknown
      promptCostPer1M = 0.15;
      completionCostPer1M = 0.20;
    }
  } else if (provider === "openrouter") {
    // OpenRouter fallback (generic average or specific)
    if (model.includes("gpt-4o-mini")) {
      promptCostPer1M = 0.15;
      completionCostPer1M = 0.60;
    } else if (model.includes("gpt-4o")) {
      promptCostPer1M = 2.50;
      completionCostPer1M = 10.00;
    } else if (model.includes("claude-3-5-sonnet")) {
      promptCostPer1M = 3.00;
      completionCostPer1M = 15.00;
    } else {
      // Very cheap fallback
      promptCostPer1M = 0.10;
      completionCostPer1M = 0.10;
    }
  }

  const promptCost = (promptTokens / 1_000_000) * promptCostPer1M;
  const completionCost = (completionTokens / 1_000_000) * completionCostPer1M;
  return promptCost + completionCost;
}
