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
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t.fileTooLarge);
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
      const { error } = await supabase.storage
        .from("briefing_assets")
        .upload(fileName, file, { upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("briefing_assets")
        .getPublicUrl(fileName);

      doSubmit(`[Arquivo Anexado via UI]: ${publicUrlData.publicUrl}`);
    } catch (err) {
      console.error("Erro no upload do arquivo:", err instanceof Error ? err.message : String(err));
      alert(t.fileUploadError);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Mobile fix: h-40 md:h-56 */}
      <div
        className={`w-full h-40 md:h-56 rounded-3xl border-2 border-dashed border-neutral-700 bg-neutral-900/30 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group hover:shadow-[0_0_30px_rgba(var(--color-primary),0.2)] active:scale-[0.98] ${
          isUploading ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-neutral-800 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
          {isUploading ? (
            <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-primary animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7 md:w-8 md:h-8 text-neutral-400 group-hover:text-primary transition-colors" />
          )}
        </div>
        <p className="text-white font-medium text-base md:text-lg">
          {isUploading ? t.sendingFile : t.dragFiles}
        </p>
        <p className="text-neutral-500 text-sm mt-1">PDF, PNG, JPG (Max 5MB)</p>
      </div>
      <div className="w-full">
        <p className="text-sm text-center text-neutral-500 mb-2">{t.orTypeFile}</p>
        <TextAudioInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
        />
      </div>
    </div>
  );
}
