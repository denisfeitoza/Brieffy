"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
