'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface PrintPdfButtonProps {
  className?: string;
  pdfSelector?: string;
}

export function PrintPdfButton({ className, pdfSelector = '.a4-document-container' }: PrintPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    try {
      if (isGenerating) return;
      
      const element = document.querySelector(pdfSelector);
      if (!element) {
        toast.error('Conteúdo do documento não encontrado.');
        return;
      }
      
      setIsGenerating(true);
      toast.info('Preparando o documento PDF...');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let html2pdf: any;
      try {
        const mod = await import('html2pdf.js');
        html2pdf = mod.default || mod;
      } catch (err) {
        console.error("Erro importando html2pdf:", err);
        toast.error('Erro ao carregar renderizador PDF.');
        setIsGenerating(false);
        return;
      }

      const opt = {
        margin:       [15, 15, 20, 15],
        filename:     `diagnostico-${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      element.classList.add("pdf-mode-active");
      
      interface JsPDFType {
        internal: {
          getNumberOfPages: () => number;
          pageSize: { getWidth: () => number; getHeight: () => number };
        };
        setPage: (i: number) => void;
        setFontSize: (size: number) => void;
        setTextColor: (r: number, g: number, b: number) => void;
        text: (text: string, x: number, y: number, options?: { align: string }) => void;
      }

      await html2pdf()
        .from(element)
        .set(opt)
        .toPdf()
        .get('pdf')
        .then((pdf: JsPDFType) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text(
              'Brieffy.ai - Smart Briefing',
              pdf.internal.pageSize.getWidth() - 15,
              pdf.internal.pageSize.getHeight() - 10,
              { align: 'right' }
            );
          }
        })
        .save();

      element.classList.remove("pdf-mode-active");
      toast.success('PDF Premium gerado com sucesso!');
    } catch (e) {
      const element = document.querySelector(pdfSelector);
      if (element) element.classList.remove("pdf-mode-active");
      toast.error('Falha ao gerar o PDF Premium.');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
       variant="outline"
       onClick={handleGeneratePdf}
       disabled={isGenerating}
       className={`bg-[var(--bg)] border-[var(--bd-strong)] text-[var(--text)] hover:bg-[var(--bg2)] shadow-sm h-10 ${className?.replace('hidden sm:flex', '') || ''}`}
       title="Baixar PDF"
    >
       <Download className="w-4 h-4 mr-2" />
       {isGenerating ? 'Gerando...' : 'Baixar PDF'}
    </Button>
  );
}
