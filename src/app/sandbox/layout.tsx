import { BriefingProvider } from "@/lib/BriefingContext";
import { ReactNode } from "react";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return <BriefingProvider>{children}</BriefingProvider>;
}
