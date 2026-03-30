"use client";

import { useState } from "react";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function PublicDocumentView({ token }: { token: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

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
        throw new Error(data.error || "Senha ou token inválidos.");
      }

      setDocumentContent(data.document || data.documentContent || "");
      setIsAuthenticated(true);
      toast.success("Acesso liberado.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Não foi possível acessar o documento.");
      } else {
        toast.error("Não foi possível acessar o documento.");
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
      throw new Error(data.error || "Erro ao salvar.");
    }
  };

  if (isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 md:px-8">
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-2xl font-outfit font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white text-sm">B</span>
            </div>
            Brieffy
          </div>
          <h1 className="text-xl text-neutral-400 font-medium tracking-tight">Diagnóstico Interativo</h1>
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white text-sm">B</span>
          </div>
          Brieffy
        </div>
        
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-outfit text-white font-medium mb-2 text-center">Diagnóstico Restrito</h2>
        <p className="text-neutral-400 text-center mb-8">
          Digite a palavra-chave que você recebeu junto com o link para acessar e editar o documento.
        </p>

        <form onSubmit={handleVerify} className="w-full space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ex: luz-mar-azul-som"
              className="w-full bg-black border border-neutral-800 text-white placeholder-neutral-600 px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
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
              <>Acessar Arquivo <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
