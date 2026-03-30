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
  ai_voice_provider?: string;
  ai_voice_model?: string;
  ai_voice_language?: string;
  briefing_max_history?: string;
  briefing_timeout_ms?: string;
  briefing_basal_threshold?: string;
}

// ================================================================
// LLM Configuration
// Priority: DB settings > ENV vars > defaults
// ================================================================
export function getLLMConfig(overrides?: SettingsOverride): LLMConfig {
  const provider = (overrides?.ai_llm_provider || process.env.AI_LLM_PROVIDER || "groq") as LLMProvider;
  const model = overrides?.ai_llm_model || process.env.AI_LLM_MODEL || "openai/gpt-oss-120b";
  const temperature = parseFloat(overrides?.ai_llm_temperature || "0");
  const maxTokens = parseInt(overrides?.ai_llm_max_tokens || "1200");

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
      };

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
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
const CACHE_TTL = 60_000; // 60 seconds

export async function getDBSettings(): Promise<SettingsOverride> {
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) return {};

    const res = await fetch(`${supabaseUrl}/rest/v1/app_settings?select=key,value`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
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
    maxHistory: parseInt(overrides?.briefing_max_history || "6"),
    timeoutMs: parseInt(overrides?.briefing_timeout_ms || "30000"),
    basalThreshold: parseFloat(overrides?.briefing_basal_threshold || "0.85"),
  };
}
