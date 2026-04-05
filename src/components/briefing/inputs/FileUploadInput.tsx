"use client";

import { useRef } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { TextAudioInput } from "./TextAudioInput";
import { createClient } from "@/lib/supabase/client";

interface FileUploadInputProps {
  inputText: string;
  setInputText: (t: string) => void;
  handleLocalSend: () => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  doSubmit: (val: string | string[] | number) => void;
  voiceLanguage: string;
  t: Record<string, string>;
}

export function FileUploadInput({
  inputText,
  setInputText,
  handleLocalSend,
  isLoading,
  isSubmittingLocal,
  isUploading,
  setIsUploading,
  doSubmit,
  voiceLanguage,
  t,
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`${t.fileTooLarge || "Arquivo grande demais:"} ${file.name}`);
          continue;
        }

        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
        const { error } = await supabase.storage
          .from("briefing_assets")
          .upload(fileName, file, { upsert: false });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("briefing_assets")
          .getPublicUrl(fileName);

        urls.push(publicUrlData.publicUrl);
      }

      if (urls.length > 0) {
        doSubmit(`[Anexos via UI]: ${urls.join(", ")}`);
      } else {
        alert(t.fileUploadError || "Erro ao fazer upload dos arquivos.");
      }
    } catch (err) {
      console.error("Erro no upload do arquivo:", err instanceof Error ? err.message : String(err));
      alert(t.fileUploadError || "Erro ao fazer upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Mobile fix: h-40 md:h-56 */}
      <div
        className={`w-full h-40 md:h-56 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-[var(--orange)]/50 hover:bg-[var(--orange)]/5 transition-all cursor-pointer group hover:shadow-lg active:scale-[0.98] ${
          isUploading ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border border-gray-200 group-hover:bg-[var(--orange)]/10 flex items-center justify-center mb-4 transition-colors shadow-sm">
          {isUploading ? (
            <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-[var(--orange)] animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7 md:w-8 md:h-8 text-gray-400 group-hover:text-[var(--orange)] transition-colors" />
          )}
        </div>
        <p className="text-black font-medium text-base md:text-lg">
          {isUploading ? (t.sendingFile || "Enviando...") : (t.dragFiles || "Toque para adicionar arquivos")}
        </p>
        <p className="text-gray-500 text-sm mt-1">PDF, PNG, JPG (Múltiplos permitidos, Max 5MB cada)</p>
      </div>
      
      <div className="w-full">
        <p className="text-sm text-center text-gray-500 mb-2">{t.orTypeFile || "Ou digite os links / responda em texto:"}</p>
        <TextAudioInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
        />
        
        <button 
          onClick={() => doSubmit('(skipped)')}
          disabled={isLoading || isSubmittingLocal || isUploading}
          className="mt-6 w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-500 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t.skipFiles || "Pular (Não tenho arquivos no momento)"}
        </button>
      </div>
    </div>
  );
}
