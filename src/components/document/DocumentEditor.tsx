"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, Save, Download, Loader2, Languages } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let html2pdf: any;
if (typeof window !== "undefined") {
  // Try to load from window if possible, or import
  import("html2pdf.js").then((mod) => {
    html2pdf = mod.default || mod;
  });
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^[\-\*] (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr />')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');
  
  html = html.replace(/(<li>.*?<\/li>)(?=\s*<li>)/gim, '$1');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, (match) => {
    if (!match.startsWith('<ul>')) return '<ul>' + match + '</ul>';
    return match;
  });
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  
  return '<p>' + html + '</p>';
}

interface DocumentEditorProps {
  initialContent: string;
  onSave?: (newContent: string) => Promise<void>;
  readOnly?: boolean;
}

export function DocumentEditor({ initialContent, onSave, readOnly = false }: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async (targetLang: string) => {
    if (!content.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/document/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentContent: content, targetLanguage: targetLang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao traduzir");
      setContent(data.document);
      toast.success("Documento traduzido com sucesso!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Erro na tradução.");
      } else {
        toast.error("Erro na tradução.");
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Conteúdo copiado para a área de transferência!");
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(content);
      setIsEditing(false);
      toast.success("Documento salvo com sucesso!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Erro ao salvar o documento.");
      } else {
        toast.error("Erro ao salvar o documento.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    if (!html2pdf || !printRef.current) {
      toast.error("Utilitário PDF ainda está carregando, tente novamente.");
      return;
    }

    const element = printRef.current;
    
    // Configurações p/ preservar o look "dark" ou "light" forçado
    // Vamos gerar PDF em fundo claro idealmente para leitura, 
    // mas se quisermos igual a tela:
    const opt = {
      margin:       15,
      filename:     `diagnostico-${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ajusta o estilo pro PDF na hora de renderizar
    element.classList.add("pdf-mode-active");
    html2pdf().from(element).set(opt).save().then(() => {
        element.classList.remove("pdf-mode-active");
    });
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-white/[0.05] border border-white/10 rounded-xl p-3 gap-4 w-full">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 flex-nowrap">
          {!readOnly && (
            isEditing ? (
               <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
                 {isSaving ? <span className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4 mr-2" />}
                 Salvar Edições
               </Button>
            ) : (
               <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 shrink-0">
                 <Edit2 className="w-4 h-4 mr-2" />
                 Habilitar Edição
               </Button>
            )
          )}
          <Button onClick={handleCopy} variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 shrink-0">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Texto
          </Button>
        </div>
        <div className="flex items-center w-full md:w-auto shrink-0 mt-2 md:mt-0">
          <Button onClick={generatePDF} size="sm" className="bg-[var(--orange)] hover:opacity-90 text-white font-semibold w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF Premium
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW / EDITOR */}
      <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
        {isEditing ? (
          <div className="flex flex-col h-full w-full">
            <textarea
              className="w-full min-h-[60vh] bg-transparent text-zinc-300 font-mono text-sm leading-relaxed p-4 border border-zinc-800 focus:border-[var(--orange)] rounded-xl outline-none resize-y custom-scrollbar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva ou edite o markdown aqui..."
            />
          </div>
        ) : (
          <div 
            ref={printRef}
            className={`prose prose-invert prose-sm md:prose-base max-w-none 
              prose-headings:font-outfit prose-headings:tracking-tight
              prose-h1:text-2xl prose-h1:md:text-4xl prose-h1:bg-gradient-to-r prose-h1:from-white prose-h1:to-zinc-500 prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:mb-8
              prose-h2:text-xl prose-h2:text-[var(--orange)] prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2 prose-h2:mt-10
              prose-h3:text-lg prose-h3:text-zinc-200
              prose-p:text-zinc-300 prose-p:leading-relaxed
              prose-li:text-zinc-300
              prose-strong:text-white prose-strong:font-semibold
              prose-blockquote:border-l-[var(--orange)] prose-blockquote:bg-[var(--orange)]/5 prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-2
              w-full mx-auto
              ${/* Classes extras q qnd PDF tiver ativo a gente pode usar via CSS se precisar */''}
            `}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Quando exportando PDF, garante contrastes fortes */
        .pdf-mode-active {
          padding: 30px !important;
          background: #000000 !important;
          color: white !important;
          width: 800px !important; /* Force width for reasonable PDF layout */
          max-width: none !important;
        }
        .pdf-mode-active h1 { background: none !important; color: white !important; -webkit-text-fill-color: white !important; }
      `}} />
    </div>
  );
}
