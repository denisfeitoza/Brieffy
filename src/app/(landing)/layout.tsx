import type { Metadata } from "next";
import { ForceLightMode } from "@/components/ui/force-light-mode";

export const metadata: Metadata = {
  title: "Brieffy | Briefings Inteligentes com IA",
  description:
    "Transforme sua coleta de informações em uma experiência consultiva inteligente. Brieffy usa IA para criar briefings adaptativos que extraem insights profundos em minutos.",
  openGraph: {
    title: "Brieffy | Briefings Inteligentes com IA",
    description:
      "Transforme sua coleta de informações em uma experiência consultiva inteligente. Brieffy usa IA para criar briefings adaptativos que extraem insights profundos em minutos.",
    url: "https://brieffy.com",
    siteName: "Brieffy",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brieffy | Briefings Inteligentes com IA",
    description:
      "Transforme sua coleta de informações em uma experiência consultiva inteligente.",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ForceLightMode />
      {children}
    </>
  );
}
