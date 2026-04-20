"use client";

// ────────────────────────────────────────────────────────────────
// Root-level error boundary.
// ────────────────────────────────────────────────────────────────
// Next.js renders this component when the root layout itself crashes —
// i.e. before any providers, fonts, or styles can mount. It MUST include
// its own <html> and <body>, and avoid importing app-level styles or
// context. Treat this as a hard fallback "the app is broken" screen.
//
// Keep zero external dependencies here so it remains renderable even if
// the bundle is partially busted.

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[app/global-error] Root layout crashed:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b0b0b",
          color: "#f5f5f5",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Falha crítica</h1>
          <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.5 }}>
            A aplicação encontrou um erro irrecuperável. Tente recarregar — se
            o problema persistir, envie o código abaixo ao suporte.
          </p>
          {error?.digest ? (
            <code
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "4px 8px",
                borderRadius: 6,
                background: "#1f1f1f",
                fontSize: 12,
                userSelect: "all",
              }}
            >
              ref: {error.digest}
            </code>
          ) : null}
          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#f5f5f5",
                color: "#0b0b0b",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
