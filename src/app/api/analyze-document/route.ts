import { NextResponse } from "next/server";
import { getDBSettings } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import { logApiUsage } from "@/lib/services/usageLogger";
import { createLogger } from "@/lib/logger";

const log = createLogger("analyze-document");

const VISION_DEFAULT_MODEL = "google/gemini-1.5-flash";
const VISION_DEFAULT_MAX_TOKENS = 2000;
const VISION_DEFAULT_TEMPERATURE = 0.2;
const VISION_TIMEOUT_MS = 45_000;

export const maxDuration = 60; // Allow 60 seconds for OCR and Extraction processes
export const dynamic = "force-dynamic";

// SSRF guard: only allow our own Supabase storage host (and any explicit allowlist via env).
function isAllowedFileUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;

    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supaHost = "";
    if (supaUrl) {
      try { supaHost = new URL(supaUrl).host; } catch { /* ignore */ }
    }

    const extra = (process.env.ANALYZE_DOC_ALLOWED_HOSTS || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const allowed = new Set<string>([supaHost, ...extra].filter(Boolean));

    return allowed.has(u.host);
  } catch {
    return false;
  }
}

const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024; // 15MB hard cap

// Heuristic: treat as binary when many control characters / NUL bytes appear.
function looksBinary(text: string): boolean {
  if (!text) return false;
  // Check first 8KB for performance
  const sample = text.length > 8192 ? text.slice(0, 8192) : text;
  let control = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0) return true; // NUL byte = definitely binary
    // Allow tab (9), LF (10), CR (13). Anything else < 32 is suspicious.
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) control++;
  }
  return control / sample.length > 0.05; // >5% control chars
}

// Fallback logic for PDF and XLSX in case packages are missing globally
// It dynamically imports them to avoid crashing if the user didn't install them.
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseAny = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseAny.default || pdfParseAny;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Erro no pdf-parse:", error);
    return "ERRO_PDF_PARSE: Instale o pacote 'pdf-parse' (npm install pdf-parse) no servidor para processar PDFs adequadamente.";
  }
}

async function extractExcelText(buffer: Buffer): Promise<string> {
  try {
    // We use the @e965/xlsx fork (Apache-2.0) instead of the canonical npm
    // `xlsx` package because the npm registry copy is frozen at 0.18.5 with
    // unpatched ReDoS + Prototype Pollution CVEs (SheetJS now ships only via
    // CDN tarballs). The fork tracks SheetJS Community 0.20.x and applies the
    // security fixes. API surface is identical.
    const xlsx = (await import("@e965/xlsx"));
    const workbook = xlsx.read(buffer, { type: "buffer" });
    let fullText = "";

    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      fullText += `\n\n--- ABA: ${sheetName} ---\n${csv}`;
    });

    return fullText;
  } catch (error) {
    console.error("Erro no xlsx:", error);
    return "ERRO_XLSX: Instale o pacote '@e965/xlsx' no servidor para extrair planilhas.";
  }
}

interface VisionResult {
  text: string;
  usage: { prompt_tokens?: number; completion_tokens?: number } | null;
  model: string;
}

async function analyzeVision(
  imageUrl: string,
  dbSettings: Record<string, string | undefined>
): Promise<VisionResult> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API key not configured.");
  }

  // Read overrides from app_settings so admins can swap the model without redeploy.
  const model = dbSettings?.ai_vision_model || VISION_DEFAULT_MODEL;
  const maxTokens = Number(dbSettings?.ai_vision_max_tokens) || VISION_DEFAULT_MAX_TOKENS;
  const temperature = Number(dbSettings?.ai_vision_temperature);
  const safeTemperature = Number.isFinite(temperature) ? Math.max(0, Math.min(2, temperature)) : VISION_DEFAULT_TEMPERATURE;

  const payload = {
    model,
    temperature: safeTemperature,
    max_tokens: Math.max(64, Math.min(8000, maxTokens)),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "You are an expert in OCR and visual business document analysis. Extract ALL visible text from this image with precision. If there are charts, flowcharts, tables, or diagrams, describe what they show in a structured way. Return ONLY the extracted data and text — no greetings, no commentary." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error("Vision AI timed out.");
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[analyze-document] Vision LLM error:", response.status, errText.slice(0, 300));
    throw new Error(`Vision AI failed (${response.status}).`);
  }

  const data = await response.json();
  return {
    text: data?.choices?.[0]?.message?.content || "",
    usage: data?.usage ?? null,
    model,
  };
}

export async function POST(req: Request) {
  try {
    // 1. AuthN: only logged-in users can hit document analysis (LLM/CPU cost).
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit per user (LLM + bandwidth cost guard).
    const rl = await checkRateLimit(`analyze_doc:${user.id}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many document analyses. Please wait a moment." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { fileUrl, fileName, mimeType } = await req.json();

    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    // 3. SSRF guard: only allow trusted hosts (our Supabase storage by default).
    if (!isAllowedFileUrl(fileUrl)) {
      return NextResponse.json({ error: "fileUrl host not allowed" }, { status: 400 });
    }

    const type = mimeType || "";
    const name = (fileName || "").toLowerCase();

    // 4. IMAGE: Se for uma imagem, usar o Motor de Visão do LLM!
    if (type.startsWith("image/") || name.match(/\.(jpeg|jpg|png|webp|gif)$/i)) {
      const dbSettings = await getDBSettings();
      if (process.env.NODE_ENV !== "production") {
        log.debug(`Vision OCR on: ${name}`);
      }
      const result = await analyzeVision(fileUrl, dbSettings as Record<string, string | undefined>);
      void logApiUsage({
        userId: user.id,
        sessionId: null,
        provider: "openrouter",
        model: result.model,
        usage: result.usage,
        endpoint: "vision_ocr",
      });
      return NextResponse.json({ text: result.text, type: "image", source: fileName });
    }

    // Para outros formatos, precisamos fazer o fetch real do arquivo
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Falha ao baixar o arquivo da URL provida (${fileResponse.status})`);
    }

    // 5. Size guard: reject obviously oversize before reading into memory.
    const declared = Number(fileResponse.headers.get('content-length') || 0);
    if (declared > MAX_DOWNLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large (15MB max)." },
        { status: 413 }
      );
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large (15MB max)." },
        { status: 413 }
      );
    }
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let detectedType = "text";

    // 6. CSV / JSON / TXT puros:
    if (type.startsWith("text/") || name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".json")) {
      extractedText = buffer.toString('utf-8');
      detectedType = "text";
    }
    // 7. PDF:
    else if (type === "application/pdf" || name.endsWith(".pdf")) {
      detectedType = "pdf";
      extractedText = await extractPdfText(buffer);
    }
    // 8. PLANILHAS:
    else if (type.includes("spreadsheet") || type.includes("excel") || name.match(/\.(xlsx|xls|ods)$/i)) {
      detectedType = "spreadsheet";
      extractedText = await extractExcelText(buffer);
    }
    // CATCH ALL (tenta decodificar como utf8 como fallback)
    else {
      extractedText = buffer.toString('utf-8');
      // Use real binary heuristic (the previous includes("") was always true).
      if (looksBinary(extractedText)) {
        extractedText = "[Arquivo binário. Conteúdo textual não passível de extração simples.]";
      }
    }

    void getRequestIP(req); // reserved for future IP-based rate limit if user is missing

    return NextResponse.json({
      text: extractedText.trim(),
      type: detectedType,
      source: fileName
    });

  } catch (err: unknown) {
    console.error("API /analyze-document error:", err);
    return NextResponse.json(
      { error: "Internal error processing document" },
      { status: 500 }
    );
  }
}
