"use client";

import { useState } from "react";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { TranslateDocumentAction } from "@/components/dashboard/TranslateDocumentAction";
import CollectedBriefingData from "@/components/dashboard/CollectedBriefingData";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type DocLanguage = 'pt' | 'en' | 'es';

const DOC_TRANSLATIONS: Record<DocLanguage, Record<string, string>> = {
  pt: {
    restricted: 'Documento Restrito',
    enterPassphrase: 'Digite a palavra-chave que você recebeu junto com o link para acessar e editar o documento.',
    passphrasePlaceholder: 'Ex: luz-mar-azul-som',
    accessFile: 'Acessar Documento',
    accessGranted: 'Acesso liberado.',
    invalidCredentials: 'Não foi possível acessar o documento.',
    interactiveDiagnostic: 'Diagnóstico Interativo',
  },
  en: {
    restricted: 'Restricted Document',
    enterPassphrase: 'Enter the passphrase you received along with the link to access and edit the document.',
    passphrasePlaceholder: 'E.g.: sun-sky-blue-star',
    accessFile: 'Access Document',
    accessGranted: 'Access granted.',
    invalidCredentials: 'Could not access the document.',
    interactiveDiagnostic: 'Interactive Diagnostic',
  },
  es: {
    restricted: 'Documento Restringido',
    enterPassphrase: 'Ingresa la contraseña que recibiste junto con el enlace para acceder y editar el documento.',
    passphrasePlaceholder: 'Ej: sol-mar-azul-som',
    accessFile: 'Acceder al Documento',
    accessGranted: 'Acceso otorgado.',
    invalidCredentials: 'No se pudo acceder al documento.',
    interactiveDiagnostic: 'Diagnóstico Interactivo',
  },
};

function detectBrowserLanguage(): DocLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.slice(0, 2)?.toLowerCase();
  if (lang === 'pt' || lang === 'en' || lang === 'es') return lang as DocLanguage;
  return 'en';
}

export function PublicDocumentView({ token }: { token: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>("");
  const [finalAssets, setFinalAssets] = useState<Record<string, unknown>>({});
  const [companyInfo, setCompanyInfo] = useState<Record<string, unknown>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  // Start with browser language, then override with session language once verified
  const [lang, setLang] = useState<DocLanguage>(detectBrowserLanguage);

  const tr = DOC_TRANSLATIONS[lang] || DOC_TRANSLATIONS.en;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/document/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, passphrase })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tr.invalidCredentials);
      }

      // Determine the final language (backend > current detected)
      const finalLang: DocLanguage =
        data.chosenLanguage && ['pt', 'en', 'es'].includes(data.chosenLanguage)
          ? (data.chosenLanguage as DocLanguage)
          : lang;

      if (finalLang !== lang) {
        setLang(finalLang);
      }

      setDocumentContent(data.document || data.documentContent || "");
      setFinalAssets(data.finalAssets || {});
      setCompanyInfo(data.companyInfo || {});
      setIsAuthenticated(true);
      // Use finalLang directly to avoid stale closure on tr
      toast.success(DOC_TRANSLATIONS[finalLang].accessGranted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || tr.invalidCredentials);
      } else {
        toast.error(tr.invalidCredentials);
      }
      setPassphrase("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async (newContent: string) => {
    const res = await fetch("/api/document/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editToken: token,
        passphrase,
        documentContent: newContent
      })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error saving.");
    }
  };

  const handleSaveAssets = async (updatedAssets: Record<string, unknown>) => {
    const res = await fetch("/api/document/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editToken: token,
        passphrase,
        finalAssets: updatedAssets
      })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error saving translation.");
    }

    setFinalAssets(updatedAssets);
    if (updatedAssets.document) {
      setDocumentContent(updatedAssets.document);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 md:px-8">
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-outfit font-bold tracking-tight text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--orange)] to-[#ffcfbc] flex items-center justify-center">
                <span className="text-white text-sm">B</span>
              </div>
              Brieffy
            </div>
            <h1 className="text-xl text-neutral-400 font-medium tracking-tight hidden md:block">| {tr.interactiveDiagnostic}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <TranslateDocumentAction 
              documentContent={documentContent}
              originalDocument={finalAssets?.original_document}
              finalAssets={finalAssets}
              baseLanguage={lang}
              onSaveAssets={handleSaveAssets}
            />

            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]" title="Relatório">
                Relatório
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto !max-w-full bg-[var(--bg)] border-l border-[var(--bd)] p-0 z-[100]">
                <SheetHeader className="p-6 border-b border-[var(--bd)] sticky top-0 bg-[var(--bg)] z-50">
                  <SheetTitle className="text-xl">Relatório</SheetTitle>
                  <SheetDescription>
                    Dados técnicos da coleta e respostas fornecidas.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6 pb-24">
                  <CollectedBriefingData companyInfo={companyInfo} lang={lang} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <DocumentEditor 
          initialContent={documentContent} 
          onSave={handleSave} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-white/10 p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="mb-8 text-2xl font-outfit font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--orange)] to-[#ffcfbc] flex items-center justify-center">
            <span className="text-white text-sm">B</span>
          </div>
          Brieffy
        </div>
        
        <div className="w-16 h-16 rounded-full bg-[var(--orange)]/10 flex items-center justify-center text-[var(--orange)] mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-outfit text-white font-medium mb-2 text-center">{tr.restricted}</h2>
        <p className="text-neutral-400 text-center mb-8">
          {tr.enterPassphrase}
        </p>

        <form onSubmit={handleVerify} className="w-full space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder={tr.passphrasePlaceholder}
              className="w-full bg-[var(--bg)] border border-[var(--bd)] text-[var(--text)] placeholder-[var(--text3)] px-4 py-3 rounded-xl focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] outline-none transition-all"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={isVerifying}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-white text-black hover:bg-neutral-200"
            disabled={isVerifying || !passphrase.trim()}
          >
            {isVerifying ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent border-r-transparent rounded-full animate-spin"></span>
            ) : (
              <>{tr.accessFile} <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
