"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode, useState } from "react";

if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const rawMessage = args.join(" ");
    if (
      rawMessage.includes("A tree hydrated but some attributes of the server rendered HTML didn't match") &&
      (rawMessage.includes("bis_skin_checked") ||
       rawMessage.includes("__processed_") ||
       rawMessage.includes("data-new-gr-c-s-check-loaded") ||
       rawMessage.includes("data-gr-ext-installed"))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Previne crashes do React causados por extensões (como o Google Tradutor)
  // que modificam o DOM (injeta tags <font> no lugar de TextNodes).
  if (typeof Node === "function" && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) {
        if (typeof console !== "undefined") {
          console.warn("DOM Exception prevented by extension workaround (removeChild).");
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (typeof console !== "undefined") {
          console.warn("DOM Exception prevented by extension workaround (insertBefore).");
        }
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };
  }
}

export function Providers({ children }: { children: ReactNode }) {
  // Defaults tuned for this app:
  // - mutations.retry = 0 → never silently retry destructive ops (delete, charge,
  //   generate dossier) which would double-bill / double-create on transient errors.
  // - queries: short staleTime to avoid spammy refetches; disable refetchOnWindowFocus
  //   to keep the briefing wizard from blowing away local user input on tab switch.
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        mutations: { retry: 0 },
        queries: {
          retry: 1,
          staleTime: 30_000,
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
