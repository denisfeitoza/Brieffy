'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Loader2, Check, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TranslateDocumentActionProps {
  documentContent: string;
  originalDocument?: string;
  finalAssets: any;
  baseLanguage: string;
  onSaveAssets: (updatedAssets: any) => Promise<void>;
}

const LANG_LABELS: Record<string, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español'
};

const BUTTON_LABELS: Record<string, string> = {
  pt: 'Língua',
  en: 'Language',
  es: 'Idioma'
};

export function TranslateDocumentAction({
  documentContent,
  originalDocument,
  finalAssets,
  baseLanguage,
  onSaveAssets,
}: TranslateDocumentActionProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const router = useRouter();

  // Determine the active requested language
  const currentLang = finalAssets?.current_lang || baseLanguage;

  const handleTranslate = async (targetLang: string, forceRetranslate: boolean = false) => {
    if (targetLang === currentLang && !forceRetranslate) return; // Prevent loop

    try {
      setIsTranslating(true);
      
      let newDoc = documentContent;
      
      if (targetLang === baseLanguage) {
         // FIX #3: Restore to original language.
         // If there's a saved original_document in the assets, use it.
         // But if the current documentContent is HTML (edited by Tiptap), it already IS the original.
         // Prefer original_document only if it was explicitly stored and differs from current.
         if (originalDocument && originalDocument !== documentContent) {
           newDoc = originalDocument;
         } else {
           newDoc = documentContent; // Already at the base version
         }
      } else if (finalAssets?.translations?.[targetLang] && !forceRetranslate) {
         // Load cached translation
         newDoc = finalAssets.translations[targetLang];
      } else {
         // Call the AI translation endpoint for the first time
         // Always translate from the base-language document (not a previously translated version)
         const sourceDoc = originalDocument || documentContent;
         const res = await fetch('/api/document/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              documentContent: sourceDoc, 
              targetLanguage: targetLang 
            })
         });
         
         const data = await res.json();
         if (data.document) {
           newDoc = data.document;
         } else {
           throw new Error(data.error || 'Falha na resposta da API.');
         }
      }

      // Preserve cache of previous translation if we are leaving a translated state
      const updatedTranslations = { ...(finalAssets?.translations || {}) };
      
      if (currentLang !== baseLanguage) {
         updatedTranslations[currentLang] = documentContent;
      }
      
      if (targetLang !== baseLanguage) {
         updatedTranslations[targetLang] = newDoc;
      }

      // Update Session DB state
      // FIX #3: Preserve original_document — never overwrite with a translation or HTML-edited version
      const updatedAssets = {
        ...finalAssets,
        document: newDoc,
        // Only set original_document if it hasn't been set yet
        original_document: finalAssets?.original_document || documentContent,
        translations: updatedTranslations,
        current_lang: targetLang,
      };
      
      await onSaveAssets(updatedAssets);
      router.refresh();
      
    } catch(err) {
      console.error(err);
      alert('Erro ao traduzir documento. Tente novamente.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isTranslating} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)] gap-1.5 disabled:opacity-50"
        title="Idioma do Documento"
      >
        {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--orange)]" /> : <Languages className="w-3.5 h-3.5" />}
        {isTranslating ? 'Aplicando...' : (BUTTON_LABELS[currentLang] || 'Língua')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[var(--bg)] border border-[var(--bd)] text-[var(--text)]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-[var(--text3)]">Idioma do Documento</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--bd)]" />
          
          {Object.entries(LANG_LABELS).map(([code, label]) => {
            const isOriginal = code === baseLanguage;
            return (
              <DropdownMenuItem 
                key={code}
                onClick={() => handleTranslate(code)} 
                className={`cursor-pointer text-sm flex items-center justify-between group ${currentLang === code ? 'text-[var(--orange)] font-medium bg-[var(--bg2)]' : 'hover:bg-[var(--bg2)]'}`}
              >
                <span>{label} {isOriginal && <span className="text-[10px] text-[var(--text2)] opacity-70 ml-1">(Original)</span>}</span>
                <div className="flex items-center gap-1.5">
                  {!isOriginal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Close menu and trigger re-translation
                        document.body.click(); 
                        handleTranslate(code, true);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                      title="Forçar nova tradução"
                      disabled={isTranslating}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {currentLang === code && <Check className="w-3.5 h-3.5" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
