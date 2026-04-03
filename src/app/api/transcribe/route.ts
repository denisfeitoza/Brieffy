import { NextResponse } from "next/server";
import { getVoiceConfig, getDBSettings } from "@/lib/aiConfig";

export async function POST(req: Request) {
  try {
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

    // Detect language from form data or default to Portuguese
    const language = (formData.get("language") as string) || voiceConfig.language || "pt";

    // Build multipart/form-data for the Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "audio.webm");
    whisperForm.append("model", voiceConfig.model);
    whisperForm.append("language", language);
    whisperForm.append("response_format", "json");

    console.log(`[Voice] Using ${voiceConfig.provider} / ${voiceConfig.model}`);

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
