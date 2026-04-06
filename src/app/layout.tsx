import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "brieffy. | simplify your requirements",
  description: "Sistema Adaptativo de Briefing Inteligente para diagnósticos, marketing e branding. Extraia insights e consolide sua estratégia em minutos.",
  openGraph: {
    title: "brieffy. | simplify your requirements",
    description: "Sistema Adaptativo de Briefing Inteligente para diagnósticos, marketing e branding.",
    url: "https://brieffy.com",
    siteName: "brieffy.",
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "brieffy. | simplify your requirements",
    description: "Sistema Adaptativo de Briefing Inteligente para diagnósticos, marketing e branding.",
  },
  appleWebApp: {
    title: "brieffy.",
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
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="font-sans min-h-full flex flex-col bg-background text-foreground overflow-x-hidden"
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: { 
                background: 'var(--bg)', 
                border: '1px solid var(--bd)', 
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
