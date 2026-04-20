"use client";

// ────────────────────────────────────────────────────────────────
// Route-level error boundary.
// ────────────────────────────────────────────────────────────────
// Next.js renders this component when a Server or Client Component below
// `app/` throws. Without it, users see Next's stark default error page —
// not great for an enterprise dashboard. Keep this lean: it must work
// even if the rest of the app is broken (no providers, no auth context).
//
// Note: a separate <RootError /> at `global-error.tsx` handles errors that
// crash the layout itself (so this file may not even mount).

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Surface to the browser console for the user to share with support;
    // server-side errors already show up in Vercel logs via the digest.
    console.error("[app/error] Unhandled route error:", error);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-[60vh] flex items-center justify-center px-6"
    >
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">
          Encontramos um problema ao carregar esta página. Você pode tentar
          novamente — se o erro persistir, copie o código abaixo e envie ao suporte.
        </p>
        {error?.digest ? (
          <code className="inline-block text-xs px-2 py-1 rounded bg-muted text-muted-foreground select-all">
            ref: {error.digest}
          </code>
        ) : null}
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Voltar ao painel
          </a>
        </div>
      </div>
    </div>
  );
}
