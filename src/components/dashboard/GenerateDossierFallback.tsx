"use client";

import { useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function GenerateDossierFallback({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing/generate-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      router.refresh();
    } catch (err: unknown) {
      setError("Falha ao gerar dossiê. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-[var(--text3)] p-6 text-center bg-[var(--bg2)] md:rounded-b-[2rem]">
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-3 text-sm font-medium w-full max-w-md mx-auto">
           <AlertTriangle className="w-5 h-5 flex-shrink-0" />
           {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative mb-4 mt-2">
            <div className="absolute inset-0 bg-[var(--orange)] blur-xl opacity-20 rounded-full animate-pulse z-0 scale-150"></div>
            <div className="relative z-10 w-20 h-20 bg-[var(--bg)] rounded-full flex items-center justify-center border-2 border-[var(--orange)]/20 shadow-md">
              <div className="absolute inset-2 border-2 border-[var(--orange)] border-dotted rounded-full animate-[spin_8s_linear_infinite] opacity-30"></div>
              <FileText className="w-8 h-8 text-[var(--orange)] animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-1">Processando Dossiê...</h3>
          <p className="max-w-xs text-sm text-[var(--text2)]">A inteligência artificial está transformando suas respostas em um Dossiê Estratégico. Isso pode levar alguns segundos.</p>
        </div>
      ) : (
        <>
          <FileText className="w-14 h-14 mb-4 opacity-40 text-[var(--orange)]" />
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">Dossiê Estratégico Pendente</h3>
          <p className="max-w-md mx-auto text-sm leading-relaxed text-[var(--text2)] mb-6">
            O seu briefing foi finalizado, mas o documento consolidado do dossiê não foi gerado. Clique no botão abaixo para processar suas respostas e gerar a sua Visão Estratégica agora.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--orange)] hover:bg-[#ff7a2e] text-white rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-orange-500/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Gerar Dossiê Estratégico
          </button>
        </>
      )}
    </div>
  );
}
