import { Suspense } from "react";
import { PublicDocumentView } from "./PublicDocumentView";

// Opt out of caching since doc content changes and we use verify API.
export const dynamic = 'force-dynamic';

export default async function DocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Carregando...</div>}>
         <PublicDocumentView token={token} />
      </Suspense>
    </div>
  );
}
