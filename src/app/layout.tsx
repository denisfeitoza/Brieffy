import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brieffy | Smart Briefing AI",
  description: "Sistema Adaptativo de Briefing Inteligente para diagnóstico, marketing e branding. Gere briefings completos em minutos com a Brieffy.",
  openGraph: {
    title: "Brieffy | Smart Briefing AI",
    description: "Sistema Adaptativo de Briefing Inteligente para diagnóstico, marketing e branding.",
    url: "https://brieffy.com",
    siteName: "Brieffy",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brieffy | Smart Briefing AI",
    description: "Sistema Adaptativo de Briefing Inteligente para diagnóstico, marketing e branding.",
  },
  appleWebApp: {
    title: "Brieffy",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster 
            theme="dark" 
            position="bottom-right"
            toastOptions={{
              style: { background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
