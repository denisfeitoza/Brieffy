import { NextResponse } from "next/server";
import { getVoiceConfig, getDBSettings } from "@/lib/aiConfig";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("transcribe");

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB - Whisper API limit

export async function POST(req: Request) {
  try {
    // Rate limit per user when authenticated, fallback to IP for public briefing flows
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const scope = user ? `transcribe:user:${user.id}` : `transcribe:ip:${getRequestIP(req)}`;
    const rl = await checkRateLimit(scope, { maxRequests: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many transcription requests. Please slow down." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const dbSettings = await getDBSettings();
    const voiceConfig = getVoiceConfig(dbSettings);

    if (!voiceConfig.apiKey) {
      return NextResponse.json(
        { error: "Voice API key not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large (25MB max)." },
        { status: 413 }
      );
    }

    // Detect language from form data or default to Portuguese
    const language = (formData.get("language") as string) || voiceConfig.language || "pt";

    // Build multipart/form-data for the Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "audio.webm");
    whisperForm.append("model", voiceConfig.model);
    whisperForm.append("language", language);
    whisperForm.append("response_format", "json");

    log.debug(`Using ${voiceConfig.provider} / ${voiceConfig.model}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(voiceConfig.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voiceConfig.apiKey}`,
      },
      body: whisperForm,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[${voiceConfig.provider.toUpperCase()}] Transcription Error:`, errorText);
      return NextResponse.json(
        { error: `Transcription failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });
  } catch (error: unknown) {
    console.error("Transcribe API Error:", error);
    return NextResponse.json(
      { error: "Internal error during transcription" },
      { status: 500 }
    );
  }
}
