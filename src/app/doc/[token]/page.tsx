import { Suspense } from "react";
import { PublicDocumentView } from "./PublicDocumentView";

// Opt out of caching since doc content changes and we use verify API.
export const dynamic = 'force-dynamic';

export default async function DocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await params;

  // Sanitize token: messaging apps (WhatsApp, email, SMS) sometimes append
  // trailing `%` or special characters to shared URLs.
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawToken);
  } catch {
    // A bare `%` without two hex digits throws URIError — fallback to raw string
    decoded = rawToken;
  }
  const token = decoded.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[var(--orange)]/30">
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Carregando...</div>}>
         <PublicDocumentView token={token} />
      </Suspense>
    </div>
  );
}
