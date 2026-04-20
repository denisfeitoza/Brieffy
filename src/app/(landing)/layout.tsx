import type { Metadata } from "next";

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
  // Landing is always rendered in light mode regardless of the user's saved
  // theme. We scope it via a wrapper with the `.light` class (defined in
  // globals.css) which resets all CSS variables to light values. This avoids
  // the FOUC that happens when forcing the theme via `useEffect` because the
  // wrapper is applied on the very first server-rendered paint.
  return <div className="light bg-background text-foreground">{children}</div>;
}
