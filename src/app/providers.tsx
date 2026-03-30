"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { BriefingProvider } from "@/lib/BriefingContext";

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
      // Suppress hydration warnings specifically caused by browser extensions
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BriefingProvider>{children}</BriefingProvider>
    </QueryClientProvider>
  );
}
