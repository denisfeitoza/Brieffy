import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

export const maxDuration = 60; // Allow 60 seconds for OCR and Extraction processes
export const dynamic = "force-dynamic";

// Fallback logic for PDF and XLSX in case packages are missing globally
// It dynamically imports them to avoid crashing if the user didn't install them.
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
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
    const xlsx = (await import("xlsx"));
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
    return "ERRO_XLSX: Instale o pacote 'xlsx' (npm install xlsx) no servidor para extrair planilhas.";
  }
}

async function analyzeVision(imageUrl: string, dbSettings: any): Promise<string> {
  // Always use a capable vision model regardless of default standard LLM model.
  // Gemini 1.5 Flash via OpenRouter is ultra fast and excellent at OCR.
  const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
  
  if (!openRouterApiKey) {
    throw new Error("API Key do OpenRouter (para Visão) não configurada no ambiente.");
  }

  const payload = {
    model: "google/gemini-1.5-flash", // Excellent Vision Model
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Você é um especialista em OCR e Análise de Imagens de Negócios. Extraia todo o texto visível nesta imagem com precisão. Se houver gráficos, fluxogramas, tabelas ou resumos, explique o que eles demonstram de forma estruturada. Retorne SOMENTE os dados e texto extraídos, sem cumprimentos ou respostas avulsas." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Vision AI Falhou: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(req: Request) {
  try {
    const { fileUrl, fileName, mimeType } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    const type = mimeType || "";
    const name = (fileName || "").toLowerCase();
    
    // 1. IMAGE: Se for uma imagem, usar o Motor de Visão do LLM!
    if (type.startsWith("image/") || name.match(/\.(jpeg|jpg|png|webp|gif)$/i)) {
      const dbSettings = await getDBSettings();
      console.log(`[Análise] Executando Visão LLM na imagem: ${name}`);
      const text = await analyzeVision(fileUrl, dbSettings);
      return NextResponse.json({ text, type: "image", source: fileName });
    }

    // Para outros formatos, precisamos fazer o fetch real do arquivo
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Falha ao baixar o arquivo da URL provida (${fileResponse.status})`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let detectedType = "text";

    // 2. CSV / JSON / TXT puros:
    if (type.startsWith("text/") || name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".json")) {
      extractedText = buffer.toString('utf-8');
      detectedType = "text";
    }
    // 3. PDF:
    else if (type === "application/pdf" || name.endsWith(".pdf")) {
      detectedType = "pdf";
      extractedText = await extractPdfText(buffer);
    }
    // 4. PLANILHAS:
    else if (type.includes("spreadsheet") || type.includes("excel") || name.match(/\.(xlsx|xls|ods)$/i)) {
      detectedType = "spreadsheet";
      extractedText = await extractExcelText(buffer);
    }
    // CATCH ALL (tenta decodificar como utf8 como fallback)
    else {
      extractedText = buffer.toString('utf-8');
      if (extractedText.includes("") && extractedText.length > 500) {
        // Se houver muitos caracteres binários, cancela a extração textualmente.
        extractedText = "[Arquivo binário. Conteúdo textual não passível de extração simples.]";
      }
    }

    return NextResponse.json({ 
      text: extractedText.trim(), 
      type: detectedType, 
      source: fileName 
    });

  } catch (err: unknown) {
    console.error("API /analyze-document error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
