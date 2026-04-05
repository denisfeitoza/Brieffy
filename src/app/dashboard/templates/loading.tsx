import { Loader2 } from 'lucide-react';

export default function LoadingTemplates() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-[var(--orange-light)] border border-[var(--orange-mid)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--orange)] animate-spin" />
        </div>
        <div className="absolute inset-0 w-16 h-16 rounded-full bg-[var(--orange)]/10 blur-xl animate-pulse" />
      </div>
      <p className="mt-6 text-sm font-medium text-zinc-400 animate-pulse">
        Carregando seus briefings...
      </p>
    </div>
  );
}
