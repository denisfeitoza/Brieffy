import { BriefingProvider } from "@/lib/BriefingContext";
import { ReactNode } from "react";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <BriefingProvider>
      <div className="dark bg-background text-foreground min-h-screen">{children}</div>
    </BriefingProvider>
  );
}
