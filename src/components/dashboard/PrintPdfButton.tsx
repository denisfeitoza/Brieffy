'use client';

import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PrintPdfButtonProps {
  className?: string;
  pdfSelector?: string;
}

export function PrintPdfButton({ className, pdfSelector = '.a4-document-container' }: PrintPdfButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    try {
       // @ts-ignore
      if (typeof window === 'undefined' || !window.html2pdf) {
        toast.error('Utilitário PDF carregando ou indisponível.');
        return;
      }
      
      const element = document.querySelector(pdfSelector);
      if (!element) {
        toast.error('Conteúdo do documento não encontrado.');
        return;
      }

      const opt = {
        margin:       15,
        filename:     `diagnostico-${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      element.classList.add("pdf-mode-active");
      // @ts-ignore
      await window.html2pdf().from(element).set(opt).save();
      element.classList.remove("pdf-mode-active");
      toast.success('PDF Premium gerado com sucesso!');
    } catch (e) {
      toast.error('Falha ao gerar o PDF Premium.');
      console.error(e);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrint}
        className={className}
        title="Imprimir (Padrão)"
      >
        <Printer className="w-4 h-4" />
      </Button>
      <Button
         variant="default"
         onClick={handleGeneratePdf}
         className={`bg-[var(--orange)] hover:opacity-90 text-white shadow-sm ${className?.replace('hidden sm:flex', '')}`}
         title="Baixar PDF Premium"
      >
         <Download className="w-4 h-4 mr-2" />
         PDF Premium
      </Button>
    </>
  );
}
